import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createUser, createUserAsync, createBuyerAsync } from "@/lib/user-storage"
import { bulkAddSupplierDocuments } from "@/lib/document-storage"
import { createAdminAsync } from "@/lib/admin-storage"
import { getPool } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    console.log("=== SIGNUP REQUEST START ===")
    
    const formData = await request.formData()
    console.log("FormData parsed successfully")

    const role = formData.get("role") as string
    const userId = formData.get("userId") as string
    const password = formData.get("password") as string

    console.log("Form fields extracted:", { role, userId, password: password ? "***" : "missing" })

    if (!userId || !password || !role) {
      console.log("Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Hash password
    console.log("Hashing password...")
    const passwordHash = await bcrypt.hash(password, 10)
    console.log("Password hashed successfully")

    if (role === "supplier") {
      console.log("Processing supplier registration...")
      const supplierData = {
        userId,
        passwordHash,
        role: role as "supplier",
        name: formData.get("name") as string,
        mobile: formData.get("mobile") as string,
        companyName: formData.get("companyName") as string,
        gstNumber: formData.get("gstNumber") as string,
        email: formData.get("email") as string,
        numberOfVehicles: Number.parseInt(formData.get("numberOfVehicles") as string) || 0,
        documents: null,
      }

      console.log("Supplier data prepared:", { 
        userId: supplierData.userId,
        name: supplierData.name,
        mobile: supplierData.mobile,
        companyName: supplierData.companyName,
        numberOfVehicles: supplierData.numberOfVehicles
      })

      const documentUrls: Record<string, string> = {}

      const aadhaar = formData.get("aadhaar") as File
      const pan = formData.get("pan") as File
      const gstCertificate = formData.get("gstCertificate") as File

      console.log("File uploads:", {
        aadhaar: aadhaar ? `${aadhaar.name} (${aadhaar.size} bytes)` : "none",
        pan: pan ? `${pan.name} (${pan.size} bytes)` : "none",
        gstCertificate: gstCertificate ? `${gstCertificate.name} (${gstCertificate.size} bytes)` : "none"
      })

      try {
        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), "public", "uploads", "supplier-documents")
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true })
          console.log("Upload directory created")
        } else {
          console.log("Upload directory exists")
        }

        if (aadhaar && aadhaar.size > 0) {
          const timestamp = Date.now()
          const filename = `aadhaar_${timestamp}_${aadhaar.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
          const filePath = join(uploadDir, filename)
          
          const bytes = await aadhaar.arrayBuffer()
          const buffer = Buffer.from(bytes)
          await writeFile(filePath, buffer)
          
          documentUrls.aadhaar = `/uploads/supplier-documents/${filename}`
          console.log("Aadhaar file uploaded:", documentUrls.aadhaar)
        }

        if (pan && pan.size > 0) {
          const timestamp = Date.now()
          const filename = `pan_${timestamp}_${pan.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
          const filePath = join(uploadDir, filename)
          
          const bytes = await pan.arrayBuffer()
          const buffer = Buffer.from(bytes)
          await writeFile(filePath, buffer)
          
          documentUrls.pan = `/uploads/supplier-documents/${filename}`
          console.log("PAN file uploaded:", documentUrls.pan)
        }

        if (gstCertificate && gstCertificate.size > 0) {
          const timestamp = Date.now()
          const filename = `gst_${timestamp}_${gstCertificate.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
          const filePath = join(uploadDir, filename)
          
          const bytes = await gstCertificate.arrayBuffer()
          const buffer = Buffer.from(bytes)
          await writeFile(filePath, buffer)
          
          documentUrls.gstCertificate = `/uploads/supplier-documents/${filename}`
          console.log("GST certificate uploaded:", documentUrls.gstCertificate)
        }
      } catch (uploadError) {
        console.error("File upload error:", uploadError)
        return NextResponse.json({ error: "File upload failed" }, { status: 500 })
      }

      // Save to database with document URLs
      console.log("Saving to database...")
      try {
        const newUser = getPool()
          ? await createUserAsync({ ...supplierData, documents: documentUrls })
          : createUser({ ...supplierData, documents: documentUrls })
        console.log("Supplier registered with ID:", newUser.id)

        // Record document submissions for admin review (file-backed store for now)
        bulkAddSupplierDocuments({
          userId,
          supplierName: supplierData.name,
          companyName: supplierData.companyName,
          documentUrls: {
            aadhaar: documentUrls.aadhaar,
            pan: documentUrls.pan,
            gst: (documentUrls as any).gstCertificate,
          },
        })
      } catch (dbError) {
        console.error("Database save error:", dbError)
        return NextResponse.json({ 
          error: "Failed to save user to database",
          details: dbError instanceof Error ? dbError.message : "Unknown error"
        }, { status: 500 })
      }
    } else if (role === "buyer") {
      console.log("Processing buyer registration...")
      const buyerData = {
        userId,
        passwordHash,
        companyName: formData.get("companyName") as string,
        gstNumber: formData.get("gstNumber") as string,
      }

      console.log("Buyer data prepared:", { 
        userId: buyerData.userId,
        companyName: buyerData.companyName
      })

      // Save to database
      try {
        const newUser = getPool() ? await createBuyerAsync(buyerData) : createUser(buyerData)
        console.log("Buyer registered with ID:", newUser.id)
      } catch (dbError) {
        console.error("Database save error:", dbError)
        return NextResponse.json({ 
          error: "Failed to save user to database",
          details: dbError instanceof Error ? dbError.message : "Unknown error"
        }, { status: 500 })
      }
    } else if (role === "admin") {
      console.log("Processing admin registration...")
      const adminKey = formData.get("adminKey") as string

      // Validate admin authorization key
      if (adminKey !== "TRANSPORT_ADMIN_2024") {
        console.log("Invalid admin key provided")
        return NextResponse.json({ error: "Invalid admin authorization key" }, { status: 403 })
      }

      const adminData = {
        userId,
        passwordHash,
        role: "admin",
        name: formData.get("name") as string,
        mobile: formData.get("mobile") as string,
        email: formData.get("email") as string,
        permissions: ["all"] // Default admin permissions
      }

      console.log("Admin data prepared:", { 
        userId: adminData.userId,
        name: adminData.name,
        email: adminData.email
      })

      // Save to admin database
      try {
        if (getPool()) {
          const newAdmin = await createAdminAsync(adminData)
          console.log("Admin registered with ID:", newAdmin.id)
        } else {
          // Fallback to file storage for admin (not ideal but prevents crash)
          console.log("Admin registration skipped - database not available")
        }
      } catch (dbError) {
        console.error("Admin database save error:", dbError)
        return NextResponse.json({ 
          error: "Failed to save admin to database",
          details: dbError instanceof Error ? dbError.message : "Unknown error"
        }, { status: 500 })
      }
    } else {
      console.log("Invalid role specified:", role)
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 })
    }

    console.log("=== SIGNUP REQUEST SUCCESS ===")
    return NextResponse.json({ message: "Account created successfully" }, { status: 201 })
  } catch (error) {
    console.error("=== SIGNUP REQUEST ERROR ===")
    console.error("Signup error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
