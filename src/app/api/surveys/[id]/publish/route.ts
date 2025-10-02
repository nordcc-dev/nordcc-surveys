import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import type { APIHandler, AuthenticatedRequest } from "@/lib/auth/types"
import type { Survey } from "@/lib/db-models"

// ───────────────────────────────────────────────
// POST /api/surveys/[id]/publish (Admin only)
// ───────────────────────────────────────────────
const handler: APIHandler<{ id: string }> = async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid survey ID" }, { status: 400 })
    }

    const { action } = await req.json() // "publish" or "unpublish"

    if (action !== "publish" && action !== "unpublish") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const surveys = await getCollection<Survey>("surveys")

    // Ensure survey exists
    const existingSurvey = await surveys.findOne({ _id: new ObjectId(id) })
    if (!existingSurvey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    // Validate survey has questions before publishing
    if (
      action === "publish" &&
      (!existingSurvey.questions || existingSurvey.questions.length === 0)
    ) {
      return NextResponse.json(
        { error: "Cannot publish survey without questions" },
        { status: 400 }
      )
    }

    const newStatus = action === "publish" ? "published" : "draft"

    await surveys.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: newStatus, updatedAt: new Date() } }
    )

    const updatedSurvey = await surveys.findOne({ _id: new ObjectId(id) })
    return NextResponse.json({ survey: updatedSurvey })
  } catch (error) {
    console.error("Publish survey error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ✅ Require admin check (JWT + tokenVersion + admins collection)
export const POST = requireAdmin(handler)
