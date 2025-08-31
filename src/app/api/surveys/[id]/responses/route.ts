import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Survey, SurveyResponse } from "@/lib/db-models"

// GET /api/surveys/[id]/responses - Get all responses for a survey (admin only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const survey = (await surveys.findOne({
      _id: new ObjectId(id),
      createdBy: new ObjectId(decoded.userId),
    })) as Survey | null

    if (!survey) {
      return NextResponse.json({ error: "Survey not found or access denied" }, { status: 404 })
    }

    // Get all responses for this survey
    const surveyResponses = await responses
      .find({ surveyId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ responses: surveyResponses })
  } catch (error) {
    console.error("Get responses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/surveys/[id]/responses - Submit a survey response
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid survey ID" }, { status: 400 })
    }

    const { responses: responseData, respondentInfo, startTime } = await request.json()

    // Validate input
    if (!responseData || typeof responseData !== "object") {
      return NextResponse.json({ error: "Response data is required" }, { status: 400 })
    }

    const surveys = await getCollection("surveys")
    const responses = await getCollection("responses")

    // Check if survey exists and is published or draft
    const survey = (await surveys.findOne({ _id: new ObjectId(id) })) as Survey | null

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    if (survey.status !== "published" && survey.status !== "draft") {
      return NextResponse.json({ error: "Survey is not available for responses" }, { status: 400 })
    }

    // Validate required questions are answered
    const requiredQuestions = survey.questions.filter((q) => q.required)
    const missingRequired = requiredQuestions.filter((q) => !responseData[q.id] || responseData[q.id] === "")

    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          error: "Required questions not answered",
          missingQuestions: missingRequired.map((q) => q.id),
        },
        { status: 400 },
      )
    }

    // Get client IP and user agent
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Create response record
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

    // Insert response
    const result = await responses.insertOne(newResponse)

    // Update survey response count
    await surveys.updateOne({ _id: new ObjectId(id) }, { $inc: { responseCount: 1 } })

    const savedResponse = await responses.findOne({ _id: result.insertedId })

    return NextResponse.json({
      message: "Response submitted successfully",
      responseId: savedResponse?._id,
    })
  } catch (error) {
    console.error("Submit response error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
