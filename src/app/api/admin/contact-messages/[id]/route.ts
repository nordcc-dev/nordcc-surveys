// app/api/contact-messages/[id]/route.ts
import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import type { APIHandler, AuthenticatedRequest } from "@/lib/auth/types"
import { ObjectId } from "mongodb"

type ContactMessage = {
  _id: ObjectId
  name: string
  email: string
  message: string
  createdAt: Date
}

// DELETE - Delete a contact message (admin only)
const handler: APIHandler<{ id: string }> = async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 })
    }

    const contactMessages = await getCollection<ContactMessage>("contact-messages")
    const result = await contactMessages.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Contact message not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Contact message deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting contact message:", error)
    return NextResponse.json({ error: "Failed to delete contact message" }, { status: 500 })
  }
}

// ✅ Admin gate happens here
export const DELETE = requireAdmin(handler)
