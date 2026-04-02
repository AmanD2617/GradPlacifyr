import prisma from '../db/prisma.js'
import { AppError } from './appError.js'

// With Prisma the schema is known at build time — the jobs table has a
// `created_by` column.  We keep the helper interface identical so callers
// (jobs, applications routes) don't need structural changes.

/**
 * Returns the owner-column name on the jobs table.
 * With the Prisma schema we know it is always 'created_by'.
 */
export async function getJobOwnerColumn() {
  return 'created_by'
}

/**
 * Look up a user's display name (used as company name fallback).
 */
export async function getCompanyNameByUserId(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  })

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }

  const fallback = user.email ? user.email.split('@')[0] : ''
  const companyName = (user.name || fallback || '').trim()

  if (!companyName) {
    throw new AppError('Company profile name is missing', 400, 'COMPANY_NAME_REQUIRED')
  }

  return companyName
}

/**
 * Build a Prisma-compatible WHERE object scoping jobs to a company user.
 * Returns { where: object, mode: string } instead of raw SQL fragments.
 *
 * NOTE: For backward-compat with routes that may still build raw SQL,
 * the legacy `clause / params / nextIndex` interface is also provided.
 */
export async function buildCompanyJobScope(alias, userId, startIndex = 1) {
  const ownerColumn = await getJobOwnerColumn()

  if (ownerColumn) {
    return {
      // Prisma-friendly filter
      prismaWhere: { created_by: userId },
      // Legacy raw-SQL compat (used in routes during transition)
      clause: `${alias}.${ownerColumn} = $${startIndex}`,
      params: [userId],
      mode: 'owner-column',
      nextIndex: startIndex + 1,
    }
  }

  // Fallback: match by company name
  const companyName = await getCompanyNameByUserId(userId)
  return {
    prismaWhere: {
      company: { equals: companyName, mode: 'insensitive' },
    },
    clause: `LOWER(TRIM(${alias}.company)) = LOWER(TRIM($${startIndex}))`,
    params: [companyName],
    mode: 'company-name',
    nextIndex: startIndex + 1,
  }
}
