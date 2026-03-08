import {
  createPasswordResetRequest,
  getUserById,
  loginUser,
  registerUser,
  resetPasswordWithToken,
} from '../services/authService.js'

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
