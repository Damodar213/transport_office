import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// GET - Get all submissions for a specific order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const orderId = parseInt(params.orderId)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const result = await dbQuery(`
      SELECT 
        os.*,
        s.company_name as supplier_company,
        s.contact_person as supplier_contact,
        s.mobile as supplier_mobile,
        s.whatsapp as supplier_whatsapp
      FROM order_submissions os
      LEFT JOIN suppliers s ON os.supplier_id = s.user_id
      WHERE os.order_id = $1
      ORDER BY os.submitted_at DESC
    `, [orderId])

    return NextResponse.json({
      success: true,
      submissions: result.rows
    })

  } catch (error) {
    console.error("Error fetching order submissions:", error)
    return NextResponse.json({ 
      error: "Failed to fetch order submissions",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
