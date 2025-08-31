// app/api/surveys/from-template/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

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
}

export async function POST(request: NextRequest) {
  try {
    // Token from Authorization header OR cookie
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

    const { templateId, title }: CreateFromTemplateBody = await request.json()

    if (!templateId || templateId.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Template ID is required" }, { status: 400 })
    }

    // Collections
    const templatesCol = await getCollection("templates")
    const surveysCol = await getCollection("surveys")

    // Find template by kebab `id` OR by Mongo `_id`
    let template: DbTemplate | null = await templatesCol.findOne<DbTemplate>({ id: templateId, isTemplate: true })
    if (!template) {
      // If not by kebab id, try _id
      const maybeObjectId = ObjectId.isValid(templateId) ? new ObjectId(templateId) : null
      if (maybeObjectId) {
        template = await templatesCol.findOne<DbTemplate>({ _id: maybeObjectId, isTemplate: true })
      }
    }

    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 })
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
      status: "published" as const, // per your example
      responseCount: 0,            // new survey starts at 0
      isTemplate: false,
      templateId: String(template.id ?? template._id ?? templateId),
    }

    const insert = await surveysCol.insertOne(surveyDoc)
    const created = await surveysCol.findOne({ _id: insert.insertedId })

    return NextResponse.json(
      {
        success: true,
        survey: created,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create survey from template error:", error)
    return NextResponse.json({ success: false, error: "Failed to create survey from template" }, { status: 500 })
  }
}
