// lib/auth/requireAuth.ts
import { NextResponse, NextRequest } from "next/server"
import { getUsersCollection } from "@/lib/mongodb"
import { verifyToken } from "./token-utils"
import type { APIHandler, AuthenticatedRequest } from "./types"
import { ObjectId } from "mongodb"


export function requireAuth<T extends Record<string, string> = Record<string, string>>(
  handler: APIHandler<T>
) {
  return async (req: AuthenticatedRequest, context: { params: Promise<T> }) => {
    try {
      // Accept header OR cookie
      const raw = req.headers.get("authorization")
      const headerToken = raw?.startsWith("Bearer ") ? raw.slice(7) : undefined

      let cookieToken: string | undefined
      const maybeNextReq = req as unknown as NextRequest
      if (typeof maybeNextReq.cookies?.get === "function") {
        cookieToken = maybeNextReq.cookies.get("auth_token")?.value
      }

      const token = headerToken || cookieToken
      if (!token) return NextResponse.json({ error: "No token provided" }, { status: 401 })

      const decoded = verifyToken(token)
      if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

      // 🔑 Convert string id → ObjectId for DB lookup
      if (!ObjectId.isValid(decoded.userId)) {
        return NextResponse.json({ error: "Invalid user id" }, { status: 401 })
      }
      const userObjectId = new ObjectId(decoded.userId)

      const users = await getUsersCollection() // Collection<User>
      const userDoc = await users.findOne(
        { _id: userObjectId },
        { projection: { tokenVersion: 1 } }
      )
      if (!userDoc) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

      const currentVersion = userDoc.tokenVersion ?? 0
      const tokenVersion = decoded.tokenVersion ?? 0
      if (tokenVersion !== currentVersion) {
        return NextResponse.json({ error: "Session expired" }, { status: 401 })
      }

      req.user = decoded
      return handler(req, context)
    } catch {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  }
}
