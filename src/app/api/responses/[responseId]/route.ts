import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth/requireAuth"
import type { APIHandler, AuthenticatedRequest } from "@/lib/auth/types"
import type { Survey, SurveyResponse } from "@/lib/db-models"

// GET /api/responses/[responseId] - Get specific response (auth required, must own survey)
const getHandler: APIHandler<{ responseId: string }> = async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ responseId: string }> }
) => {
  try {
    const { responseId } = await params

    if (!ObjectId.isValid(responseId)) {
      return NextResponse.json({ error: "Invalid response ID" }, { status: 400 })
    }

    const responses = await getCollection<SurveyResponse>("responses")
    const surveys = await getCollection<Survey>("surveys")

    // Find response
    const response = await responses.findOne({ _id: new ObjectId(responseId) })
    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 })
    }

    // Ensure user owns the survey
    const survey = await surveys.findOne({
      _id: response.surveyId,
      createdBy: new ObjectId(req.user!.userId),
    })
    if (!survey) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ response, survey })
  } catch (error) {
    console.error("Get response error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/responses/[responseId] - Delete specific response (auth required, must own survey)
const deleteHandler: APIHandler<{ responseId: string }> = async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ responseId: string }> }
) => {
  try {
    const { responseId } = await params

    if (!ObjectId.isValid(responseId)) {
      return NextResponse.json({ error: "Invalid response ID" }, { status: 400 })
    }

    const responses = await getCollection<SurveyResponse>("responses")
    const surveys = await getCollection<Survey>("surveys")

    // Find response
    const response = await responses.findOne({ _id: new ObjectId(responseId) })
    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 })
    }

    // Ensure user owns the survey
    const survey = await surveys.findOne({
      _id: response.surveyId,
      createdBy: new ObjectId(req.user!.userId),
    })
    if (!survey) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Delete response
    await responses.deleteOne({ _id: new ObjectId(responseId) })

    // Update survey response count
    await surveys.updateOne({ _id: response.surveyId }, { $inc: { responseCount: -1 } })

    return NextResponse.json({ message: "Response deleted successfully" })
  } catch (error) {
    console.error("Delete response error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ✅ Wrap with requireAuth so JWT + tokenVersion are validated server-side
export const GET = requireAuth(getHandler)
export const DELETE = requireAuth(deleteHandler)
