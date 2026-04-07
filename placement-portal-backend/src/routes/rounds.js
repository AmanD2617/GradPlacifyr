import { Router } from 'express'
import prisma from '../db/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { AppError } from '../utils/appError.js'
import { buildCompanyJobScope } from '../utils/jobOwnerColumn.js'

const router = Router()

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Verify job belongs to the requesting company user (or is admin). */
async function assertJobAccess(jobId, user) {
  // Guard: prisma client must be available
  if (!prisma || !prisma.job) {
    console.error('Prisma client or prisma.job is undefined — check DB connection / schema generation')
    throw new AppError('Database service unavailable', 500, 'DB_UNAVAILABLE')
  }

  if (jobId == null || isNaN(jobId) || jobId <= 0) {
    throw new AppError('Invalid job ID', 400, 'INVALID_JOB_ID')
  }

  try {
    if (user.role === 'company') {
      const scope = await buildCompanyJobScope('j', user.id)
      const job = await prisma.job.findFirst({
        where: { id: jobId, ...scope.prismaWhere },
        select: { id: true },
      })
      if (!job) {
        throw new AppError('Job not found or you do not have access', 404, 'JOB_NOT_FOUND')
      }
      return job
    }

    // Admin / TPO path
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true },
    })
    if (!job) {
      throw new AppError('Job not found', 404, 'JOB_NOT_FOUND')
    }
    return job
  } catch (err) {
    if (err instanceof AppError) throw err
    console.error('assertJobAccess unexpected error:', err)
    throw new AppError('Failed to verify job access', 500, 'INTERNAL_ERROR')
  }
}

// ═══════════ ROUND CRUD ═══════════

// GET /api/rounds?jobId=:jobId — list rounds for a job
router.get(
  '/',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { jobId } = req.query
      if (!jobId) throw new AppError('jobId query param required', 400, 'VALIDATION_ERROR')

      const jid = Number(jobId)

      const rounds = await prisma.round.findMany({
        where: { job_id: jid },
        select: {
          id: true,
          job_id: true,
          title: true,
          sort_order: true,
          date: true,
          description: true,
          _count: { select: { candidates: true } },
        },
        orderBy: { sort_order: 'asc' },
      })

      const result = rounds.map((r) => ({
        id: r.id,
        jobId: r.job_id,
        title: r.title,
        order: r.sort_order,
        date: r.date,
        description: r.description,
        candidateCount: r._count.candidates,
      }))

      res.json(result)
    } catch (err) {
      next(err)
    }
  }
)

// POST /api/rounds — create a round for a job
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'company', 'tpo'),
  async (req, res, next) => {
    try {
      const { jobId, title, order, date, description } = req.body ?? {}

      // Validate required fields
      if (!jobId) {
        throw new AppError('jobId is required', 400, 'VALIDATION_ERROR')
      }
      if (!title || !String(title).trim()) {
        throw new AppError('title is required', 400, 'VALIDATION_ERROR')
      }

      const jid = Number(jobId)
      if (isNaN(jid) || jid <= 0) {
        throw new AppError('jobId must be a positive number', 400, 'VALIDATION_ERROR')
      }

      // Verify job exists and user has access
      await assertJobAccess(jid, req.user)

      // Auto-determine order if not provided
      let sortOrder = order
      if (sortOrder == null) {
        const maxRound = await prisma.round.findFirst({
          where: { job_id: jid },
          orderBy: { sort_order: 'desc' },
          select: { sort_order: true },
        })
        sortOrder = (maxRound?.sort_order ?? 0) + 1
      }

      const round = await prisma.round.create({
        data: {
          job_id: jid,
          title,
          sort_order: Number(sortOrder),
          date: date ? new Date(date) : null,
          description: description || null,
        },
      })

      res.status(201).json({
        id: round.id,
        jobId: round.job_id,
        title: round.title,
        order: round.sort_order,
        date: round.date,
        description: round.description,
      })
    } catch (err) {
      next(err)
    }
  }
)

// PUT /api/rounds/:id — update a round
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'company', 'tpo'),
  async (req, res, next) => {
    try {
      const roundId = Number(req.params.id)
      const round = await prisma.round.findUnique({ where: { id: roundId }, select: { id: true, job_id: true } })
      if (!round) throw new AppError('Round not found', 404, 'NOT_FOUND')

      await assertJobAccess(round.job_id, req.user)

      const { title, order, date, description } = req.body

      await prisma.round.update({
        where: { id: roundId },
        data: {
          ...(title !== undefined && { title }),
          ...(order !== undefined && { sort_order: Number(order) }),
          ...(date !== undefined && { date: date ? new Date(date) : null }),
          ...(description !== undefined && { description }),
        },
      })

      res.json({ ok: true })
    } catch (err) {
      next(err)
    }
  }
)

// DELETE /api/rounds/:id — delete a round
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'company', 'tpo'),
  async (req, res, next) => {
    try {
      const roundId = Number(req.params.id)
      const round = await prisma.round.findUnique({ where: { id: roundId }, select: { id: true, job_id: true } })
      if (!round) throw new AppError('Round not found', 404, 'NOT_FOUND')

      await assertJobAccess(round.job_id, req.user)

      await prisma.round.delete({ where: { id: roundId } })

      res.json({ ok: true })
    } catch (err) {
      next(err)
    }
  }
)

// ═══════════ ROUND CANDIDATES ═══════════

// GET /api/rounds/:id/candidates — list candidates in a round
router.get(
  '/:id/candidates',
  authenticateToken,
  authorizeRoles('admin', 'company', 'tpo'),
  async (req, res, next) => {
    try {
      const roundId = Number(req.params.id)

      const round = await prisma.round.findUnique({
        where: { id: roundId },
        select: { id: true, job_id: true, title: true, sort_order: true },
      })
      if (!round) throw new AppError('Round not found', 404, 'NOT_FOUND')

      await assertJobAccess(round.job_id, req.user)

      const candidates = await prisma.roundCandidate.findMany({
        where: { round_id: roundId },
        select: {
          id: true,
          status: true,
          updated_at: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              enrollment_number: true,
              profile_image: true,
              profile: {
                select: {
                  resume_url: true,
                  resume_original_name: true,
                  programming_languages: true,
                  frameworks: true,
                  tools: true,
                },
              },
            },
          },
        },
      })

      const result = candidates.map((c) => ({
        id: c.id,
        status: c.status,
        updatedAt: c.updated_at,
        studentId: c.student.id,
        studentName: c.student.name,
        studentEmail: c.student.email,
        studentPhone: c.student.phone,
        enrollmentNumber: c.student.enrollment_number,
        profileImage: c.student.profile_image,
        resumeUrl: c.student.profile?.resume_url || null,
        skills: [
          c.student.profile?.programming_languages,
          c.student.profile?.frameworks,
          c.student.profile?.tools,
        ].filter(Boolean).join(', '),
      }))

      res.json({ round, candidates: result })
    } catch (err) {
      next(err)
    }
  }
)

// POST /api/rounds/:id/seed — seed first round with all applied students for that job
router.post(
  '/:id/seed',
  authenticateToken,
  authorizeRoles('admin', 'company', 'tpo'),
  async (req, res, next) => {
    try {
      const roundId = Number(req.params.id)

      const round = await prisma.round.findUnique({
        where: { id: roundId },
        select: { id: true, job_id: true, sort_order: true },
      })
      if (!round) throw new AppError('Round not found', 404, 'NOT_FOUND')

      await assertJobAccess(round.job_id, req.user)

      // Get all students who applied for this job and aren't rejected
      const applications = await prisma.application.findMany({
        where: {
          job_id: round.job_id,
          status: { not: 'rejected' },
        },
        select: { student_id: true, id: true },
      })

      // Upsert into round_candidates (skip if already exists)
      let added = 0
      for (const app of applications) {
        const existing = await prisma.roundCandidate.findUnique({
          where: { round_id_student_id: { round_id: roundId, student_id: app.student_id } },
          select: { id: true },
        })
        if (!existing) {
          await prisma.roundCandidate.create({
            data: { round_id: roundId, student_id: app.student_id, status: 'pending' },
          })
          // Set this as the current round for the student's application
          await prisma.application.update({
            where: { job_id_student_id: { job_id: round.job_id, student_id: app.student_id } },
            data: { current_round_id: roundId },
          })
          added++
        }
      }

      res.json({ ok: true, added, total: applications.length })
    } catch (err) {
      next(err)
    }
  }
)

// PATCH /api/rounds/:id/candidates/:candidateId — update candidate status (clear / reject)
router.patch(
  '/:id/candidates/:candidateId',
  authenticateToken,
  authorizeRoles('admin', 'company', 'tpo'),
  async (req, res, next) => {
    try {
      const roundId = Number(req.params.id)
      const candidateId = Number(req.params.candidateId)
      const { status } = req.body

      if (!['cleared', 'rejected', 'pending'].includes(status)) {
        throw new AppError('Invalid status. Must be cleared, rejected, or pending', 400, 'VALIDATION_ERROR')
      }

      const rc = await prisma.roundCandidate.findUnique({
        where: { id: candidateId },
        select: { id: true, round_id: true, student_id: true, round: { select: { job_id: true, sort_order: true } } },
      })
      if (!rc || rc.round_id !== roundId) {
        throw new AppError('Candidate not found in this round', 404, 'NOT_FOUND')
      }

      await assertJobAccess(rc.round.job_id, req.user)

      // Update the candidate status
      await prisma.roundCandidate.update({
        where: { id: candidateId },
        data: { status },
      })

      // If cleared, advance to the next round
      if (status === 'cleared') {
        const nextRound = await prisma.round.findFirst({
          where: {
            job_id: rc.round.job_id,
            sort_order: { gt: rc.round.sort_order },
          },
          orderBy: { sort_order: 'asc' },
          select: { id: true },
        })

        if (nextRound) {
          // Create entry in next round (if not already present)
          const existsInNext = await prisma.roundCandidate.findUnique({
            where: { round_id_student_id: { round_id: nextRound.id, student_id: rc.student_id } },
            select: { id: true },
          })
          if (!existsInNext) {
            await prisma.roundCandidate.create({
              data: { round_id: nextRound.id, student_id: rc.student_id, status: 'pending' },
            })
          }

          // Update the application's current round pointer
          await prisma.application.updateMany({
            where: { job_id: rc.round.job_id, student_id: rc.student_id },
            data: { current_round_id: nextRound.id },
          })
        } else {
          // No more rounds — mark as selected
          await prisma.application.updateMany({
            where: { job_id: rc.round.job_id, student_id: rc.student_id },
            data: { status: 'selected' },
          })
        }
      }

      // If rejected, update application status too
      if (status === 'rejected') {
        await prisma.application.updateMany({
          where: { job_id: rc.round.job_id, student_id: rc.student_id },
          data: { status: 'rejected' },
        })
      }

      res.json({ ok: true })
    } catch (err) {
      next(err)
    }
  }
)

// ═══════════ STUDENT VIEW ═══════════

// GET /api/rounds/my-progress — student's round progress across all applied jobs
router.get(
  '/my-progress',
  authenticateToken,
  authorizeRoles('student'),
  async (req, res, next) => {
    try {
      const studentId = req.user.id

      // Get all applications with their rounds
      const applications = await prisma.application.findMany({
        where: { student_id: studentId },
        select: {
          id: true,
          job_id: true,
          status: true,
          current_round_id: true,
          applied_at: true,
          job: {
            select: {
              title: true,
              company: true,
              rounds: {
                select: {
                  id: true,
                  title: true,
                  sort_order: true,
                  date: true,
                  description: true,
                  candidates: {
                    where: { student_id: studentId },
                    select: { status: true },
                  },
                },
                orderBy: { sort_order: 'asc' },
              },
            },
          },
        },
        orderBy: { applied_at: 'desc' },
      })

      const result = applications.map((app) => ({
        applicationId: app.id,
        jobId: app.job_id,
        jobTitle: app.job.title,
        company: app.job.company,
        applicationStatus: app.status,
        currentRoundId: app.current_round_id,
        appliedAt: app.applied_at,
        rounds: app.job.rounds.map((r) => ({
          id: r.id,
          title: r.title,
          order: r.sort_order,
          date: r.date,
          description: r.description,
          candidateStatus: r.candidates[0]?.status || null, // null = not yet in this round
        })),
      }))

      res.json(result)
    } catch (err) {
      next(err)
    }
  }
)

export default router
