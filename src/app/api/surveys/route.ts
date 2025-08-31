// app/api/surveys/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const headerToken = request.headers.get("authorization")?.replace("Bearer ", "")
    const cookieToken = request.cookies.get("auth_token")?.value
    const token = headerToken || cookieToken

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const surveys = await getCollection("surveys")
    const userSurveys = await surveys
      .find({ createdBy: new ObjectId(decoded.userId) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ surveys: userSurveys })
  } catch (error) {
    console.error("Get surveys error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
