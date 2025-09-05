import fs from "fs"
import path from "path"

export type DocumentType = "aadhaar" | "pan" | "gst" | "rc" | "insurance" | "license"
export type DocumentStatus = "pending" | "approved" | "rejected"

export interface DocumentSubmission {
  id: number
  userId: string
  supplierName?: string
  companyName?: string
  documentType: DocumentType
  documentUrl: string
  submittedAt: string
  status: DocumentStatus
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: string
}

const dataDir = path.join(process.cwd(), "data")
const filePath = path.join(dataDir, "documents.json")

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({ nextId: 1, submissions: [] }, null, 2), "utf-8")
}

function readStore(): { nextId: number; submissions: DocumentSubmission[] } {
  ensureStore()
  const raw = fs.readFileSync(filePath, "utf-8")
  return JSON.parse(raw)
}

function writeStore(store: { nextId: number; submissions: DocumentSubmission[] }) {
  ensureStore()
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8")
}

export function listDocuments(): DocumentSubmission[] {
  const store = readStore()
  // Most recent first
  return [...store.submissions].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
}

export function addDocumentSubmission(entry: Omit<DocumentSubmission, "id" | "status" | "submittedAt"> & { submittedAt?: string; status?: DocumentStatus }): DocumentSubmission {
  const store = readStore()
  const submission: DocumentSubmission = {
    id: store.nextId++,
    userId: entry.userId,
    supplierName: entry.supplierName,
    companyName: entry.companyName,
    documentType: entry.documentType,
    documentUrl: entry.documentUrl,
    submittedAt: entry.submittedAt || new Date().toISOString().replace("T", " ").slice(0, 16),
    status: entry.status || "pending",
  }
  store.submissions.push(submission)
  writeStore(store)
  return submission
}

export function bulkAddSupplierDocuments(args: {
  userId: string
  supplierName?: string
  companyName?: string
  documentUrls: Partial<Record<DocumentType, string>>
}) {
  const { userId, supplierName, companyName, documentUrls } = args
  const entries: Array<{ type: DocumentType; url: string }> = []
  ;(["aadhaar", "pan", "gst", "rc", "insurance", "license"] as DocumentType[]).forEach((t) => {
    const url = (documentUrls as any)[t]
    if (url) entries.push({ type: t, url })
  })
  entries.forEach((e) =>
    addDocumentSubmission({
      userId,
      supplierName,
      companyName,
      documentType: e.type,
      documentUrl: e.url,
    }),
  )
}

export function reviewDocument(id: number, status: DocumentStatus, reviewNotes: string | undefined, reviewer: string): DocumentSubmission | null {
  const store = readStore()
  const idx = store.submissions.findIndex((s) => s.id === id)
  if (idx === -1) return null
  const updated: DocumentSubmission = {
    ...store.submissions[idx],
    status,
    reviewNotes,
    reviewedBy: reviewer,
    reviewedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
  }
  store.submissions[idx] = updated
  writeStore(store)
  return updated
}


