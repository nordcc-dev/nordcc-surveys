import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Survey, SurveyResponse } from "@/lib/db-models"

// GET /api/responses/[responseId] - Get specific response (admin only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ responseId: string }> }) {
  try {
    const { responseId } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!ObjectId.isValid(responseId)) {
      return NextResponse.json({ error: "Invalid response ID" }, { status: 400 })
    }

    const responses = await getCollection("responses")
    const surveys = await getCollection("surveys")

    // Get the response
    const response = (await responses.findOne({ _id: new ObjectId(responseId) })) as SurveyResponse | null

    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 })
    }

    // Check if user owns the survey this response belongs to
    const survey = (await surveys.findOne({
      _id: response.surveyId,
      createdBy: new ObjectId(decoded.userId),
    })) as Survey | null

    if (!survey) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ response, survey })
  } catch (error) {
    console.error("Get response error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/responses/[responseId] - Delete specific response (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ responseId: string }> }) {
  try {
    const { responseId } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!ObjectId.isValid(responseId)) {
      return NextResponse.json({ error: "Invalid response ID" }, { status: 400 })
    }

    const responses = await getCollection("responses")
    const surveys = await getCollection("surveys")

    // Get the response
    const response = (await responses.findOne({ _id: new ObjectId(responseId) })) as SurveyResponse | null

    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 })
    }

    // Check if user owns the survey this response belongs to
    const survey = (await surveys.findOne({
      _id: response.surveyId,
      createdBy: new ObjectId(decoded.userId),
    })) as Survey | null

    if (!survey) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Delete the response
    await responses.deleteOne({ _id: new ObjectId(responseId) })

    // Update survey response count
    await surveys.updateOne({ _id: response.surveyId }, { $inc: { responseCount: -1 } })

    return NextResponse.json({ message: "Response deleted successfully" })
  } catch (error) {
    console.error("Delete response error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
