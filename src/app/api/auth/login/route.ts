// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { getCollection } from "@/lib/mongodb"
import { verifyPassword } from "@/lib/auth/password-utils"
import { generateToken, JWTPayload } from "@/lib/auth/token-utils"
import type { User } from "@/lib/db-models"

// keep this helper local if you don't have the separate file
export function toSafeUser(user: User): Omit<User, "password"> {
  const clone = { ...user } as Partial<User>
  delete clone.password
  return clone as Omit<User, "password">
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const users = await getCollection<User>("users")
    const user = await users.findOne({ email })
    if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })

    const ok = await verifyPassword(password, user.password)
    if (!ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })

    const tokenVersion = user.tokenVersion ?? 0
    await users.updateOne({ _id: user._id }, { $set: { updatedAt: new Date(), tokenVersion } })

    const payload: JWTPayload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
      tokenVersion,
    }

    const FIFTEEN_MIN = 60 * 15 // JWT exp (seconds)
    const token = generateToken(payload, FIFTEEN_MIN)

    const safeUser = toSafeUser(user)

    const isProd = process.env.NODE_ENV === "production"
    const res = NextResponse.json({
      user: safeUser,
      // returning CSRF is optional; cookie is readable by JS anyway
      // but this can save you from parsing document.cookie on first load
      csrfToken: undefined, // will set below
      token,                // optional: keep during migration; can be removed when fully cookie-only
    })

    // Session auth cookie (httpOnly) — survives refresh, dies on browser close
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      // session cookie: no expires/maxAge
    })

    // CSRF token cookie (NOT httpOnly, so client JS can read & echo in X-CSRF-Token)
    const csrf = randomBytes(32).toString("hex")
    res.cookies.set("csrf_token", csrf, {
      httpOnly: false,       // must be readable by JS
      secure: isProd,
      sameSite: "strict",
      path: "/",
      // session cookie as well
    })

    // Optionally include csrf in the JSON response to avoid reading document.cookie
    

    return res
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
