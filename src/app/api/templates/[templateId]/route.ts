import { type NextRequest, NextResponse } from "next/server"
import templates from "@/data/survey-templates.json"

export async function GET(request: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const { templateId } = await params
    const template = templates.templates.find((t) => t.id === templateId)

    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error) {
    console.error("Error fetching template:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch template" }, { status: 500 })
  }
}
