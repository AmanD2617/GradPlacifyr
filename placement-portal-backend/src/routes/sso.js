import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { generateTicket, verifyTicket } from '../controllers/ssoController.js'

const router = Router()

// ─── Internal API key guard ───────────────────────────────────────────────────
// Used exclusively on the back-channel verify endpoint.
// The AIMCQTest server must include:  X-Internal-Api-Key: <SSO_INTERNAL_API_KEY>
function requireInternalApiKey(req, res, next) {
  const expectedKey = process.env.SSO_INTERNAL_API_KEY

  if (!expectedKey) {
    return res.status(500).json({
      success: false,
      error: { code: 'MISCONFIGURED', message: 'SSO_INTERNAL_API_KEY is not set on this server' },
    })
  }

  const providedKey = req.headers['x-internal-api-key']
  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or missing internal API key' },
    })
  }

  next()
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Frontend-facing: generate a one-time ticket for the logged-in student
router.post('/generate-ticket', authenticateToken, asyncHandler(generateTicket))

// Back-channel: AIMCQTest server validates a ticket and receives user info
router.post('/verify-ticket', requireInternalApiKey, asyncHandler(verifyTicket))

export default router
