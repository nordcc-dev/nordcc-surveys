
import { NextResponse } from "next/server"
import testSurvey from "@/data/test-survey.json"

export async function GET() {
  try {
    return NextResponse.json(testSurvey)
  } catch (error) {
    console.error("Error loading test survey:", error)
    return NextResponse.json({ error: "Failed to load survey" }, { status: 500 })
  }
}
