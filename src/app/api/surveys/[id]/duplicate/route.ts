import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Survey } from "@/lib/db-models"

// POST /api/surveys/[id]/duplicate - Duplicate survey
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

    const surveys = await getCollection("surveys")

    // Check if survey exists and user owns it
    const existingSurvey = (await surveys.findOne({
      _id: new ObjectId(id),
      createdBy: new ObjectId(decoded.userId),
    })) as Survey | null

    if (!existingSurvey) {
      return NextResponse.json({ error: "Survey not found or access denied" }, { status: 404 })
    }

    // Create duplicate survey
    const duplicatedSurvey: Omit<Survey, "_id"> = {
      title: `${existingSurvey.title} (Copy)`,
      description: existingSurvey.description,
      questions: existingSurvey.questions,
      settings: existingSurvey.settings,
      status: "draft", // Always start as draft
      createdBy: new ObjectId(decoded.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
      responseCount: 0,
    }

    const result = await surveys.insertOne(duplicatedSurvey)
    const newSurvey = await surveys.findOne({ _id: result.insertedId })

    return NextResponse.json({ survey: newSurvey })
  } catch (error) {
    console.error("Duplicate survey error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
