// lib/auth/requireAdmin.ts
import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { requireAuth } from "./requireAuth"
import type { APIHandler, AuthenticatedRequest } from "./types"
import { ObjectId } from "mongodb"

type AdminDoc = { userId: string | ObjectId; admin: boolean }

export function requireAdmin<T extends Record<string, string> = Record<string, string>>(
  handler: APIHandler<T>
) {
  return requireAuth<T>(async (req: AuthenticatedRequest, context: { params: Promise<T> }) => {
    const uid = req.user?.userId
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admins = await getCollection<AdminDoc>("admins")
    const maybeOid = ObjectId.isValid(uid) ? new ObjectId(uid) : null

    const adminDoc = await admins.findOne(
      {
        admin: true,
        $or: [{ userId: uid }, ...(maybeOid ? [{ userId: maybeOid }] : [])],
      },
      { projection: { _id: 1 } }
    )

    if (!adminDoc) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    return handler(req, context)
  })
}
