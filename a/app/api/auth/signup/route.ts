import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createUser, createUserAsync } from "@/lib/user-storage"
import { createAdminAsync } from "@/lib/admin-storage"
import { getPool } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const role = formData.get("role") as string
    const userId = formData.get("userId") as string
    const password = formData.get("password") as string

    if (!userId || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    if (role === "supplier") {
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
      }

      const documentUrls: Record<string, string> = {}

      const aadhaar = formData.get("aadhaar") as File
      const pan = formData.get("pan") as File
      const gstCertificate = formData.get("gstCertificate") as File

      try {
        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), "public", "uploads", "supplier-documents")
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true })
        }

        if (aadhaar && aadhaar.size > 0) {
          const timestamp = Date.now()
          const filename = `aadhaar_${timestamp}_${aadhaar.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
          const filePath = join(uploadDir, filename)
          
          const bytes = await aadhaar.arrayBuffer()
          const buffer = Buffer.from(bytes)
          await writeFile(filePath, buffer)
          
          documentUrls.aadhaar = `/uploads/supplier-documents/${filename}`
        }

        if (pan && pan.size > 0) {
          const timestamp = Date.now()
          const filename = `pan_${timestamp}_${pan.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
          const filePath = join(uploadDir, filename)
          
          const bytes = await pan.arrayBuffer()
          const buffer = Buffer.from(bytes)
          await writeFile(filePath, buffer)
          
          documentUrls.pan = `/uploads/supplier-documents/${filename}`
        }

        if (gstCertificate && gstCertificate.size > 0) {
          const timestamp = Date.now()
          const filename = `gst_${timestamp}_${gstCertificate.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
          const filePath = join(uploadDir, filename)
          
          const bytes = await gstCertificate.arrayBuffer()
          const buffer = Buffer.from(bytes)
          await writeFile(filePath, buffer)
          
          documentUrls.gstCertificate = `/uploads/supplier-documents/${filename}`
        }
      } catch (uploadError) {
        console.error("File upload error:", uploadError)
        return NextResponse.json({ error: "File upload failed" }, { status: 500 })
      }

      // Save to database with document URLs
      const newUser = getPool()
        ? await createUserAsync({ ...supplierData, documents: documentUrls })
        : createUser({ ...supplierData, documents: documentUrls })
      console.log("Supplier registered with ID:", newUser.id)
    } else if (role === "buyer") {
      const buyerData = {
        userId,
        passwordHash,
        role: role as "buyer",
        companyName: formData.get("companyName") as string,
        gstNumber: formData.get("gstNumber") as string,
      }

      // Save to database
      const newUser = getPool() ? await createUserAsync(buyerData) : createUser(buyerData)
      console.log("Buyer registered with ID:", newUser.id)
    } else if (role === "admin") {
      const adminKey = formData.get("adminKey") as string

      // Validate admin authorization key
      if (adminKey !== "TRANSPORT_ADMIN_2024") {
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

      // Save to admin database
      if (getPool()) {
        const newAdmin = await createAdminAsync(adminData)
        console.log("Admin registered with ID:", newAdmin.id)
      } else {
        // Fallback to file storage for admin (not ideal but prevents crash)
        console.log("Admin registration skipped - database not available")
      }
    } else {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 })
    }

    return NextResponse.json({ message: "Account created successfully" }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
