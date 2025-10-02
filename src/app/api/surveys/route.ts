import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth/requireAuth"
import type { APIHandler, AuthenticatedRequest } from "@/lib/auth/types"
import type { Survey } from "@/lib/db-models"

// ───────────────────────────────────────────────
// GET /api/surveys - Get surveys for current user
// ───────────────────────────────────────────────
const handler: APIHandler = async (req: AuthenticatedRequest) => {
  try {
    const surveys = await getCollection<Survey>("surveys")

    const userSurveys = await surveys
      .find({ createdBy: new ObjectId(req.user!.userId) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ surveys: userSurveys })
  } catch (error) {
    console.error("Get surveys error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ✅ Auth required, but not admin-only
export const GET = requireAuth(handler)
