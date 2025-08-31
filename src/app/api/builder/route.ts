import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"

type QuestionType =
  | "rating"
  | "scale"
  | "nps"
  | "checkbox"
  | "multiple-choice"
  | "textarea"
  | "text"
  | "number"

type Question = {
  id: string
  type: QuestionType
  question: string
  required: boolean
  options?: {
    scale?: number
    labels?: string[]
    choices?: string[]
    placeholder?: string
  }
}

type TemplateDoc = {
  id: string
  name: string
  description: string
  category: string
  icon: string
  questions: Question[]
  settings: {
    allowAnonymous: boolean
    requireAuth: boolean
    multipleResponses: boolean
    showProgressBar: boolean
    thankYouMessage: string
  }
  // Optional metadata
  createdAt?: Date
  updatedAt?: Date
  isTemplate?: boolean
}

export const POST = requireAdmin(async (req: Request) => {
  try {
    const body = (await req.json()) as TemplateDoc

    // Basic validation (server-side)
    if (!body?.id || !/^[a-z0-9-]+$/.test(body.id)) {
      return NextResponse.json({ error: "Invalid template id (use kebab-case)." }, { status: 400 })
    }
    if (!body.name || !Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json({ error: "Name and at least one question are required." }, { status: 400 })
    }

    const templates = await getCollection("templates")

    // Enforce unique id
    const existing = await templates.findOne({ id: body.id })
    if (existing) {
      return NextResponse.json({ error: "Template ID already exists." }, { status: 409 })
    }

    const doc: TemplateDoc = {
      ...body,
      isTemplate: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await templates.insertOne(doc)
    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (err) {
    console.error("Create template error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
