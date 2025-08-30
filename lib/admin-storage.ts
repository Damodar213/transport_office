// Admin-specific storage and authentication
import bcrypt from "bcryptjs"
import { dbQuery, getPool } from "./db"

export interface Admin {
  id: number
  userId: string
  passwordHash: string
  name?: string
  email?: string
  mobile?: string
  role: string
  permissions: string[]
  createdAt: Date
}

export function createAdmin(adminData: Omit<Admin, "id" | "createdAt">): Admin {
  // For now, fallback to file storage if no database
  if (!getPool()) {
    throw new Error("Database connection required for admin management")
  }
  
  // This will be called via createAdminAsync
  throw new Error("Use createAdminAsync for database operations")
}

export async function createAdminAsync(adminData: Omit<Admin, "id" | "createdAt">): Promise<Admin> {
  if (!getPool()) {
    throw new Error("Database connection required for admin management")
  }

  try {
    const now = new Date()
    const { userId, passwordHash, name, email, mobile, role, permissions } = adminData

    const res = await dbQuery<{ id: number }>(
      `INSERT INTO admins (user_id, password_hash, name, email, mobile, role, permissions, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [userId, passwordHash, name || null, email || null, mobile || null, role, permissions, now.toISOString()]
    )

    // Check if database operation was successful
    if (res.rows.length === 0) {
      throw new Error("Database insert failed")
    }

    return {
      id: res.rows[0].id,
      userId,
      passwordHash,
      name,
      email,
      mobile,
      role,
      permissions,
      createdAt: now
    }
  } catch (error) {
    console.error("Admin creation failed:", error)
    throw new Error("Failed to create admin account")
  }
}

export async function findAdminByCredentials(userId: string): Promise<Admin | undefined> {
  if (!getPool()) {
    throw new Error("Database connection required for admin management")
  }

  try {
    const res = await dbQuery<Admin>(
      `SELECT id, user_id as "userId", password_hash as "passwordHash", name, email, mobile, role, permissions, created_at as "createdAt"
       FROM admins WHERE user_id = $1`,
      [userId]
    )

    if (res.rows.length === 0) return undefined

    const admin = res.rows[0]
    return {
      ...admin,
      createdAt: new Date(admin.createdAt)
    }
  } catch (error) {
    console.error("Admin lookup failed:", error)
    return undefined
  }
}

export async function getAllAdmins(): Promise<Admin[]> {
  if (!getPool()) {
    throw new Error("Database connection required for admin management")
  }

  const res = await dbQuery<Admin>(
    `SELECT id, user_id as "userId", password_hash as "passwordHash", name, email, mobile, role, permissions, created_at as "createdAt"
     FROM admins ORDER BY created_at DESC`
  )

  return res.rows.map(admin => ({
    ...admin,
    createdAt: new Date(admin.createdAt)
  }))
}

export async function deleteAdmin(adminId: number): Promise<void> {
  if (!getPool()) {
    throw new Error("Database connection required for admin management")
  }

  await dbQuery(`DELETE FROM admins WHERE id = $1`, [adminId])
}

export async function updateAdminPermissions(adminId: number, permissions: string[]): Promise<void> {
  if (!getPool()) {
    throw new Error("Database connection required for admin management")
  }

  await dbQuery(
    `UPDATE admins SET permissions = $1 WHERE id = $1`,
    [permissions, adminId]
  )
}



