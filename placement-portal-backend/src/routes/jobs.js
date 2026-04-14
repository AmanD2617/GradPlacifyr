import { Router } from 'express'
import prisma from '../db/prisma.js'
import {
  authenticateToken,
  authorizeRoles,
  optionalAuthenticateToken,
} from '../middleware/auth.js'
import { AppError } from '../utils/appError.js'
import {
  buildCompanyJobScope,
  getCompanyNameByUserId,
  getJobOwnerColumn,
} from '../utils/jobOwnerColumn.js'

const router = Router()

// Shared select object for list views (avoids fetching description/requirements)
const JOB_LIST_SELECT = {
  id: true,
  title: true,
  company: true,
  ctc: true,
  location: true,
  status: true,
  created_at: true,
}

// GET /api/jobs - list all jobs
router.get('/', authenticateToken, authorizeRoles('student', 'company', 'tpo', 'admin'), async (req, res, next) => {
  try {
    let where = {}

    if (req.user?.role === 'company') {
      const scope = await buildCompanyJobScope('j', req.user.id)
      where = scope.prismaWhere
    }

    const jobs = await prisma.job.findMany({
      where,
      select: JOB_LIST_SELECT,
      orderBy: { created_at: 'desc' },
    })

    res.json(jobs)
  } catch (err) {
    next(err)
  }
})

// GET /api/jobs/:id - get single job
router.get('/:id', optionalAuthenticateToken, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    let where = { id }

    if (req.user?.role === 'company') {
      const scope = await buildCompanyJobScope('jobs', req.user.id)
      where = { ...where, ...scope.prismaWhere }
    }

    const job = await prisma.job.findFirst({ where })

    if (!job) {
      throw new AppError('Job not found', 404, 'JOB_NOT_FOUND')
    }

    res.json(job)
  } catch (err) {
    next(err)
  }
})

// POST /api/jobs - create job (admin/company)
router.post('/', authenticateToken, authorizeRoles('admin', 'company'), async (req, res, next) => {
  try {
    const { title, company, ctc, location, description, requirements } = req.body
    if (!title || !company) {
      throw new AppError('Title and company required', 400, 'VALIDATION_ERROR')
    }
    if (String(title).trim().length > 255) throw new AppError('Title must be under 255 characters', 400, 'VALIDATION_ERROR')
    if (description && String(description).length > 10000) throw new AppError('Description must be under 10000 characters', 400, 'VALIDATION_ERROR')
    if (requirements && String(requirements).length > 5000) throw new AppError('Requirements must be under 5000 characters', 400, 'VALIDATION_ERROR')

    const safeCompany =
      req.user.role === 'company'
        ? await getCompanyNameByUserId(req.user.id)
        : company

    const job = await prisma.job.create({
      data: {
        title,
        company: safeCompany,
        ctc: ctc || null,
        location: location || null,
        description: description || null,
        requirements: requirements || null,
        status: 'open',
        created_by: req.user.id,
      },
      select: { id: true },
    })

    res.status(201).json({ id: job.id, title, company: safeCompany, status: 'open' })
  } catch (err) {
    next(err)
  }
})

// PUT /api/jobs/:id - update job
router.put('/:id', authenticateToken, authorizeRoles('admin', 'company'), async (req, res, next) => {
  try {
    let { title, company, ctc, location, description, requirements, status } = req.body
    const id = Number(req.params.id)
    let where = { id }

    if (title && String(title).trim().length > 255) throw new AppError('Title must be under 255 characters', 400, 'VALIDATION_ERROR')
    if (description && String(description).length > 10000) throw new AppError('Description must be under 10000 characters', 400, 'VALIDATION_ERROR')
    if (requirements && String(requirements).length > 5000) throw new AppError('Requirements must be under 5000 characters', 400, 'VALIDATION_ERROR')

    if (req.user.role === 'company') {
      const scope = await buildCompanyJobScope('jobs', req.user.id)
      where = { ...where, ...scope.prismaWhere }
      company = await getCompanyNameByUserId(req.user.id)
    }

    // Prisma doesn't support updateMany with unique return, so check first
    const existing = await prisma.job.findFirst({ where, select: { id: true } })
    if (!existing) {
      throw new AppError('Job not found', 404, 'JOB_NOT_FOUND')
    }

    await prisma.job.update({
      where: { id: existing.id },
      data: {
        title,
        company,
        ctc,
        location,
        description,
        requirements,
        status: status || 'open',
      },
    })

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/jobs/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'company'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    let where = { id }

    if (req.user.role === 'company') {
      const scope = await buildCompanyJobScope('jobs', req.user.id)
      where = { ...where, ...scope.prismaWhere }
    }

    const existing = await prisma.job.findFirst({ where, select: { id: true } })
    if (!existing) {
      throw new AppError('Job not found', 404, 'JOB_NOT_FOUND')
    }

    await prisma.job.delete({ where: { id: existing.id } })

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
