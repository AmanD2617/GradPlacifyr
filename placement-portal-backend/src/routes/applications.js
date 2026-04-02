import { Router } from 'express'
import prisma from '../db/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { AppError } from '../utils/appError.js'
import { buildCompanyJobScope } from '../utils/jobOwnerColumn.js'

const router = Router()

const STATUS_VALUES = new Set([
  'applied',
  'eligible',
  'shortlisted',
  'test_scheduled',
  'interview_scheduled',
  'selected',
  'rejected',
])

// POST /api/applications - student applies for a job
router.post(
  '/',
  authenticateToken,
  authorizeRoles('student'),
  async (req, res, next) => {
    try {
      const studentId = req.user.id
      const { jobId } = req.body

      if (!jobId) {
        throw new AppError('jobId is required', 400, 'VALIDATION_ERROR')
      }

      const job = await prisma.job.findUnique({
        where: { id: Number(jobId) },
        select: { id: true, status: true },
      })

      if (!job) {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND')
      }

      if (job.status !== 'open') {
        throw new AppError('Job is closed', 400, 'JOB_CLOSED')
      }

      const existing = await prisma.application.findUnique({
        where: {
          job_id_student_id: { job_id: Number(jobId), student_id: studentId },
        },
        select: { id: true },
      })

      if (existing) {
        throw new AppError('Already applied to this job', 409, 'ALREADY_APPLIED')
      }

      const application = await prisma.application.create({
        data: {
          job_id: Number(jobId),
          student_id: studentId,
          status: 'applied',
        },
        select: { id: true },
      })

      res.status(201).json({
        id: application.id,
        jobId: Number(jobId),
        studentId,
        status: 'applied',
      })
    } catch (err) {
      next(err)
    }
  }
)

// GET /api/applications/my - logged-in student's applications
router.get(
  '/my',
  authenticateToken,
  authorizeRoles('student'),
  async (req, res, next) => {
    try {
      const rows = await prisma.application.findMany({
        where: { student_id: req.user.id },
        select: {
          id: true,
          job_id: true,
          status: true,
          applied_at: true,
          job: {
            select: { title: true, company: true },
          },
        },
        orderBy: { applied_at: 'desc' },
      })

      // Shape response to match original API contract
      const result = rows.map((r) => ({
        id: r.id,
        jobId: r.job_id,
        status: r.status,
        appliedAt: r.applied_at,
        jobTitle: r.job.title,
        company: r.job.company,
      }))

      res.json(result)
    } catch (err) {
      next(err)
    }
  }
)

// GET /api/applications?jobId=:jobId - admin/company/tpo view applicants
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'company', 'tpo'),
  async (req, res, next) => {
    try {
      const { jobId } = req.query
      const where = {}

      // Build the job-level filter for company scoping
      if (req.user.role === 'company') {
        const scope = await buildCompanyJobScope('j', req.user.id)
        where.job = scope.prismaWhere
      }

      if (jobId) {
        // Nest jobId inside the job relation filter
        where.job = { ...where.job, id: Number(jobId) }
      }

      const rows = await prisma.application.findMany({
        where,
        select: {
          id: true,
          job_id: true,
          student_id: true,
          status: true,
          applied_at: true,
          job: {
            select: { title: true, company: true },
          },
          student: {
            select: { name: true, email: true },
          },
        },
        orderBy: { applied_at: 'desc' },
      })

      // Shape response to match original API contract
      const result = rows.map((r) => ({
        id: r.id,
        jobId: r.job_id,
        studentId: r.student_id,
        status: r.status,
        appliedAt: r.applied_at,
        jobTitle: r.job.title,
        company: r.job.company,
        studentName: r.student.name,
        studentEmail: r.student.email,
      }))

      res.json(result)
    } catch (err) {
      next(err)
    }
  }
)

// PATCH /api/applications/:id/status - admin/company/tpo update status
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('admin', 'company', 'tpo'),
  async (req, res, next) => {
    try {
      const { status } = req.body
      if (!status || !STATUS_VALUES.has(status)) {
        throw new AppError('Invalid status value', 400, 'VALIDATION_ERROR')
      }

      const appId = Number(req.params.id)

      // For company users, verify the application belongs to one of their jobs
      if (req.user.role === 'company') {
        const scope = await buildCompanyJobScope('j', req.user.id)
        const app = await prisma.application.findFirst({
          where: {
            id: appId,
            job: scope.prismaWhere,
          },
          select: { id: true },
        })

        if (!app) {
          throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND')
        }
      } else {
        const app = await prisma.application.findUnique({
          where: { id: appId },
          select: { id: true },
        })
        if (!app) {
          throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND')
        }
      }

      await prisma.application.update({
        where: { id: appId },
        data: { status },
      })

      res.json({ ok: true })
    } catch (err) {
      next(err)
    }
  }
)

export default router
