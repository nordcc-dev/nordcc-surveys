import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import type { User } from "./db-models"
import { type NextRequest, NextResponse } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this"

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  )
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// Middleware to check authentication
interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

type APIHandler<T = Record<string, string>> = (
  req: AuthenticatedRequest,
  context: { params: Promise<T> },
) => Promise<NextResponse> | NextResponse

export function requireAuth<T = Record<string, string>>(handler: APIHandler<T>) {
  return async (req: AuthenticatedRequest, context: { params: Promise<T> }) => {
    try {
      const token = req.headers.get("authorization")?.replace("Bearer ", "")

      if (!token) {
        return NextResponse.json({ error: "No token provided" }, { status: 401 })
      }

      const decoded = verifyToken(token)
      if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

      req.user = decoded
      return handler(req, context)
    } catch {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  }
}

// Middleware to check admin role
export function requireAdmin<T = Record<string, string>>(handler: APIHandler<T>) {
  return requireAuth<T>(async (req: AuthenticatedRequest, context: { params: Promise<T> }) => {
    if (req.user?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    return handler(req, context)
  })
}
