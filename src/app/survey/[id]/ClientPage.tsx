"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Star, ChevronLeft, ChevronRight, AlertCircle, Send } from "lucide-react"
import { useParams } from "next/navigation"
import type { Question, SurveySettings, ResponseValue } from "@/lib/db-models"
import { useRouter } from "next/navigation"   // ✅ import router
import Image from "next/image"
interface Survey {
  id: string
  title: string
  description: string
  questions: Question[]
  settings?: SurveySettings
}

interface Response {
  questionId: string
  value: ResponseValue
}

export default function TakeSurvey() {
  const params = useParams()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Response[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [started, setStarted] = useState(false)

  const fetchSurvey = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // First try to fetch from database
      const response = await fetch(`/api/surveys/${params.id}`)

      if (response.ok) {
        const data = await response.json()
        if (data.survey) {
          setSurvey(data.survey)
          return
        }
      }

      // If not found in database, check if it's a template-based survey
      if (response.status === 404) {
        // Try to fetch as template
        const templateResponse = await fetch(`/api/templates/${params.id}`)

        if (templateResponse.ok) {
          const templateData = await templateResponse.json()
          if (templateData.success) {
            // Convert template to survey format
            const templateSurvey: Survey = {
              id: templateData.template.id,
              title: templateData.template.name,
              description: templateData.template.description,
              questions: templateData.template.questions,
              settings: templateData.template.settings,
            }
            setSurvey(templateSurvey)
            return
          }
        }
      }

      // If neither worked, show error
      setError("Survey not found")
    } catch (err) {
      console.error("Error fetching survey:", err)
      setError("Failed to load survey")
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchSurvey()
  }, [fetchSurvey])

  const currentQuestion = survey?.questions[currentQuestionIndex]
  const progress = survey ? ((currentQuestionIndex + 1) / survey.questions.length) * 100 : 0

  const getResponse = (questionId: string) => {
    return responses.find((r) => r.questionId === questionId)?.value || ""
  }

  const updateResponse = (questionId: string, value: ResponseValue) => {
    setResponses((prev) => {
      const existing = prev.find((r) => r.questionId === questionId)
      if (existing) {
        return prev.map((r) => (r.questionId === questionId ? { ...r, value } : r))
      }
      return [...prev, { questionId, value }]
    })
    // Clear error when user provides input
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  const validateCurrentQuestion = () => {
    const question = currentQuestion
    const response = getResponse(question?.id || "")

    if (question?.required && (!response || (Array.isArray(response) && response.length === 0))) {
      setErrors((prev) => ({
        ...prev,
        [question.id]: "This question is required",
      }))
      return false
    }

    if (question?.type === "email" && response) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(response as string)) {
        setErrors((prev) => ({
          ...prev,
          [question.id]: "Please enter a valid email address",
        }))
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateCurrentQuestion()) {
      if (currentQuestionIndex < (survey?.questions.length || 0) - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentQuestion()) return

    setIsSubmitting(true)
    try {
      const responseData: Record<string, ResponseValue> = {}
      responses.forEach((response) => {
        responseData[response.questionId] = response.value
      })

      const response = await fetch(`/api/surveys/${params.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: responseData,
          startTime: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        alert("✅ Thank you! Your survey was submitted successfully.") // ✅ popup
        router.push("/completed") // ✅ redirect
      } else {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        throw new Error(errorData.error || "Failed to submit survey")
      }
    } catch (error) {
      console.error("Failed to submit survey:", error)
      alert("Failed to submit survey. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question: Question) => {
    const response = getResponse(question.id)
    const error = errors[question.id]

    // Handle both template and database question structures
    type ChoicesObject = { choices: string[] };

    function isChoicesObject(v: unknown): v is ChoicesObject {
      return !!v
        && typeof v === "object"
        && "choices" in (v as Record<string, unknown>)
        && Array.isArray((v as Record<string, unknown>).choices);
    }

    const opts: unknown = question.options;

    const questionOptions: string[] =
      Array.isArray(opts)
        ? opts
        : isChoicesObject(opts)
          ? opts.choices
          : [];


    switch (question.type) {
      case "text":
      case "email":
        return (
          <div className="space-y-2">
            <Input
              type={question.type === "email" ? "email" : "text"}
              value={response as string}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              placeholder={question.type === "email" ? "your@email.com" : "Your answer"}
              className={error ? "border-destructive" : ""}
              maxLength={150}
            />
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )

      case "textarea":
        return (
          <div className="space-y-2">
            <Textarea
              value={response as string}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              placeholder="Your answer"
              rows={4}
              className={error ? "border-destructive" : ""}
              maxLength={700}
            />
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )

      case "multiple-choice":
        return (
          <div className="space-y-3">
            <RadioGroup value={response as string} onValueChange={(value) => updateResponse(question.id, value)}>
              {questionOptions.map((option: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                  <Label htmlFor={`${question.id}-${idx}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )

      case "checkbox":
        return (
          <div className="space-y-3">
            {questionOptions.map((option: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${idx}`}
                  checked={(response as string[])?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = (response as string[]) || []
                    if (checked) {
                      updateResponse(question.id, [...currentValues, option])
                    } else {
                      updateResponse(
                        question.id,
                        currentValues.filter((v) => v !== option),
                      )
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${idx}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )

      case "rating":
        const scale = question.settings?.scale || 5
        const labels = question.settings?.labels || []
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              {Array.from({ length: scale }, (_, i) => i + 1).map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => updateResponse(question.id, rating)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Star
                    className={`h-8 w-8 ${(response as number) >= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                      }`}
                  />
                </button>
              ))}
            </div>
            {labels.length >= 2 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{labels[0]}</span>
                <span>{labels[labels.length - 1]}</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )

        case "scale": {
          const min = question.settings?.min ?? 1
          const max = question.settings?.max ?? 10
          const scaleLabels = question.settings?.labels ?? []
          const minLabel = scaleLabels[0] || "Low"
          const maxLabel = scaleLabels[scaleLabels.length - 1] || "High"
          const values = Array.from({ length: max - min + 1 }, (_, i) => min + i)
        
          return (
            <div className="space-y-3">
              {/* Mobile: wraps automatically; Desktop: fixed columns */}
              <div
                className={`
                  grid gap-2
                  [grid-template-columns:repeat(auto-fit,minmax(2.75rem,1fr))]
                  sm:[grid-template-columns:repeat(${values.length},minmax(0,1fr))]
                `}
              >
                {values.map((score) => {
                  const active = (response as number) === score
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => updateResponse(question.id, score)}
                      aria-pressed={active}
                      className={[
                        "w-full p-3 rounded-lg border text-sm font-medium transition-colors",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted border-border"
                      ].join(" ")}
                    >
                      {score}
                    </button>
                  )
                })}
              </div>
        
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground px-0.5">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
              </div>
        
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          )
        }
        

        case "nps": {
          const values = Array.from({ length: 11 }, (_, i) => i)
        
          return (
            <div className="space-y-3">
              {/* Mobile: wraps automatically; >=sm: 11 equal-width columns */}
              <div
                className={`
                  grid gap-2
                  [grid-template-columns:repeat(auto-fit,minmax(2.75rem,1fr))]
                  sm:[grid-template-columns:repeat(${values.length},minmax(0,1fr))]
                `}
              >
                {values.map((score) => {
                  const active = (response as number) === score
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => updateResponse(question.id, score)}
                      aria-pressed={active}
                      className={[
                        "w-full p-3 rounded-lg border text-sm font-medium transition-colors",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted border-border",
                      ].join(" ")}
                    >
                      {score}
                    </button>
                  )
                })}
              </div>
        
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground px-0.5">
                <span>Not at all likely</span>
                <span>Extremely likely</span>
              </div>
        
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          )
        }
        
        case "dropdown":
          return (
            <div className="space-y-2">
              <select
                className={`w-full rounded-md border px-3 py-2 bg-background ${error ? "border-destructive" : "border-input"}`}
                value={(response as string) ?? ""}
                onChange={(e) => updateResponse(question.id, e.target.value)}
              >
                <option value="" disabled>
                  Select an option…
                </option>
                {questionOptions.map((option: string, idx: number) => (
                  <option key={idx} value={option}>
                    {option}
                  </option>
                ))}
              </select>
        
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          )
        
        case "number":
          return (
            <div className="space-y-2">
              <Input
                type="number"
                value={typeof response === "number" ? response : (response as string) ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  // empty → allow clearing; otherwise parse to number
                  updateResponse(question.id, val === "" ? "" : Number(val))
                }}
                min={question.settings?.min}
                max={question.settings?.max}
                step={question.settings?.step ?? 1}
                className={error ? "border-destructive" : ""}
                placeholder="Enter a number"
              />
        
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          )
        

      default:
        return <div>Unsupported question type: {question.type}</div>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading survey...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Survey Not Found</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading survey...</p>
        </div>
      </div>
    )
  }


  function SurveyFooter() {
    return (
      <footer className="border-t bg-card/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <Image
              src="/media/logo.jpg"
              alt="Survey logo"
              width={96}
              height={96}
              className="h-10 w-auto object-contain"
            />
            
          </div>
        </div>
      </footer>
    )
  }
  return (
    <div className="min-h-screen bg-background flex flex-col bg-white">
      {/* Header (no logo) */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-black mb-2">
              {survey.title}
            </h1>
            <p className="text-muted-foreground mb-4">{survey.description}</p>
            {survey.settings?.showProgressBar !== false && (
              <div className="flex items-center justify-center gap-4">
                <Progress value={progress} className="w-64" />
                <span className="text-sm text-muted-foreground">
                  {currentQuestionIndex + 1} of {survey.questions.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content (stays centered) */}
<main className="flex-1">
  {!started ? (
    // ---------- Landing / Welcome section ----------
    <div className="max-w-2xl mx-auto p-6 mt-25">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold">Welcome</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground text-center">
            Your input will help us shape and improve NORDCC&apos;s upcoming events, it only
            takes a few minutes to complete.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="rounded-full font-bold" onClick={() => setStarted(true)}>
              Start Survey
            </Button>
          </div>
          
        </CardContent>
      </Card>
    </div>
  ) : loading ? (
    // ---------- Loading state after Start ----------
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading survey…</p>
      </div>
    </div>
  ) : (
    // ---------- Survey section ----------
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-8">
                {currentQuestion?.title}
                {currentQuestion?.required && (
                  <Badge variant="secondary" className="ml-2 text-xs rounded-full">
                    Required
                  </Badge>
                )}
              </CardTitle>
              {currentQuestion?.question && (
                <p className="text-black font-bold text-xl">{currentQuestion.question}</p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-8">{currentQuestion && renderQuestion(currentQuestion)}</div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="rounded-full bg-white"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentQuestionIndex === (survey?.questions.length || 0) - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Survey
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 text-white rounded-full"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )}
</main>


      {/* Footer with centered logo */}
      <SurveyFooter />
    </div>
  )
}
