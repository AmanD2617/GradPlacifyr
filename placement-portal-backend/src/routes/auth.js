import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
} from '../controllers/authController.js'

const router = Router()

router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
router.get('/me', authenticateToken, asyncHandler(me))
router.post('/forgot-password', asyncHandler(forgotPassword))
router.post('/reset-password/:token', asyncHandler(resetPassword))

export default router
