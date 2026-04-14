import { Router } from 'express'
import crypto from 'crypto'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import prisma from '../db/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { AppError } from '../utils/appError.js'
import { validateFileOnDisk } from '../utils/validateFileType.js'
import { safeDeleteStoredFile } from '../utils/safeDeleteFile.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

      const userUpdate = {}
      if (name !== undefined) userUpdate.name = String(name).trim() || null
      if (phone !== undefined) userUpdate.phone = String(phone).trim() || null

      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({
          where: { id: req.user.id },
          data: userUpdate,
        })
      }

      const profileData = {
        company_name: companyName !== undefined ? (String(companyName).trim().slice(0, 255) || null) : undefined,
        about:        about       !== undefined ? (String(about).trim().slice(0, 3000)       || null) : undefined,
        website:      website     !== undefined ? (String(website).trim().slice(0, 500)       || null) : undefined,
        industry:     industry    !== undefined ? (String(industry).trim().slice(0, 255)      || null) : undefined,
        location:     location    !== undefined ? (String(location).trim().slice(0, 255)      || null) : undefined,
      }

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
const logosDir = path.join(__dirname, '..', '..', 'uploads', 'logos')
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true })
}

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logosDir),
  filename: (_req, file, cb) => {
    // UUID filename — prevents enumeration
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${crypto.randomUUID()}${ext}`)
  },
})

const logoFilter = (_req, file, cb) => {
  // SVG REMOVED — can contain embedded JavaScript (XSS vector)
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('Only JPEG, PNG, GIF, and WebP images are allowed', 400, 'INVALID_FILE_TYPE'), false)
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

      // Magic byte validation — reject spoofed MIME types
      await validateFileOnDisk(req.file.path, 'image')

      const logoUrl = `/uploads/logos/${req.file.filename}`

      // Delete old logo if exists (path-traversal-safe)
      const existing = await prisma.companyProfile.findUnique({
        where: { user_id: req.user.id },
        select: { logo_url: true },
      })
      safeDeleteStoredFile(existing?.logo_url)

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
