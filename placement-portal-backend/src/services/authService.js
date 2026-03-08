import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import pool from '../db/connection.js'
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
  }
}

export async function registerUser({ email, password, role, name }) {
  if (!email || !password || !role) {
    throw new AppError('Email, password and role required', 400, 'VALIDATION_ERROR')
  }

  const hash = await bcrypt.hash(password, 10)
  const [result] = await pool.execute(
    'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)',
    [email, hash, role, name || email.split('@')[0]]
  )

  const user = {
    id: result.insertId,
    email,
    role,
    name: name || email.split('@')[0],
  }

  return {
    token: buildJwt(user),
    user: buildUserPayload(user),
  }
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new AppError('Email and password required', 400, 'VALIDATION_ERROR')
  }

  const [rows] = await pool.execute(
    'SELECT id, email, password_hash, role, name FROM users WHERE email = ?',
    [email]
  )

  if (!rows.length) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  const user = rows[0]
  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  return {
    token: buildJwt(user),
    user: buildUserPayload(user),
  }
}

export async function getUserById(id) {
  const [rows] = await pool.execute('SELECT id, email, role, name FROM users WHERE id = ?', [id])
  if (!rows.length) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }
  return buildUserPayload(rows[0])
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

  const [rows] = await pool.execute('SELECT id, email FROM users WHERE email = ?', [email])
  if (!rows.length) {
    throw new AppError('No account found for this email', 404, 'EMAIL_NOT_FOUND')
  }

  const user = rows[0]
  const rawToken = createRawResetToken()
  const hashedToken = hashResetToken(rawToken)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

  await pool.execute(
    'UPDATE users SET reset_password_token = ?, reset_password_expire = ? WHERE id = ?',
    [hashedToken, expiresAt, user.id]
  )

  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
  const resetLink = `${baseUrl}/reset-password/${rawToken}`

  try {
    await sendResetEmail(user.email, resetLink)
  } catch (err) {
    await pool.execute(
      'UPDATE users SET reset_password_token = NULL, reset_password_expire = NULL WHERE id = ?',
      [user.id]
    )

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
  const [rows] = await pool.execute(
    'SELECT id, reset_password_expire FROM users WHERE reset_password_token = ?',
    [hashedToken]
  )

  if (!rows.length) {
    throw new AppError('Invalid password reset token', 400, 'INVALID_RESET_TOKEN')
  }

  const user = rows[0]
  const expiresAt = user.reset_password_expire ? new Date(user.reset_password_expire) : null

  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    await pool.execute(
      'UPDATE users SET reset_password_token = NULL, reset_password_expire = NULL WHERE id = ?',
      [user.id]
    )
    throw new AppError('Password reset token has expired', 400, 'RESET_TOKEN_EXPIRED')
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await pool.execute(
    `UPDATE users
     SET password_hash = ?, reset_password_token = NULL, reset_password_expire = NULL
     WHERE id = ?`,
    [passwordHash, user.id]
  )

  return { message: 'Password reset successful' }
}
