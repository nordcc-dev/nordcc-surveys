"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, Calendar, Users, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { getCSRFToken } from "@/lib/CSFRToken"
// shadcn Confirm dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Survey {
  _id: string
  title: string
  description: string
  status: "draft" | "published" | "closed"
  createdAt: string
  updatedAt: string
  responseCount: number
  isTemplate?: boolean
  templateId?: string
  name: string
}

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSurveys()
  }, [])

  const fetchSurveys = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      const response = await fetch("/api/surveys", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          credentials: "include",
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch surveys: ${response.status}`)
      }

      const data = await response.json()
      setSurveys(data.surveys || [])
    } catch (error) {
      console.error("Failed to fetch surveys:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch surveys")
    } finally {
      setLoading(false)
    }
  }

  const deleteSurvey = async (surveyId: string) => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      toast({ title: "Not authorized", description: "Missing auth token.", variant: "destructive" })
      return
    }
    try {
      setDeletingId(surveyId)

      // Optimistic remove
      setSurveys((prev) => prev.filter((s) => s._id !== surveyId))
      const csrf = getCSRFToken()
      const res = await fetch(`/api/surveys/${surveyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf || "",
        },
      })

      if (!res.ok) {
        // Revert on failure
        await fetchSurveys()
        const msg = `Delete failed: ${res.status}`
        toast({ title: "Delete failed", description: msg, variant: "destructive" })
        return
      }

      toast({ title: "Survey deleted", description: "The survey was removed successfully." })
    } catch (e) {
      await fetchSurveys()
      console.error(e)
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Survey URL copied to clipboard",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: "Copy failed",
        description: "Could not copy URL to clipboard",
        variant: "destructive",
      })
    }
  }

  const getSurveyUrl = (surveyId: string) => {
    return `${window.location.origin}/survey/${surveyId}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 border-green-200 rounded-full"
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "closed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading surveys...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="rounded-full mb-4">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Survey Management</h1>
          <p className="text-gray-600">View and manage all surveys in your database</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">{error}</p>
              <Button onClick={fetchSurveys} variant="outline" className="mt-4 bg-transparent">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {surveys.length === 0 && !error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No surveys found in the database</p>
                <Button onClick={fetchSurveys} variant="outline">
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {surveys.map((survey) => (
              <Card key={survey._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{survey.name}</CardTitle>
                      <CardDescription className="text-base">
                        {survey.description || "No description provided"}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(survey.status)}>{survey.status}</Badge>

                      {/* Delete with confirm */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="shrink-0"
                            disabled={deletingId === survey._id}
                            aria-label="Delete survey"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this survey?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete “{survey.name}” and its survey
                              entry from your database. Responses linked to this survey will no longer be accessible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => deleteSurvey(survey._id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {new Date(survey.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Responses: {survey.responseCount}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">ID:</span> {survey._id}
                    </div>
                    {survey.templateId && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Template:</span> {survey.templateId}
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">Survey URL:</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <code className="flex-1 text-sm text-gray-800 break-all">{getSurveyUrl(survey._id)}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(getSurveyUrl(survey._id))}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(getSurveyUrl(survey._id), "_blank")}
                        className="shrink-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button onClick={fetchSurveys} variant="outline">
            Refresh Surveys
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  )
}
