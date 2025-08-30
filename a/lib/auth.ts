import { cookies } from "next/headers"

export interface User {
  userId: number
  userIdString: string
  role: "supplier" | "buyer" | "admin"
  email?: string
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return null
    }

    const session = JSON.parse(sessionCookie.value)
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
