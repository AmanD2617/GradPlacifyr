import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import pdfParse from 'pdf-parse'
import OpenAI from 'openai'
import prisma from '../db/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { AppError } from '../utils/appError.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// ── Ensure uploads directory exists ──
const resumeUploadsDir = path.join(__dirname, '..', '..', 'uploads', 'resumes')
if (!fs.existsSync(resumeUploadsDir)) {
  fs.mkdirSync(resumeUploadsDir, { recursive: true })
}

// ── Multer: in-memory for AI parsing ──
const memoryUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new AppError('Only PDF resumes are allowed', 400, 'INVALID_FILE_TYPE'))
      return
    }
    cb(null, true)
  },
})

// ── Multer: disk storage for persistent resume upload ──
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resumeUploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const safeName = `resume-${req.user.id}-${Date.now()}${ext}`
    cb(null, safeName)
  },
})

const diskUpload = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new AppError('Only PDF files are allowed', 400, 'INVALID_FILE_TYPE'))
      return
    }
    cb(null, true)
  },
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function ensureOpenAIConfigured() {
  if (!process.env.OPENAI_API_KEY) {
    throw new AppError('AI service is not configured', 503, 'AI_NOT_CONFIGURED')
  }
}

// ═══════════ POST /api/student/upload-resume ═══════════
// Persists the resume PDF to disk and saves the URL in the database
router.post(
  '/upload-resume',
  authenticateToken,
  authorizeRoles('student'),
  (req, res, next) => {
    diskUpload.single('resume')(req, res, (err) => {
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
        throw new AppError('No resume file provided', 400, 'NO_FILE')
      }

      const resumeUrl = `/uploads/resumes/${req.file.filename}`
      const originalName = req.file.originalname

      // Delete old resume file if it exists
      const existingProfile = await prisma.studentProfile.findUnique({
        where: { student_id: req.user.id },
        select: { resume_url: true },
      })

      if (existingProfile?.resume_url) {
        const oldPath = path.resolve(__dirname, '..', '..', existingProfile.resume_url)
        if (oldPath.startsWith(resumeUploadsDir) && fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath)
        }
      }

      // Upsert profile with resume URL
      await prisma.studentProfile.upsert({
        where: { student_id: req.user.id },
        create: {
          student_id: req.user.id,
          resume_url: resumeUrl,
          resume_original_name: originalName,
        },
        update: {
          resume_url: resumeUrl,
          resume_original_name: originalName,
        },
      })

      res.json({
        message: 'Resume uploaded successfully',
        resumeUrl,
        originalName,
      })
    } catch (err) {
      next(err)
    }
  }
)

// ═══════════ GET /api/student/my-resume ═══════════
// Returns the current resume info (URL + filename)
router.get(
  '/my-resume',
  authenticateToken,
  authorizeRoles('student'),
  async (req, res, next) => {
    try {
      const profile = await prisma.studentProfile.findUnique({
        where: { student_id: req.user.id },
        select: { resume_url: true, resume_original_name: true },
      })

      if (!profile || !profile.resume_url) {
        return res.json({ resumeUrl: null, originalName: null })
      }

      res.json({
        resumeUrl: profile.resume_url,
        originalName: profile.resume_original_name,
      })
    } catch (err) {
      next(err)
    }
  }
)

// ═══════════ DELETE /api/student/my-resume ═══════════
// Removes the stored resume
router.delete(
  '/my-resume',
  authenticateToken,
  authorizeRoles('student'),
  async (req, res, next) => {
    try {
      const profile = await prisma.studentProfile.findUnique({
        where: { student_id: req.user.id },
        select: { resume_url: true },
      })

      if (profile?.resume_url) {
        const filePath = path.resolve(__dirname, '..', '..', profile.resume_url)
        if (filePath.startsWith(resumeUploadsDir) && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }

        await prisma.studentProfile.update({
          where: { student_id: req.user.id },
          data: { resume_url: null, resume_original_name: null },
        })
      }

      res.json({ message: 'Resume removed' })
    } catch (err) {
      next(err)
    }
  }
)

// ═══════════ POST /api/student/parse-resume ═══════════
// AI-powered resume parsing (in-memory, no disk storage)
router.post(
  '/parse-resume',
  authenticateToken,
  authorizeRoles('student'),
  memoryUpload.single('resume'),
  async (req, res, next) => {
    try {
      ensureOpenAIConfigured()

      if (!req.file) {
        throw new AppError('No resume file uploaded', 400, 'NO_FILE')
      }

      let extractedText = ''
      try {
        const parsed = await pdfParse(req.file.buffer)
        extractedText = parsed.text || ''
      } catch (err) {
        throw new AppError('Failed to read PDF file', 400, 'PDF_PARSE_ERROR')
      }

      if (!extractedText.trim()) {
        throw new AppError('Could not extract text from resume', 400, 'EMPTY_RESUME_TEXT')
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an assistant that reads student resumes and extracts structured placement profile data. Respond ONLY with a single JSON object of the shape { programmingLanguages: string[], frameworks: string[], tools: string[], certifications: string[], internshipExperience: string, projects: string[], achievements: string[] }. Keep values concise and deduplicated. If a field is not present, return an empty array or empty string for that field.',
          },
          {
            role: 'user',
            content: `Extract structured information from this resume:\n\n${extractedText}`,
          },
        ],
      })

      const raw = completion.choices[0]?.message?.content || '{}'

      let parsedResult
      try {
        parsedResult = JSON.parse(raw)
      } catch (err) {
        throw new AppError('AI response could not be parsed', 502, 'AI_PARSE_ERROR')
      }

      const safe = {
        programmingLanguages: Array.isArray(parsedResult.programmingLanguages)
          ? parsedResult.programmingLanguages
          : [],
        frameworks: Array.isArray(parsedResult.frameworks) ? parsedResult.frameworks : [],
        tools: Array.isArray(parsedResult.tools) ? parsedResult.tools : [],
        certifications: Array.isArray(parsedResult.certifications)
          ? parsedResult.certifications
          : [],
        internshipExperience:
          typeof parsedResult.internshipExperience === 'string'
            ? parsedResult.internshipExperience
            : '',
        projects: Array.isArray(parsedResult.projects) ? parsedResult.projects : [],
        achievements: Array.isArray(parsedResult.achievements) ? parsedResult.achievements : [],
      }

      res.json(safe)
    } catch (err) {
      next(err)
    }
  }
)

export default router
