/**
 * File serving — replaces express.static for /uploads.
 *
 * Avatars and logos are served publicly because browsers do not forward
 * auth cookies on `<img>` subresource requests across sites — gating them
 * behind auth made profile images unrenderable in cross-origin deployments.
 * Filenames are unguessable UUIDs, so enumeration is not a concern.
 *
 * Resumes remain behind auth with an ownership check.
 */
import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { authenticateToken } from '../middleware/auth.js'
import prisma from '../db/prisma.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', 'uploads')

const router = Router()

/**
 * Safely resolve a file path and ensure it doesn't escape the uploads directory.
 * Prevents path traversal attacks (e.g., ../../etc/passwd).
 */
function safeResolvePath(subdir, filename) {
  // Reject filenames with directory traversal
  const sanitized = path.basename(filename)
  const resolved = path.resolve(UPLOADS_ROOT, subdir, sanitized)

  // Ensure the resolved path is within UPLOADS_ROOT
  if (!resolved.startsWith(UPLOADS_ROOT)) {
    return null
  }

  return resolved
}

// GET /uploads/avatars/:filename — public (UUID-gated, embedded in <img>)
router.get('/avatars/:filename', (req, res) => {
  const filePath = safeResolvePath('avatars', req.params.filename)
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  res.sendFile(filePath)
})

// GET /uploads/logos/:filename — public (UUID-gated, embedded in <img>)
router.get('/logos/:filename', (req, res) => {
  const filePath = safeResolvePath('logos', req.params.filename)
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  res.sendFile(filePath)
})

// GET /uploads/resumes/:filename — ownership check for students
router.get('/resumes/:filename', authenticateToken, async (req, res) => {
  const filePath = safeResolvePath('resumes', req.params.filename)
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }

  const userRole = req.user.role

  // Admin, TPO, and company users can view any resume (they review applicants)
  if (['admin', 'tpo', 'company'].includes(userRole)) {
    return res.sendFile(filePath)
  }

  // Students can only access their own resume
  if (userRole === 'student') {
    const profile = await prisma.studentProfile.findUnique({
      where: { student_id: req.user.id },
      select: { resume_url: true },
    })

    const expectedFilename = profile?.resume_url
      ? path.basename(profile.resume_url)
      : null

    if (expectedFilename === req.params.filename) {
      return res.sendFile(filePath)
    }

    return res.status(403).json({ error: 'You can only access your own resume' })
  }

  return res.status(403).json({ error: 'Forbidden' })
})

export default router
