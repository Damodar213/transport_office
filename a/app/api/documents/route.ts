import { NextRequest, NextResponse } from "next/server"
import { listDocuments, reviewDocument } from "@/lib/document-storage"

export async function GET() {
  try {
    const docs = listDocuments()
    const response = NextResponse.json({ documents: docs })
  } catch (error) {
    console.error("GET /api/documents error:", error)
    const response = NextResponse.json({ error: "Failed to load documents" }, { status: 500 })
  }

}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, reviewNotes, reviewer } = body as {
      id: number
      status: "approved" | "rejected"
      reviewNotes?: string
      reviewer?: string



      }

      }

      }

    }

    if (!id || !status) {
      const response = NextResponse.json({ error: "id and status are required" }, { status: 400 })
    }

    const updated = reviewDocument(Number(id), status, reviewNotes, reviewer || "Admin")
    if (!updated) {
      const response = NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const response = NextResponse.json({ document: updated })
  } catch (error) {
    console.error("PATCH /api/documents error:", error)
    const response = NextResponse.json({ error: "Failed to review document" }, { status: 500 })
  }

}
