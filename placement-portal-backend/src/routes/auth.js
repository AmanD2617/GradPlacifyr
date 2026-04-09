import { Router } from 'express'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { rateLimit } from '../middleware/rateLimiter.js'
import {
  forgotPassword,
  login,
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
} from '../controllers/authController.js'

const router = Router()

// Rate limiters
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: 'Too many requests, please try again later.' })
const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: 'Too many login attempts. Please wait a minute and try again.' })

// Core auth
router.post('/register', authLimiter, asyncHandler(register))
router.post('/login', loginLimiter, asyncHandler(login))
router.get('/me', authenticateToken, asyncHandler(me))
router.post('/forgot-password', asyncHandler(forgotPassword))
router.post('/reset-password/:token', asyncHandler(resetPassword))

// Google OAuth (students only)
router.post('/google', asyncHandler(handleGoogleAuth))
router.post('/google/complete', asyncHandler(handleCompleteGoogleRegistration))

// OTP verification
router.post('/send-otp', asyncHandler(handleSendOtp))
router.post('/verify-otp', asyncHandler(handleVerifyOtp))

// Company approval (admin only)
router.get('/pending-companies', authenticateToken, authorizeRoles('admin', 'tpo'), asyncHandler(handleGetPendingCompanies))
router.post('/approve-company/:id', authenticateToken, authorizeRoles('admin', 'tpo'), asyncHandler(handleApproveCompany))
router.post('/reject-company/:id', authenticateToken, authorizeRoles('admin', 'tpo'), asyncHandler(handleRejectCompany))

export default router
