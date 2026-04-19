import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import prisma from '../db/prisma.js'
import { AppError } from '../utils/appError.js'
import { validateRegistration, STRONG_PASSWORD_REGEX } from '../utils/validators.js'
import { JWT_SECRET } from '../middleware/auth.js'

const BCRYPT_ROUNDS = 12
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000
const OTP_TTL_MS = 10 * 60 * 1000
const OTP_MAX_ATTEMPTS = 5

// Per-account login brute-force protection
const LOGIN_MAX_FAILURES = 5          // Lock after 5 consecutive failures
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000 // Lock for 15 minutes

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

/**
 * Build JWT with token_version (tv) embedded so we can invalidate all
 * tokens for a user by incrementing their token_version in the DB.
 */
function buildJwt(user) {
  return jwt.sign(
    { id: user.id, role: user.role, tv: user.token_version ?? 1 },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

/** Public alias used by the controller layer (e.g., Google OAuth flow). */
export { buildJwt as buildJwtPublic }

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
const APP_TO_DB_ROLE = { tpo: 'hod' }
function toDbRole(appRole) {
  return APP_TO_DB_ROLE[appRole] || appRole
}

/**
 * Roles that MUST NEVER be creatable via the public registration endpoint.
 *
 * - `admin`: seeded once at startup via DEFAULT_ADMIN_EMAIL/PASSWORD; all
 *   subsequent admins would be a privilege-escalation risk.
 * - `tpo` / `hod`: TPO accounts are provisioned only by an existing Admin
 *   from inside the Admin dashboard. The public UI hides these options,
 *   but this guard is the authoritative enforcement point — it defends
 *   against anyone calling POST /api/auth/register directly (curl/Postman)
 *   with a crafted payload.
 *
 * Kept as a lowercased set so case-variant payloads (`"ADMIN"`, `"Tpo"`,
 * etc.) are also rejected.
 */
const PRIVILEGED_ROLES = new Set(['admin', 'tpo', 'hod'])

// ═══════════ REGISTRATION ═══════════

export async function registerUser({ email, password, role, name, phone, enrollmentNumber }) {
  // ═══════════ PRIVILEGED ROLE GUARD ═══════════
  // Reject any attempt to self-register as an admin or TPO via the public
  // endpoint. This runs BEFORE the generic validator so the caller never
  // sees a VALIDATION_ERROR that might leak which fields are required for
  // these roles. Returning 403 also signals to honest clients that this
  // action is forbidden regardless of payload correctness.
  const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : ''
  if (PRIVILEGED_ROLES.has(normalizedRole)) {
    throw new AppError(
      'This role cannot be created through public registration. Contact your administrator.',
      403,
      'ROLE_NOT_ALLOWED'
    )
  }

  const validationError = validateRegistration({ email, password, role, name, phone, enrollmentNumber })
  if (validationError) {
    throw new AppError(validationError, 400, 'VALIDATION_ERROR')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const cleanPhone = phone.replace(/\D/g, '')
  const dbRole = toDbRole(role)

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } })
  if (existing) {
    throw new AppError('An account with this email already exists', 409, 'DUPLICATE_EMAIL')
  }

  if (role === 'student' && enrollmentNumber) {
    const existingEnrollment = await prisma.user.findUnique({
      where: { enrollment_number: enrollmentNumber.trim().toUpperCase() },
      select: { id: true },
    })
    if (existingEnrollment) {
      throw new AppError('This enrollment number is already registered', 409, 'DUPLICATE_ENROLLMENT')
    }
  }

  const status = role === 'recruiter' ? 'pending' : 'active'
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS)

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
    select: { id: true, token_version: true },
  })

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
    token_version: created.token_version ?? 1,
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
      token_version: true, failed_login_attempts: true, locked_until: true,
    },
  })

  if (!user) {
    // Still run a dummy bcrypt compare to prevent timing-based user enumeration
    await bcrypt.compare(password, '$2a$12$invalidhashinvalidhashinvalidhashX')
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  // ═══════════ PER-ACCOUNT LOCKOUT ═══════════
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remaining = Math.ceil((new Date(user.locked_until) - Date.now()) / 60000)
    throw new AppError(
      `Account locked due to too many failed attempts. Try again in ${remaining} minute(s).`,
      429,
      'ACCOUNT_LOCKED'
    )
  }

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) {
    // Increment failed attempt counter; lock after threshold
    const attempts = (user.failed_login_attempts ?? 0) + 1
    const lockData = attempts >= LOGIN_MAX_FAILURES
      ? { failed_login_attempts: attempts, locked_until: new Date(Date.now() + LOGIN_LOCKOUT_MS) }
      : { failed_login_attempts: attempts }

    await prisma.user.update({ where: { id: user.id }, data: lockData })
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  // Successful login — reset failure counter and unlock
  await prisma.user.update({
    where: { id: user.id },
    data: { failed_login_attempts: 0, locked_until: null },
  })

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

  if (role) {
    const normalizedSelected = role.toLowerCase()
    const dbRole = user.role.toLowerCase()
    const roleMatches =
      normalizedSelected === dbRole ||
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

  let user = await prisma.user.findFirst({
    where: { OR: [{ google_id: googleId }, { email }] },
    select: {
      id: true, email: true, role: true, name: true,
      profile_image: true, phone: true, status: true, google_id: true,
      token_version: true,  // Required for buildJwt() to embed the tv claim
    },
  })

  if (user) {
    if (user.role !== 'student') {
      throw new AppError(
        'Google login is only available for students. Please use email/password.',
        403,
        'GOOGLE_NOT_ALLOWED'
      )
    }

    if (!user.google_id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { google_id: googleId },
      })
    }

    // Return both the public-safe payload AND the raw DB row so the controller
    // can call buildJwtPublic(rawUser) which needs token_version.
    return { exists: true, user: buildUserPayload(user), rawUser: user }
  }

  return { exists: false, email, name, googleId }
}

export async function completeGoogleRegistration({ googleId, email, name, phone, verificationToken }) {
  // ═══════════ OTP PROOF REQUIRED ═══════════
  // The caller must supply a verification token issued by verifyOtp()
  if (!verificationToken) {
    throw new AppError('OTP verification is required before registration', 400, 'OTP_NOT_VERIFIED')
  }

  try {
    const payload = jwt.verify(verificationToken, JWT_SECRET)
    if (payload.purpose !== 'otp_verified' || payload.email !== email) {
      throw new Error('mismatch')
    }
  } catch {
    throw new AppError('Invalid or expired OTP verification token', 400, 'INVALID_VERIFICATION_TOKEN')
  }

  const randomPassword = crypto.randomBytes(32).toString('hex')
  const hash = await bcrypt.hash(randomPassword, BCRYPT_ROUNDS)

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
      profile_image: true, phone: true, status: true, token_version: true,
    },
  })

  return {
    token: buildJwt(created),
    user: buildUserPayload(created),
  }
}

// ═══════════ OTP SYSTEM ═══════════

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt() instead of Math.random().
 */
function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000))
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

  // Create new OTP (attempts start at 0)
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
      used: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: 'desc' },
  })

  if (!otp) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP')
  }

  // ═══════════ OTP BRUTE-FORCE PROTECTION ═══════════
  const attempts = (otp.attempts ?? 0) + 1

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    // Already at max — lock this OTP and force a new one
    await prisma.otp.update({ where: { id: otp.id }, data: { used: true } })
    throw new AppError('Too many failed OTP attempts. Please request a new code.', 429, 'OTP_MAX_ATTEMPTS')
  }

  // Constant-time comparison to prevent timing attacks
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(code.padEnd(6, ' ')),
    Buffer.from(otp.code.padEnd(6, ' '))
  )

  if (!isMatch) {
    // Persist incremented attempt count; lock if threshold reached
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await prisma.otp.update({ where: { id: otp.id }, data: { used: true, attempts } })
      throw new AppError('Too many failed OTP attempts. Please request a new code.', 429, 'OTP_MAX_ATTEMPTS')
    }
    await prisma.otp.update({ where: { id: otp.id }, data: { attempts } })
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP')
  }

  // Mark as used
  await prisma.otp.update({
    where: { id: otp.id },
    data: { used: true },
  })

  // Issue a short-lived verification token (proof that OTP was verified)
  const verificationToken = jwt.sign(
    { email, purpose: 'otp_verified' },
    JWT_SECRET,
    { expiresIn: '15m' }
  )

  return { verified: true, verificationToken }
}

// ═══════════ COMPANY APPROVAL (ADMIN) ═══════════

export async function getPendingCompanies() {
  const users = await prisma.user.findMany({
    where: { role: 'recruiter', status: 'pending' },
    select: {
      id: true, name: true, email: true, phone: true, created_at: true,
    },
    orderBy: { created_at: 'desc' },
    take: 200, // Reasonable ceiling — pending queue shouldn't exceed this
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

/** Send a notification that the password was changed (security alert) */
async function sendPasswordChangedNotification(toEmail) {
  try {
    const transporter = getMailerTransport()
    const from = process.env.SMTP_FROM || process.env.SMTP_USER

    await transporter.sendMail({
      from,
      to: toEmail,
      subject: 'Placement Portal - Your Password Was Changed',
      text: 'Your password was recently changed. If you did not make this change, please contact support immediately.',
      html: `
        <div style="font-family:system-ui,sans-serif;padding:20px;">
          <h2 style="color:#1f4b9c;">Placement Portal</h2>
          <p>Your password was recently changed.</p>
          <p style="color:#c0392b;font-weight:bold;">If you did not make this change, please contact support immediately.</p>
        </div>
      `,
    })
  } catch {
    // Non-critical — don't fail the reset if notification fails
    console.error('Failed to send password change notification email')
  }
}

export async function createPasswordResetRequest(email) {
  if (!email) {
    throw new AppError('Email is required', 400, 'VALIDATION_ERROR')
  }

  // ═══════════ PREVENT EMAIL ENUMERATION ═══════════
  // Always return the same response regardless of whether the email exists.
  const GENERIC_RESPONSE = { message: 'If that email is registered, you will receive a password reset link.' }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  })

  if (!user) {
    // Return generic response — do NOT reveal that the email is unregistered
    return GENERIC_RESPONSE
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

  // ═══════════ VALIDATE FRONTEND_URL — PREVENT OPEN REDIRECT ═══════════
  const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  let baseUrl
  try {
    const parsed = new URL(rawFrontendUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol')
    }
    baseUrl = parsed.origin // strips trailing path, enforces origin only
  } catch {
    console.error('[authService] Invalid FRONTEND_URL in environment — falling back to localhost')
    baseUrl = 'http://localhost:5173'
  }
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

  return GENERIC_RESPONSE
}

export async function resetPasswordWithToken(rawToken, newPassword) {
  if (!rawToken) {
    throw new AppError('Reset token is required', 400, 'VALIDATION_ERROR')
  }

  if (!newPassword) {
    throw new AppError('New password is required', 400, 'VALIDATION_ERROR')
  }

  // ═══════════ PASSWORD STRENGTH VALIDATION ON RESET ═══════════
  if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
    throw new AppError(
      'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      400,
      'WEAK_PASSWORD'
    )
  }

  const hashedToken = hashResetToken(rawToken)

  const user = await prisma.user.findFirst({
    where: { reset_password_token: hashedToken },
    select: { id: true, email: true, reset_password_expire: true },
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

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash: passwordHash,
      reset_password_token: null,
      reset_password_expire: null,
      token_version: { increment: 1 }, // Invalidate all existing sessions
      failed_login_attempts: 0,        // Reset lockout state after password change
      locked_until: null,
    },
  })

  // ═══════════ SEND PASSWORD CHANGE NOTIFICATION ═══════════
  await sendPasswordChangedNotification(user.email)

  return { message: 'Password reset successful' }
}

// ═══════════ AUTHENTICATED PASSWORD CHANGE ═══════════

export async function changePassword(userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400, 'VALIDATION_ERROR')
  }

  if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
    throw new AppError(
      'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      400,
      'WEAK_PASSWORD'
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, password_hash: true, google_id: true },
  })

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }

  // Google-only accounts have a random password_hash — don't allow change via this flow
  if (!user.password_hash) {
    throw new AppError(
      'Password change is not available for Google-linked accounts',
      400,
      'GOOGLE_ACCOUNT'
    )
  }

  const match = await bcrypt.compare(currentPassword, user.password_hash)
  if (!match) {
    throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS')
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from current password', 400, 'SAME_PASSWORD')
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

  await prisma.user.update({
    where: { id: userId },
    data: {
      password_hash: newHash,
      token_version: { increment: 1 }, // Invalidate all other sessions
      failed_login_attempts: 0,
      locked_until: null,
    },
  })

  await sendPasswordChangedNotification(user.email)

  return { message: 'Password changed successfully' }
}
