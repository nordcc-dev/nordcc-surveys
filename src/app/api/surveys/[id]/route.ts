import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Survey } from "@/lib/db-models"

// GET /api/surveys/[id] - Get specific survey
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid survey ID" }, { status: 400 })
    }

    const surveys = await getCollection("surveys")
    const survey = (await surveys.findOne({ _id: new ObjectId(id) })) as Survey | null

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    // Check if request is authenticated (for admin access)
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (token) {
      const decoded = verifyToken(token)
      if (decoded && decoded.userId === survey.createdBy.toString()) {
        // Return full survey data for owner
        return NextResponse.json({ survey })
      }
    }

    // Return public survey data (for taking surveys)
    if (survey.status !== "published") {
      return NextResponse.json({ error: "Survey not available" }, { status: 404 })
    }

    const publicSurvey = {
      _id: survey._id,
      title: survey.title,
      description: survey.description,
      questions: survey.questions,
      settings: survey.settings,
    }

    return NextResponse.json({ survey: publicSurvey })
  } catch (error) {
    console.error("Get survey error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/surveys/[id] - Update survey
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { title, description, questions, settings, status } = await request.json()

    const surveys = await getCollection("surveys")

    // Check if survey exists and user owns it
    const existingSurvey = (await surveys.findOne({
      _id: new ObjectId(id),
      createdBy: new ObjectId(decoded.userId),
    })) as Survey | null

    if (!existingSurvey) {
      return NextResponse.json({ error: "Survey not found or access denied" }, { status: 404 })
    }

    // Update survey
    const updateData: Partial<Survey> = {
      updatedAt: new Date(),
    }

    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (questions) updateData.questions = questions
    if (settings) updateData.settings = settings
    if (status) updateData.status = status

    await surveys.updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    const updatedSurvey = await surveys.findOne({ _id: new ObjectId(id) })
    return NextResponse.json({ survey: updatedSurvey })
  } catch (error) {
    console.error("Update survey error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/surveys/[id] - Delete survey
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const responses = await getCollection("responses")

    // Check if survey exists and user owns it
    const existingSurvey = (await surveys.findOne({
      _id: new ObjectId(id),
      createdBy: new ObjectId(decoded.userId),
    })) as Survey | null

    if (!existingSurvey) {
      return NextResponse.json({ error: "Survey not found or access denied" }, { status: 404 })
    }

    // Delete survey and all its responses
    await Promise.all([
      surveys.deleteOne({ _id: new ObjectId(id) }),
      responses.deleteMany({ surveyId: new ObjectId(id) }),
    ])

    return NextResponse.json({ message: "Survey deleted successfully" })
  } catch (error) {
    console.error("Delete survey error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
