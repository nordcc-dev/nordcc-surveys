"use client"


import ProtectedRoute from "@/components/auth/protected-route"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RecentActivityCard } from "@/components/admin/recent-activity-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
 
  Trash2,

  BarChart3,

 

  Download,
 
  Mail,
  MessageSquare,
  Book
} from "lucide-react"

import Link from "next/link"
import type { SurveyResponse, ContactMessage } from "@/lib/db-models"


interface Survey {
  id: string
  title: string
  description: string
  status: "draft" | "published" | "closed"
  responses: number
  createdAt: string
  lastModified: string
}



function AdminDashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([])

  
  const [, setResponses] = useState<SurveyResponse[]>([])
  const [, setLoadingResponses] = useState(false)
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const fetchSurveys = async () => {
    try {
      

      const response = await fetch("/api/admin/surveys", {
        method: "GET",
        credentials: "include", // ✅ send cookies like `auth_token`
        headers: {
          "Content-Type": "application/json",
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
        credentials: "include",
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



 
  



  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-white">
        {/* Header */}

        <header className="border-b bg-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 sm:py-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-primary">
                Admin Dashboard
              </h1>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
            
             
              <Link href="/admin/create-survey">
                <Button
                  size="sm"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Survey
                </Button>
              </Link>
            </div>
          </div>
        </header>


        <div className="p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[500px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              

              <TabsTrigger value="messages">Messages</TabsTrigger>

            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              

              <Card className="text-black">
                <CardHeader>
                  <CardTitle className="text-xl">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Link href="/admin/create-survey">
                      <Button variant="outline" className="w-full h-20 flex-col gap-2 bg-transparent">
                        <Plus className="h-8 w-8" />
                        <span className="text-2xl">Create Survey</span>
                    
                      </Button>
                    </Link>
                    <Link href="/admin/analytics">
                      <Button variant="default" className="w-full h-20 flex-col gap-2 bg-transparent">
                        <BarChart3 className="h-6 w-6" />
                        <span className="text-2xl">View Analytics</span>
                     
                      </Button>
                    </Link>
                    <Link href="/admin/surveys">
                      <Button variant="default" className="w-full h-20 flex-col gap-2 bg-transparent">
                        <Book className="h-6 w-4" />
                        <span className="text-2xl">View Surveys</span>
                    
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <RecentActivityCard />
            </TabsContent>





            <TabsContent value="messages" className="space-y-6 bg-white">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-2xl">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-8 w-8 text-blue-600" />
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
                    <div className="space-y-4 text-black">
                      {contactMessages
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((message) => (
                          <div
                            key={message._id?.toString() || message.email}
                            className="border rounded-lg p-4 sm:p-6 bg-card"
                          >
                            {/* Header: subject + date + action */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mb-2">
                                  <h3 className="font-semibold text-lg leading-tight break-words">
                                    {message.subject}
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className="mt-1 sm:mt-0 text-xs rounded-full w-fit text-black"
                                  >
                                    {new Date(message.createdAt).toLocaleDateString()}
                                  </Badge>
                                </div>

                                {/* Meta row: wraps on small screens */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:text-base text-muted-foreground mb-1">
                                  <span className="flex items-center gap-1 min-w-0 break-words">
                                    <Mail className="h-4 w-4 shrink-0" />
                                    <span className="break-all">{message.email}</span>
                                  </span>
                                  <span className="min-w-0 break-words">{message.name}</span>
                                  {message.company && (
                                    <span className="min-w-0 break-words">• {message.company}</span>
                                  )}
                                </div>
                              </div>

                              {/* Action (delete) stays reachable on mobile */}
                              <div className="self-end sm:self-auto">
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
                                        Are you sure you want to delete this contact message from {message.name}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          message._id ? handleDeleteMessage(message._id.toString()) : undefined
                                        }
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete Message
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>

                            {/* Message body */}
                            <div className="bg-muted/50 rounded-md p-3 sm:p-4">
                              <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words">
                                {message.message}
                              </p>
                            </div>

                            {/* Footer: submitted meta */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-4 border-t">
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                Submitted on {new Date(message.createdAt).toLocaleDateString()} at{" "}
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                  )}
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default AdminDashboard
