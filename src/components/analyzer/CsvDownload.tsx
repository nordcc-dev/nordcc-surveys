"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

// Import your shared types if available.
// If ResponseValue is exported from your models, prefer:
// import type { ResponseValue } from "@/lib/db-models"

// Minimal copy to avoid module-type conflicts:
export type ResponseValue =
  | string
  | number
  | string[]
  | { [rowId: string]: string }
  | boolean
  | null

// Minimal shape: only what the CSV builder needs.
// No surveyId here => no ObjectId/string mismatch.
export interface MinimalSurveyResponse {
  responses: { [questionId: string]: ResponseValue }
  metadata?: {
    ipAddress?: string
    userAgent?: string
    startTime?: string | Date
    endTime?: string | Date
    isComplete?: boolean
  }
  respondentInfo?: {
    email?: string
    name?: string
  }
  createdAt?: string | Date
}

export interface QuestionLite {
  id: string
  title: string
}

interface DownloadCsvButtonProps {
  questions: QuestionLite[]
  responses: MinimalSurveyResponse[] | null | undefined
  filename?: string
  className?: string
  extraHeaderLabels?: string[]
  extraHeaderValues?:
    ((r: MinimalSurveyResponse) => (string | number | boolean | null | undefined)[])
}

// ---- CSV helpers (no any)

const csvEscape = (v: unknown): string => {
  if (v === null || v === undefined) return ""
  const s = typeof v === "string" ? v : Array.isArray(v) ? JSON.stringify(v) : String(v)
  const needsQuotes = /[",\n]/.test(s)
  const escaped = s.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

const isStringArray = (v: ResponseValue): v is string[] =>
  Array.isArray(v) && v.every(x => typeof x === "string")

const isMatrix = (v: ResponseValue): v is { [rowId: string]: string } =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const formatResponseValue = (v: ResponseValue): string => {
  if (v === null) return ""
  if (typeof v === "string") return v
  if (typeof v === "number") return String(v)
  if (typeof v === "boolean") return v ? "true" : "false"
  if (isStringArray(v)) return v.join("; ")
  if (isMatrix(v)) {
    const pairs: string[] = []
    for (const key of Object.keys(v)) {
      pairs.push(`${key}: ${v[key]}`)
    }
    return pairs.join(" | ")
  }
  return ""
}

const buildCsv = (
  questions: QuestionLite[],
  responses: MinimalSurveyResponse[],
  extraHeaderLabels?: string[],
  extraHeaderValues?: (r: MinimalSurveyResponse) => (string | number | boolean | null | undefined)[]
): string => {
  const headerTitles = questions.map(q => q.title)
  const fullHeader = extraHeaderLabels && extraHeaderLabels.length > 0
    ? [...headerTitles, ...extraHeaderLabels]
    : headerTitles

  const rows: string[] = responses.map((resp) => {
    const cols: string[] = questions.map((q) => {
      const raw = resp.responses[q.id] ?? null
      return csvEscape(formatResponseValue(raw))
    })

    if (extraHeaderLabels && extraHeaderLabels.length > 0 && extraHeaderValues) {
      const extras = extraHeaderValues(resp).map(v => csvEscape(v ?? ""))
      return [...cols, ...extras].join(",")
    }
    return cols.join(",")
  })

  return [fullHeader.map(csvEscape).join(","), ...rows].join("\n")
}

// ---- Component

export function DownloadCsvButton({
  questions,
  responses,
  filename = "survey-responses",
  className,
  extraHeaderLabels,
  extraHeaderValues,
}: DownloadCsvButtonProps) {
  const disabled = !responses || responses.length === 0

  const handleDownload = React.useCallback(() => {
    if (!responses) return
    const csv = buildCsv(questions, responses, extraHeaderLabels, extraHeaderValues)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const safeName = filename.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    const a = document.createElement("a")
    a.href = url
    a.download = `${safeName || "survey-responses"}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [questions, responses, filename, extraHeaderLabels, extraHeaderValues])

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled}
      className={className}
      title="Download responses as CSV (headers are the question titles)"
    >
      <Download className="h-4 w-4 mr-2" />
      Download CSV
    </Button>
  )
}
