import { Router } from 'express'
import prisma from '../db/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// GET /api/users?role=student|company|tpo&q=search
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'tpo'),
  async (req, res, next) => {
    try {
      const { role, q } = req.query
      const where = {}

      if (role) {
        where.role = role
      }

      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ]
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      })

      // Shape response to match original API contract (camelCase alias)
      const result = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.created_at,
      }))

      res.json(result)
    } catch (err) {
      next(err)
    }
  }
)

export default router
