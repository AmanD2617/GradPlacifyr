import pool from '../db/connection.js'
import { AppError } from './appError.js'

const OWNER_COLUMN_PRIORITY = ['company_id', 'recruiter_id', 'user_id', 'created_by']
let cachedOwnerColumn = undefined

export async function getJobOwnerColumn() {
  if (cachedOwnerColumn !== undefined) return cachedOwnerColumn

  const placeholders = OWNER_COLUMN_PRIORITY.map(() => '?').join(', ')
  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'jobs'
       AND COLUMN_NAME IN (${placeholders})`,
    OWNER_COLUMN_PRIORITY
  )

  const existing = new Set(rows.map((row) => row.COLUMN_NAME))
  cachedOwnerColumn = OWNER_COLUMN_PRIORITY.find((column) => existing.has(column)) || null
  return cachedOwnerColumn
}

export async function getCompanyNameByUserId(userId) {
  const [rows] = await pool.execute('SELECT name, email FROM users WHERE id = ?', [userId])
  if (!rows.length) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }

  const row = rows[0]
  const fallback = row.email ? row.email.split('@')[0] : ''
  const companyName = (row.name || fallback || '').trim()

  if (!companyName) {
    throw new AppError('Company profile name is missing', 400, 'COMPANY_NAME_REQUIRED')
  }

  return companyName
}

export async function buildCompanyJobScope(alias, userId) {
  const ownerColumn = await getJobOwnerColumn()

  if (ownerColumn) {
    return {
      clause: `${alias}.${ownerColumn} = ?`,
      params: [userId],
      mode: 'owner-column',
    }
  }

  const companyName = await getCompanyNameByUserId(userId)
  return {
    clause: `LOWER(TRIM(${alias}.company)) = LOWER(TRIM(?))`,
    params: [companyName],
    mode: 'company-name',
  }
}
