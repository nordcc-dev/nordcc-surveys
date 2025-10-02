import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import type { APIHandler, AuthenticatedRequest } from "@/lib/auth/types"

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
  createdAt?: Date
  updatedAt?: Date
  isTemplate?: boolean
}

// ───────────────────────────────────────────────
// POST /api/builder (Admin only)
// ───────────────────────────────────────────────
const handler: APIHandler = async (_req: AuthenticatedRequest) => {
  try {
    const body = (await _req.json()) as TemplateDoc

    // Basic validation
    if (!body?.id || !/^[a-z0-9-]+$/.test(body.id)) {
      return NextResponse.json(
        { error: "Invalid template id (use kebab-case)." },
        { status: 400 }
      )
    }
    if (!body.name || !Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json(
        { error: "Name and at least one question are required." },
        { status: 400 }
      )
    }

    const templates = await getCollection<TemplateDoc>("templates")

    // Enforce unique ID
    const existing = await templates.findOne({ id: body.id })
    if (existing) {
      return NextResponse.json(
        { error: "Template ID already exists." },
        { status: 409 }
      )
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
}

// ✅ Require admin (JWT + tokenVersion + admins collection)
export const POST = requireAdmin(handler)
