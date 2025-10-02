// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"
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

    // Short-lived JWT (e.g., 15 minutes). Adjust if your generateToken signature differs.
    const FIFTEEN_MIN = 60 * 15
    const token = generateToken(payload, FIFTEEN_MIN)

    const safeUser = toSafeUser(user)

    // --- Set httpOnly session cookie (survives refresh, dies on browser close) ---
    const isProd = process.env.NODE_ENV === "production"
    const res = NextResponse.json({ user: safeUser, token }) // still return token if you want to keep localStorage

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: isProd,          // set true in prod; false is okay on http://localhost
      sameSite: "strict",
      path: "/",               // send cookie to all routes
      // no expires/maxAge => session cookie (cleared when browser closes)
    })

    // (Optional) If you truly want a readable cookie in the browser (not recommended),
    // you could also set a non-httpOnly mirror. Prefer localStorage over this.
    // res.cookies.set("auth_token_client", token, {
    //   httpOnly: false,
    //   secure: isProd,
    //   sameSite: "strict",
    //   path: "/",
    // })

    return res
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
