/**
 * Safely delete a file that was previously stored in the database.
 *
 * Problem: file paths (profile_image, resume_url, logo_url) stored in the DB
 * look like "/uploads/avatars/uuid.png". When deleting an old file, the code
 * does path.join(root, dbValue) which is safe as long as the DB value doesn't
 * contain traversal sequences (e.g., "../../etc/passwd").
 *
 * This utility validates the resolved path stays within the expected uploads
 * root before deleting, preventing path traversal on the deletion step.
 */
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Absolute path to the uploads root — all stored files must live under here
const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', 'uploads')

/**
 * Safely delete a stored file.
 * @param {string|null|undefined} storedPath - The path stored in the DB, e.g. "/uploads/avatars/uuid.png"
 * @returns {boolean} true if deleted, false if skipped (not found or unsafe path)
 */
export function safeDeleteStoredFile(storedPath) {
  if (!storedPath) return false

  // Resolve the absolute path
  const absPath = path.resolve(UPLOADS_ROOT, '..', storedPath.replace(/^\//, ''))

  // Guard: ensure the resolved path is strictly inside UPLOADS_ROOT
  if (!absPath.startsWith(UPLOADS_ROOT + path.sep) && absPath !== UPLOADS_ROOT) {
    console.warn(`[safeDeleteFile] Rejected suspicious path: ${storedPath} => ${absPath}`)
    return false
  }

  if (fs.existsSync(absPath)) {
    try {
      fs.unlinkSync(absPath)
      return true
    } catch (err) {
      console.error(`[safeDeleteFile] Failed to delete ${absPath}:`, err.message)
      return false
    }
  }

  return false
}
