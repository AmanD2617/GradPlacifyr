import { Router } from 'express'
import pool from '../db/connection.js'
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

      const [jobs] = await pool.execute(
        'SELECT id, status FROM jobs WHERE id = ?',
        [jobId]
      )

      if (!jobs.length) {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND')
      }

      if (jobs[0].status !== 'open') {
        throw new AppError('Job is closed', 400, 'JOB_CLOSED')
      }

      const [existing] = await pool.execute(
        'SELECT id FROM applications WHERE job_id = ? AND student_id = ?',
        [jobId, studentId]
      )
      if (existing.length) {
        throw new AppError('Already applied to this job', 409, 'ALREADY_APPLIED')
      }

      const [result] = await pool.execute(
        'INSERT INTO applications (job_id, student_id, status) VALUES (?, ?, ?)',
        [jobId, studentId, 'applied']
      )

      res.status(201).json({
        id: result.insertId,
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
      const [rows] = await pool.execute(
        `SELECT
           a.id,
           a.job_id AS jobId,
           a.status,
           a.applied_at AS appliedAt,
           j.title AS jobTitle,
           j.company
         FROM applications a
         JOIN jobs j ON j.id = a.job_id
         WHERE a.student_id = ?
         ORDER BY a.applied_at DESC`,
        [req.user.id]
      )
      res.json(rows)
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
      const params = []
      const whereParts = []

      if (req.user.role === 'company') {
        const scope = await buildCompanyJobScope('j', req.user.id)
        whereParts.push(scope.clause)
        params.push(...scope.params)
      }

      if (jobId) {
        whereParts.push('a.job_id = ?')
        params.push(jobId)
      }

      const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

      const [rows] = await pool.execute(
        `SELECT
           a.id,
           a.job_id AS jobId,
           a.student_id AS studentId,
           a.status,
           a.applied_at AS appliedAt,
           j.title AS jobTitle,
           j.company,
           u.name AS studentName,
           u.email AS studentEmail
         FROM applications a
         JOIN jobs j ON j.id = a.job_id
         JOIN users u ON u.id = a.student_id
         ${whereClause}
         ORDER BY a.applied_at DESC`,
        params
      )
      res.json(rows)
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

      let result
      if (req.user.role === 'company') {
        const scope = await buildCompanyJobScope('j', req.user.id)
        ;[result] = await pool.execute(
          `UPDATE applications a
           JOIN jobs j ON j.id = a.job_id
           SET a.status = ?
           WHERE a.id = ? AND ${scope.clause}`,
          [status, req.params.id, ...scope.params]
        )
      } else {
        ;[result] = await pool.execute(
          'UPDATE applications SET status = ? WHERE id = ?',
          [status, req.params.id]
        )
      }
      if (result.affectedRows === 0) {
        throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND')
      }
      res.json({ ok: true })
    } catch (err) {
      next(err)
    }
  }
)

export default router
