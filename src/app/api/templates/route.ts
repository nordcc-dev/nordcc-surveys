import { NextResponse } from "next/server"
import { ObjectId, OptionalId } from "mongodb"
import { getCollection } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import type { APIHandler, AuthenticatedRequest } from "@/lib/auth/types"

type CreateTemplateBody = {
  id: string
  name: string
  description: string
  category?: string
  icon?: string
  questions: unknown[]
  settings?: Record<string, unknown>
}

type InsertableTemplate = OptionalId<{
  id: string
  name: string
  title: string
  description: string
  category?: string
  icon?: string
  questions: unknown[]
  settings: Record<string, unknown>
  isTemplate: true
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}>

// ───────────────────────────────────────────────
// POST /api/templates - Create template (Admin only)
// ───────────────────────────────────────────────
const postHandler: APIHandler = async (req: AuthenticatedRequest) => {
  try {
    const body = (await req.json()) as Partial<CreateTemplateBody>
    const { id, name, description, category, icon, questions, settings } = body

    if (!id || !name || !description || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (!/^[a-z0-9-]+$/.test(id)) {
      return NextResponse.json(
        { error: "Template id must be kebab-case" },
        { status: 400 }
      )
    }

    const templatesCol = await getCollection("templates")

    const normalizedName = name.trim()
    const now = new Date()

    const doc: InsertableTemplate = {
      id,
      name: normalizedName,
      title: normalizedName, // ensure both fields are stored
      description,
      category,
      icon,
      questions,
      settings: settings ?? {},
      isTemplate: true,
      createdBy: new ObjectId(req.user!.userId),
      createdAt: now,
      updatedAt: now,
    }

    const result = await templatesCol.insertOne(doc)
    const created = await templatesCol.findOne({ _id: result.insertedId })

    return NextResponse.json({ success: true, template: created }, { status: 201 })
  } catch (err) {
    console.error("Create template error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ✅ Wrap in requireAdmin
export const POST = requireAdmin(postHandler)

// ───────────────────────────────────────────────
// GET /api/templates - List templates (Admin only)
// ───────────────────────────────────────────────
const getHandler: APIHandler = async (req: AuthenticatedRequest) => {
  try {
    const templatesCol = await getCollection("templates")

    const query: Record<string, unknown> = {
      isTemplate: true,
      createdBy: new ObjectId(req.user!.userId),
    }

    const templates = await templatesCol
      .find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray()

    return NextResponse.json({ templates }, { status: 200 })
  } catch (error) {
    console.error("Get templates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ✅ Wrap in requireAdmin
export const GET = requireAdmin(getHandler)
