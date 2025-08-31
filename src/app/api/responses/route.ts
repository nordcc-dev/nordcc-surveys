import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"
import type { Survey, SurveyResponse, Question, ResponseValue } from "@/lib/db-models"

// GET /api/responses - Get all survey responses with analytics (admin only)
export const GET = requireAdmin(async () => {
  try {
    const responses = await getCollection("responses")
    const surveys = await getCollection("surveys")

    // Get all responses
    const allResponses = (await responses.find({}).toArray()) as SurveyResponse[]

    // Get all surveys
    const allSurveys = (await surveys.find({}).toArray()) as Survey[]

    // Create a map of survey ID to survey data
    const surveyMap = new Map<string, Survey>()
    allSurveys.forEach((survey) => {
      if (survey._id) {
        surveyMap.set(survey._id.toString(), survey)
      }
    })

    // Group responses by survey
    const responsesBySurvey = new Map<string, SurveyResponse[]>()
    allResponses.forEach((response) => {
      const surveyId = response.surveyId.toString()
      if (!responsesBySurvey.has(surveyId)) {
        responsesBySurvey.set(surveyId, [])
      }
      responsesBySurvey.get(surveyId)?.push(response)
    })

    // Calculate analytics for each survey
    const analytics = Array.from(responsesBySurvey.entries())
      .map(([surveyId, surveyResponses]) => {
        const survey = surveyMap.get(surveyId)
        if (!survey) return null

        // Calculate question analytics
        const questionAnalytics = survey.questions.map((question: Question) => {
          const questionResponses = surveyResponses
            .map((response) => response.responses[question.id])
            .filter((value): value is ResponseValue => value !== undefined && value !== null)

          const analytics = {
            questionId: question.id,
            questionTitle: question.question,
            questionType: question.type,
            totalResponses: questionResponses.length,
            distribution: {} as Record<string, number>,
            average: null as number | null,
            standardDeviation: null as number | null,
          }

          if (questionResponses.length === 0) return analytics

          // Handle different question types
          switch (question.type) {
            case "multiple-choice":
            case "dropdown":
              // Calculate distribution for multiple choice
              const distribution: Record<string, number> = {}
              questionResponses.forEach((response) => {
                const value = response as string
                distribution[value] = (distribution[value] || 0) + 1
              })
              analytics.distribution = distribution
              break

            case "checkbox":
              // Calculate distribution for checkboxes (array responses)
              const checkboxDistribution: Record<string, number> = {}
              questionResponses.forEach((response) => {
                const values = Array.isArray(response) ? response : [response]
                values.forEach((value) => {
                  const stringValue = String(value)
                  checkboxDistribution[stringValue] = (checkboxDistribution[stringValue] || 0) + 1
                })
              })
              analytics.distribution = checkboxDistribution
              break

            case "rating":
            case "scale":
            case "nps":
            case "number":
              // Calculate average and standard deviation for numeric responses
              const numericValues = questionResponses
                .map((response) => Number(response))
                .filter((value) => !isNaN(value))

              if (numericValues.length > 0) {
                const sum = numericValues.reduce((a, b) => a + b, 0)
                const average = sum / numericValues.length

                const variance =
                  numericValues.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / numericValues.length
                const standardDeviation = Math.sqrt(variance)

                analytics.average = Math.round(average * 100) / 100
                analytics.standardDeviation = Math.round(standardDeviation * 100) / 100

                // Also create distribution for numeric values
                const numericDistribution: Record<string, number> = {}
                numericValues.forEach((value) => {
                  const stringValue = String(value)
                  numericDistribution[stringValue] = (numericDistribution[stringValue] || 0) + 1
                })
                analytics.distribution = numericDistribution
              }
              break

            default:
              // For text responses, just count unique responses
              const textDistribution: Record<string, number> = {}
              questionResponses.forEach((response) => {
                const value = String(response)
                textDistribution[value] = (textDistribution[value] || 0) + 1
              })
              analytics.distribution = textDistribution
          }

          return analytics
        })

        return {
          surveyId,
          surveyTitle: survey.title,
          surveyDescription: survey.description,
          totalResponses: surveyResponses.length,
          createdAt: survey.createdAt,
          questionAnalytics,
          responses: surveyResponses,
          name: survey.name ?? null,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    return NextResponse.json({
      success: true,
      analytics,
      totalSurveys: analytics.length,
      totalResponses: allResponses.length,
    })
  } catch (error) {
    console.error("Get all responses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
