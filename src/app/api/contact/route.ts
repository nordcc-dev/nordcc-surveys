
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

interface ContactMessage {
  name: string
  email: string
  company?: string
  subject: string
  message: string
  createdAt: Date
  ipAddress?: string
  userAgent?: string
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, subject, message } = await request.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Name, email, subject, and message are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 })
    }

    // Get client information
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Create contact message object
    const contactMessage: ContactMessage = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || undefined,
      subject: subject.trim(),
      message: message.trim(),
      createdAt: new Date(),
      ipAddress,
      userAgent,
    }

    // Store in MongoDB
    const contactMessages = await getCollection("contact-messages")
    const result = await contactMessages.insertOne(contactMessage)

    if (!result.insertedId) {
      return NextResponse.json({ error: "Failed to save contact message" }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Contact message sent successfully",
        id: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json({ error: "Internal server error. Please try again later." }, { status: 500 })
  }
}
