import bcrypt from 'bcryptjs'
import prisma from './prisma.js'
import { STRONG_PASSWORD_REGEX } from '../utils/validators.js'

/**
 * ═══════════ DEFAULT ADMIN AUTO-SEEDER ═══════════
 *
 * Solves the "chicken-and-egg" bootstrap problem: the public registration
 * endpoint refuses to create admins (and TPOs), so on a fresh database
 * there would be no way to log in and create the first TPO.
 *
 * On every server start this script:
 *   1. Asks the DB whether any user with role = 'admin' already exists.
 *   2. If yes → do nothing. The existing admin (whose password the admin
 *      may have changed from the default) remains the single source of truth.
 *   3. If no → read DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD from the
 *      environment, bcrypt-hash the password (same BCRYPT_ROUNDS as the rest
 *      of the app), and insert a new admin row.
 *
 * Design choices worth calling out:
 *
 *   - The password is ONLY read at the moment of seeding. It is never stored
 *     in plaintext; only its bcrypt hash ever touches the database. This
 *     means the standard /api/auth/login route works unmodified against
 *     this account — no "hardcoded password bypass" in the login controller.
 *
 *   - Seeding is idempotent. Running the server 1,000 times still produces
 *     exactly one admin. Once the real admin has logged in and (ideally)
 *     changed the password, removing the env vars will not delete them —
 *     the seeder just becomes a no-op.
 *
 *   - If the env vars are missing on a fresh DB, we log a loud warning but
 *     we do NOT crash the server. A crashed API is far worse for ops than
 *     an un-seeded admin, and the admin can still be created manually via
 *     a Prisma Studio insert. (On a DB that already has an admin, missing
 *     env vars are completely fine and we stay silent.)
 *
 *   - Weak default passwords are refused. STRONG_PASSWORD_REGEX is the same
 *     rule the regular registration flow enforces, so a deployer can't
 *     accidentally ship a "password123" admin.
 */

const BCRYPT_ROUNDS = 12

export async function seedDefaultAdmin() {
  // Step 1 — bail out fast if any admin already exists.
  // We only need to know existence, so select just the id.
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true },
  })

  if (existingAdmin) {
    return { seeded: false, reason: 'ADMIN_EXISTS' }
  }

  // Step 2 — read credentials from env.
  const email = (process.env.DEFAULT_ADMIN_EMAIL || '').trim().toLowerCase()
  const password = process.env.DEFAULT_ADMIN_PASSWORD || ''
  const name = (process.env.DEFAULT_ADMIN_NAME || 'System Administrator').trim()

  if (!email || !password) {
    console.warn(
      '[seedAdmin] No admin user exists and DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD ' +
        'are not set. Skipping admin seed — you will not be able to log in as admin until ' +
        'one is created. Set the env vars and restart to auto-provision the first admin.'
    )
    return { seeded: false, reason: 'ENV_NOT_SET' }
  }

  // Very loose email sanity check — the DB column is VARCHAR(255) UNIQUE,
  // so a malformed value would blow up the insert anyway, but a friendly
  // log message is nicer than a Prisma stack trace.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(
      `[seedAdmin] DEFAULT_ADMIN_EMAIL is not a valid email: "${email}". Skipping seed.`
    )
    return { seeded: false, reason: 'INVALID_EMAIL' }
  }

  if (!STRONG_PASSWORD_REGEX.test(password)) {
    console.error(
      '[seedAdmin] DEFAULT_ADMIN_PASSWORD does not meet strength requirements ' +
        '(min 8 chars, upper, lower, digit, special). Skipping seed for safety.'
    )
    return { seeded: false, reason: 'WEAK_PASSWORD' }
  }

  // Step 3 — collision check. If a user with this email already exists but
  // is NOT an admin, refuse to hijack their account. This could happen if
  // somebody registered as a student/recruiter using what later became the
  // admin email — we don't want to silently overwrite them.
  const emailClash = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  })
  if (emailClash) {
    console.error(
      `[seedAdmin] A non-admin user already exists with email "${email}" ` +
        `(role=${emailClash.role}). Refusing to overwrite. Either delete that ` +
        `user or pick a different DEFAULT_ADMIN_EMAIL.`
    )
    return { seeded: false, reason: 'EMAIL_IN_USE' }
  }

  // Step 4 — create the admin. Hashing is done here (same rounds as the
  // rest of auth code) so the ordinary bcrypt.compare() path in loginUser()
  // works without any branching for "default" vs "real" admins.
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const admin = await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      role: 'admin',
      name,
      // phone is optional in the schema; admins don't need one to log in.
      phone: null,
      status: 'active',
    },
    select: { id: true, email: true, role: true },
  })

  console.log(
    `[seedAdmin] Default admin created: id=${admin.id} email=${admin.email}. ` +
      `Log in and change the password immediately.`
  )

  return { seeded: true, admin }
}

export default seedDefaultAdmin
