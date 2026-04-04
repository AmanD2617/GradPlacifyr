import { Router } from 'express'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
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

// Core auth
router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
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
router.get('/pending-companies', authenticateToken, authorizeRoles('admin', 'hod'), asyncHandler(handleGetPendingCompanies))
router.post('/approve-company/:id', authenticateToken, authorizeRoles('admin', 'hod'), asyncHandler(handleApproveCompany))
router.post('/reject-company/:id', authenticateToken, authorizeRoles('admin', 'hod'), asyncHandler(handleRejectCompany))

export default router
