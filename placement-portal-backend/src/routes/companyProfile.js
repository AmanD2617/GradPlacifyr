import { Router } from 'express'
import prisma from '../db/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { AppError } from '../utils/appError.js'

const router = Router()

const EMPTY_COMPANY_PROFILE = {
  companyName: '',
  about: '',
  website: '',
  industry: '',
  location: '',
  logoUrl: null,
}

function normaliseRow(row) {
  return {
    companyName: row.company_name || '',
    about: row.about || '',
    website: row.website || '',
    industry: row.industry || '',
    location: row.location || '',
    logoUrl: row.logo_url || null,
  }
}

// ── GET /api/company-profile/me ────────────────────────────────────────────
// Returns the company profile for the authenticated recruiter/admin user.
// Also includes basic user fields (name, email, phone, profileImage).
router.get(
  '/me',
  authenticateToken,
  authorizeRoles('admin', 'company', 'tpo'),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          profile_image: true,
        },
      })

      if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')

      // Fetch company profile (may not exist yet)
      const profile = await prisma.companyProfile.findUnique({
        where: { user_id: req.user.id },
      })

      res.json({
        user: {
          id: user.id,
          name: user.name || '',
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          profileImage: user.profile_image || null,
        },
        profile: profile ? normaliseRow(profile) : EMPTY_COMPANY_PROFILE,
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── PUT /api/company-profile/me ────────────────────────────────────────────
// Updates both user fields (name, phone) and company profile fields.
router.put(
  '/me',
  authenticateToken,
  authorizeRoles('admin', 'company', 'tpo'),
  async (req, res, next) => {
    try {
      const {
        name,
        phone,
        companyName,
        about,
        website,
        industry,
        location,
      } = req.body ?? {}

      if (name && String(name).trim().length > 255) throw new AppError('Name must be under 255 characters', 400, 'VALIDATION_ERROR')
      if (companyName && String(companyName).trim().length > 255) throw new AppError('Company name must be under 255 characters', 400, 'VALIDATION_ERROR')
      if (about && String(about).trim().length > 2000) throw new AppError('About must be under 2000 characters', 400, 'VALIDATION_ERROR')
      if (website && String(website).trim().length > 500) throw new AppError('Website must be under 500 characters', 400, 'VALIDATION_ERROR')

      // Update user-level fields
      const userUpdate = {}
      if (name !== undefined) userUpdate.name = String(name).trim() || null
      if (phone !== undefined) userUpdate.phone = String(phone).trim() || null

      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({
          where: { id: req.user.id },
          data: userUpdate,
        })
      }

      // Upsert company profile
      const profileData = {
        company_name: companyName !== undefined ? (String(companyName).trim() || null) : undefined,
        about: about !== undefined ? (String(about).trim() || null) : undefined,
        website: website !== undefined ? (String(website).trim() || null) : undefined,
        industry: industry !== undefined ? (String(industry).trim() || null) : undefined,
        location: location !== undefined ? (String(location).trim() || null) : undefined,
      }

      // Remove undefined keys so Prisma doesn't overwrite with null
      const cleanData = Object.fromEntries(
        Object.entries(profileData).filter(([, v]) => v !== undefined)
      )

      const profile = await prisma.companyProfile.upsert({
        where: { user_id: req.user.id },
        create: {
          user_id: req.user.id,
          ...cleanData,
        },
        update: cleanData,
      })

      // Fetch updated user
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          profile_image: true,
        },
      })

      res.json({
        user: {
          id: user.id,
          name: user.name || '',
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          profileImage: user.profile_image || null,
        },
        profile: normaliseRow(profile),
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /api/company-profile/logo ─────────────────────────────────────────
// Upload company logo using the existing upload infrastructure.
// Expects multipart form with 'logo' field — delegates to the upload route's
// multer config pattern but stores in a separate path.
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logosDir = path.join(__dirname, '..', '..', 'uploads', 'logos')
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true })
}

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logosDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueName = `company-${req.user.id}-${Date.now()}${ext}`
    cb(null, uniqueName)
  },
})

const logoFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('Only JPEG, PNG, GIF, WebP, and SVG images are allowed', 400, 'INVALID_FILE_TYPE'), false)
  }
}

const logoUpload = multer({
  storage: logoStorage,
  fileFilter: logoFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

router.post(
  '/logo',
  authenticateToken,
  authorizeRoles('admin', 'company', 'tpo'),
  (req, res, next) => {
    logoUpload.single('logo')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File size must be under 5 MB', 400, 'FILE_TOO_LARGE'))
        }
        return next(new AppError(err.message, 400, 'UPLOAD_ERROR'))
      }
      if (err) return next(err)
      next()
    })
  },
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No image file provided', 400, 'NO_FILE')
      }

      const logoUrl = `/uploads/logos/${req.file.filename}`

      // Delete old logo if exists
      const existing = await prisma.companyProfile.findUnique({
        where: { user_id: req.user.id },
        select: { logo_url: true },
      })

      if (existing?.logo_url) {
        const oldPath = path.join(__dirname, '..', '..', existing.logo_url)
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath)
        }
      }

      // Upsert profile with new logo URL
      await prisma.companyProfile.upsert({
        where: { user_id: req.user.id },
        create: { user_id: req.user.id, logo_url: logoUrl },
        update: { logo_url: logoUrl },
      })

      res.json({ logoUrl })
    } catch (err) {
      next(err)
    }
  }
)

export default router
