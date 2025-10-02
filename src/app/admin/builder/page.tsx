// app/builder/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Plus, Trash2, Save, ArrowLeft, Sparkles } from "lucide-react"

import { DraftsPicker } from "@/components/surveys/builder/drafts-tray"
import { saveDraft, loadDraft } from "@/lib/drafts"


// ----- Types -----
type QuestionType =
  | "rating"
  | "scale"
  | "nps"
  | "checkbox"
  | "dropdown"
  | "multiple-choice"
  | "textarea"
  | "text"
  | "number"

type BaseQuestion = {
  id: string
  type: QuestionType
  question: string
  required: boolean
  options?: {
    scale?: number
    labels?: string[]
    choices?: string[]
    placeholder?: string
  }
}

type TemplateSettings = {
  allowAnonymous: boolean
  requireAuth: boolean
  multipleResponses: boolean
  showProgressBar: boolean
  thankYouMessage: string
}

type TemplateDoc = {
  id: string
  name: string
  description: string
  category: string
  icon: string
  questions: BaseQuestion[]
  settings: TemplateSettings
}

// ----- Helpers -----
function newQuestion(nextIndex: number): BaseQuestion {
  return {
    id: `q-${nextIndex}`,
    type: "rating",
    question: "",
    required: false,
    options: { scale: 5, labels: ["1", "2", "3", "4", "5"] },
  }
}

// lib/id.ts
export function generateSurveyId(): string {
    return `survey-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
  

export default function BuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ---- Core UI state ----
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Draft id + template
  const [surveyId, setSurveyId] = useState<string>("")
  const [tpl, setTpl] = useState<TemplateDoc>({
    id: "",
    name: "",
    description: "",
    category: "",
    icon: "📝",
    questions: [newQuestion(1)],
    settings: {
      allowAnonymous: true,
      requireAuth: false,
      multipleResponses: false,
      showProgressBar: true,
      thankYouMessage: "Thank you for your valuable feedback!",
    },
  })

  // ---- Draft Logic (explicit save + explicit load) ----

  // Keep surveyId in sync with URL (?surveyId=...), or generate one if not present.
  useEffect(() => {
    const p = searchParams.get("surveyId")
    if (p) {
      setSurveyId(p)
    } else {
      // No param -> generate a fresh id for a new (unsaved) draft.
      setSurveyId((prev) => prev || generateSurveyId())
    }
  }, [searchParams])

  // Whenever surveyId changes (e.g., user clicked "Continue" in DraftsPicker),
  // try to load that draft from local storage and hydrate the builder.
  useEffect(() => {
    if (!surveyId) return
    const rec = loadDraft<TemplateDoc>(surveyId)
    if (rec?.answers) {
      setTpl(rec.answers)
    } else {
      // If nothing saved for this id, keep current (new) template structure.
      // No-op.
    }
  }, [surveyId])

  function handleSaveDraft() {
    if (!surveyId) {
      alert("No draft ID available.")
      return
    }
    saveDraft<TemplateDoc>({
      surveyId,
        title: tpl.name || "New Survey Draft",
      answers: tpl,
    })
    alert("💾 Draft saved locally")
  }

  function handleNewDraft() {
    // Start a fresh draft with a new id; do NOT save unless user clicks "Save Draft".
    const newId = generateSurveyId()
    setSurveyId(newId)
    setTpl({
      id: "",
      name: "",
      description: "",
      category: "",
      icon: "📝",
      questions: [newQuestion(1)],
      settings: {
        allowAnonymous: true,
        requireAuth: false,
        multipleResponses: false,
        showProgressBar: true,
        thankYouMessage: "Thank you for your valuable feedback!",
      },
    })
    // Update URL to contain the new draft id (optional, but helps continuity)
    const url = new URL(window.location.href)
    url.searchParams.set("surveyId", newId)
    window.history.replaceState({}, "", url.toString())
  }

  // ---- Question modifiers ----
  function updateQuestion(idx: number, patch: Partial<BaseQuestion>) {
    setTpl((prev) => {
      const q = { ...prev.questions[idx], ...patch }
      const next = [...prev.questions]
      next[idx] = q
      return { ...prev, questions: next }
    })
  }
  function removeQuestion(idx: number) {
    setTpl((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }))
  }
  function addQuestion() {
    setTpl((prev) => ({ ...prev, questions: [...prev.questions, newQuestion(prev.questions.length + 1)] }))
  }

  // ---- Submit to server (saving the template) ----
  async function onSubmit() {
    try {
      setSaving(true)
      setError(null)

      if (!tpl.id.trim() || !tpl.name.trim()) {
        throw new Error("Please provide a Template ID and Name.")
      }
      if (!/^[a-z0-9-]+$/.test(tpl.id)) {
        throw new Error("Template ID must be kebab-case (lowercase letters, numbers, dashes).")
      }
      if (!tpl.questions.length) throw new Error("Add at least one question.")

      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("No authentication token found")

      const res = await fetch("/api/templates", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(tpl),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Failed to save template (${res.status})`)
      }

      alert("✅ Template saved")
      router.push("/admin/create-survey")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  if (!surveyId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Preparing builder…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="rounded-full hover:scale-[1.02] transition-transform"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-secondary" />
              Template Builder
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="rounded-full hover:scale-[1.02] transition-transform"
              onClick={handleNewDraft}
              title="Start a brand-new draft"
            >
              New Draft
            </Button>

            <Button
              variant="outline"
              className="rounded-full hover:scale-[1.02] transition-transform"
              onClick={() =>
                setTpl({
                  ...tpl,
                  questions: [newQuestion(1)],
                })
              }
              title="Reset questions (does not affect saved drafts)"
            >
              Reset
            </Button>

            <Button
              variant="secondary"
              className="rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
              onClick={handleSaveDraft}
              title="Save this draft locally"
            >
              💾 Save Draft
            </Button>

            <Button
              onClick={onSubmit}
              disabled={saving}
              className="rounded-full bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Template"}
            </Button>

           
          </div>
        </div>
      </div>

      <div className="mt-4 ml-4 mr-4">

 {/* Local drafts picker (global, no auth) */}
 <DraftsPicker />

      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Create a Survey Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Template meta */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Template Details
              </h3>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="tpl-id">Template ID (kebab-case)</Label>
                  <Input
                    id="tpl-id"
                    placeholder="customer-satisfaction"
                    value={tpl.id}
                    onChange={(e) => setTpl({ ...tpl, id: e.target.value })}
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tpl-name">Name</Label>
                  <Input
                    id="tpl-name"
                    placeholder="Customer Satisfaction Survey"
                    value={tpl.name}
                    onChange={(e) => setTpl({ ...tpl, name: e.target.value })}
                    className="rounded-full"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="tpl-desc">Description</Label>
                  <Textarea
                    id="tpl-desc"
                    placeholder="Describe this template..."
                    value={tpl.description}
                    onChange={(e) => setTpl({ ...tpl, description: e.target.value })}
                    className="min-h-24 rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tpl-cat">Category</Label>
                  <Input
                    id="tpl-cat"
                    placeholder="Business"
                    value={tpl.category}
                    onChange={(e) => setTpl({ ...tpl, category: e.target.value })}
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tpl-icon">Icon (emoji)</Label>
                  <Input
                    id="tpl-icon"
                    placeholder="👥"
                    value={tpl.icon}
                    onChange={(e) => setTpl({ ...tpl, icon: e.target.value })}
                    className="rounded-full"
                  />
                </div>
              </div>
            </section>

            {/* Settings */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Settings
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={tpl.settings.allowAnonymous ? "secondary" : "outline"}
                  className="rounded-full hover:scale-[1.02] transition-transform"
                  onClick={() =>
                    setTpl((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, allowAnonymous: !prev.settings.allowAnonymous },
                    }))
                  }
                >
                  Anonymous: {tpl.settings.allowAnonymous ? "On" : "Off"}
                </Button>

                <Button
                  type="button"
                  variant={tpl.settings.requireAuth ? "secondary" : "outline"}
                  className="rounded-full hover:scale-[1.02] transition-transform"
                  onClick={() =>
                    setTpl((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, requireAuth: !prev.settings.requireAuth },
                    }))
                  }
                >
                  Require Auth: {tpl.settings.requireAuth ? "On" : "Off"}
                </Button>

                <Button
                  type="button"
                  variant={tpl.settings.multipleResponses ? "secondary" : "outline"}
                  className="rounded-full hover:scale-[1.02] transition-transform"
                  onClick={() =>
                    setTpl((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, multipleResponses: !prev.settings.multipleResponses },
                    }))
                  }
                >
                  Multiple Responses: {tpl.settings.multipleResponses ? "On" : "Off"}
                </Button>

                <Button
                  type="button"
                  variant={tpl.settings.showProgressBar ? "secondary" : "outline"}
                  className="rounded-full hover:scale-[1.02] transition-transform"
                  onClick={() =>
                    setTpl((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, showProgressBar: !prev.settings.showProgressBar },
                    }))
                  }
                >
                  Progress Bar: {tpl.settings.showProgressBar ? "On" : "Off"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tpl-thanks">Thank You Message</Label>
                <Input
                  id="tpl-thanks"
                  value={tpl.settings.thankYouMessage}
                  onChange={(e) =>
                    setTpl((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, thankYouMessage: e.target.value },
                    }))
                  }
                  className="rounded-full"
                />
              </div>
            </section>

            {/* Questions */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Questions
                </h3>
                <Button
                  onClick={addQuestion}
                  variant="secondary"
                  className="rounded-full hover:scale-[1.03] active:scale-[0.98] transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-4">
                {tpl.questions.map((q, idx) => (
                  <Card key={q.id} className="border shadow-xs transition hover:shadow-sm">
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Question ID</Label>
                          <Input
                            value={q.id}
                            onChange={(e) => updateQuestion(idx, { id: e.target.value })}
                            placeholder="overall-satisfaction"
                            className="rounded-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={q.type}
                            onValueChange={(val: QuestionType) => {
                              if (val === "rating" || val === "scale") {
                                updateQuestion(idx, {
                                  type: val,
                                  options: { scale: 5, labels: ["1", "2", "3", "4", "5"] },
                                })
                              } else if (val === "nps") {
                                updateQuestion(idx, { type: val, options: undefined })
                              } else if (val === "checkbox" || val === "dropdown" || val === "multiple-choice") {
                                updateQuestion(idx, { type: val, options: { choices: ["Option A", "Option B"] } })
                              } else if (val === "textarea" || val === "text") {
                                updateQuestion(idx, { type: val, options: { placeholder: "" } })
                              } else {
                                updateQuestion(idx, { type: val, options: undefined })
                              }
                            }}
                          >
                            <SelectTrigger className="rounded-full">
                              <SelectValue placeholder="Choose type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rating">rating</SelectItem>
                              <SelectItem value="scale">scale</SelectItem>
                              <SelectItem value="nps">nps</SelectItem>
                              <SelectItem value="checkbox">checkbox</SelectItem>
                              <SelectItem value="multiple-choice">multiple-choice</SelectItem>
                              <SelectItem value="dropdown">dropdown</SelectItem>
                              <SelectItem value="number">number</SelectItem>
                              <SelectItem value="text">text</SelectItem>
                              <SelectItem value="textarea">textarea</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Required</Label>
                          <Button
                            type="button"
                            variant={q.required ? "secondary" : "outline"}
                            className="w-full rounded-full hover:scale-[1.02] transition-transform"
                            onClick={() => updateQuestion(idx, { required: !q.required })}
                          >
                            {q.required ? "Yes" : "No"}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Question</Label>
                        <Input
                          value={q.question}
                          onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                          placeholder="How satisfied are you with our product/service overall?"
                          className="rounded-full"
                        />
                      </div>

                      {(q.type === "rating" || q.type === "scale") && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Scale</Label>
                            <Input
                              type="number"
                              min={2}
                              value={q.options?.scale ?? 5}
                              onChange={(e) =>
                                updateQuestion(idx, {
                                  options: {
                                    ...q.options,
                                    scale: Number(e.target.value) || 5,
                                    labels:
                                      q.options?.labels &&
                                      q.options.labels.length === Number(e.target.value)
                                        ? q.options.labels
                                        : Array.from({ length: Number(e.target.value) || 5 }, (_, i) =>
                                            String(i + 1)
                                          ),
                                  },
                                })
                              }
                              className="rounded-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Labels (comma-separated)</Label>
                            <Input
                              value={(q.options?.labels ?? []).join(", ")}
                              onChange={(e) =>
                                updateQuestion(idx, {
                                  options: {
                                    ...q.options,
                                    labels: e.target.value.split(",").map((s) => s.trim()),
                                  },
                                })
                              }
                              placeholder="Very Dissatisfied, Dissatisfied, Neutral, Satisfied, Very Satisfied"
                              className="rounded-full"
                            />
                          </div>
                        </div>
                      )}

                      {(q.type === "checkbox" || q.type === "dropdown" || q.type === "multiple-choice") && (
                        <div className="space-y-2">
                          <Label>Choices (comma-separated)</Label>
                          <Input
                            value={(q.options?.choices ?? []).join(", ")}
                            onChange={(e) =>
                              updateQuestion(idx, {
                                options: {
                                  ...q.options,
                                  choices: e.target.value.split(",").map((s) => s.trim()),
                                },
                              })
                            }
                            placeholder="Option A, Option B, Option C"
                            className="rounded-full"
                          />
                        </div>
                      )}

                      {(q.type === "text" || q.type === "textarea") && (
                        <div className="space-y-2">
                          <Label>Placeholder</Label>
                          <Input
                            value={q.options?.placeholder ?? ""}
                            onChange={(e) =>
                              updateQuestion(idx, { options: { ...q.options, placeholder: e.target.value } })
                            }
                            placeholder="Your feedback helps us improve..."
                            className="rounded-full"
                          />
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => removeQuestion(idx)}
                          className="rounded-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Bottom actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="rounded-full hover:scale-[1.02] transition-transform"
              >
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                disabled={saving}
                className="rounded-full bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground mt-6">
          Local draft saving by button • Continue from DraftsPicker • No autosave on refresh
        </div>
      </div>
    </div>
  )
}
