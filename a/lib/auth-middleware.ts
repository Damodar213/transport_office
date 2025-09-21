import { NextRequest, NextResponse } from "next/server"
import { getSession } from "./auth"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    userIdString: string
    role: string
    email?: string
    name?: string
    companyName?: string
  }
}

export async function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  allowedRoles?: string[]
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const session = await getSession()
      
      if (!session) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      }

      // Check role permissions if specified
      if (allowedRoles && !allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        )
      }

      // Add user to request object
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = session as any

      return await handler(authenticatedRequest)
    } catch (error) {
      console.error("Auth middleware error:", error)
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      )
    }
  }
}

export function requireRole(role: string) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) => {
    return withAuth(handler, [role])
  }
}

export function requireAnyRole(roles: string[]) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) => {
    return withAuth(handler, roles)
  }
}

