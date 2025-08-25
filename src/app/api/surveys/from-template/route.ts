import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import templates from "@/data/survey-templates.json"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authorization required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { templateId, title } = await request.json()

    if (!templateId) {
      return NextResponse.json({ success: false, error: "Template ID is required" }, { status: 400 })
    }

    // Find the template
    const template = templates.templates.find((t) => t.id === templateId)
    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 })
    }

    const { db } = await connectToDatabase()

    // Create survey from template
    const survey = {
      _id: new ObjectId(),
      title: title || template.name,
      description: template.description,
      questions: template.questions,
      settings: template.settings,
      createdBy: new ObjectId(decoded.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "draft",
      responseCount: 0,
      isTemplate: false,
      templateId: templateId,
    }

    const result = await db.collection("surveys").insertOne(survey)

    return NextResponse.json({
      success: true,
      survey: {
        ...survey,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    console.error("Error creating survey from template:", error)
    return NextResponse.json({ success: false, error: "Failed to create survey from template" }, { status: 500 })
  }
}
