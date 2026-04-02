import { Router } from 'express'
import prisma from '../db/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { AppError } from '../utils/appError.js'

const router = Router()

const EMPTY_PROFILE = {
  tenthPercentage: null,
  twelfthPercentage: null,
  backlogs: null,
  graduationYear: null,
  programmingLanguages: '',
  frameworks: '',
  tools: '',
  certifications: '',
  projects: [],
  internshipExperience: '',
  achievements: '',
  githubUrl: '',
  linkedinUrl: '',
  portfolioUrl: '',
  resumeUrl: null,
  resumeOriginalName: null,
}

function normaliseProfileRow(row) {
  return {
    tenthPercentage: row.tenth_percentage ? Number(row.tenth_percentage) : null,
    twelfthPercentage: row.twelfth_percentage ? Number(row.twelfth_percentage) : null,
    backlogs: row.backlogs,
    graduationYear: row.graduation_year,
    programmingLanguages: row.programming_languages || '',
    frameworks: row.frameworks || '',
    tools: row.tools || '',
    certifications: row.certifications || '',
    projects: row.projects_json ? JSON.parse(row.projects_json) : [],
    internshipExperience: row.internship_experience || '',
    achievements: row.achievements || '',
    githubUrl: row.github_url || '',
    linkedinUrl: row.linkedin_url || '',
    portfolioUrl: row.portfolio_url || '',
    resumeUrl: row.resume_url || null,
    resumeOriginalName: row.resume_original_name || null,
  }
}

router.get(
  '/me',
  authenticateToken,
  authorizeRoles('student'),
  async (req, res, next) => {
    try {
      const profile = await prisma.studentProfile.findUnique({
        where: { student_id: req.user.id },
      })

      if (!profile) {
        return res.json(EMPTY_PROFILE)
      }

      res.json(normaliseProfileRow(profile))
    } catch (err) {
      next(err)
    }
  }
)

router.put(
  '/me',
  authenticateToken,
  authorizeRoles('student'),
  async (req, res, next) => {
    try {
      const {
        tenthPercentage,
        twelfthPercentage,
        backlogs,
        graduationYear,
        programmingLanguages,
        frameworks,
        tools,
        certifications,
        projects,
        internshipExperience,
        achievements,
        githubUrl,
        linkedinUrl,
        portfolioUrl,
      } = req.body ?? {}

      if (tenthPercentage !== undefined && (tenthPercentage < 0 || tenthPercentage > 100)) {
        throw new AppError('10th percentage must be between 0 and 100', 400, 'VALIDATION_ERROR')
      }
      if (twelfthPercentage !== undefined && (twelfthPercentage < 0 || twelfthPercentage > 100)) {
        throw new AppError('12th percentage must be between 0 and 100', 400, 'VALIDATION_ERROR')
      }

      const projectsJson = JSON.stringify(projects || [])

      const data = {
        tenth_percentage: tenthPercentage ?? null,
        twelfth_percentage: twelfthPercentage ?? null,
        backlogs: backlogs ?? null,
        graduation_year: graduationYear ?? null,
        programming_languages: programmingLanguages ?? null,
        frameworks: frameworks ?? null,
        tools: tools ?? null,
        certifications: certifications ?? null,
        projects_json: projectsJson,
        internship_experience: internshipExperience ?? null,
        achievements: achievements ?? null,
        github_url: githubUrl ?? null,
        linkedin_url: linkedinUrl ?? null,
        portfolio_url: portfolioUrl ?? null,
      }

      const profile = await prisma.studentProfile.upsert({
        where: { student_id: req.user.id },
        create: {
          student_id: req.user.id,
          ...data,
        },
        update: data,
      })

      res.json(normaliseProfileRow(profile))
    } catch (err) {
      next(err)
    }
  }
)

export default router
