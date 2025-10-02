"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProtectedRoute from "@/components/auth/protected-route"
import { Plus, Search, FileText, Users, Clock, ArrowRight, Layout, Copy, Database } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UseTemplateButton } from "@/components/surveys/use-template"
import { getCSRFToken } from "@/lib/CSFRToken"
interface Template {
  id: string
  title: string
  description: string
  category: string
  estimatedTime: string
  questionCount: number
  tags: string[]
  questions: unknown[]
}

interface Survey {
  id: string
  title: string
  description: string
  status: "draft" | "published" | "closed"
  responses: number
  createdAt: string
  lastModified: string
}

/** Shape coming back from /api/surveys (existing) */
type DbSurvey = {
  _id?: string
  id?: string
  name?: string
  title?: string
  description?: string
  status?: "draft" | "published" | "closed"
  responseCount?: number
  createdAt?: string
  updatedAt?: string
}

/** Shape coming back from /api/templates (NEW) */
type DbTemplate = {
  _id?: string
  id?: string
  name?: string
  title?: string
  description?: string
  category?: string
  icon?: string
  questions?: unknown[]
  settings?: Record<string, unknown>
  isTemplate?: boolean
  createdAt?: string
  updatedAt?: string
}

function CreateSurveyPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [surveys, setSurveys] = useState<Survey[]>([]) // existing “Duplicate Existing” list (from /api/surveys)
  const [createdTemplates, setCreatedTemplates] = useState<Survey[]>([]) // DB-only “Created Templates” (from /api/templates)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Create a new survey in the "surveys" collection by using a template from DB
  // was: async function useTemplateToCreateSurvey(...)


  const createSurveyFromTemplate = useCallback(
    async (dbId: string, defaultTitle?: string): Promise<void> => {
      try {
        console.log("[CreateSurvey] createSurveyFromTemplate →", { dbId, defaultTitle })
        const csrf = getCSRFToken()

        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
        const res = await fetch("/api/surveys/from-template", {
          method: "POST",
          credentials: "include",
          headers: token
            ? {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "X-CSRF-Token": csrf || "",
            }
            : { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId: dbId, title: defaultTitle }),
        })

        console.log("[CreateSurvey] /api/surveys/from-template status:", res.status)
        const payload: { success?: boolean; survey?: { _id?: string }; error?: string } =
          await res.json().catch(() => ({}))

        console.log("[CreateSurvey] /api/surveys/from-template payload:", payload)

        if (!res.ok || !payload.success || !payload.survey?._id) {
          console.error("[CreateSurvey] Failed to create survey from template:", payload.error)
          alert(payload.error ?? "Failed to create survey")
          return
        }

        alert("✅ Survey created from template")
       router.push(`/admin/surveys`)
      } catch (e) {
        console.error("[CreateSurvey] Error creating survey from template:", e)
        alert("Failed to create survey from template")
      }
    },
    [router]
  )


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // ---- Load static templates (from file) ----
        console.log("[CreateSurvey] Loading static templates from file…")
        const templatesModule = await import("@/data/survey-templates.json")
        const templatesData = templatesModule.default
        const templatesArray = templatesData.templates || templatesData

        if (!Array.isArray(templatesArray)) {
          throw new Error("Invalid templates data format")
        }

        const transformedTemplates: Template[] = templatesArray.map((template: unknown) => {
          const t = template as Record<string, unknown>
          console.log(t)
          return {
            id: String(t.id),
            title: String(t.name || t.title || "Untitled Template"),
            description: String(t.description || "No description available"),
            category: String(t.category || "General"),
            estimatedTime: String(t.estimatedTime || "5-10 min"),
            questionCount: Array.isArray(t.questions) ? t.questions.length : 0,
            tags: Array.isArray(t.tags) ? t.tags.map(String) : [String(t.category || "General")],
            questions: Array.isArray(t.questions) ? t.questions : [],
          }
        })
        

        console.log("[CreateSurvey] Static templates loaded:", transformedTemplates.length)
        setTemplates(transformedTemplates)

        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

        // ---- Load created templates (from DB via /api/templates) ----
        console.log("[CreateSurvey] Fetching /api/templates with token?", Boolean(token))
        const tplRes = await fetch("/api/templates", { method: "GET", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } })


        console.log("[CreateSurvey] /api/templates status:", tplRes.status)
        if (tplRes.ok) {
          const payload: { templates?: DbTemplate[] } = await tplRes.json().catch(() => ({ templates: [] }))
          console.log("[CreateSurvey] /api/templates payload:", payload)

          const list: DbTemplate[] = Array.isArray(payload.templates) ? payload.templates : []
          const mappedFromDb: Survey[] = list.map((t) => ({
            id: String(t._id ?? t.id ?? ""),
            title: String(t.title ?? t.name ?? "Untitled"),
            description: String(t.description ?? ""),
            status: "draft", // just a label for the card
            responses: 0,    // templates don't have responses
            createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "",
            lastModified: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : "",
          }))

          console.log("[CreateSurvey] Mapped templates from DB:", mappedFromDb.length)
          setCreatedTemplates(mappedFromDb)
        } else {
          const errText = await tplRes.text().catch(() => "")
          console.warn("[CreateSurvey] Failed to load /api/templates:", tplRes.status, errText)
          setCreatedTemplates([])
        }

        // ---- Load existing surveys (optional: for duplicate tab) ----
        console.log("[CreateSurvey] Fetching /api/surveys with token?", Boolean(token))
        const surveysResponse = await fetch("/api/surveys", {
          credentials: "include",
          headers: token
            ? {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              credentials: "include",
            }
            : { "Content-Type": "application/json", credentials: "include", },
            
        })

        console.log("[CreateSurvey] /api/surveys status:", surveysResponse.status)
        if (surveysResponse.ok) {
          const json: { surveys?: DbSurvey[] } = await surveysResponse.json().catch(() => ({ surveys: [] }))
          console.log("[CreateSurvey] /api/surveys payload:", json)

          const list: DbSurvey[] = Array.isArray(json?.surveys) ? json.surveys : []
          const mapped: Survey[] = list.map((s) => ({
            id: String(s._id ?? s.id ?? ""),
            title: String(s.title ?? s.name ?? "Untitled"),
            description: String(s.description ?? ""),
            status: s.status ?? "draft",
            responses: s.responseCount ?? 0,
            createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "",
            lastModified: s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "",
          }))

          console.log("[CreateSurvey] Mapped surveys from DB:", mapped.length)
          setSurveys(mapped)
        } else {
          setSurveys([])
        }
      } catch (error) {
        console.error("[CreateSurvey] Error loading data:", error)
        setTemplates([])
        setSurveys([])
        setCreatedTemplates([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDuplicateSurvey = async (surveyId: string) => {
    try {
      console.log("[CreateSurvey] Duplicating survey:", surveyId)
      const response = await fetch(`/api/surveys/${surveyId}/duplicate`, { method: "POST" })
      console.log("[CreateSurvey] Duplicate response status:", response.status)
      if (response.ok) {
        const survey = await response.json()
        console.log("[CreateSurvey] Duplicate response payload:", survey)
        router.push(`/survey/${survey.id}`)
      } else {
        const j = await response.json().catch(() => ({}))
        console.error("[CreateSurvey] Duplicate failed:", j)
      }
    } catch (error) {
      console.error("[CreateSurvey] Error duplicating survey:", error)
    }
  }

  const filteredTemplates = templates.filter((template) => {
    const title = template.title || ""
    const description = template.description || ""
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredSurveys = surveys.filter(
    (survey) =>
      (survey.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (survey.description || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredCreatedTemplates = createdTemplates.filter(
    (survey) =>
      (survey.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (survey.description || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const categories = ["all", ...Array.from(new Set(templates.map((t) => t.category)))]

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading survey options…</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  console.log("[CreateSurvey] Render — counts:", {
    staticTemplates: filteredTemplates.length,
    createdTemplates: filteredCreatedTemplates.length,
    duplicateExisting: filteredSurveys.length,
  })

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="rounded-full">
                  ← Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-primary">Create New Survey</h1>
            </div>
            <Button
              onClick={() => router.push("/admin/builder")}
              className="bg-primary hover:bg-primary/50 text-white rounded-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start from Scratch
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates and surveys…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* NEW: Created Templates (from DB) */}
          <section className="space-y-4 mb-10">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-secondary" />
              <h2 className="text-xl font-semibold">Created Templates (from DB)</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCreatedTemplates.map((survey) => (
                <Card key={survey.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {survey.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {survey.description || "No description provided"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2 rounded-full">
                        Template
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {survey.createdAt}
                      </div>
                    </div>

                    <div className="">

                      <Button
                        onClick={async () => {
                          console.log("[CreateSurvey] Use template clicked:", survey.id)
                          await createSurveyFromTemplate(survey.id, survey.title)
                        }}
                        className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-bold text-lg"
                      >
                        
                        Use
                      </Button>

                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCreatedTemplates.length === 0 && (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">
                  No created templates found in the database.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check the console for logs from <code>/api/templates</code> and mapping steps.
                </p>
              </div>
            )}
          </section>

          {/* Existing Tabs */}
          <Tabs defaultValue="templates" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Templates ({filteredTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="existing" className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Duplicate Existing ({filteredSurveys.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {template.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2 rounded-full">
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 flex flex-col flex-1">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {template.questionCount} questions
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {template.estimatedTime}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.tags.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <UseTemplateButton
                        templateId={template.id}
                        defaultName={template.title}
                        className="w-full bg-primary hover:bg-primary/90 mt-auto rounded-full text-white"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No templates found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="existing" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSurveys.map((survey) => (
                  <Card key={survey.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {survey.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{survey.description}</p>
                        </div>
                        <Badge variant={survey.status === "published" ? "default" : "secondary"} className="ml-2">
                          {survey.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {survey.responses} responses
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {survey.createdAt}
                        </div>
                      </div>

                      <Button onClick={() => handleDuplicateSurvey(survey.id)} variant="outline" className="w-full">
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate Survey
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredSurveys.length === 0 && (
                <div className="text-center py-12">
                  <Copy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No existing surveys found</h3>
                  <p className="text-muted-foreground">Create your first survey or try adjusting your search.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default CreateSurveyPage
