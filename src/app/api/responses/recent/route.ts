// app/api/responses/recent/route.ts
import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import type { APIHandler } from "@/lib/auth/types"

const handler: APIHandler = async () => {
  try {
    const responses = await getCollection("responses")

    const recent = await responses
      .aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 4 },
        {
          $lookup: {
            from: "surveys",
            localField: "surveyId",
            foreignField: "_id",
            as: "survey",
          },
        },
        {
          $project: {
            _id: 1,
            surveyId: 1,
            createdAt: 1,
            respondentEmail: 1,
            answersCount: { $size: { $ifNull: ["$answers", []] } },
            surveyTitle: {
              $ifNull: [{ $arrayElemAt: ["$survey.title", 0] }, "Untitled Survey"],
            },
          },
        },
      ])
      .toArray()

    return NextResponse.json({ success: true, responses: recent })
  } catch (error) {
    console.error("Get recent responses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ✅ Only admins can call this
export const GET = requireAdmin(handler)
