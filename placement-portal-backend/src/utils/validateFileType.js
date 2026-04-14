/**
 * Magic-byte file type validation using the `file-type` package.
 * Rejects files where the actual content doesn't match the expected type.
 * Prevents MIME spoofing attacks.
 */
import { fileTypeFromBuffer, fileTypeFromFile } from 'file-type'
import fs from 'fs/promises'
import { AppError } from './appError.js'

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

const PDF_MIMES = new Set([
  'application/pdf',
])

/**
 * Validate a file on disk by reading its magic bytes.
 * @param {string} filePath - Path to the file
 * @param {'image'|'pdf'} expectedCategory - Expected file category
 * @throws {AppError} if the file type doesn't match
 */
export async function validateFileOnDisk(filePath, expectedCategory) {
  const allowed = expectedCategory === 'pdf' ? PDF_MIMES : IMAGE_MIMES

  const detected = await fileTypeFromFile(filePath)

  if (!detected || !allowed.has(detected.mime)) {
    // Delete the invalid file
    try { await fs.unlink(filePath) } catch { /* ignore */ }

    const expectedTypes = expectedCategory === 'pdf'
      ? 'PDF'
      : 'JPEG, PNG, GIF, or WebP'

    throw new AppError(
      `File content does not match expected type. Only ${expectedTypes} files are allowed.`,
      400,
      'INVALID_FILE_CONTENT'
    )
  }
}

/**
 * Validate a file buffer by reading its magic bytes.
 * @param {Buffer} buffer - File buffer
 * @param {'image'|'pdf'} expectedCategory - Expected file category
 * @throws {AppError} if the file type doesn't match
 */
export async function validateFileBuffer(buffer, expectedCategory) {
  const allowed = expectedCategory === 'pdf' ? PDF_MIMES : IMAGE_MIMES

  const detected = await fileTypeFromBuffer(buffer)

  if (!detected || !allowed.has(detected.mime)) {
    const expectedTypes = expectedCategory === 'pdf'
      ? 'PDF'
      : 'JPEG, PNG, GIF, or WebP'

    throw new AppError(
      `File content does not match expected type. Only ${expectedTypes} files are allowed.`,
      400,
      'INVALID_FILE_CONTENT'
    )
  }
}
