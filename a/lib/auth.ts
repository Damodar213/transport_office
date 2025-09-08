import { cookies } from "next/headers"
import { dbQuery } from "./db"

export interface User {
  userId: number
  userIdString: string
  role: "supplier" | "buyer" | "admin"
  email?: string
  name?: string
  companyName?: string
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return null
    }

    const session = JSON.parse(sessionCookie.value)
    
    // Validate session against database if available
    if (session.userId && session.role) {
      try {
        const result = await dbQuery(
          "SELECT user_id, role, email, name FROM users WHERE user_id = $1 AND role = $2",
          [session.userId, session.role]
        )
        
        if (result.rows.length === 0) {
          console.warn("Session validation failed: user not found in database")
          return null
        }
        
        // Update session with fresh data from database
        const dbUser = result.rows[0]
        return {
          ...session,
          email: dbUser.email || session.email,
          name: dbUser.name || session.name,
        }
      } catch (error) {
        console.error("Session validation error:", error)
        // Return session even if validation fails (graceful degradation)
        return session
      }
    }
    
    return session
  } catch (error) {
    console.error("Session error:", error)
    return null
  }
}

export async function requireAuth(allowedRoles?: string[]) {
  const session = await getSession()

  if (!session) {
    throw new Error("Authentication required")
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error("Insufficient permissions")
  }

  return session
}
