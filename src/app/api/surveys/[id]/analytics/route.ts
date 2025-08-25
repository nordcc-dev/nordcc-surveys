import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Survey, SurveyResponse, QuestionAnalytics } from "@/lib/db-models"

// GET /api/surveys/[id]/analytics - Get analytics for a survey
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid survey ID" }, { status: 400 })
    }

    const surveys = await getCollection("surveys")
    const responses = await getCollection("responses")

    // Check if survey exists and user owns it
    const survey = (await surveys.findOne({
      _id: new ObjectId(id),
      createdBy: new ObjectId(decoded.userId),
    })) as Survey | null

    if (!survey) {
      return NextResponse.json({ error: "Survey not found or access denied" }, { status: 404 })
    }

    // Get all responses for analytics
    const surveyResponses = (await responses.find({ surveyId: new ObjectId(id) }).toArray()) as SurveyResponse[]

    const totalResponses = surveyResponses.length
    const completedResponses = surveyResponses.filter((r) => r.metadata.isComplete).length
    const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0

    // Calculate average completion time
    const completionTimes = surveyResponses
      .filter((r) => r.metadata.startTime && r.metadata.endTime)
      .map((r) => r.metadata.endTime.getTime() - r.metadata.startTime.getTime())

    const averageTime =
      completionTimes.length > 0 ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length : 0

    // Responses by date (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const responsesByDate = await responses
      .aggregate([
        {
          $match: {
            surveyId: new ObjectId(id),
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray()

    // Question-specific analytics
    const questionAnalytics: QuestionAnalytics[] = survey.questions.map((question) => {
      const questionResponses = surveyResponses
        .map((r) => r.responses[question.id])
        .filter((response) => response !== undefined && response !== null && response !== "")

      const analytics: QuestionAnalytics = {
        questionId: question.id,
        questionType: question.type,
        questionTitle: question.title,
        responseCount: questionResponses.length,
        responses: questionResponses,
      }

      // Calculate distribution for choice-based questions
      if (["multiple-choice", "dropdown", "checkbox"].includes(question.type)) {
        const distribution: { [key: string]: number } = {}
        questionResponses.forEach((response) => {
          if (Array.isArray(response)) {
            // For checkbox questions
            response.forEach((choice) => {
              distribution[choice] = (distribution[choice] || 0) + 1
            })
          } else {
            distribution[String(response)] = (distribution[String(response)] || 0) + 1
          }
        })
        analytics.distribution = distribution
      }

      // Calculate average for rating/scale questions
      if (["rating", "scale"].includes(question.type)) {
        const numericResponses = questionResponses.filter((r) => !isNaN(Number(r))).map(Number)
        if (numericResponses.length > 0) {
          analytics.averageRating = numericResponses.reduce((a, b) => a + b, 0) / numericResponses.length
        }
      }

      // Calculate NPS score
      if (question.type === "nps") {
        const npsResponses = questionResponses.filter((r) => !isNaN(Number(r))).map(Number)
        if (npsResponses.length > 0) {
          const promoters = npsResponses.filter((score) => score >= 9).length
          const detractors = npsResponses.filter((score) => score <= 6).length
          analytics.npsScore = ((promoters - detractors) / npsResponses.length) * 100
        }
      }

      return analytics
    })

    const analyticsData = {
      surveyId: new ObjectId(id),
      totalResponses,
      completionRate,
      averageTime: Math.round(averageTime / 1000), // Convert to seconds
      responsesByDate: responsesByDate.map((item) => ({
        date: item._id,
        count: item.count,
      })),
      questionAnalytics,
    }

    return NextResponse.json({ analytics: analyticsData })
  } catch (error) {
    console.error("Get analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
