// Simple in-memory user storage for demo purposes
// In production, replace with proper database operations
import bcrypt from "bcryptjs"
import fs from "fs"
import path from "path"
import { dbQuery, getPool } from "./db"

export interface User {
  id: number
  userId: string
  passwordHash: string
  role: "supplier" | "buyer" | "admin"
  email?: string
  name?: string
  mobile?: string
  companyName?: string
  gstNumber?: string
  numberOfVehicles?: number
  documents?: Record<string, string>
  createdAt: Date
}

// Seed helpers
const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123"

const adminPasswordHash = bcrypt.hashSync(defaultAdminPassword, 10)

// File-backed storage for development
const dataDir = path.join(process.cwd(), "data")
const usersFile = path.join(dataDir, "users.json")

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function loadUsersFromDisk(): User[] {
  try {
    ensureDataDir()
    if (!fs.existsSync(usersFile)) {
      const initial: User[] = [
        {
          id: 1,
          userId: "admin",
          passwordHash: adminPasswordHash,
          role: "admin",
          email: "admin@transportoffice.com",
          name: "System Admin",
          createdAt: new Date(),
        },
      ]
      fs.writeFileSync(usersFile, JSON.stringify(initial, null, 2), "utf-8")
      return initial
    }
    const raw = fs.readFileSync(usersFile, "utf-8")
    const parsed = JSON.parse(raw) as Array<Omit<User, "createdAt"> & { createdAt: string }>
    return parsed.map((u) => ({ ...u, createdAt: new Date(u.createdAt) }))
  } catch (_e) {
    // Fallback to admin only if something goes wrong
    return [
      {
        id: 1,
        userId: "admin",
        passwordHash: adminPasswordHash,
        role: "admin",
        email: "admin@transportoffice.com",
        name: "System Admin",
        createdAt: new Date(),
      },
    ]
  }
}

function saveUsersToDisk(current: User[]) {
  ensureDataDir()
  const serializable = current.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))
  fs.writeFileSync(usersFile, JSON.stringify(serializable, null, 2), "utf-8")
}

let users: User[] = loadUsersFromDisk()
let nextUserId = users.reduce((max, u) => Math.max(max, u.id), 0) + 1

export function createUser(userData: Omit<User, "id" | "createdAt">): User {
  // If DATABASE_URL exists, write to Postgres; else fallback to file
  if (getPool()) {
    return createUserDb(userData)
  }
  const newUser: User = {
    ...userData,
    id: nextUserId++,
    createdAt: new Date(),
  }
  users.push(newUser)
  saveUsersToDisk(users)
  return newUser
}

function createUserDb(userData: Omit<User, "id" | "createdAt">): User {
  // Synchronous shape for callers; we will block using deasync-like pattern via execSync style
  // But since our route handlers are async, they can await a Promise version.
  // For compatibility, we perform a naive sync emulation by throwing if called outside async.
  // To avoid refactors, we perform a simple Atomics.wait based gate.
  throw new Error(
    "createUserDb should be called via createUserAsync in async context; refactor needed if hit",
  )
}

export async function createBuyerAsync(buyerData: {
  userId: string
  passwordHash: string
  companyName: string
  gstNumber: string
}): Promise<User> {
  if (!getPool()) {
    return createUser({ ...buyerData, role: "buyer" })
  }
  
  try {
    const now = new Date()
    const { userId, passwordHash, companyName, gstNumber } = buyerData
    console.log("createBuyerAsync called with:", { userId, companyName, gstNumber })
    
    const res = await dbQuery<{ id: number }>(
      `INSERT INTO users (user_id, password_hash, role, email, name, mobile, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [userId, passwordHash, 'buyer', null, null, null, now],
    )
    
    if (res.rows.length === 0) {
      throw new Error("No rows returned from users insert")
    }
    
    const id = res.rows[0].id
    console.log("✅ User created with ID:", id)
    
    // Insert into buyers table
    await dbQuery(
      `INSERT INTO buyers (user_id, company_name, gst_number) VALUES ($1,$2,$3)
       ON CONFLICT (user_id) DO UPDATE SET company_name=EXCLUDED.company_name, gst_number=EXCLUDED.gst_number`,
      [userId, companyName, gstNumber],
    )
    
    console.log("✅ Buyer data inserted successfully")
    
    return { 
      id, 
      userId, 
      passwordHash, 
      role: "buyer" as const,
      email: undefined,
      name: undefined,
      mobile: undefined,
      companyName, 
      gstNumber, 
      numberOfVehicles: undefined,
      documents: undefined,
      createdAt: now 
    }
  } catch (error) {
    console.error("Database operation failed:", error)
    throw error
  }
}

export async function createUserAsync(userData: Omit<User, "id" | "createdAt">): Promise<User> {
  if (!getPool()) {
    return createUser(userData)
  }
  
  try {
    const now = new Date()
    const { userId, passwordHash, role } = userData
    console.log("createUserAsync called with:", { userId, role })
    
    const res = await dbQuery<{ id: number }>(
      `INSERT INTO users (user_id, password_hash, role, email, name, mobile, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [userId, passwordHash, role, userData.email || null, userData.name || null, userData.mobile || null, now],
    )
    
    // Check if database operation was successful
    if (res.rows.length === 0) {
      console.error("Database insert failed - no rows returned")
      throw new Error("Failed to insert user into database")
    }
    
    const id = res.rows[0].id
    if (role === "supplier") {
      await dbQuery(
        `INSERT INTO suppliers (user_id, company_name, gst_number, number_of_vehicles) VALUES ($1,$2,$3,$4)
         ON CONFLICT (user_id) DO UPDATE SET company_name=EXCLUDED.company_name, gst_number=EXCLUDED.gst_number, number_of_vehicles=EXCLUDED.number_of_vehicles`,
        [userId, userData.companyName || null, userData.gstNumber || null, userData.numberOfVehicles || null],
      )
    } else if (role === "buyer") {
      await dbQuery(
        `INSERT INTO buyers (user_id, company_name, gst_number) VALUES ($1,$2,$3)
         ON CONFLICT (user_id) DO UPDATE SET company_name=EXCLUDED.company_name, gst_number=EXCLUDED.gst_number`,
        [userId, userData.companyName || null, userData.gstNumber || null],
      )
    }
    // documents persistence can be added later via upload route
    return { 
      id, 
      userId, 
      passwordHash, 
      role, 
      email: userData.email, 
      name: userData.name, 
      mobile: userData.mobile, 
      companyName: userData.companyName, 
      gstNumber: userData.gstNumber, 
      numberOfVehicles: userData.numberOfVehicles, 
      documents: userData.documents, 
      createdAt: now 
    }
  } catch (error) {
    console.error("Database operation failed:", error)
    // Do NOT fallback to file-based storage for security
    throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function findUserByCredentials(userId: string, role: string): User | undefined {
  // Always load fresh data from disk
  users = loadUsersFromDisk()
  
  const target = userId.trim() // Remove .toLowerCase() to make it case-sensitive
  const digits = target.replace(/[^0-9]/g, "")
  const targetRole = role.trim().toLowerCase() as User["role"]
  
  const foundUser = users.find((user) => {
    if (user.role !== targetRole) return false
    const byUserId = (user.userId || "") === target // Remove .toLowerCase() for case-sensitive comparison
    const byEmail = (user.email || "") === target // Remove .toLowerCase() for case-sensitive comparison
    const byMobile = (user.mobile || "").replace(/[^0-9]/g, "") === digits && digits.length > 0
    return byUserId || byEmail || byMobile
  })
  
  return foundUser
}

export async function findUserByCredentialsAsync(userId: string, role: string): Promise<User | undefined> {
  console.log(`[AUTH] findUserByCredentialsAsync called with: userId="${userId}", role="${role}"`)
  
  // If database is available, query it
  if (getPool()) {
    try {
      const target = userId.trim() // Remove .toLowerCase() to make it case-sensitive
      const targetRole = role.trim().toLowerCase() as User["role"]
      
      console.log(`[AUTH] Searching for user: "${target}" with role: "${targetRole}"`)
      
      // Try to find by userId first
      let res = await dbQuery<any>(
        `SELECT u.id, u.user_id as "userId", u.password_hash as "passwordHash", u.role, u.email, u.name, u.mobile, u.created_at as "createdAt",
                s.company_name as "companyName", s.gst_number as "gstNumber", s.number_of_vehicles as "numberOfVehicles"
         FROM users u
         LEFT JOIN suppliers s ON s.user_id = u.user_id
         LEFT JOIN buyers b ON b.user_id = u.user_id
         WHERE u.user_id = $1 AND u.role = $2`,
        [target, targetRole]
      )
      
      console.log(`[AUTH] Database query returned ${res.rows.length} rows`)
      
      if (res.rows.length > 0) {
        const user = res.rows[0]
        console.log(`[AUTH] User found: ${user.userId} (${user.role})`)
        return { ...user, createdAt: new Date(user.createdAt) }
      }
      
      // Try to find by email
      if (target.includes('@')) {
        res = await dbQuery<any>(
          `SELECT u.id, u.user_id as "userId", u.password_hash as "passwordHash", u.role, u.email, u.name, u.mobile, u.created_at as "createdAt",
                  s.company_name as "companyName", s.gst_number as "gstNumber", s.number_of_vehicles as "numberOfVehicles"
           FROM users u
           LEFT JOIN suppliers s ON s.user_id = u.user_id
           LEFT JOIN buyers b ON b.user_id = u.user_id
           WHERE u.email = $1 AND u.role = $2`,
          [target, targetRole]
        )
        
        if (res.rows.length > 0) {
          const user = res.rows[0]
          return { ...user, createdAt: new Date(user.createdAt) }
        }
      }
      
      // Try to find by mobile (digits only)
      const digits = target.replace(/[^0-9]/g, "")
      if (digits.length > 0) {
        res = await dbQuery<any>(
          `SELECT u.id, u.user_id as "userId", u.password_hash as "passwordHash", u.role, u.email, u.name, u.mobile, u.created_at as "createdAt",
                  s.company_name as "companyName", s.gst_number as "gstNumber", s.number_of_vehicles as "numberOfVehicles"
           FROM users u
           LEFT JOIN suppliers s ON s.user_id = u.user_id
           LEFT JOIN buyers b ON b.user_id = u.user_id
           WHERE u.mobile IS NOT NULL AND u.role = $1`,
          [targetRole]
        )
        
        // Filter by mobile digits in JavaScript since PostgreSQL regex is complex
        const mobileMatch = res.rows.find(row => {
          if (!row.mobile) return false
          const mobileDigits = row.mobile.replace(/[^0-9]/g, "")
          return mobileDigits === digits
        })
        
        if (mobileMatch) {
          const user = mobileMatch
          return { ...user, createdAt: new Date(user.createdAt) }
        }
      }
      
      // If no user found in database, fall back to file storage for development
      console.log("No user found in database - falling back to file storage")
      return findUserByCredentials(userId, role)
    } catch (error) {
      console.error("Database query error:", error)
      // Fallback to file-based search for development
      console.log("Database error - falling back to file storage")
      return findUserByCredentials(userId, role)
    }
  }
  
  // No database available - use file-based storage
  console.log("No database connection - using file storage")
  return findUserByCredentials(userId, role)
}

export function getAllUsers(): User[] {
  users = loadUsersFromDisk()
  return [...users]
}

export function getUsersByRole(role: string): User[] {
  users = loadUsersFromDisk()
  return users.filter((user) => user.role === role)
}

// Async variants when DB is enabled
export async function getAllUsersAsync(): Promise<User[]> {
  if (!getPool()) return getAllUsers()
  
  try {
    const res = await dbQuery<any>(
      `SELECT u.id, u.user_id as "userId", u.password_hash as "passwordHash", u.role, u.email, u.name, u.mobile, u.created_at as "createdAt",
              s.company_name as "companyName", s.gst_number as "gstNumber", s.number_of_vehicles as "numberOfVehicles"
       FROM users u
       LEFT JOIN suppliers s ON s.user_id = u.user_id
       LEFT JOIN buyers b ON b.user_id = u.user_id`
    )
    
    if (res.rows.length === 0) {
      console.log("No users found in database, falling back to file storage")
      return getAllUsers()
    }
    
    return res.rows.map((r) => ({ ...r, createdAt: new Date(r.createdAt) }))
  } catch (error) {
    console.error("Database query failed, falling back to file storage:", error)
    return getAllUsers()
  }
}
