// lib/auth/token-utils.ts
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken"

const secret = process.env.JWT_SECRET
if (!secret) throw new Error("Missing JWT_SECRET")
export const JWT_SECRET: string = secret

export interface JWTPayload extends JwtPayload {
  userId: string
  email: string
  role?: string
  tokenVersion?: number
}

const WEEK_IN_SECONDS = 60 * 60 * 24 * 7

export function generateToken(payload: JWTPayload, expiresIn: number = WEEK_IN_SECONDS): string {
  const options: SignOptions = { expiresIn } // <- number is always valid
  return jwt.sign(payload, JWT_SECRET, options)
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (typeof decoded === "string") return null
    if (typeof decoded.userId !== "string" || typeof decoded.email !== "string") return null
    return decoded as JWTPayload
  } catch {
    return null
  }
}
