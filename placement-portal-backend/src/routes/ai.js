import { Router } from 'express'
import OpenAI from 'openai'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import prisma from '../db/prisma.js'
import { AppError } from '../utils/appError.js'

const router = Router()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function ensureOpenAIConfigured() {
  if (!process.env.OPENAI_API_KEY) {
    throw new AppError('AI service is not configured', 503, 'AI_NOT_CONFIGURED')
  }
}

router.post(
  '/generate-resume',
  authenticateToken,
  authorizeRoles('student', 'company', 'tpo', 'admin'),
  async (req, res, next) => {
    try {
      ensureOpenAIConfigured()

      const { linkedInUrl, profileText, save } = req.body ?? {}

      if (!linkedInUrl && !profileText) {
        throw new AppError(
          'Provide a LinkedIn URL or profile summary text',
          400,
          'VALIDATION_ERROR'
        )
      }

      const userContextParts = []
      if (linkedInUrl) userContextParts.push(`LinkedIn: ${linkedInUrl}`)
      if (profileText) userContextParts.push(`Profile:\n${profileText}`)
      const userContext = userContextParts.join('\n\n')

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an assistant that creates structured resumes for campus placement students. Always respond with a single JSON object with keys: summary (string), skills (string[]), experience (array of {company, role, duration, description}), projects (array of {title, description, techStack, githubLink}), education (array of {degree, institution, year, grade}). Do not include any extra commentary.',
          },
          {
            role: 'user',
            content: `Generate a strong placement resume profile using this information:\n\n${userContext}`,
          },
        ],
      })

      const raw = completion.choices[0]?.message?.content || '{}'
      const parsed = JSON.parse(raw)

      if (save && req.user.role === 'student') {
        const resumeJson = JSON.stringify(parsed)

        await prisma.studentProfile.upsert({
          where: { student_id: req.user.id },
          create: {
            student_id: req.user.id,
            ai_resume_json: resumeJson,
          },
          update: {
            ai_resume_json: resumeJson,
          },
        })
      }

      res.json(parsed)
    } catch (err) {
      next(err)
    }
  }
)

router.post(
  '/generate-questions',
  authenticateToken,
  authorizeRoles('student', 'company', 'tpo', 'admin'),
  async (req, res, next) => {
    try {
      ensureOpenAIConfigured()

      const { role, skills } = req.body ?? {}
      if (!role || !skills) {
        throw new AppError(
          'Job role and skills are required',
          400,
          'VALIDATION_ERROR'
        )
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You generate interview questions for campus placements. Respond ONLY with JSON of shape { difficulty: "easy" | "medium" | "hard", technical: { question: string, difficulty: "easy" | "medium" | "hard" }[], behavioral: { question: string }[] }. Return exactly 10 technical and 5 behavioral questions.',
          },
          {
            role: 'user',
            content: `Generate interview questions for the role "${role}" for a student with these skills: ${skills}.`,
          },
        ],
      })

      const raw = completion.choices[0]?.message?.content || '{}'
      const parsed = JSON.parse(raw)

      res.json(parsed)
    } catch (err) {
      next(err)
    }
  }
)

export default router
