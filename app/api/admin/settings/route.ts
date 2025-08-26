import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// Default settings
const defaultSettings = {
  systemSettings: {
    siteName: "Transport Office Management System",
    siteDescription: "Comprehensive transport and logistics management platform",
    adminEmail: "admin@transportoffice.com",
    supportEmail: "support@transportoffice.com",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    currency: "INR",
    language: "en"
  },
  securitySettings: {
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    requireTwoFactor: false,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true
  },
  notificationSettings: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderUpdates: true,
    userRegistrations: true,
    systemAlerts: true,
    documentReviews: true,
    paymentConfirmations: true
  },
  databaseSettings: {
    backupFrequency: "daily",
    backupRetention: 30,
    autoOptimization: true,
    queryLogging: false,
    connectionPoolSize: 10
  }
}

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
    return NextResponse.json(settings)
    
  } catch (error) {
    console.error("Error in settings GET API:", error)
    return NextResponse.json({ 
      error: "Failed to fetch settings",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { systemSettings, securitySettings, notificationSettings, databaseSettings } = body
    
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
      const settingsToStore = [
        // System settings
        { key: "system.siteName", value: systemSettings.siteName, type: "string" },
        { key: "system.siteDescription", value: systemSettings.siteDescription, type: "string" },
        { key: "system.adminEmail", value: systemSettings.adminEmail, type: "string" },
        { key: "system.supportEmail", value: systemSettings.supportEmail, type: "string" },
        { key: "system.timezone", value: systemSettings.timezone, type: "string" },
        { key: "system.dateFormat", value: systemSettings.dateFormat, type: "string" },
        { key: "system.currency", value: systemSettings.currency, type: "string" },
        { key: "system.language", value: systemSettings.language, type: "string" },
        
        // Security settings
        { key: "security.sessionTimeout", value: securitySettings.sessionTimeout, type: "number" },
        { key: "security.maxLoginAttempts", value: securitySettings.maxLoginAttempts, type: "number" },
        { key: "security.requireTwoFactor", value: securitySettings.requireTwoFactor, type: "boolean" },
        { key: "security.passwordMinLength", value: securitySettings.passwordMinLength, type: "number" },
        { key: "security.passwordRequireSpecial", value: securitySettings.passwordRequireSpecial, type: "boolean" },
        { key: "security.passwordRequireNumbers", value: securitySettings.passwordRequireNumbers, type: "boolean" },
        { key: "security.passwordRequireUppercase", value: securitySettings.passwordRequireUppercase, type: "boolean" },
        
        // Notification settings
        { key: "notifications.emailNotifications", value: notificationSettings.emailNotifications, type: "boolean" },
        { key: "notifications.smsNotifications", value: notificationSettings.smsNotifications, type: "boolean" },
        { key: "notifications.pushNotifications", value: notificationSettings.pushNotifications, type: "boolean" },
        { key: "notifications.orderUpdates", value: notificationSettings.orderUpdates, type: "boolean" },
        { key: "notifications.userRegistrations", value: notificationSettings.userRegistrations, type: "boolean" },
        { key: "notifications.systemAlerts", value: notificationSettings.systemAlerts, type: "boolean" },
        { key: "notifications.documentReviews", value: notificationSettings.documentReviews, type: "boolean" },
        { key: "notifications.paymentConfirmations", value: notificationSettings.paymentConfirmations, type: "boolean" },
        
        // Database settings
        { key: "database.backupFrequency", value: databaseSettings.backupFrequency, type: "string" },
        { key: "database.backupRetention", value: databaseSettings.backupRetention, type: "number" },
        { key: "database.autoOptimization", value: databaseSettings.autoOptimization, type: "boolean" },
        { key: "database.queryLogging", value: databaseSettings.queryLogging, type: "boolean" },
        { key: "database.connectionPoolSize", value: databaseSettings.connectionPoolSize, type: "number" }
      ]
      
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
      return NextResponse.json({ 
        message: "Settings updated successfully",
        settings: {
          systemSettings,
          securitySettings,
          notificationSettings,
          databaseSettings
        }
      })
      
    } catch (error) {
      console.error("Error updating settings in database:", error)
      return NextResponse.json({ 
        error: "Failed to update settings in database",
        details: error instanceof Error ? error.message : "Unknown error"
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error("Error in settings PUT API:", error)
    return NextResponse.json({ 
      error: "Failed to update settings",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}



