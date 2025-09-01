
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { hashPassword, generateToken } from "@/lib/auth"
import type { User } from "@/lib/db-models"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validate input
    const emailInput = email
    const passwordInput = password
    const nameInput = name

    if (!emailInput || !passwordInput || !nameInput) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    if (passwordInput.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    const users = await getCollection("users")

    // Check if user already exists
    const existingUser = await users.findOne({ email: emailInput })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(passwordInput)
    const newUser: Omit<User, "_id"> = {
      email: emailInput,
      password: hashedPassword,
      name: nameInput,
      role: "user", // Default to admin for now
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await users.insertOne(newUser)
    const user = await users.findOne({ _id: result.insertedId })

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Generate token
    const token = generateToken(user as User)

    // Return user data without password
    const {  ...userWithoutPassword } = user
    return NextResponse.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
