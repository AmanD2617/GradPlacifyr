import { Router } from 'express'
import multer from 'multer'
import pdfParse from 'pdf-parse'
import OpenAI from 'openai'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { AppError } from '../utils/appError.js'

const router = Router()

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new AppError('Only PDF resumes are allowed', 400, 'INVALID_FILE_TYPE'))
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

router.post(
  '/parse-resume',
  authenticateToken,
  authorizeRoles('student'),
  upload.single('resume'),
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

