import { randomBytes } from 'crypto'
import prisma from '../db/prisma.js'
import { AppError } from '../utils/appError.js'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sso/generate-ticket
// Called by the Placement Portal frontend (authenticated student).
// Generates a cryptographically secure, single-use 32-character ticket,
// persists it with a 60-second TTL, and returns the AIMCQTest redirect URL.
// ─────────────────────────────────────────────────────────────────────────────
export async function generateTicket(req, res) {
  const userId = req.user.id

  // 16 random bytes → 32 lowercase hex characters (128-bit entropy)
  const ticket = randomBytes(16).toString('hex')

  const expiresAt = new Date(Date.now() + 60 * 1000) // 60 seconds from now

  // Remove any stale tickets for this user before issuing a new one
  await prisma.ssoTicket.deleteMany({ where: { user_id: userId } })

  await prisma.ssoTicket.create({
    data: {
      ticket,
      user_id: userId,
      expires_at: expiresAt,
    },
  })

  const aimcqtestUrl = (process.env.AIMCQTEST_FRONTEND_URL || 'http://localhost:5174').replace(/\/$/, '')
  const redirectUrl = `${aimcqtestUrl}/sso?ticket=${ticket}`

  res.json({ success: true, redirectUrl })
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sso/verify-ticket
// Private back-channel — called only by the AIMCQTest server.
// Secured via X-Internal-Api-Key header (not user JWT).
// Looks up the ticket, deletes it immediately (one-time use), then—only if it
// hasn't expired—returns the associated user's email, firstName, and lastName.
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyTicket(req, res) {
  const { ticket } = req.body

  if (!ticket || typeof ticket !== 'string') {
    throw new AppError('ticket is required', 400, 'MISSING_TICKET')
  }

  // Look up the ticket together with the owning user
  const record = await prisma.ssoTicket.findUnique({
    where: { ticket },
    include: { user: true },
  })

  if (!record) {
    throw new AppError('Invalid or already-used ticket', 401, 'INVALID_TICKET')
  }

  // Always delete immediately — prevents replay even on failure paths below
  await prisma.ssoTicket.delete({ where: { ticket } })

  // Check expiry AFTER deletion so an expired ticket can never be retried
  if (record.expires_at < new Date()) {
    throw new AppError('Ticket has expired', 401, 'TICKET_EXPIRED')
  }

  // Split the stored full name into first / last components
  const nameParts = (record.user.name ?? '').trim().split(/\s+/)
  const firstName = nameParts[0] ?? ''
  const lastName  = nameParts.slice(1).join(' ')

  res.json({
    success: true,
    user: {
      email: record.user.email,
      firstName,
      lastName,
    },
  })
}

