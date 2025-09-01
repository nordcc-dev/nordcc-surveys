
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"
import { ObjectId } from "mongodb"

// DELETE - Delete a contact message (admin only)
export const DELETE = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 })
    }

    const contactMessages = await getCollection("contact-messages")
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
})
