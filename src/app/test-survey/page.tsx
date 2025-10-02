"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ResponseValue } from "@/lib/db-models"
import { getCSRFToken } from "@/components/surveys/use-template"
interface Question {
  id: string
  type: string
  question: string
  required: boolean
  options?: string[]
  scale?: number
  labels?: { [key: string]: string }
  placeholder?: string
}

interface Survey {
  id: string
  title: string
  description: string
  questions: Question[]
  settings: {
    allowAnonymous: boolean
    requireEmail: boolean
    showProgressBar: boolean
    allowMultipleSubmissions: boolean
  }
}

export default function TestSurveyPage() {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<{ [key: string]: ResponseValue }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const router = useRouter()

  useEffect(() => {
    // Load the test survey from the JSON file
    fetch("/api/test-survey")
      .then((res) => res.json())
      .then((data) => setSurvey(data))
      .catch((err) => console.error("Failed to load survey:", err))
  }, [])

  const handleResponse = (questionId: string, value: ResponseValue) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))
    // Clear error when user provides input
    if (errors[questionId]) {
      setErrors((prev) => ({
        ...prev,
        [questionId]: "",
      }))
    }
  }

  const validateCurrentQuestion = () => {
    if (!survey) return true

    const question = survey.questions[currentQuestion]
    if (!question.required) return true

    const response = responses[question.id]

    if (!response || (Array.isArray(response) && response.length === 0) || response === "") {
      setErrors((prev) => ({
        ...prev,
        [question.id]: "This question is required",
      }))
      return false
    }

    return true
  }

  const nextQuestion = () => {
    if (!validateCurrentQuestion()) return

    if (survey && currentQuestion < survey.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const submitSurvey = async () => {
    if (!validateCurrentQuestion()) return

    setIsSubmitting(true)
    const csrf = getCSRFToken()

    try {
      const response = await fetch("/api/test-survey/responses", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json", "X-CSRF-Token": csrf || "",
        },
        body: JSON.stringify({
          surveyId: "test-survey",
          responses: responses,
          submittedAt: new Date().toISOString(),
          ipAddress: "anonymous", // In a real app, you'd get this from the request
        }),
      })

      if (response.ok) {
        setIsCompleted(true)
      } else {
        throw new Error("Failed to submit survey")
      }
    } catch (error) {
      console.error("Error submitting survey:", error)
      alert("Failed to submit survey. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question: Question) => {
    const response = responses[question.id]
    const error = errors[question.id]

    switch (question.type) {
      case "text":
        return (
          <div className="space-y-2">
            <Input
              value={typeof response === "string" ? response : ""}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              placeholder={question.placeholder}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case "long_text":
        return (
          <div className="space-y-2">
            <Textarea
              value={typeof response === "string" ? response : ""}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              placeholder={question.placeholder}
              rows={4}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case "multiple_choice":
        return (
          <div className="space-y-2">
            <RadioGroup
              value={typeof response === "string" ? response : ""}
              onValueChange={(value) => handleResponse(question.id, value)}
            >
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case "checkbox":
        return (
          <div className="space-y-2">
            <div className="space-y-3">
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${index}`}
                    checked={Array.isArray(response) && response.includes(option)}
                    onCheckedChange={(checked) => {
                      const currentResponses = Array.isArray(response) ? response : []
                      if (checked) {
                        handleResponse(question.id, [...currentResponses, option])
                      } else {
                        handleResponse(
                          question.id,
                          currentResponses.filter((r: string) => r !== option),
                        )
                      }
                    }}
                  />
                  <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case "rating":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {question.labels && (
                <>
                  <span className="text-sm text-gray-600">{question.labels["1"]}</span>
                  <span className="text-sm text-gray-600">{question.labels[question.scale?.toString() || "5"]}</span>
                </>
              )}
            </div>
            <div className="flex justify-between">
              {Array.from({ length: question.scale || 5 }, (_, i) => i + 1).map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleResponse(question.id, rating)}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-medium transition-colors ${
                    response === rating
                      ? "bg-red-600 border-red-600 text-white"
                      : "border-gray-300 hover:border-red-400 text-gray-700"
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      default:
        return <div>Unsupported question type: {question.type}</div>
    }
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading survey...</p>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Thank You!</CardTitle>
            <CardDescription className="text-gray-600">
              Your responses have been successfully submitted. We appreciate your participation in helping us understand
              business challenges in the Netherlands.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full bg-red-600 hover:bg-red-700">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = ((currentQuestion + 1) / survey.questions.length) * 100
  const question = survey.questions[currentQuestion]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title}</h1>
          <p className="text-gray-600">{survey.description}</p>
        </div>

        {/* Progress Bar */}
        {survey.settings.showProgressBar && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Question {currentQuestion + 1} of {survey.questions.length}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderQuestion(question)}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentQuestion === survey.questions.length - 1 ? (
            <Button
              onClick={submitSurvey}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
            >
              {isSubmitting ? "Submitting..." : "Finish Survey"}
              <CheckCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={nextQuestion} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
