import type { NextRequest } from "next/server"

export interface JWTPayload {
  userId: string
  email: string
  role?: string
  tokenVersion?: number
  iat?: number
  exp?: number
}

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export type APIHandler<T extends Record<string, string> = Record<string, string>> = (
  req: AuthenticatedRequest,
  context: { params: Promise<T> }
) => Promise<Response> | Response
