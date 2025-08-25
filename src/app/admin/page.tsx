"use client"

import { ChartTooltip } from "@/components/ui/chart"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import ProtectedRoute from "@/components/auth/protected-route"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Globe,
  Settings,
  Download,
  Layout,
  Mail,
  MessageSquare,
} from "lucide-react"
import { LineChart, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts"
import Link from "next/link"
import type { SurveyResponse, ContactMessage, ResponseValue } from "@/lib/db-models"
import type { LucideIcon } from "lucide-react"

interface Survey {
  id: string
  title: string
  description: string
  status: "draft" | "published" | "closed"
  responses: number
  createdAt: string
  lastModified: string
}

interface DashboardStats {
  totalSurveys: number
  totalResponses: number
  activeSurveys: number
  avgResponseRate: number
}

function AdminDashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [stats] = useState<DashboardStats>({ totalSurveys: 0, totalResponses: 0, activeSurveys: 0, avgResponseRate: 0 })
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const fetchSurveys = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/admin/surveys", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSurveys(data.surveys)
      } else {
        console.error("Failed to fetch surveys")
      }
    } catch (error) {
      console.error("Error fetching surveys:", error)
    }
  }

  const fetchResponses = async () => {
    setLoadingResponses(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const allResponses: SurveyResponse[] = []

      for (const survey of surveys) {
        try {
          const response = await fetch(`/api/surveys/${survey.id}/responses`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            allResponses.push(...data.responses)
          }
        } catch (error) {
          console.error(`Error fetching responses for survey ${survey.id}:`, error)
        }
      }

      setResponses(allResponses)
    } catch (error) {
      console.error("Error fetching responses:", error)
    } finally {
      setLoadingResponses(false)
    }
  }

  const fetchContactMessages = async () => {
    setLoadingMessages(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch("/api/admin/contact-messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setContactMessages(data.messages)
      } else {
        console.error("Failed to fetch contact messages")
      }
    } catch (error) {
      console.error("Error fetching contact messages:", error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setContactMessages((prev) => prev.filter((msg) => msg._id !== messageId))
      } else {
        console.error("Failed to delete contact message")
      }
    } catch (error) {
      console.error("Error deleting contact message:", error)
    }
  }

  const handleDuplicateSurvey = (survey: Survey) => {
    console.log("Duplicate survey:", survey)
    // Implement duplication logic here
  }

  const handleDeleteSurvey = (surveyId: string) => {
    console.log("Delete survey with ID:", surveyId)
    // Implement deletion logic here
  }

  const fetchResponsesCallback = useCallback(fetchResponses, [surveys])

  useEffect(() => {
    fetchSurveys()
    fetchContactMessages()
  }, [])

  useEffect(() => {
    if (surveys.length > 0) {
      fetchResponsesCallback()
    }
  }, [surveys, fetchResponsesCallback])

  const getStatusBadge = (status: Survey["status"]) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "closed":
        return <Badge variant="outline">Closed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
  }: { title: string; value: string | number; icon: LucideIcon; trend?: string }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-secondary" />
        </div>
      </CardContent>
    </Card>
  )

  const getSurveyTitle = (surveyId: string) => {
    const survey = surveys.find((s) => s.id === surveyId)
    return survey?.title || "Unknown Survey"
  }

  const getResponsePreview = (responseData: { [key: string]: ResponseValue }) => {
    const entries = Object.entries(responseData)
    if (entries.length === 0) return "No responses"

    const firstResponse = entries[0][1]
    if (typeof firstResponse === "string") {
      return firstResponse.length > 50 ? `${firstResponse.substring(0, 50)}...` : firstResponse
    }
    return `${entries.length} questions answered`
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/templates">
                <Button variant="outline" size="sm">
                  <Layout className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Link href="/create-survey">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Survey
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-[500px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="surveys">Surveys</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Surveys" value={stats.totalSurveys} icon={FileText} trend="+2 this month" />
                <StatCard
                  title="Total Responses"
                  value={stats.totalResponses.toLocaleString()}
                  icon={Users}
                  trend="+12% from last month"
                />
                <StatCard title="Active Surveys" value={stats.activeSurveys} icon={Globe} />
                <StatCard
                  title="Avg Response Rate"
                  value={`${stats.avgResponseRate}%`}
                  icon={BarChart3}
                  trend="+5.2% from last month"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Link href="/create-survey">
                      <Button variant="outline" className="w-full h-20 flex-col gap-2 bg-transparent">
                        <Plus className="h-6 w-6" />
                        <span>Create Survey</span>
                        <span className="text-xs text-muted-foreground">Templates or from scratch</span>
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2 bg-transparent">
                      <BarChart3 className="h-6 w-6" />
                      <span>View Analytics</span>
                      <span className="text-xs text-muted-foreground">Analyze responses</span>
                    </Button>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2 bg-transparent">
                      <Settings className="h-6 w-4" />
                      <span>Settings</span>
                      <span className="text-xs text-muted-foreground">Configure platform</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-secondary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New response received</p>
                          <p className="text-xs text-muted-foreground">Customer Satisfaction Survey • 2 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Survey published</p>
                          <p className="text-xs text-muted-foreground">Product Feedback Form • 1 hour ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Survey created</p>
                          <p className="text-xs text-muted-foreground">Employee Engagement Survey • 3 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-secondary" />
                      Top Performing Surveys
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {surveys
                        .filter((s) => s.status === "published")
                        .sort((a, b) => b.responses - a.responses)
                        .slice(0, 3)
                        .map((survey) => (
                          <div key={survey.id} className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{survey.title}</p>
                              <p className="text-sm text-muted-foreground">{survey.description}</p>
                            </div>
                            <Badge variant="outline">{survey.responses}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="surveys" className="space-y-6">
              {/* Search and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search surveys..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/create-survey">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Survey
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Surveys Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Survey</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Responses</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {surveys.map((survey) => (
                        <TableRow key={survey.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{survey.title}</p>
                              <p className="text-sm text-muted-foreground">{survey.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(survey.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {survey.responses}
                            </div>
                          </TableCell>
                          <TableCell>{survey.createdAt}</TableCell>
                          <TableCell>{survey.lastModified}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateSurvey(survey)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  Analytics
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem 
                                      onSelect={(e: Event) => e.preventDefault()}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Survey</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete &quot;{survey.title}&quot;? This action cannot be undone
                                        and will permanently delete all associated responses.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteSurvey(survey.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="responses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Responses</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={fetchResponses} disabled={loadingResponses}>
                        {loadingResponses ? "Loading..." : "Refresh"}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingResponses ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading responses...</p>
                    </div>
                  ) : responses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No responses found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {responses
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 10)
                        .map((response) => (
                          <div
                            key={response._id?.toString() || response.surveyId.toString()}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{getSurveyTitle(response.surveyId.toString())}</p>
                              <p className="text-sm text-muted-foreground">
                                {response.respondentInfo?.email || "Anonymous response"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getResponsePreview(response.responses)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {new Date(response.createdAt).toLocaleDateString()} at{" "}
                                {new Date(response.createdAt).toLocaleTimeString()}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Link href={`/admin/analytics/${response.surveyId}`}>
                                  <Button variant="ghost" size="sm">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Analytics
                                  </Button>
                                </Link>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Responses by Survey</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {surveys.map((survey) => {
                      const surveyResponses = responses.filter((r) => r.surveyId.toString() === survey.id)
                      return (
                        <div key={survey.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{survey.title}</p>
                            <p className="text-sm text-muted-foreground">{survey.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{surveyResponses.length}</p>
                            <p className="text-sm text-muted-foreground">responses</p>
                            <Link href={`/admin/analytics/${survey.id}`}>
                              <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Analytics
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      Contact Messages
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={fetchContactMessages} disabled={loadingMessages}>
                        {loadingMessages ? "Loading..." : "Refresh"}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingMessages ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading contact messages...</p>
                    </div>
                  ) : contactMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No contact messages found</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Messages submitted through the contact form will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contactMessages
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((message) => (
                          <div key={message._id?.toString() || message.email} className="border rounded-lg p-6 bg-card">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{message.subject}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {new Date(message.createdAt).toLocaleDateString()}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    {message.email}
                                  </span>
                                  <span>{message.name}</span>
                                  {message.company && <span>• {message.company}</span>}
                                </div>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Contact Message</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this contact message from {message.name}? This
                                      action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => message._id ? handleDeleteMessage(message._id.toString()) : undefined}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete Message
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            <div className="bg-muted/50 rounded-md p-4">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                              <div className="text-xs text-muted-foreground">
                                Submitted on {new Date(message.createdAt).toLocaleDateString()} at{" "}
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <a href={`mailto:${message.email}?subject=Re: ${message.subject}`}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Reply
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Response Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{ responses: { label: "Responses", color: "hsl(var(--chart-1))" } }}
                      className="h-64"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { date: "Jan 1", responses: 12 },
                            { date: "Jan 2", responses: 19 },
                            { date: "Jan 3", responses: 8 },
                            { date: "Jan 4", responses: 23 },
                            { date: "Jan 5", responses: 31 },
                            { date: "Jan 6", responses: 18 },
                            { date: "Jan 7", responses: 27 },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="responses" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Survey Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{ performance: { label: "Performance", color: "hsl(var(--chart-2))" } }}
                      className="h-64"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { survey: "Customer Satisfaction", responses: 247 },
                            { survey: "Product Feedback", responses: 89 },
                            { survey: "Market Research", responses: 156 },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="survey" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="responses" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default AdminDashboard
