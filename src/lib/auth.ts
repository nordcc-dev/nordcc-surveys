import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import type { User } from "./db-models"
import { type NextRequest, NextResponse } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");

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
    JWT_SECRET as string,
    { expiresIn: "7d" },
  )
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JWTPayload
    return decoded
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

type APIHandler = (req: AuthenticatedRequest, res: NextResponse) => Promise<NextResponse> | NextResponse

export function requireAuth(handler: APIHandler) {
  return async (req: AuthenticatedRequest, res: NextResponse) => {
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
      return handler(req, res)
    } catch {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  }
}

// Middleware to check admin role
export function requireAdmin(handler: APIHandler) {
  return requireAuth(async (req: AuthenticatedRequest, res: NextResponse) => {
    if (req.user?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    return handler(req, res)
  })
}
