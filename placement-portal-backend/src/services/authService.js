import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import prisma from '../db/prisma.js'
import { AppError } from '../utils/appError.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

let cachedTransporter

function getMailerTransport() {
  if (cachedTransporter) return cachedTransporter

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    throw new AppError('Email service is not configured', 503, 'EMAIL_NOT_CONFIGURED')
  }

  const secure = process.env.SMTP_SECURE === 'true' || port === 465
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })

  return cachedTransporter
}

function buildJwt(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

function buildUserPayload(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name || user.email.split('@')[0],
    profileImage: user.profile_image || null,
  }
}

export async function registerUser({ email, password, role, name }) {
  if (!email || !password || !role) {
    throw new AppError('Email, password and role required', 400, 'VALIDATION_ERROR')
  }

  const hash = await bcrypt.hash(password, 10)

  const created = await prisma.user.create({
    data: {
      email,
      password_hash: hash,
      role,
      name: name || email.split('@')[0],
    },
    select: { id: true },
  })

  const user = {
    id: created.id,
    email,
    role,
    name: name || email.split('@')[0],
    profile_image: null,
  }

  return {
    token: buildJwt(user),
    user: buildUserPayload(user),
  }
}

export async function loginUser({ email, password, role }) {
  if (!email || !password) {
    throw new AppError('Email and password required', 400, 'VALIDATION_ERROR')
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, password_hash: true, role: true, name: true, profile_image: true },
  })

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  // Role validation — if frontend sent a role, it must match the DB role
  if (role) {
    // Normalize: frontend sends "recruiter" but DB may store "recruiter";
    // frontend may send "admin" for both admin and hod roles
    const normalizedSelected = role.toLowerCase()
    const dbRole = user.role.toLowerCase()

    const roleMatches =
      normalizedSelected === dbRole ||
      (normalizedSelected === 'admin' && dbRole === 'hod') ||
      (normalizedSelected === 'hod' && dbRole === 'admin')

    if (!roleMatches) {
      throw new AppError(
        'You are not registered as this role. Please select the correct role.',
        403,
        'ROLE_MISMATCH'
      )
    }
  }

  return {
    token: buildJwt(user),
    user: buildUserPayload(user),
  }
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, name: true, profile_image: true },
  })

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }

  return buildUserPayload(user)
}

function createRawResetToken() {
  return crypto.randomBytes(32).toString('hex')
}

function hashResetToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

async function sendResetEmail(toEmail, resetLink) {
  const transporter = getMailerTransport()
  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: 'Placement Portal Password Reset',
    text: `You requested a password reset. Use this link within 1 hour: ${resetLink}`,
    html: `<p>You requested a password reset.</p><p>Use this link within 1 hour:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
  })
}

export async function createPasswordResetRequest(email) {
  if (!email) {
    throw new AppError('Email is required', 400, 'VALIDATION_ERROR')
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  })

  if (!user) {
    throw new AppError('No account found for this email', 404, 'EMAIL_NOT_FOUND')
  }

  const rawToken = createRawResetToken()
  const hashedToken = hashResetToken(rawToken)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      reset_password_token: hashedToken,
      reset_password_expire: expiresAt,
    },
  })

  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
  const resetLink = `${baseUrl}/reset-password/${rawToken}`

  try {
    await sendResetEmail(user.email, resetLink)
  } catch (err) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_password_token: null,
        reset_password_expire: null,
      },
    })

    if (err instanceof AppError) {
      throw err
    }

    throw new AppError('Unable to send password reset email', 502, 'EMAIL_SEND_FAILED')
  }

  return { message: 'Password reset email sent' }
}

export async function resetPasswordWithToken(rawToken, newPassword) {
  if (!rawToken) {
    throw new AppError('Reset token is required', 400, 'VALIDATION_ERROR')
  }

  if (!newPassword) {
    throw new AppError('New password is required', 400, 'VALIDATION_ERROR')
  }

  const hashedToken = hashResetToken(rawToken)

  const user = await prisma.user.findFirst({
    where: { reset_password_token: hashedToken },
    select: { id: true, reset_password_expire: true },
  })

  if (!user) {
    throw new AppError('Invalid password reset token', 400, 'INVALID_RESET_TOKEN')
  }

  const expiresAt = user.reset_password_expire ? new Date(user.reset_password_expire) : null

  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_password_token: null,
        reset_password_expire: null,
      },
    })
    throw new AppError('Password reset token has expired', 400, 'RESET_TOKEN_EXPIRED')
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash: passwordHash,
      reset_password_token: null,
      reset_password_expire: null,
    },
  })

  return { message: 'Password reset successful' }
}
