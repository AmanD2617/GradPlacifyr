import { Router } from 'express'
import prisma from '../db/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

const MAX_PAGE_SIZE = 100

// GET /api/users?role=student|company|tpo&q=search&page=1&limit=50
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'tpo'),
  async (req, res, next) => {
    try {
      const { role, q } = req.query

      // Pagination — prevent unbounded full-table dumps
      const page  = Math.max(1, parseInt(req.query.page  ?? '1', 10) || 1)
      const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit ?? '50', 10) || 50))
      const skip  = (page - 1) * limit

      const where = {}
      if (role) where.role = role
      if (q) {
        where.OR = [
          { name:  { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ]
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: { id: true, name: true, email: true, role: true, created_at: true },
          orderBy: { created_at: 'desc' },
          take: limit,
          skip,
        }),
        prisma.user.count({ where }),
      ])

      res.json({
        data: users.map((u) => ({
          id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.created_at,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    } catch (err) {
      next(err)
    }
  }
)

export default router
