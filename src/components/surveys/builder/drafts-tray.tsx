"use client"

import { useEffect, useState } from "react"
import { listDrafts, deleteDraft, clearAllDrafts } from "@/lib/drafts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Play } from "lucide-react"
import { useRouter } from "next/navigation"

type Row = { surveyId: string; title?: string; updatedAt: string }

export function DraftsPicker() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    setRows(listDrafts())
  }, [])

  const handleDelete = (surveyId: string) => {
    deleteDraft(surveyId)
    setRows(listDrafts())
  }

  const handleClearAll = () => {
    clearAllDrafts()
    setRows([])
  }

  if (!rows.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Continue a saved draft</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => (
          <div key={r.surveyId} className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2">
            <div className="min-w-0">
              <div className="font-medium truncate">{r.title || r.surveyId}</div>
              <div className="text-xs text-muted-foreground">
                Updated {new Date(r.updatedAt).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => router.push(`/admin/builder?surveyId=${encodeURIComponent(r.surveyId)}`)}
              >
                <Play className="h-4 w-4 mr-1" />
                Continue
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => handleDelete(r.surveyId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <div className="pt-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleClearAll}>
            Clear all drafts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
