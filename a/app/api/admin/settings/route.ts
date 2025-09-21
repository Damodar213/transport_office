import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

// Default settings
const defaultSettings = {}

export async function GET() {
  try {
    console.log("GET /api/admin/settings - fetching settings...")
    
    let settings = { ...defaultSettings }
    
    // If database is available, try to fetch settings
    if (getPool()) {
      try {
        // Check if settings table exists
        const tableExists = await dbQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'admin_settings'
          )
        `)
        
        if (tableExists.rows[0].exists) {
          const result = await dbQuery(`
            SELECT setting_key, setting_value, setting_type
            FROM admin_settings
          `)
          
          if (result.rows.length > 0) {
            // Parse stored settings
            result.rows.forEach(row => {
              try {
                const value = JSON.parse(row.setting_value)
                const [category, key] = row.setting_key.split('.')
                
                if (settings[category as keyof typeof settings]) {
                  (settings[category as keyof typeof settings] as any)[key] = value
                }
              } catch (parseError) {
                console.warn(`Failed to parse setting ${row.setting_key}:`, parseError)
              }
            })
          }
        } else {
          console.log("Settings table doesn't exist, using default values")
        }
      } catch (error) {
        console.error("Error fetching settings from database:", error)
        console.log("Falling back to default settings")
      }
    }
    
    console.log("Settings fetched successfully")
    console.error("Error in settings GET API:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch settings",
      details: error instanceof Error ? error.message : "Unknown error"
  })
    return addCorsHeaders(response)
  }
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    
    console.log("PUT /api/admin/settings - updating settings...")
    
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }
    try {
      // Check if settings table exists, create if not
      const tableExists = await dbQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'admin_settings'
        )
      `)
      
      if (!tableExists.rows[0].exists) {
        await dbQuery(`
          CREATE TABLE admin_settings (
            id SERIAL PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT NOT NULL,
            setting_type VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)
        console.log("Created admin_settings table")
      }
      
      // Prepare settings for storage
      const settingsToStore: any[] = []
      
      // Store each setting
      for (const setting of settingsToStore) {
        await dbQuery(`
          INSERT INTO admin_settings (setting_key, setting_value, setting_type)
          VALUES ($1, $2, $3)
          ON CONFLICT (setting_key) 
          DO UPDATE SET 
            setting_value = EXCLUDED.setting_value,
            setting_type = EXCLUDED.setting_type,
            updated_at = CURRENT_TIMESTAMP
        `, [setting.key, JSON.stringify(setting.value), setting.type])
      }
      
      console.log("Settings updated successfully")
      const response = NextResponse.json({ 
        message: "Settings updated successfully",
        settings: settings
      })
      return addCorsHeaders(response)

  } catch (error) {
      console.error("Error updating settings in database:", error)
      const response = NextResponse.json({ 
        error: "Failed to update settings in database",
        details: error instanceof Error ? error.message : "Unknown error"
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error in settings PUT API:", error)
    const response = NextResponse.json({ 
      error: "Failed to update settings",
      details: error instanceof Error ? error.message : "Unknown error"
  })
    return addCorsHeaders(response)
  }