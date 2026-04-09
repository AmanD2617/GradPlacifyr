import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import prisma from '../db/prisma.js'
import { AppError } from '../utils/appError.js'
import { validateRegistration } from '../utils/validators.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000
const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes

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
    phone: user.phone || null,
    status: user.status || 'active',
  }
}

// ═══════════ ROLE MAPPING ═══════════
// The DB enum uses 'hod' as the stored value for TPO users.
// The auth middleware normalizes 'hod' → 'tpo' for the app layer.
// When writing to DB, we must map 'tpo' back to 'hod'.
const APP_TO_DB_ROLE = { tpo: 'hod' }
function toDbRole(appRole) {
  return APP_TO_DB_ROLE[appRole] || appRole
}

// ═══════════ REGISTRATION ═══════════

export async function registerUser({ email, password, role, name, phone, enrollmentNumber }) {
  // Strict server-side validation
  const validationError = validateRegistration({ email, password, role, name, phone, enrollmentNumber })
  if (validationError) {
    throw new AppError(validationError, 400, 'VALIDATION_ERROR')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const cleanPhone = phone.replace(/\D/g, '')

  // Map app-level role to the DB enum value (e.g. 'tpo' → 'hod')
  const dbRole = toDbRole(role)

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } })
  if (existing) {
    throw new AppError('An account with this email already exists', 409, 'DUPLICATE_EMAIL')
  }

  // Check for duplicate enrollment number (students)
  if (role === 'student' && enrollmentNumber) {
    const existingEnrollment = await prisma.user.findUnique({
      where: { enrollment_number: enrollmentNumber.trim().toUpperCase() },
      select: { id: true },
    })
    if (existingEnrollment) {
      throw new AppError('This enrollment number is already registered', 409, 'DUPLICATE_ENROLLMENT')
    }
  }

  // Company/Recruiter accounts start as "pending" — need admin approval
  const status = role === 'recruiter' ? 'pending' : 'active'

  const hash = await bcrypt.hash(password, 12)

  const created = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password_hash: hash,
      role: dbRole,
      name: name.trim(),
      phone: cleanPhone,
      enrollment_number: role === 'student' ? enrollmentNumber.trim().toUpperCase() : null,
      status,
    },
    select: { id: true },
  })

  // If pending, don't issue a token — tell the user to wait for approval
  if (status === 'pending') {
    return {
      pending: true,
      message: 'Your company account has been submitted for admin approval. You will be able to log in once approved.',
    }
  }

  const user = {
    id: created.id,
    email: normalizedEmail,
    role,
    name: name.trim(),
    profile_image: null,
    phone: cleanPhone,
    status,
  }

  return {
    token: buildJwt(user),
    user: buildUserPayload(user),
  }
}

// ═══════════ LOGIN ═══════════

export async function loginUser({ email, password, role }) {
  if (!email || !password) {
    throw new AppError('Email and password required', 400, 'VALIDATION_ERROR')
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, email: true, password_hash: true, role: true,
      name: true, profile_image: true, phone: true, status: true,
    },
  })

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  // Check account status
  if (user.status === 'pending') {
    throw new AppError(
      'Your account is pending admin approval. Please wait for activation.',
      403,
      'ACCOUNT_PENDING'
    )
  }
  if (user.status === 'rejected') {
    throw new AppError(
      'Your account registration was not approved. Contact the administrator.',
      403,
      'ACCOUNT_REJECTED'
    )
  }

  // Role validation
  if (role) {
    const normalizedSelected = role.toLowerCase()
    const dbRole = user.role.toLowerCase()

    const roleMatches =
      normalizedSelected === dbRole ||
      // Legacy hod users can log in as tpo
      (normalizedSelected === 'tpo' && dbRole === 'hod') ||
      (normalizedSelected === 'hod' && dbRole === 'tpo')

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

// ═══════════ GOOGLE AUTH (STUDENTS ONLY) ═══════════

export async function googleAuth({ googleId, email, name }) {
  if (!googleId || !email) {
    throw new AppError('Google ID and email are required', 400, 'VALIDATION_ERROR')
  }

  // Check if user exists by google_id or email
  let user = await prisma.user.findFirst({
    where: { OR: [{ google_id: googleId }, { email }] },
    select: {
      id: true, email: true, role: true, name: true,
      profile_image: true, phone: true, status: true, google_id: true,
    },
  })

  if (user) {
    // Only students can use Google login
    if (user.role !== 'student') {
      throw new AppError(
        'Google login is only available for students. Please use email/password.',
        403,
        'GOOGLE_NOT_ALLOWED'
      )
    }

    // Link Google ID if not already linked
    if (!user.google_id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { google_id: googleId },
      })
    }

    return { exists: true, user: buildUserPayload(user) }
  }

  // User doesn't exist — we'll create after OTP verification
  return { exists: false, email, name, googleId }
}

export async function completeGoogleRegistration({ googleId, email, name, phone }) {
  // Create new student account with Google
  const randomPassword = crypto.randomBytes(32).toString('hex')
  const hash = await bcrypt.hash(randomPassword, 10)

  const created = await prisma.user.create({
    data: {
      email,
      password_hash: hash,
      role: 'student',
      name: name || email.split('@')[0],
      phone: phone || null,
      google_id: googleId,
      status: 'active',
    },
    select: {
      id: true, email: true, role: true, name: true,
      profile_image: true, phone: true, status: true,
    },
  })

  return {
    token: buildJwt(created),
    user: buildUserPayload(created),
  }
}

// ═══════════ OTP SYSTEM ═══════════

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function sendOtp(email) {
  if (!email) {
    throw new AppError('Email is required', 400, 'VALIDATION_ERROR')
  }

  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  // Invalidate any existing OTPs for this email
  await prisma.otp.updateMany({
    where: { email, used: false },
    data: { used: true },
  })

  // Create new OTP
  await prisma.otp.create({
    data: { email, code, expires_at: expiresAt },
  })

  // Send email
  const transporter = getMailerTransport()
  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Placement Portal - Login OTP',
    text: `Your OTP for login is: ${code}\n\nThis code expires in 10 minutes.`,
    html: `
      <div style="font-family:system-ui,sans-serif;padding:20px;">
        <h2 style="color:#1f4b9c;">Placement Portal</h2>
        <p>Your OTP for login is:</p>
        <h1 style="letter-spacing:8px;font-size:32px;color:#1f4b9c;">${code}</h1>
        <p style="color:#666;">This code expires in 10 minutes.</p>
      </div>
    `,
  })

  return { message: 'OTP sent to your email' }
}

export async function verifyOtp(email, code) {
  if (!email || !code) {
    throw new AppError('Email and OTP code are required', 400, 'VALIDATION_ERROR')
  }

  const otp = await prisma.otp.findFirst({
    where: {
      email,
      code,
      used: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: 'desc' },
  })

  if (!otp) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP')
  }

  // Mark as used
  await prisma.otp.update({
    where: { id: otp.id },
    data: { used: true },
  })

  return { verified: true }
}

// ═══════════ COMPANY APPROVAL (ADMIN) ═══════════

export async function getPendingCompanies() {
  const users = await prisma.user.findMany({
    where: { role: 'recruiter', status: 'pending' },
    select: {
      id: true, name: true, email: true, phone: true, created_at: true,
    },
    orderBy: { created_at: 'desc' },
  })

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    createdAt: u.created_at,
  }))
}

export async function approveCompany(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  })

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }
  if (user.role !== 'recruiter') {
    throw new AppError('Only company accounts can be approved', 400, 'INVALID_ROLE')
  }
  if (user.status !== 'pending') {
    throw new AppError('Account is not in pending state', 400, 'INVALID_STATUS')
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'active' },
  })

  return { message: 'Company account approved' }
}

export async function rejectCompany(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  })

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }
  if (user.role !== 'recruiter') {
    throw new AppError('Only company accounts can be rejected', 400, 'INVALID_ROLE')
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'rejected' },
  })

  return { message: 'Company account rejected' }
}

// ═══════════ EXISTING FEATURES ═══════════

export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, name: true, profile_image: true, phone: true, status: true },
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
