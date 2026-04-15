/**
 * Production-grade rate limiting via express-rate-limit.
 *
 * Uses the built-in MemoryStore by default. For multi-process / production,
 * swap in a Redis store:
 *
 *   import { RedisStore } from 'rate-limit-redis'
 *   import { createClient } from 'redis'
 *   const redisClient = createClient({ url: process.env.REDIS_URL })
 *   await redisClient.connect()
 *
 * Then pass `store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) })`
 * to each limiter below.
 */
import rateLimit from 'express-rate-limit'

/** General API rate limiter: 100 req / min per IP */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' },
  },
})

/** Auth endpoints (register, etc.): 10 req / min per IP */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' },
  },
})

/** Login: 5 req / min per IP */
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts. Please wait a minute and try again.' },
  },
})

/** Sensitive endpoints (OTP, password reset, Google auth): 5 req / 15 min per IP */
export const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many attempts. Please try again in 15 minutes.' },
  },
})

/** OTP verification: 5 attempts / 15 min per IP — prevents brute-force */
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many OTP attempts. Please request a new code.' },
  },
})
