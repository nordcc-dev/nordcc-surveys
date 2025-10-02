// lib/auth/password-utils.ts
import bcrypt from "bcryptjs"

/**
 * Hash a plaintext password using bcrypt.
 * @param password Plaintext password
 * @returns A secure bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  // 12 rounds is a good default balance of security vs performance
  return bcrypt.hash(password, 12)
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 * @param password Plaintext password
 * @param hashedPassword The bcrypt hash from DB
 * @returns true if match, false otherwise
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
