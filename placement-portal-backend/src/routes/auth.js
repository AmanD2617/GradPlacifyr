import { Router } from 'express'
import { authenticateToken, authorizeRoles, optionalAuthenticateToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  authLimiter,
  loginLimiter,
  sensitiveLimiter,
  otpVerifyLimiter,
} from '../middleware/rateLimiter.js'
import {
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword,
  handleGoogleAuth,
  handleCompleteGoogleRegistration,
  handleSendOtp,
  handleVerifyOtp,
  handleGetPendingCompanies,
  handleApproveCompany,
  handleRejectCompany,
  handleChangePassword,
} from '../controllers/authController.js'

const router = Router()

// Core auth
router.post('/register', authLimiter, asyncHandler(register))
router.post('/login', loginLimiter, asyncHandler(login))
// Logout uses optionalAuthenticateToken so it works even if the token is
// already expired or invalidated — the cookie is always cleared.
router.post('/logout', optionalAuthenticateToken, asyncHandler(logout))
router.post('/change-password', authenticateToken, sensitiveLimiter, asyncHandler(handleChangePassword))
router.get('/me', authenticateToken, asyncHandler(me))

// Password reset — rate-limited to prevent abuse & enumeration
router.post('/forgot-password', sensitiveLimiter, asyncHandler(forgotPassword))
router.post('/reset-password/:token', sensitiveLimiter, asyncHandler(resetPassword))

// Google OAuth (students only) — rate-limited
router.post('/google', sensitiveLimiter, asyncHandler(handleGoogleAuth))
router.post('/google/complete', sensitiveLimiter, asyncHandler(handleCompleteGoogleRegistration))

// OTP verification — strictly rate-limited to prevent brute-force
router.post('/send-otp', sensitiveLimiter, asyncHandler(handleSendOtp))
router.post('/verify-otp', otpVerifyLimiter, asyncHandler(handleVerifyOtp))

// Company approval (admin only)
router.get('/pending-companies', authenticateToken, authorizeRoles('admin', 'tpo'), asyncHandler(handleGetPendingCompanies))
router.post('/approve-company/:id', authenticateToken, authorizeRoles('admin', 'tpo'), asyncHandler(handleApproveCompany))
router.post('/reject-company/:id', authenticateToken, authorizeRoles('admin', 'tpo'), asyncHandler(handleRejectCompany))

export default router
