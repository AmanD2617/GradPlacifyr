import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import jobsRoutes from './routes/jobs.js'
import applicationsRoutes from './routes/applications.js'
import usersRoutes from './routes/users.js'
import aiRoutes from './routes/ai.js'
import profileRoutes from './routes/profile.js'
import studentRoutes from './routes/student.js'
import eventsRoutes from './routes/events.js'
import uploadRoutes from './routes/upload.js'
import roundsRoutes from './routes/rounds.js'
import companyProfileRoutes from './routes/companyProfile.js'
import filesRoutes from './routes/files.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import { authenticateToken } from './middleware/auth.js'

// ═══════════ STARTUP CHECKS ═══════════
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Aborting.')
  process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// ═══════════ SECURITY MIDDLEWARE ═══════════

// Helmet: sets security headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow cross-origin images
}))

// CORS: configurable via env, supports credentials (cookies)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173']

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

// Cookie parser
app.use(cookieParser())

// Body parser with size limits
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))

// ═══════════ CSRF ORIGIN VALIDATION ═══════════
// For state-changing requests, verify the Origin header matches our allowed list.
// This is a defence-in-depth layer on top of SameSite cookies.
app.use((req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) return next()

  const origin = req.headers.origin
  // Allow requests with no origin header (same-origin browser requests, Postman)
  if (!origin) return next()

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_ORIGIN', message: 'Request origin not allowed' },
    })
  }

  next()
})

// ═══════════ AUTHENTICATED FILE SERVING ═══════════
// Replaces express.static — all files require authentication
app.use('/uploads', filesRoutes)

// ═══════════ API ROUTES ═══════════
app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/rounds', roundsRoutes)
app.use('/api/company-profile', companyProfileRoutes)

// Health check — authenticated to prevent external probing
app.get('/api/health', authenticateToken, (_req, res) => {
  res.json({ ok: true })
})

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`)
  try {
    await seedAdmin()
  } catch (err) {
    console.error('[seed] Failed to seed admin account:', err.message)
  }
})
