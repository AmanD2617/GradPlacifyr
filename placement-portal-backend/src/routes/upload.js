import { Router } from 'express'
import crypto from 'crypto'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import prisma from '../db/prisma.js'
import { authenticateToken } from '../middleware/auth.js'
import { AppError } from '../utils/appError.js'
import { validateFileOnDisk } from '../utils/validateFileType.js'
import { safeDeleteStoredFile } from '../utils/safeDeleteFile.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'avatars')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Multer config: UUID filenames to prevent enumeration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueName = `${crypto.randomUUID()}${ext}`
    cb(null, uniqueName)
  },
})

const fileFilter = (_req, file, cb) => {
  // No SVG — it can contain embedded JavaScript (XSS vector)
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('Only JPEG, PNG, GIF, and WebP images are allowed', 400, 'INVALID_FILE_TYPE'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

const router = Router()

// POST /api/upload/avatar
router.post(
  '/avatar',
  authenticateToken,
  (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
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

      const imageUrl = `/uploads/avatars/${req.file.filename}`

      // Delete old avatar file if it exists (path-traversal-safe)
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { profile_image: true },
      })
      safeDeleteStoredFile(currentUser?.profile_image)

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { profile_image: imageUrl },
        select: { id: true, email: true, name: true, role: true, profile_image: true },
      })

      res.json({
        message: 'Profile image uploaded successfully',
        profileImage: updatedUser.profile_image,
        user: updatedUser,
      })
    } catch (err) {
      next(err)
    }
  }
)

// DELETE /api/upload/avatar
router.delete(
  '/avatar',
  authenticateToken,
  async (req, res, next) => {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { profile_image: true },
      })

      safeDeleteStoredFile(currentUser?.profile_image)

      await prisma.user.update({
        where: { id: req.user.id },
        data: { profile_image: null },
      })

      res.json({ message: 'Profile image removed' })
    } catch (err) {
      next(err)
    }
  }
)

export default router
