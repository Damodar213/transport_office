import { NextResponse } from "next/server"
import { getSession } from "./auth"
import { checkDatabaseHealth } from "./db"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any
}

export function createApiResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  }, { status })
}

export function createApiError(
  error: string,
  details?: any,
  status: number = 500
): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error,
    details,
  }, { status })
}

export async function withAuth<T>(
  handler: (session: any) => Promise<NextResponse<ApiResponse<T>>>,
  allowedRoles?: string[]
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const session = await getSession()
    
    if (!session) {
      return createApiError("Authentication required", null, 401)
    }
    
    if (allowedRoles && !allowedRoles.includes(session.role)) {
      return createApiError("Insufficient permissions", null, 403)
    }
    
    return await handler(session)
  } catch (error) {
    console.error("Auth middleware error:", error)
    return createApiError(
      "Authentication error",
      error instanceof Error ? error.message : "Unknown error",
      500
    )
  }
}

export async function withDatabase<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    // Check database health first
    const health = await checkDatabaseHealth()
    if (!health.healthy) {
      return createApiError(
        "Database unavailable",
        health.message,
        503
      )
    }
    
    return await handler()
  } catch (error) {
    console.error("Database middleware error:", error)
    return createApiError(
      "Database error",
      error instanceof Error ? error.message : "Unknown error",
      500
    )
  }
}

export async function withErrorHandling<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    return await handler()
  } catch (error) {
    console.error("API handler error:", error)
    return createApiError(
      "Internal server error",
      error instanceof Error ? error.message : "Unknown error",
      500
    )
  }
}

export function validateRequiredFields(
  data: any,
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ""
  )
  
  return {
    valid: missingFields.length === 0,
    missingFields
  }
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim()
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  return input
}


