"use client"

import { useState } from "react"
import { Sparkles, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// keep your imports...
import { useRouter } from "next/navigation"



// import or inline the function from step 1
// import { handleCreateFromTemplate } from "@/lib/your-path"

type UseTemplateButtonProps = {
    templateId: string
    defaultName?: string // e.g. template.name
    className?: string
}

export function UseTemplateButton({ templateId, defaultName, className }: UseTemplateButtonProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(defaultName ?? "")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleCreateFromTemplate = async (templateId: string, surveyName: string) => {
        try {
          const token = localStorage.getItem("auth_token")
          if (!token) throw new Error("No authentication token found")
      
          const res = await fetch("/api/surveys/from-template", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ templateId, name: surveyName }), // <-- send name
          })
      
          if (!res.ok) {
            const j = await res.json().catch(() => ({}))
            throw new Error(j?.error || `Request failed: ${res.status}`)
          }
      
          alert("✅ Survey Was Created ✅")
          router.push(`/admin/surveys`)
        } catch (e) {
          console.error("Error creating survey from template:", e)
        }
      }
      

    async function onConfirm() {
        try {
            setError(null)
            if (!name.trim()) {
                setError("Please enter a survey name")
                return
            }
            setLoading(true)
            await handleCreateFromTemplate(templateId, name.trim())
            setOpen(false)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to create survey")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setError(null) }}>
            <AlertDialogTrigger asChild>
                <Button className={className}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Use This Template
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Name your survey</AlertDialogTitle>
                    <AlertDialogDescription>
                        Choose a name for this survey. You can change it later.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid gap-2">
                    <Label htmlFor="survey-name">Survey name</Label>
                    <Input
                        id="survey-name"
                        placeholder="e.g. Q4 Product Feedback"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading} className="rounded-full">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 rounded-full text-white"
                    >
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Create Survey
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
