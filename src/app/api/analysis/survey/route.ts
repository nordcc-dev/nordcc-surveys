// app/api/analysis/survey/route.ts
import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import { requireAdmin } from "@/lib/auth/requireAdmin"
import type { APIHandler, AuthenticatedRequest } from "@/lib/auth/types"

const groqApiKey = process.env.GROQ_API_KEY
if (!groqApiKey) {
  throw new Error("Missing GROQ_API_KEY")
}
const groq = new Groq({ apiKey: groqApiKey })

type QuestionAnalytics = {
  questionId: string
  questionTitle: string
  questionType: string
  totalResponses: number
  distribution: Record<string, number>
  average: number | null
  standardDeviation: number | null
}

type SurveyPayload = {
  surveyId: string
  surveyTitle?: string
  name?: string
  surveyDescription?: string
  totalResponses: number
  createdAt?: string
  questionAnalytics: QuestionAnalytics[]
}

function buildPrompt(s: SurveyPayload) {
  const header = `You are a senior research analyst. Analyze the following survey. 
Provide: (1) executive summary, (2) key insights and trends, (3) statistically notable signals, 
(4) potential biases/limitations, (5) recommended actions and follow-up questions. 
Write clearly for non-technical stakeholders.`

  const meta = `
Survey:

- Title: ${s.surveyTitle ?? "N/A"}
- Name (user-provided): ${s.name ?? "N/A"}
- Description: ${s.surveyDescription ?? "N/A"}
- Total responses: ${s.totalResponses}
- Created at: ${s.createdAt ?? "N/A"}
`

  const qa = s.questionAnalytics
    .map((q, idx) => {
      const dist = Object.entries(q.distribution)
        .map(([k, v]) => `      - ${k}: ${v}`)
        .join("\n")
      return `
  ${idx + 1}. "${q.questionTitle}" 
     - Type: ${q.questionType}
     - Total responses: ${q.totalResponses}
     - Average: ${q.average ?? "N/A"}
     - Std Dev: ${q.standardDeviation ?? "N/A"}
     - Distribution:
${dist || "      - (no data)"}`
    })
    .join("\n")

  return `${header}

${meta}

Questions & Distributions:
${qa}

Guidance:
- Call out significant differences or clusters in the distributions.
- If numeric (rating/scale/nps), interpret averages & deviations.
- If categorical, highlight top/bottom choices and notable gaps.
- NPS and scale questions scale from 0-10, rating questions are from 1-5.
- Be specific, concise, and actionable.
- Return the response in markdown format`
}

// POST — Admin-only survey analysis
const handler: APIHandler = async (req: AuthenticatedRequest) => {
  try {
    const body = (await req.json()) as SurveyPayload

    // Basic payload validation
    if (
      !body ||
      typeof body.surveyId !== "string" ||
      !Array.isArray(body.questionAnalytics) ||
      typeof body.totalResponses !== "number"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // (Optional) cap payload sizes to protect the LLM call
    if (body.questionAnalytics.length > 500) {
      return NextResponse.json({ error: "Too many questions" }, { status: 413 })
    }

    const prompt = buildPrompt(body)

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a helpful, rigorous research analyst." },
        { role: "user", content: prompt },
      ],
    })

    const analysis = completion.choices?.[0]?.message?.content ?? ""
    return NextResponse.json({
      success: true,
      analysis,
      model: "llama-3.1-8b-instant",
    })
  } catch (err) {
    console.error("Survey analysis error:", err)
    return NextResponse.json({ error: "Failed to analyze survey" }, { status: 500 })
  }
}

// ✅ Server-side admin gate: requireAuth (JWT verify) → MongoDB admins check
export const POST = requireAdmin(handler)
