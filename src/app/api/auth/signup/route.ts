// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { hashPassword } from "@/lib/auth/password-utils"
import { generateToken, JWTPayload } from "@/lib/auth/token-utils"
import type { User } from "@/lib/db-models"
import { toSafeUser } from "../login/route"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (typeof email !== "string" || typeof password !== "string" || typeof name !== "string") {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    const users = await getCollection<User>("users")

    // Check if user already exists
    const existingUser = await users.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const newUser: Omit<User, "_id"> = {
      email,
      password: hashedPassword,
      name,
      role: "user",         // every new user starts as "user"
      tokenVersion: 0,      // start at 0 so login/logout/revocation works
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await users.insertOne(newUser)
    const user = await users.findOne({ _id: result.insertedId })
    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Build JWT payload in line with requireAuth
    const payload: JWTPayload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    }
    const token = generateToken(payload)

    // Remove password safely
    const safeUser = toSafeUser(user)

    return NextResponse.json({ user: safeUser, token })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
