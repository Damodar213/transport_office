import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery } from "@/lib/db"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST() {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    console.log("Starting migration to fix order_submissions status field...")

    // Check if the order_submissions table exists
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_submissions')
      )
    `)

    if (!tableExists.rows[0].exists) {
      const response = NextResponse.json({ 
        message: "order_submissions table does not exist",)
        success: false})
    return addCorsHeaders(response)
  }

    // Check current status values in the table
    const currentStatuses = await dbQuery(`)
      SELECT status, COUNT(*) as count 
      FROM order_submissions 
      GROUP BY status
    `)
    
    console.log("Current status distribution:", currentStatuses.rows)

    // Update any 'submitted' status to 'new' since 'submitted' is not in the allowed values
    const updateResult = await dbQuery(`
      UPDATE order_submissions )
      SET status = 'new', updated_at = NOW() AT TIME ZONE 'Asia/Kolkata'
      WHERE status = 'submitted'
    `)

    console.log(`Updated ${updateResult.rows.length} order submissions from 'submitted' to 'new'`)

    // Check final status values
    const finalStatuses = await dbQuery(`)
      SELECT status, COUNT(*) as count 
      FROM order_submissions 
      GROUP BY status
    `)
    
    console.log("Final status distribution:", finalStatuses.rows)

    const response = NextResponse.json({ 
      message: `Migration completed successfully - Updated ${updateResult.rows.length} order submissions from 'submitted' to 'new' status`,
      success: true,
      updatedCount: updateResult.rows.length,
      beforeStatuses: currentStatuses.rows,
      afterStatuses: finalStatuses.rows


})
  } catch (error) {
    console.error("Migration error:", error)
    const response = NextResponse.json({ 
      error: "Failed to migrate order_submissions status",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
