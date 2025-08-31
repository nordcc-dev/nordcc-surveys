"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { RefreshCw, TrendingUp, Users, FileText } from "lucide-react"
import Link from "next/link"
import { SurveyInsight } from "@/components/surveys/survey-insights"
import {
  convertQuestionTypeToScale,
  defaultLabelsForType,
  type QuestionType,
} from "@/components/surveys/question-type"
import { topNWordsFrom, averageWordLengthFrom } from "@/components/analyzer/AnalyzingLogic"


interface QuestionAnalytics {
  questionId: string
  questionTitle: string
  questionType: string
  totalResponses: number
  distribution: Record<string, number>
  average: number | null
  standardDeviation: number | null
}

interface SurveyAnalytics {
  surveyId: string
  surveyTitle: string
  name?: string
  surveyDescription: string
  totalResponses: number
  createdAt: string
  questionAnalytics: QuestionAnalytics[]
  responses: unknown[]
}

interface AnalyticsData {
  success: boolean
  analytics: SurveyAnalytics[]
  totalSurveys: number
  totalResponses: number
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A020F0",
  "#FF1493",
  "#00CED1",
  "#FFD700",
]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("No authentication token found")

      const response = await fetch("/api/responses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch analytics")

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }, []) // no changing deps

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Default-select the first survey after data is set
  useEffect(() => {
    if (!selectedSurveyId && data?.analytics?.length) {
      setSelectedSurveyId(data.analytics[0].surveyId)
    }
  }, [data, selectedSurveyId])


  useEffect(() => {
    fetchAnalytics()

  }, [fetchAnalytics])

  const selectedSurvey: SurveyAnalytics | undefined = useMemo(
    () => data?.analytics.find((s) => s.surveyId === selectedSurveyId),
    [data, selectedSurveyId]
  )

  const renderQuestionAnalytics = (question: QuestionAnalytics) => {
    // derive scale/labels from the standardized type
    const inferredScale = convertQuestionTypeToScale(
      question.questionType as QuestionType
    )
    const inferredLabels = defaultLabelsForType(
      question.questionType as QuestionType,
      inferredScale
    )

    const distributionData = Object.entries(question.distribution).map(
      ([key, value]) => ({
        name: key,
        value: value as number,
      })
    )

    return (
      <CardContent>
      {(() => {
        const qTitle =
          question.questionTitle
        
    
        const isTextual =
          question.questionType === "text" || question.questionType === "textarea"
    
        const textAnswerCounts: Record<string, number> =
          (question.distribution as Record<string, number>) ??
          (distributionData.length
            ? Object.fromEntries(
                distributionData.map((d) => [String(d.name), Number(d.value) || 0])
              )
            : {})
    
        return (
          <section className="space-y-4 rounded-xl border p-5 bg-card/40">
            {/* Question heading */}
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-semibold leading-snug">{qTitle}</h3>
              <div className="shrink-0 text-right">
                <Badge variant="outline" className="mr-2 rounded-full">
                  {question.questionType}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {question.totalResponses} responses
                </span>
              </div>
            </div>
    
            <div className="border-t" />
    
            {isTextual ? (
              <>
                {/* Top words + avg length */}
                <div className="mb-4 p-6 bg-muted rounded-xl shadow-sm">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    {/* Most Used Words */}
    <div className="p-4 bg-background rounded-lg border border-border">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        3 Most Used Words
      </p>
      {topNWordsFrom(textAnswerCounts, 3).length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm">
          {topNWordsFrom(textAnswerCounts, 3).map(({ word, count }) => (
            <li
              key={`${question.questionId}-word-${word}`}
              className="flex items-center justify-between border-b border-border pb-1 last:border-0 last:pb-0"
            >
              <span className="font-medium">{word}</span>
              <span className="text-muted-foreground">{count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-muted-foreground">No frequent words yet</p>
      )}
    </div>

    {/* Average Word Length */}
    <div className="p-4 bg-background rounded-lg border border-border flex flex-col justify-center items-center text-center">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Average Word Length
      </p>
      <p className="text-3xl font-extrabold text-blue-600 mt-3">
        {averageWordLengthFrom(textAnswerCounts)}
      </p>
    </div>
  </div>
</div>

    
                {/* Answers list */}
                <div>
                  <h4 className="font-medium mb-2">Responses</h4>
                  {Object.keys(textAnswerCounts).length > 0 ? (
                    <ul className="space-y-2">
                      {Object.entries(textAnswerCounts).map(([answer, count]) => (
                        <li
                          key={`${question.questionId}-answer-${answer}`}
                          className="p-3 rounded-lg border bg-background text-sm leading-relaxed break-words"
                        >
                          <div className="flex justify-between gap-3">
                            <span className="whitespace-pre-wrap">{answer}</span>
                            <span className="text-muted-foreground text-xs">
                              {count} response{count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No responses yet.</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {question.average !== null && (
                  <div className="mb-4 p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Average
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {question.average}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Standard Deviation
                        </p>
                        <p className="text-2xl font-bold text-blue-400">
                          {question.standardDeviation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
    
                {inferredScale && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Scale
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(inferredLabels ?? Array.from({ length: inferredScale })).map(
                        (label, idx) => (
                          <span
                            key={`${question.questionId}-label-${idx}`}
                            className="px-2.5 py-1 rounded-full border text-xs bg-white"
                          >
                            {label ?? idx + 1}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
    
                {distributionData.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Bar */}
                    <div className="min-w-0">
                      <h4 className="font-medium mb-2">Response Distribution</h4>
                      <div className="w-full overflow-x-auto sm:overflow-visible">
                        <div
                          style={{
                            minWidth: Math.max(360, distributionData.length * 64),
                          }}
                          className="min-w-0"
                        >
                          <ChartContainer
                            config={{
                              value: {
                                label: "Responses",
                                color: "hsl(var(--chart-1))",
                              },
                            }}
                            className="h-56 sm:h-64 w-full"
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={distributionData}
                                margin={{
                                  top: 8,
                                  right: 8,
                                  bottom: 28,
                                  left: 8,
                                }}
                                barCategoryGap="20%"
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar
                                  dataKey="value"
                                  fill="white"
                                  radius={[4, 4, 0, 0]}
                                >
                                  {distributionData.map((d, index) => (
                                    <Cell
                                      key={`${question.questionId}-bar-${d.name}-${index}`}
                                      fill="white"
                                      stroke="black"
                                      strokeWidth={2}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </div>
                      </div>
                    </div>
    
                    {/* Pie */}
                    {distributionData.length <= 8 && (
                      <div className="min-w-0">
                        <h4 className="font-medium mb-2">Distribution Breakdown</h4>
                        <ChartContainer
                          config={{
                            value: {
                              label: "Responses",
                              color: "hsl(var(--chart-2))",
                            },
                          }}
                          className="h-64 w-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={distributionData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                              >
                                {distributionData.map((d, index) => (
                                  <Cell
                                    key={`${question.questionId}-pie-${d.name}-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )
      })()}
    </CardContent>
    
    

    )
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600">Error: {error}</p>
              <Button onClick={fetchAnalytics} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto p-6 bg-white">
        <Link href="/admin">
          <Button variant="outline" size="sm" className="rounded-full mb-4">
            ← Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Survey Analytics</h1>
            <p className="text-gray-600 mt-2">Choose a survey to view detailed analytics.</p>
          </div>
          <Button onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Total Surveys</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data?.totalSurveys || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Total Responses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data?.totalResponses || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Avg Responses per Survey</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {data?.totalSurveys ? Math.round((data.totalResponses / data.totalSurveys) * 100) / 100 : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Survey picker grid */}
        <div className="mb-15 border-b-4">
          <h2 className="text-2xl font-semibold mb-3 text-black">Select a survey</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
            {data?.analytics.map((survey) => {
              const isSelected = survey.surveyId === selectedSurveyId
              return (
                <Card
                  key={survey.surveyId}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSurveyId(survey.surveyId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelectedSurveyId(survey.surveyId)
                    }
                  }}
                  className={`transition-all cursor-pointer ${isSelected ? "border-2 border-primary ring-2 ring-primary/20" : "hover:shadow-md"
                    }`}
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      {survey.name || survey.surveyTitle}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {survey.surveyDescription}
                    </CardDescription>


                  </CardHeader>

                  <CardContent className="mt-auto">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full">{survey.totalResponses} responses</Badge>
                      <Badge variant="outline" className="rounded-full text-black">
                        Created: {new Date(survey.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>




                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Selected survey analytics */}
        {selectedSurvey ? (
          <div className="space-y-8">
            <SurveyInsight survey={selectedSurvey} />
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-900">{selectedSurvey.name || selectedSurvey.surveyTitle}</CardTitle>
                <CardDescription className="text-lg">
                  {selectedSurvey.surveyDescription}
                  <div className="mt-2">
                    <Badge variant="secondary" className="mr-2 rounded-full">
                      {selectedSurvey.totalResponses} responses
                    </Badge>
                    <Badge variant="outline" className="rounded-full text-black">
                      Created: {new Date(selectedSurvey.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
  <div className="space-y-4">
    {selectedSurvey.questionAnalytics.map((qa) => (
      <div key={qa.questionId ?? `${qa.questionType}-${qa.questionTitle}`}>
        {renderQuestionAnalytics(qa)}
      </div>
    ))}
  </div>
</CardContent>

            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Select a survey above to view its analytics.
            </CardContent>
          </Card>
        )}

        {data?.analytics.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No survey responses found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}



