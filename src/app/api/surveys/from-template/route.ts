// app/api/surveys/from-template/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

// IMPORTANT: ensure tsconfig has "resolveJsonModule": true
import localTemplatesFile from "@/data/survey-templates.json"



type DbTemplate = {
  _id?: ObjectId | string
  id?: string
  name?: string
  title?: string
  description?: string
  category?: string
  icon?: string
  questions?: unknown[]
  settings?: Record<string, unknown>
  isTemplate?: boolean
  createdAt?: string
  updatedAt?: string
}


type CreateFromTemplateBody = {
  templateId?: string
  title?: string
  /** Optional override for debugging */
  source?: "local" | "db" | "auto"
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

function normalizeLocalTemplates(src: unknown): DbTemplate[] {
  // Accept either { templates: [...] } or just [...]
  if (Array.isArray(src)) {
    return src.filter(isDbTemplate)
  }
  if (isRecord(src) && Array.isArray((src as { templates?: unknown }).templates)) {
    return (src as { templates: unknown[] }).templates.filter(isDbTemplate)
  }
  return []
}

function isDbTemplate(v: unknown): v is DbTemplate {
  if (!isRecord(v)) return false
  if ("id" in v && v.id !== undefined && typeof v.id !== "string") return false
  if ("name" in v && v.name !== undefined && typeof v.name !== "string") return false
  if ("title" in v && v.title !== undefined && typeof v.title !== "string") return false
  if ("description" in v && v.description !== undefined && typeof v.description !== "string") return false
  if ("questions" in v && v.questions !== undefined && !Array.isArray(v.questions)) return false
  return true
}

async function findDbTemplateById(templatesCol: Awaited<ReturnType<typeof getCollection>>, id: string) {
  let t = await templatesCol.findOne<DbTemplate>({ id, isTemplate: true })
  if (!t && ObjectId.isValid(id)) {
    t = await templatesCol.findOne<DbTemplate>({ _id: new ObjectId(id), isTemplate: true })
  }
  return t
}

export async function POST(request: NextRequest) {
  try {
    // Auth
    const headerToken = request.headers.get("authorization")?.replace("Bearer ", "")
    const cookieToken = request.cookies.get("auth_token")?.value
    const token = headerToken || cookieToken
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Body
    const { templateId, title, source = "auto" }: CreateFromTemplateBody = await request.json()
    if (!templateId?.trim()) {
      return NextResponse.json({ success: false, error: "Template ID is required" }, { status: 400 })
    }
    const wantedId = templateId.trim()

    // Collections
    const templatesCol = await getCollection("templates")
    const surveysCol = await getCollection("surveys")

    // Prepare local list once (at import time) and normalize shape
    const localList: DbTemplate[] = normalizeLocalTemplates(localTemplatesFile)

    // Resolve template by source preference
    let template: DbTemplate | null = null

    const tryLocal = () => {
      const found = localList.find(t => (t.id ?? "").trim() === wantedId) ?? null
      return found
    }

    const tryDb = () => findDbTemplateById(templatesCol, wantedId)

    if (source === "local") {
      template = tryLocal()
    } else if (source === "db") {
      template = await tryDb()
    } else {
      // "auto" — local first, then DB
      template = tryLocal() ?? (await tryDb())
    }

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: "Template not found",
          detail: {
            triedId: wantedId,
            localCount: localList.length,
            exampleLocalIds: localList
              .map(t => t.id)
              .filter((x): x is string => typeof x === "string")
              .slice(0, 20),
            sourceTried: source,
          },
        },
        { status: 404 },
      )
    }

    const now = new Date()
    const surveyDoc = {
      title: title?.trim() || String(template.name ?? template.title ?? "Untitled"),
      description: String(template.description ?? ""),
      questions: Array.isArray(template.questions) ? template.questions : [],
      settings: template.settings ?? {},
      createdBy: new ObjectId(decoded.userId),
      createdAt: now,
      updatedAt: now,
      status: "published" as const,
      responseCount: 0,
      isTemplate: false,
      templateId: String(template.id ?? template._id ?? wantedId),
    }

    const insert = await surveysCol.insertOne(surveyDoc)
    const created = await surveysCol.findOne({ _id: insert.insertedId })

    return NextResponse.json({ success: true, survey: created }, { status: 201 })
  } catch (error) {
    console.error("Create survey from template error:", error)
    return NextResponse.json({ success: false, error: "Failed to create survey from template" }, { status: 500 })
  }
}
