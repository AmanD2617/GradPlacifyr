import jwt from 'jsonwebtoken'
import { AppError } from '../utils/appError.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

const ROLE_ALIASES = {
  student: 'student',
  admin: 'admin',
  recruiter: 'company',
  company: 'company',
  hod: 'tpo',       // legacy DB value → normalized to tpo
  tpo: 'tpo',
}

function normalizeRole(role) {
  if (!role) return null
  return ROLE_ALIASES[role] || role
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null

  if (!token) {
    return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'))
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = {
      ...payload,
      role: normalizeRole(payload.role),
    }
    next()
  } catch (err) {
    err.statusCode = 401
    err.code = 'INVALID_TOKEN'
    next(err)
  }
}

export function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null

  if (!token) {
    req.user = null
    return next()
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = {
      ...payload,
      role: normalizeRole(payload.role),
    }
    next()
  } catch (err) {
    err.statusCode = 401
    err.code = 'INVALID_TOKEN'
    next(err)
  }
}

export function authorizeRoles(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map((role) => normalizeRole(role))

  return (req, res, next) => {
    const userRole = normalizeRole(req.user && req.user.role)
    if (!req.user || !normalizedAllowed.includes(userRole)) {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN'))
    }
    next()
  }
}

