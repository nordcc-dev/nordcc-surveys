// hooks/useSurveyDraft.ts
"use client"

import { useEffect, useRef } from "react"
import { saveDraft, loadDraft } from "@/lib/drafts"

type Params<TAnswers> = {
  surveyId: string
  title?: string
  answers: TAnswers
  onHydrate: (answers: TAnswers) => void
  debounceMs?: number
}

export function useSurveyDraft<TAnswers>({
  surveyId,
  title,
  answers,
  onHydrate,
  debounceMs = 600,
}: Params<TAnswers>) {
  // Hydrate once on mount
  useEffect(() => {
    const rec = loadDraft<TAnswers>(surveyId)
    if (rec?.answers) onHydrate(rec.answers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId])

  // Debounced autosave when answers change
  const t = useRef<number | null>(null)
  useEffect(() => {
    if (t.current) window.clearTimeout(t.current)
    t.current = window.setTimeout(() => {
      saveDraft<TAnswers>({ surveyId, title, answers })
    }, debounceMs)
    return () => { if (t.current) window.clearTimeout(t.current) }
  }, [surveyId, title, answers, debounceMs])
}
