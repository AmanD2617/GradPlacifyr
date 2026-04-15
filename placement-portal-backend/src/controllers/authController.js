import { JWT_SECRET, getTokenCookieOptions } from '../middleware/auth.js'
import prisma from '../db/prisma.js'
import {
  createPasswordResetRequest,
  getUserById,
  loginUser,
  registerUser,
  resetPasswordWithToken,
  googleAuth,
  completeGoogleRegistration,
  buildJwtPublic,
  sendOtp,
  verifyOtp,
  getPendingCompanies,
  approveCompany,
  rejectCompany,
  changePassword,
} from '../services/authService.js'

/** Helper: set JWT as HttpOnly cookie and include in response body */
function setAuthCookie(res, token) {
  res.cookie('placement_token', token, getTokenCookieOptions())
}

export async function register(req, res) {
  const result = await registerUser(req.body)

  // Set cookie if token was issued (not pending accounts)
  if (result.token) {
    setAuthCookie(res, result.token)
  }

  res.status(201).json(result)
}

export async function login(req, res) {
  const result = await loginUser(req.body)
  setAuthCookie(res, result.token)
  res.json(result)
}

export async function logout(req, res) {
  // ═══════════ INVALIDATE JWT VIA TOKEN VERSION ═══════════
  // Incrementing token_version makes all existing JWTs for this user invalid,
  // even if an attacker has a copy of the token (e.g., from XSS before fix).
  if (req.user?.id) {
    try {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { token_version: { increment: 1 } },
      })
    } catch {
      // Non-fatal — still clear the cookie
    }
  }

  // Clear the auth cookie
  res.clearCookie('placement_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
  })
  res.json({ message: 'Logged out' })
}

export async function me(req, res) {
  const user = await getUserById(req.user.id)
  res.json(user)
}

export async function forgotPassword(req, res) {
  const { email } = req.body ?? {}
  const result = await createPasswordResetRequest(email)
  res.json(result)
}

export async function resetPassword(req, res) {
  const { token } = req.params
  const { password } = req.body ?? {}
  const result = await resetPasswordWithToken(token, password)
  res.json(result)
}

// ═══════════ GOOGLE AUTH ═══════════

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''

async function verifyGoogleToken(idToken) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
  if (!res.ok) {
    throw new Error('Invalid Google token')
  }
  const payload = await res.json()

  if (payload.aud !== GOOGLE_CLIENT_ID) {
    throw new Error('Token audience mismatch')
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
  }
}

export async function handleGoogleAuth(req, res) {
  const { credential } = req.body ?? {}

  if (!credential) {
    return res.status(400).json({ error: 'Google credential token is required' })
  }

  let googleUser
  try {
    googleUser = await verifyGoogleToken(credential)
  } catch {
    return res.status(401).json({ error: 'Invalid Google credential' })
  }

  const result = await googleAuth({
    googleId: googleUser.googleId,
    email: googleUser.email,
    name: googleUser.name,
  })

  if (result.exists) {
    // buildJwtPublic includes the tv (token_version) claim required by verifyTokenVersion()
    const token = buildJwtPublic(result.rawUser)
    setAuthCookie(res, token)
    return res.json({ exists: true, token, user: result.user })
  }

  // New user — needs OTP verification first
  res.json({ exists: false, email: result.email, name: result.name, googleId: result.googleId })
}

export async function handleCompleteGoogleRegistration(req, res) {
  const { googleId, email, name, phone, verificationToken } = req.body ?? {}

  // completeGoogleRegistration now requires the OTP verification token
  const result = await completeGoogleRegistration({ googleId, email, name, phone, verificationToken })

  if (result.token) {
    setAuthCookie(res, result.token)
  }

  res.status(201).json(result)
}

// ═══════════ OTP ═══════════

export async function handleSendOtp(req, res) {
  const { email } = req.body ?? {}
  const result = await sendOtp(email)
  res.json(result)
}

export async function handleVerifyOtp(req, res) {
  const { email, code } = req.body ?? {}
  const result = await verifyOtp(email, code)
  // result now includes { verified: true, verificationToken }
  res.json(result)
}

// ═══════════ AUTHENTICATED PASSWORD CHANGE ═══════════

export async function handleChangePassword(req, res) {
  const { currentPassword, newPassword } = req.body ?? {}
  const result = await changePassword(req.user.id, { currentPassword, newPassword })
  res.json(result)
}

// ═══════════ COMPANY APPROVAL ═══════════

export async function handleGetPendingCompanies(_req, res) {
  const result = await getPendingCompanies()
  res.json(result)
}

export async function handleApproveCompany(req, res) {
  const userId = parseInt(req.params.id, 10)
  const result = await approveCompany(userId)
  res.json(result)
}

export async function handleRejectCompany(req, res) {
  const userId = parseInt(req.params.id, 10)
  const result = await rejectCompany(userId)
  res.json(result)
}
