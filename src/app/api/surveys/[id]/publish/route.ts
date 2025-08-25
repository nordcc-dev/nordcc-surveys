import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Survey } from "@/lib/db-models"

// POST /api/surveys/[id]/publish - Publish/unpublish survey
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid survey ID" }, { status: 400 })
    }

    const { action } = await request.json() // "publish" or "unpublish"

    const surveys = await getCollection("surveys")

    // Check if survey exists and user owns it
    const existingSurvey = (await surveys.findOne({
      _id: new ObjectId(id),
      createdBy: new ObjectId(decoded.userId),
    })) as Survey | null

    if (!existingSurvey) {
      return NextResponse.json({ error: "Survey not found or access denied" }, { status: 404 })
    }

    // Validate survey has questions before publishing
    if (action === "publish" && (!existingSurvey.questions || existingSurvey.questions.length === 0)) {
      return NextResponse.json({ error: "Cannot publish survey without questions" }, { status: 400 })
    }

    const newStatus = action === "publish" ? "published" : "draft"

    await surveys.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date(),
        },
      },
    )

    const updatedSurvey = await surveys.findOne({ _id: new ObjectId(id) })
    return NextResponse.json({ survey: updatedSurvey })
  } catch (error) {
    console.error("Publish survey error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
