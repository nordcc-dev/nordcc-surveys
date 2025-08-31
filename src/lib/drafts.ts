// lib/localDrafts.ts

export type DraftRecord<TAnswers = unknown> = {
    surveyId: string
    title?: string
    name?: string
    answers: TAnswers
    updatedAt: string // ISO
  }
  
  const INDEX_KEY = "draftIndex"                 // global index
  const DRAFT_KEY = (surveyId: string) => `draft:${surveyId}`
  
  function readIndex(): Array<{ surveyId: string; title?: string; updatedAt: string }> {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) return []
    try { return JSON.parse(raw) as Array<{ surveyId: string; title?: string; updatedAt: string }> } catch { return [] }
  }
  
  function writeIndex(rows: Array<{ surveyId: string; title?: string; updatedAt: string }>): void {
    localStorage.setItem(INDEX_KEY, JSON.stringify(rows))
  }
  
  export function saveDraft<TAnswers = unknown>(rec: {
    surveyId: string
    title?: string
    answers: TAnswers
  }): void {
    const updatedAt = new Date().toISOString()
    const full: DraftRecord<TAnswers> = { ...rec, updatedAt }
    localStorage.setItem(DRAFT_KEY(rec.surveyId), JSON.stringify(full))
  
    const idx = readIndex().filter(r => r.surveyId !== rec.surveyId)
    idx.unshift({ surveyId: rec.surveyId, title: rec.title, updatedAt })
    writeIndex(idx.slice(0, 100)) // keep up to 100 drafts
  }
  
  export function loadDraft<TAnswers = unknown>(surveyId: string): DraftRecord<TAnswers> | null {
    const raw = localStorage.getItem(DRAFT_KEY(surveyId))
    if (!raw) return null
    try { return JSON.parse(raw) as DraftRecord<TAnswers> } catch { return null }
  }
  
  export function listDrafts(): Array<{ surveyId: string; title?: string; updatedAt: string }> {
    return readIndex()
  }
  
  export function deleteDraft(surveyId: string): void {
    localStorage.removeItem(DRAFT_KEY(surveyId))
    writeIndex(readIndex().filter(r => r.surveyId !== surveyId))
  }
  
  export function clearAllDrafts(): void {
    const idx = readIndex()
    for (const row of idx) localStorage.removeItem(DRAFT_KEY(row.surveyId))
    localStorage.removeItem(INDEX_KEY)
  }
  