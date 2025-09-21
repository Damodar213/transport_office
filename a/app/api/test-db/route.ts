import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Test DB API called")
    
    if (!getPool()) {
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Test basic database connection
    const result = await dbQuery("SELECT 1 as test")
    console.log("Database test result:", result.rows[0])

    const response = NextResponse.json({
      success: true,
      message: "Database connection working",
      result: result.rows[0]



      }

      }

      }

    })

  } catch (error) {
    console.error("Test DB error:", error)
    const response = NextResponse.json(
      { 
        error: "Database test failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
 
 
 
        }

        }

        }

      },
      { status: 500 }

    )
  }

}
