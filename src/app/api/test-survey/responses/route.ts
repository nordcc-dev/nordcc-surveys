
export const dynamic = "force-dynamic"; // avoid build-time execution


import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { surveyId, responses, submittedAt, ipAddress } = body

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Create the response document
    const responseDoc = {
      surveyId,
      responses,
      submittedAt: new Date(submittedAt),
      ipAddress,
      createdAt: new Date(),
    }

    // Insert into the 'responses' collection under 'test-survey' cluster
    const result = await db.collection("responses").insertOne(responseDoc)

    console.log("[v0] Test survey response saved:", result.insertedId)

    return NextResponse.json({
      success: true,
      responseId: result.insertedId,
    })
  } catch (error) {
    console.error("Error saving test survey response:", error)
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 })
  }
}
