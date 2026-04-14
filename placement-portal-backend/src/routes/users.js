import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../db/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { AppError } from '../utils/appError.js'

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

// POST /api/users/create-tpo  — admin-only: create a new TPO account
router.post(
  '/create-tpo',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res, next) => {
    try {
      const { name, email, phone, password } = req.body

      if (!name || !email || !phone || !password) {
        throw new AppError('name, email, phone and password are required', 400, 'VALIDATION_ERROR')
      }

      if (String(name).trim().length < 2 || String(name).trim().length > 100) {
        throw new AppError('Name must be between 2 and 100 characters', 400, 'VALIDATION_ERROR')
      }

      const normalizedEmail = String(email).trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new AppError('Enter a valid email address', 400, 'VALIDATION_ERROR')
      }

      const cleanPhone = String(phone).replace(/\D/g, '')
      if (cleanPhone.length !== 10) {
        throw new AppError('Phone number must be exactly 10 digits', 400, 'VALIDATION_ERROR')
      }

      if (String(password).length < 6) {
        throw new AppError('Password must be at least 6 characters', 400, 'VALIDATION_ERROR')
      }

      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      })
      if (existing) {
        throw new AppError('An account with this email already exists', 409, 'DUPLICATE_EMAIL')
      }

      const hash = await bcrypt.hash(String(password), 12)
      const tpo = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password_hash: hash,
          role: 'hod', // DB stores TPO role as 'hod'
          name: String(name).trim(),
          phone: cleanPhone,
          status: 'active',
        },
        select: { id: true, name: true, email: true, role: true, created_at: true },
      })

      res.status(201).json({
        message: 'TPO account created successfully',
        user: {
          id: tpo.id,
          name: tpo.name,
          email: tpo.email,
          role: 'tpo',
          createdAt: tpo.created_at,
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

// GET /api/users/tpo  — admin-only: list all TPO accounts
router.get(
  '/tpo',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res, next) => {
    try {
      const users = await prisma.user.findMany({
        where: { role: 'hod' },
        select: { id: true, name: true, email: true, role: true, created_at: true },
        orderBy: { created_at: 'desc' },
      })

      res.json(users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: 'tpo',
        createdAt: u.created_at,
      })))
    } catch (err) {
      next(err)
    }
  }
)

export default router
