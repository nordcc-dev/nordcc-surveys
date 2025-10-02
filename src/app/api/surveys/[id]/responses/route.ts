import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import type { APIHandler, AuthenticatedRequest } from "@/lib/auth/types"
import type { Survey, SurveyResponse } from "@/lib/db-models"

// ───────────────────────────────────────────────
// GET (Admin only) - fetch all responses for a survey
// ───────────────────────────────────────────────
const getHandler: APIHandler<{ id: string }> = async (
  _req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid survey ID" }, { status: 400 })
    }

    const surveys = await getCollection<Survey>("surveys")
    const responses = await getCollection<SurveyResponse>("responses")

    // Make sure the survey exists
    const survey = await surveys.findOne({ _id: new ObjectId(id) })
    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    // Fetch responses
    const surveyResponses = await responses
      .find({ surveyId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ survey, responses: surveyResponses })
  } catch (error) {
    console.error("Get survey responses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ✅ Require admin to access
export const GET = requireAdmin(getHandler)

// ───────────────────────────────────────────────
// POST (Public) - submit a survey response
// ───────────────────────────────────────────────
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid survey ID" }, { status: 400 })
    }

    const { responses: responseData, respondentInfo, startTime } = await request.json()

    if (!responseData || typeof responseData !== "object") {
      return NextResponse.json({ error: "Response data is required" }, { status: 400 })
    }

    const surveys = await getCollection<Survey>("surveys")
    const responses = await getCollection<SurveyResponse>("responses")

    const survey = await surveys.findOne({ _id: new ObjectId(id) })
    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    if (survey.status !== "published" && survey.status !== "draft") {
      return NextResponse.json({ error: "Survey is not available for responses" }, { status: 400 })
    }

    // Check required questions
    const requiredQuestions = survey.questions.filter((q) => q.required)
    const missingRequired = requiredQuestions.filter(
      (q) => !responseData[q.id] || responseData[q.id] === ""
    )
    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          error: "Required questions not answered",
          missingQuestions: missingRequired.map((q) => q.id),
        },
        { status: 400 }
      )
    }

    // Metadata
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    const newResponse: Omit<SurveyResponse, "_id"> = {
      surveyId: new ObjectId(id),
      responses: responseData,
      metadata: {
        ipAddress: survey.settings.collectIP ? clientIP : undefined,
        userAgent,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: new Date(),
        isComplete: true,
      },
      respondentInfo: survey.settings.collectEmail ? respondentInfo : undefined,
      createdAt: new Date(),
    }

    const result = await responses.insertOne(newResponse)

    await surveys.updateOne({ _id: new ObjectId(id) }, { $inc: { responseCount: 1 } })

    return NextResponse.json({
      message: "Response submitted successfully",
      responseId: result.insertedId,
    })
  } catch (error) {
    console.error("Submit survey response error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
