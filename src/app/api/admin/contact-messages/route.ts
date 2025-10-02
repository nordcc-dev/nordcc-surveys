// app/api/contact-messages/route.ts
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import type { APIHandler, AuthenticatedRequest } from "@/lib/auth/types"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

type ContactMessage = {
  _id: ObjectId
  name: string
  email: string
  message: string
  createdAt: Date
}

// GET - Fetch all contact messages (admin only)
const handler: APIHandler = async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
    const limitRaw = Number.parseInt(searchParams.get("limit") || "20")
    const limit = Math.min(Math.max(1, limitRaw), 100) // cap to prevent abuse
    const skip = (page - 1) * limit

    const contactMessages = await getCollection<ContactMessage>("contact-messages")

    const total = await contactMessages.countDocuments({})
    const messages = await contactMessages
      .find({}, { projection: { /* optionally redact fields here */ } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching contact messages:", error)
    return NextResponse.json({ error: "Failed to fetch contact messages" }, { status: 500 })
  }
}

// ✅ Admin gate happens server-side via requireAdmin -> requireAuth -> MongoDB check
export const GET = requireAdmin(handler)
