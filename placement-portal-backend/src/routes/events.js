import { Router } from 'express'
import prisma from '../db/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { AppError } from '../utils/appError.js'

const router = Router()

// GET /api/events — list all events (any authenticated user)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
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

// POST /api/events — create event (admin / company only)
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
          title,
          description: description || null,
          date: new Date(date),
          time: time || null,
          company: company || null,
          created_by: req.user.id,
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

// PUT /api/events/:id — update event (admin / company only)
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

      if (existing.created_by !== req.user.id && req.user.role !== 'admin') {
        throw new AppError('Forbidden', 403, 'FORBIDDEN')
      }

      const updated = await prisma.event.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(date !== undefined && { date: new Date(date) }),
          ...(time !== undefined && { time }),
          ...(company !== undefined && { company }),
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

// DELETE /api/events/:id — delete event (admin / company only)
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

      if (existing.created_by !== req.user.id && req.user.role !== 'admin') {
        throw new AppError('Forbidden', 403, 'FORBIDDEN')
      }

      await prisma.event.delete({ where: { id } })
      res.json({ message: 'Event deleted' })
    } catch (err) {
      next(err)
    }
  }
)

export default router
