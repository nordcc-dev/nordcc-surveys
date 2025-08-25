"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProtectedRoute from "@/components/auth/protected-route"
import { Plus, Search, FileText, Users, Clock, ArrowRight, Layout, Copy, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Question } from "@/lib/db-models"

interface Template {
  id: string
  title: string
  description: string
  category: string
  estimatedTime: string
  questionCount: number
  tags: string[]
  questions: Question
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

function CreateSurveyPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch templates
        const templatesResponse = await fetch("/api/templates")
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json()
          setTemplates(templatesData)
        }

        // Fetch existing surveys
        const surveysResponse = await fetch("/api/surveys")
        if (surveysResponse.ok) {
          const surveysData = await surveysResponse.json()
          setSurveys(surveysData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      const response = await fetch("/api/surveys/from-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ templateId }),
      })

      if (response.ok) {
        const survey = await response.json()
        router.push(`/survey/${survey.id}`)
      }
    } catch (error) {
      console.error("Error creating survey from template:", error)
    }
  }

  const handleDuplicateSurvey = async (surveyId: string) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}/duplicate`, {
        method: "POST",
      })

      if (response.ok) {
        const survey = await response.json()
        router.push(`/survey/${survey.id}`)
      }
    } catch (error) {
      console.error("Error duplicating survey:", error)
    }
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredSurveys = surveys.filter(
    (survey) =>
      survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const categories = ["all", ...Array.from(new Set(templates.map((t) => t.category)))]

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading survey options...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  ← Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-primary">Create New Survey</h1>
            </div>
            <Button onClick={() => router.push("/builder")} className="bg-primary hover:bg-primary/90">
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
                placeholder="Search templates and surveys..."
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
                  <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {template.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
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

                      <Button
                        onClick={() => handleCreateFromTemplate(template.id)}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Use This Template
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
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
