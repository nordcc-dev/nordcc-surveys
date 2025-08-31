"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, MessageSquare, Mail } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-provider"

type RecentResponse = {
  _id: string
  surveyId?: string
  createdAt: string | Date
  respondentEmail?: string | null
  answersCount?: number | null
  surveyTitle: string
}

function timeAgo(d: string | Date) {
  const t = new Date(d).getTime()
  const diff = Date.now() - t
  const s = Math.max(1, Math.floor(diff / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function RecentActivityCard() {
  const { token, user } = useAuth() as { token?: string; user?: { role?: string } }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<RecentResponse[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        // If no token or not admin, fail fast (optional UX)
        
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      

        const res = await fetch("/api/responses/recent", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error("Unauthorized")
          }
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.error || `Request failed: ${res.status}`)
        }

        const j = await res.json()
        if (mounted) setItems(Array.isArray(j.responses) ? j.responses : [])
      } catch (e: unknown) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : "Failed to load")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [token, user?.role])

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-3">
          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        </div>
      )
    }

    if (error === "Unauthorized") {
      return (
        <p className="text-sm text-muted-foreground">
          Admin access required to view recent responses.
        </p>
      )
    }

    if (error) {
      return <div className="text-sm text-red-600">{error}</div>
    }

    if (!items.length) {
      return <p className="text-sm text-muted-foreground">No recent responses yet.</p>
    }

    return (
      <div className="space-y-4">
        {items.map((r) => (
          <div key={r._id} className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
            <div className="flex-1 min-w-0">
              <p className="text-xl font-medium leading-snug">New response received</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-lg">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {r.surveyTitle}
                </span>
                <span className="text-lg">• {timeAgo(r.createdAt)}</span>
              
                {r.respondentEmail && (
                  <span className="inline-flex items-center gap-1 break-all">
                    <Mail className="h-3.5 w-3.5" />
                    {r.respondentEmail}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }, [items, loading, error])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-secondary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
