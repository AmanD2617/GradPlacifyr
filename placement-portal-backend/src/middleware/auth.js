import jwt from 'jsonwebtoken'
import { AppError } from '../utils/appError.js'
import prisma from '../db/prisma.js'

// No fallback — startup check in server.js ensures this is set
export const JWT_SECRET = process.env.JWT_SECRET

const ROLE_ALIASES = {
  student: 'student',
  admin: 'admin',
  recruiter: 'company',
  company: 'company',
  hod: 'tpo',       // legacy DB value -> normalized to tpo
  tpo: 'tpo',
}

function normalizeRole(role) {
  if (!role) return null
  return ROLE_ALIASES[role] || role
}

/**
 * Extract JWT token from request.
 * Priority: HttpOnly cookie > Authorization header (backwards compat)
 */
function extractToken(req) {
  // 1. Prefer HttpOnly cookie
  if (req.cookies && req.cookies.placement_token) {
    return req.cookies.placement_token
  }

  // 2. Fallback to Authorization header (for API clients / backwards compat)
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return null
}

/** Cookie options for JWT token — exported for use in controllers */
export function getTokenCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  }
}

/**
 * Verify token_version against the DB to support proper logout invalidation.
 * If the user has incremented their token_version (via logout or password change),
 * any existing JWTs with the old version are rejected.
 */
async function verifyTokenVersion(payload) {
  // tv (token_version) claim was added in the security hardening pass.
  // Old tokens without tv are rejected to force re-login.
  if (payload.tv == null) {
    throw new AppError('Token is invalid — please log in again', 401, 'INVALID_TOKEN')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { token_version: true },
  })

  if (!user || user.token_version !== payload.tv) {
    throw new AppError('Session has been invalidated — please log in again', 401, 'TOKEN_INVALIDATED')
  }
}

export async function authenticateToken(req, res, next) {
  const token = extractToken(req)

  if (!token) {
    return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'))
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    await verifyTokenVersion(payload)
    req.user = {
      ...payload,
      role: normalizeRole(payload.role),
    }
    next()
  } catch (err) {
    if (!err.statusCode) err.statusCode = 401
    if (!err.code) err.code = 'INVALID_TOKEN'
    next(err)
  }
}

export async function optionalAuthenticateToken(req, res, next) {
  const token = extractToken(req)

  if (!token) {
    req.user = null
    return next()
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    await verifyTokenVersion(payload)
    req.user = {
      ...payload,
      role: normalizeRole(payload.role),
    }
    next()
  } catch {
    // Optional auth — treat invalid/expired token as unauthenticated
    req.user = null
    next()
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
