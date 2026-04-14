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
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173']

app.use(helmet())
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(cookieParser())
app.use(express.json())

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

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

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Placement Portal API' })
})

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
