"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getCSRFToken } from "./use-template"
type QuestionAnalytics = {
  questionId: string
  questionTitle: string
  questionType: string
  totalResponses: number
  distribution: Record<string, number>
  average: number | null
  standardDeviation: number | null
}

type SurveyAnalytics = {
  surveyId: string
  surveyTitle?: string
  name?: string
  surveyDescription?: string
  totalResponses: number
  createdAt?: string
  questionAnalytics: QuestionAnalytics[]
}

type Props = {
  survey: SurveyAnalytics
}

export function SurveyInsight({ survey }: Props) {
  const storageKey = useMemo(() => `survey_analysis_${survey.surveyId}`, [survey.surveyId])
  const [analysis, setAnalysis] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load cached analysis on mount
  useEffect(() => {
    const cached = localStorage.getItem(storageKey)
    if (cached) setAnalysis(cached)
  }, [storageKey])

  async function runAnalysis() {
    try {
      setLoading(true)
      setError(null)
      const csrf = getCSRFToken()
      const token = localStorage.getItem("auth_token")
      const res = await fetch("/api/analysis/survey", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "X-CSRF-Token": csrf || "",
        },
        body: JSON.stringify({
          surveyId: survey.surveyId,
          surveyTitle: survey.surveyTitle,
          name: survey.name,
          surveyDescription: survey.surveyDescription,
          totalResponses: survey.totalResponses,
          createdAt: survey.createdAt,
          questionAnalytics: survey.questionAnalytics,
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Request failed: ${res.status}`)
      }

      const j = (await res.json()) as { success: boolean; analysis: string }
      setAnalysis(j.analysis || "")
      localStorage.setItem(storageKey, j.analysis || "")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to analyze survey")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-secondary" />
          AI Survey Insight
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Generates a comprehensive narrative using the survey’s questions and response distributions.
        </div>

        <div className="flex gap-2">
          <Button onClick={runAnalysis} disabled={loading} className="rounded-full">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {analysis ? "Regenerate Insight" : "Generate Insight"}
          </Button>
          {analysis && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                localStorage.removeItem(storageKey)
                setAnalysis("")
              }}
            >
              Clear Saved Insight
            </Button>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {analysis ? (
          <div className="prose prose-sm sm:prose max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // tighten list spacing a bit
                ul: ({ children }) => <ul className="list-disc pl-6 space-y-1 mb-4">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 space-y-1 mb-4">{children}</ol>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
              }}
            >
              {analysis}
            </ReactMarkdown>
          </div>
        ) : !loading ? (
          <p className="text-sm text-muted-foreground">
            No insight yet. Click “Generate Insight” to analyze this survey.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
