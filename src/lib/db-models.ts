import type { ObjectId } from "mongodb"

// User model for authentication
export interface User {
  _id?: ObjectId
  email: string
  password: string // This will be hashed
  name: string
  role: "admin" | "user"
  createdAt: Date
  updatedAt: Date
}

// Survey model
export interface Survey {
  _id?: ObjectId
  title: string
  description?: string
  questions: Question[]
  settings: SurveySettings
  status: "draft" | "published" | "closed"
  createdBy: ObjectId // User ID
  createdAt: Date
  updatedAt: Date
  responseCount: number
  name?: string
}

// Question types
export interface Question {
  id: string
  type: 
    | "text"
    | "textarea"
    | "multiple-choice"
    | "checkbox"
    | "dropdown"
    | "rating"
    | "scale"
    | "nps"
    | "date"
    | "time"
    | "email"
    | "phone"
    | "number"
    | "url"
    | "matrix"
  title: string
  description?: string
  question: string
  required: boolean
  options?: string[] | { choices: string[]; placeholder?: string }
 // For multiple choice, checkbox, dropdown
  settings?: {
    min?: number
    max?: number
    step?: number
    scale?: number
    labels?: string[]
    rows?: string[]
    columns?: string[]
  }
  name?: string
}

// Survey settings
export interface SurveySettings {
  allowAnonymous: boolean
  requireAuth: boolean
  multipleResponses: boolean
  showProgressBar: boolean
  randomizeQuestions: boolean
  collectEmail: boolean
  collectIP: boolean
  thankYouMessage?: string
  redirectUrl?: string
}

// Define all possible response value types based on question types
export type ResponseValue =
  | string // text, textarea, email, phone, url, date, time, multiple-choice, dropdown
  | number // rating, scale, nps, number
  | string[] // checkbox (multiple selections)
  | { [rowId: string]: string } // matrix (row-column mapping)
  | boolean // for any yes/no type questions
  | null // for unanswered optional questions

// Response model
export interface SurveyResponse {
  _id?: ObjectId
  surveyId: ObjectId
  responses: { [questionId: string]: ResponseValue }
  metadata: {
    ipAddress?: string
    userAgent?: string
    startTime: Date
    endTime: Date
    isComplete: boolean
  }
  respondentInfo?: {
    email?: string
    name?: string
  }
  createdAt: Date
}

// Analytics aggregation interfaces
export interface SurveyAnalytics {
  surveyId: ObjectId
  totalResponses: number
  completionRate: number
  averageTime: number
  responsesByDate: { date: string; count: number }[]
  questionAnalytics: QuestionAnalytics[]
}

export interface QuestionAnalytics {
  questionId: string
  questionType: string
  questionTitle: string
  responseCount: number
  responses: ResponseValue[]
  distribution?: { [key: string]: number }
  averageRating?: number
  npsScore?: number
}

export interface ContactMessage {
  _id?: string
  name: string
  email: string
  subject: string
  message: string
  createdAt: Date
  isRead?: boolean
  company: string
}
