import { NextResponse } from "next/server"
import templates from "@/data/survey-templates.json"

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      templates: templates.templates,
    })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch templates" }, { status: 500 })
  }
}
