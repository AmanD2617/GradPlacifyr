import { Prisma } from '@prisma/client'
import { AppError } from '../utils/appError.js'

export function notFoundHandler(req, res, next) {
  const message = `Route ${req.originalUrl} not found`
  next(new AppError(message, 404, 'NOT_FOUND'))
}

export function errorHandler(err, req, res, next) {
  // Fallbacks
  let statusCode = err.statusCode || 500
  let code = err.code || 'INTERNAL_ERROR'
  let message = err.message || 'Something went wrong'

  // Validation errors (e.g. from manual validation)
  if (err.name === 'ValidationError') {
    statusCode = 400
    code = 'VALIDATION_ERROR'
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    code = 'INVALID_TOKEN'
    message = 'Invalid authentication token'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    code = 'TOKEN_EXPIRED'
    message = 'Authentication token has expired'
  }

  // ── Prisma errors ─────────────────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        statusCode = 409
        code = 'DUPLICATE_KEY'
        message = `Duplicate entry on ${(err.meta?.target || []).join(', ') || 'unknown field'}`
        break
      case 'P2003': // Foreign key constraint failed
        statusCode = 400
        code = 'FOREIGN_KEY_VIOLATION'
        message = 'Referenced record does not exist'
        break
      case 'P2025': // Record not found (update/delete)
        statusCode = 404
        code = 'NOT_FOUND'
        message = err.meta?.cause || 'Record not found'
        break
      case 'P2011': // Null constraint violation
        statusCode = 400
        code = 'VALIDATION_ERROR'
        message = `Missing required field: ${err.meta?.constraint || 'unknown'}`
        break
      case 'P2012': // Missing required value
        statusCode = 400
        code = 'VALIDATION_ERROR'
        message = `Missing required value`
        break
      default:
        statusCode = 500
        code = 'DATABASE_ERROR'
        message = 'A database error occurred'
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400
    code = 'VALIDATION_ERROR'
    message = 'Invalid data provided to database query'
  }

  // ── Legacy PostgreSQL errors (kept for safety during transition) ───────────
  // unique_violation (duplicate key)
  if (err.code === '23505' && statusCode === 500) {
    statusCode = 409
    code = 'DUPLICATE_KEY'
    message = 'Duplicate entry'
  }

  // foreign_key_violation
  if (err.code === '23503' && statusCode === 500) {
    statusCode = 400
    code = 'FOREIGN_KEY_VIOLATION'
    message = 'Referenced record does not exist'
  }

  // not_null_violation
  if (err.code === '23502' && statusCode === 500) {
    statusCode = 400
    code = 'VALIDATION_ERROR'
    message = `Missing required field: ${err.column || 'unknown'}`
  }

  // check_violation
  if (err.code === '23514' && statusCode === 500) {
    statusCode = 400
    code = 'VALIDATION_ERROR'
    message = 'Value violates a check constraint'
  }

  const response = {
    success: false,
    error: {
      code,
      message,
    },
  }

  if (err.details) {
    response.error.details = err.details
  }

  // Standard shape for validation details
  if (err.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
    response.error.validation = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message || String(err.errors[key]),
    }))
  }

  if (process.env.NODE_ENV !== 'production') {
    response.error.stack = err.stack
  }

  // eslint-disable-next-line no-console
  if (statusCode >= 500) {
    console.error(err)
  }

  res.status(statusCode).json(response)
}
