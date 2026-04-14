import { Router } from 'express'
import prisma from '../db/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { AppError } from '../utils/appError.js'

const router = Router()

// GET /api/events — any authenticated user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  ?? '1',   10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit ?? '100', 10) || 100))

    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    res.json(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description || '',
        date: e.date.toISOString().slice(0, 10),
        time: e.time || '',
        company: e.company || '',
        createdBy: e.creator
          ? { id: e.creator.id, name: e.creator.name, role: e.creator.role }
          : null,
        createdAt: e.created_at,
      }))
    )
  } catch (err) {
    next(err)
  }
})

// POST /api/events — admin / company / tpo
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'tpo', 'company'),
  async (req, res, next) => {
    try {
      const { title, description, date, time, company } = req.body

      if (!title || !date) {
        throw new AppError('Title and date are required', 400, 'VALIDATION_ERROR')
      }

      const event = await prisma.event.create({
        data: {
          title:       String(title).slice(0, 255),
          description: description ? String(description).slice(0, 2000) : null,
          date:        new Date(date),
          time:        time    ? String(time).slice(0, 10) : null,
          company:     company ? String(company).slice(0, 255) : null,
          created_by:  req.user.id,
        },
      })

      res.status(201).json({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.date.toISOString().slice(0, 10),
        time: event.time || '',
        company: event.company || '',
        createdAt: event.created_at,
      })
    } catch (err) {
      next(err)
    }
  }
)

// PUT /api/events/:id — admin / tpo can edit any; company can only edit their own
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'tpo', 'company'),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id)
      const { title, description, date, time, company } = req.body

      const existing = await prisma.event.findUnique({ where: { id } })
      if (!existing) {
        throw new AppError('Event not found', 404, 'NOT_FOUND')
      }

      // ═══════════ OWNERSHIP CHECK ═══════════
      // Company users can only edit events they created
      if (req.user.role === 'company' && existing.created_by !== req.user.id) {
        throw new AppError('You can only edit events you created', 403, 'FORBIDDEN')
      }

      const updated = await prisma.event.update({
        where: { id },
        data: {
          ...(title !== undefined       && { title:       String(title).slice(0, 255) }),
          ...(description !== undefined && { description: description ? String(description).slice(0, 2000) : null }),
          ...(date !== undefined        && { date:        new Date(date) }),
          ...(time !== undefined        && { time:        time ? String(time).slice(0, 10) : null }),
          ...(company !== undefined     && { company:     company ? String(company).slice(0, 255) : null }),
        },
      })

      res.json({
        id: updated.id,
        title: updated.title,
        description: updated.description || '',
        date: updated.date.toISOString().slice(0, 10),
        time: updated.time || '',
        company: updated.company || '',
        createdAt: updated.created_at,
      })
    } catch (err) {
      next(err)
    }
  }
)

// DELETE /api/events/:id — admin / tpo can delete any; company can only delete their own
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'tpo', 'company'),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id)

      const existing = await prisma.event.findUnique({ where: { id } })
      if (!existing) {
        throw new AppError('Event not found', 404, 'NOT_FOUND')
      }

      // ═══════════ OWNERSHIP CHECK ═══════════
      if (req.user.role === 'company' && existing.created_by !== req.user.id) {
        throw new AppError('You can only delete events you created', 403, 'FORBIDDEN')
      }

      await prisma.event.delete({ where: { id } })
      res.json({ message: 'Event deleted' })
    } catch (err) {
      next(err)
    }
  }
)

export default router
