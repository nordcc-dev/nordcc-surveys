import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Survey } from "@/lib/db-models"

// GET /api/surveys - Get all surveys for authenticated user
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const surveys = await getCollection("surveys")
    const userSurveys = await surveys
      .find({ createdBy: new ObjectId(decoded.userId) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ surveys: userSurveys })
  } catch (error) {
    console.error("Get surveys error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/surveys - Create new survey
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { title, description, questions, settings } = await request.json()

    // Validate input
    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Title and questions are required" }, { status: 400 })
    }

    const surveys = await getCollection("surveys")

    const newSurvey: Omit<Survey, "_id"> = {
      title,
      description: description || "",
      questions,
      settings: settings || {
        allowAnonymous: true,
        requireAuth: false,
        multipleResponses: false,
        showProgressBar: true,
        randomizeQuestions: false,
        collectEmail: false,
        collectIP: true,
      },
      status: "draft",
      createdBy: new ObjectId(decoded.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
      responseCount: 0,
    }

    const result = await surveys.insertOne(newSurvey)
    const survey = await surveys.findOne({ _id: result.insertedId })

    return NextResponse.json({ survey })
  } catch (error) {
    console.error("Create survey error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
