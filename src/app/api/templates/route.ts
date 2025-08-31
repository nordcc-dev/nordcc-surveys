// app/api/templates/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId, OptionalId } from "mongodb"

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

export async function POST(request: NextRequest) {
  try {
    const headerToken = request.headers.get("authorization")?.replace("Bearer ", "")
    const cookieToken = request.cookies.get("auth_token")?.value
    const token = headerToken || cookieToken

    if (!token) return NextResponse.json({ error: "No token provided" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const body = (await request.json()) as Partial<CreateTemplateBody>
    const { id, name, description, category, icon, questions, settings } = body

    if (!id || !name || !description || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (!/^[a-z0-9-]+$/.test(id)) {
      return NextResponse.json({ error: "Template id must be kebab-case" }, { status: 400 })
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
      createdBy: new ObjectId(decoded.userId),
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

export async function GET(request: NextRequest) {
  try {
    const headerToken = request.headers.get("authorization")?.replace("Bearer ", "")
    const cookieToken = request.cookies.get("auth_token")?.value
    const token = headerToken || cookieToken
    if (!token) return NextResponse.json({ error: "No token provided" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const templatesCol = await getCollection("templates")

    const query: Record<string, unknown> = {
      isTemplate: true,
      createdBy: new ObjectId(decoded.userId),
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
