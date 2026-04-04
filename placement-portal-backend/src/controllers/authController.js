import jwt from 'jsonwebtoken'
import {
  createPasswordResetRequest,
  getUserById,
  loginUser,
  registerUser,
  resetPasswordWithToken,
  googleAuth,
  completeGoogleRegistration,
  sendOtp,
  verifyOtp,
  getPendingCompanies,
  approveCompany,
  rejectCompany,
} from '../services/authService.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function register(req, res) {
  const result = await registerUser(req.body)
  res.status(201).json(result)
}

export async function login(req, res) {
  const result = await loginUser(req.body)
  res.json(result)
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
  // Verify the Google ID token via Google's tokeninfo endpoint
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
  if (!res.ok) {
    throw new Error('Invalid Google token')
  }
  const payload = await res.json()

  // Verify the audience matches our client ID
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

  // Verify the token server-side
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
    const token = jwt.sign({ id: result.user.id, role: result.user.role }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({ exists: true, token, user: result.user })
  }

  // New user — needs OTP verification first
  res.json({ exists: false, email: result.email, name: result.name, googleId: result.googleId })
}

export async function handleCompleteGoogleRegistration(req, res) {
  const { googleId, email, name, phone } = req.body ?? {}
  const result = await completeGoogleRegistration({ googleId, email, name, phone })
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
