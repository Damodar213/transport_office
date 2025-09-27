import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Admin credentials update API called")
    
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash('T0360j@36', 10)
    console.log("New password hashed successfully")
    
    // Check if 'arun' admin exists in users table
    const userCheck = await dbQuery(
      'SELECT * FROM users WHERE user_id = $1 AND role = $2',
      ['arun', 'admin']
    )
    
    if (userCheck.rows.length > 0) {
      console.log('Found arun admin in users table, updating...')
      
      // Update the user_id and password in users table
      await dbQuery(
        'UPDATE users SET user_id = $1, password_hash = $2, name = $3 WHERE user_id = $4 AND role = $5',
        ['Tejas', newPasswordHash, 'Tejas', 'arun', 'admin']
      )
      
      console.log('Updated users table: arun -> Tejas')
    }
    
    // Check if 'arun' admin exists in admins table
    const adminCheck = await dbQuery(
      'SELECT * FROM admins WHERE user_id = $1',
      ['arun']
    )
    
    if (adminCheck.rows.length > 0) {
      console.log('Found arun admin in admins table, updating...')
      
      // Update the user_id and password in admins table
      await dbQuery(
        'UPDATE admins SET user_id = $1, password_hash = $2, name = $3 WHERE user_id = $4',
        ['Tejas', newPasswordHash, 'Tejas', 'arun']
      )
      
      console.log('Updated admins table: arun -> Tejas')
    }
    
    // Check if Tejas already exists
    const tejasUserCheck = await dbQuery(
      'SELECT * FROM users WHERE user_id = $1 AND role = $2',
      ['Tejas', 'admin']
    )
    
    const tejasAdminCheck = await dbQuery(
      'SELECT * FROM admins WHERE user_id = $1',
      ['Tejas']
    )
    
    if (tejasUserCheck.rows.length === 0 && tejasAdminCheck.rows.length === 0) {
      console.log('Tejas admin not found, creating new admin...')
      
      // Create new admin in users table
      await dbQuery(
        `INSERT INTO users (user_id, password_hash, role, name, email, mobile, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['Tejas', newPasswordHash, 'admin', 'Tejas', 'tejas@admin.com', '9999999999', new Date()]
      )
      
      // Create new admin in admins table
      await dbQuery(
        `INSERT INTO admins (user_id, password_hash, name, email, mobile, role, permissions, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['Tejas', newPasswordHash, 'Tejas', 'tejas@admin.com', '9999999999', 'admin', ['all'], new Date()]
      )
      
      console.log('Created new Tejas admin account')
    }
    
    // Verify the update
    const verifyUser = await dbQuery(
      'SELECT user_id, name, role FROM users WHERE user_id = $1 AND role = $2',
      ['Tejas', 'admin']
    )
    
    const verifyAdmin = await dbQuery(
      'SELECT user_id, name, role FROM admins WHERE user_id = $1',
      ['Tejas']
    )
    
    console.log('Verification results:')
    console.log('Users table:', verifyUser.rows)
    console.log('Admins table:', verifyAdmin.rows)
    
    return NextResponse.json({
      success: true,
      message: "Admin credentials updated successfully",
      newCredentials: {
        username: "Tejas",
        password: "T0360j@36"
      },
      verification: {
        usersTable: verifyUser.rows,
        adminsTable: verifyAdmin.rows
      }
    })
    
  } catch (error) {
    console.error("Error updating admin credentials:", error)
    return NextResponse.json(
      { 
        error: "Failed to update admin credentials", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }, 
      { status: 500 }
    )
  }
}
