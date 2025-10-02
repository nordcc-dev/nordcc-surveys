// app/api/surveys/[id]/route.ts
import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth/requireAuth"
import type { APIHandler, AuthenticatedRequest } from "@/lib/auth/types"
import { verifyToken } from "@/lib/auth/token-utils"
import { getUsersCollection } from "@/lib/mongodb"

import type { Survey } from "@/lib/db-models"




// ────────────────────────────────────────────────────────────────
// Helper: optional server-side auth (verifies token + tokenVersion)
// Returns the authenticated userId (string) or null
// ────────────────────────────────────────────────────────────────
async function optionalUserIdFromAuthHeader(req: Request): Promise<string | null> {
  const raw = req.headers.get("authorization")
  const token = raw?.startsWith("Bearer ") ? raw.slice(7) : undefined
  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  // Convert JWT string id → ObjectId for Mongo query
  const objectId = new ObjectId(decoded.userId)

  const users = await getUsersCollection()
  const user = await users.findOne(
    { _id: objectId },
    { projection: { tokenVersion: 1 } }
  )

  if (!user) return null

  const currentVersion = user.tokenVersion ?? 0
  if ((decoded.tokenVersion ?? 0) !== currentVersion) return null

  return decoded.userId
}

// ────────────────────────────────────────────────────────────────
// GET /api/surveys/[id]  (public; owners see full document)
// ────────────────────────────────────────────────────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid survey ID" }, { status: 400 })
    }

    const surveys = await getCollection<Survey>("surveys")
    const survey = await surveys.findOne({ _id: new ObjectId(id) })
    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    // If authenticated & owner → return full survey
    const authedUserId = await optionalUserIdFromAuthHeader(request)
    if (authedUserId && survey.createdBy?.toString?.() === authedUserId) {
      return NextResponse.json({ survey })
    }

    // Otherwise return public subset (only if survey is available)
    if (survey.status !== "published" && survey.status !== "draft") {
      return NextResponse.json({ error: "Survey not available" }, { status: 404 })
    }

    const publicSurvey = {
      _id: survey._id,
      title: survey.title,
      description: survey.description,
      questions: survey.questions,
      settings: survey.settings,
    }

    return NextResponse.json({ survey: publicSurvey })
  } catch (error) {
    console.error("Get survey error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ────────────────────────────────────────────────────────────────
// PUT /api/surveys/[id]  (owner only)
// ────────────────────────────────────────────────────────────────
const putHandler: APIHandler<{ id: string }> = async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid survey ID" }, { status: 400 })
    }

    const { title, description, questions, settings, status } = await req.json()

    const surveys = await getCollection<Survey>("surveys")

    // owner check
    const existing = await surveys.findOne({
      _id: new ObjectId(id),
      createdBy: new ObjectId(req.user!.userId),
    })
    if (!existing) {
      return NextResponse.json({ error: "Survey not found or access denied" }, { status: 404 })
    }

    const updateData: Partial<Survey> = { updatedAt: new Date() }
    if (typeof title === "string") updateData.title = title
    if (description !== undefined) updateData.description = description
    if (questions) updateData.questions = questions
    if (settings) updateData.settings = settings
    if (status) updateData.status = status

    await surveys.updateOne({ _id: new ObjectId(id) }, { $set: updateData })
    const updated = await surveys.findOne({ _id: new ObjectId(id) })
    return NextResponse.json({ survey: updated })
  } catch (error) {
    console.error("Update survey error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
export const PUT = requireAuth(putHandler)

// ────────────────────────────────────────────────────────────────
// DELETE /api/surveys/[id]  (owner OR admin)
// ────────────────────────────────────────────────────────────────
type AdminDoc = { userId: string; admin: boolean }

const deleteHandler: APIHandler<{ id: string }> = async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid survey ID" }, { status: 400 })
    }

    const surveys = await getCollection<Survey>("surveys")
    const responses = await getCollection("responses")
    const admins = await getCollection<AdminDoc>("admins")

    const survey = await surveys.findOne({ _id: new ObjectId(id) })
    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    // Owner or admin?
    const isOwner = survey.createdBy?.toString?.() === req.user!.userId
    const isAdmin = !!(await admins.findOne(
      { userId: req.user!.userId, admin: true },
      { projection: { userId: 1 } }
    ))

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    await Promise.all([
      surveys.deleteOne({ _id: new ObjectId(id) }),
      responses.deleteMany({ surveyId: new ObjectId(id) }),
    ])

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Delete survey error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
export const DELETE = requireAuth(deleteHandler)
