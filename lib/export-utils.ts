import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface ExportableUser {
  id: number
  userId: string
  name?: string
  email?: string
  mobile?: string
  role: string
  companyName?: string
  isActive?: boolean
  isVerified?: boolean
  registrationDate?: string
  lastLogin?: string
  totalOrders?: number
  gstNumber?: string
}

export const exportToExcel = (users: ExportableUser[], filename: string = 'users') => {
  // Prepare data for Excel export
  const excelData = users.map(user => ({
    'User ID': user.userId,
    'Name': user.name || 'N/A',
    'Email': user.email || 'N/A',
    'Mobile': user.mobile || 'N/A',
    'Role': user.role.charAt(0).toUpperCase() + user.role.slice(1),
    'Company Name': user.companyName || 'N/A',
    'GST Number': user.gstNumber || 'N/A',
    'Status': user.isActive ? 'Active' : 'Inactive',
    'Verified': user.isVerified ? 'Yes' : 'No',
    'Total Orders': user.totalOrders || 0,
    'Registration Date': user.registrationDate || 'N/A',
    'Last Login': user.lastLogin || 'N/A'
  }))

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(excelData)

  // Set column widths
  const columnWidths = [
    { wch: 15 }, // User ID
    { wch: 20 }, // Name
    { wch: 25 }, // Email
    { wch: 15 }, // Mobile
    { wch: 10 }, // Role
    { wch: 25 }, // Company Name
    { wch: 20 }, // GST Number
    { wch: 10 }, // Status
    { wch: 10 }, // Verified
    { wch: 12 }, // Total Orders
    { wch: 20 }, // Registration Date
    { wch: 20 }  // Last Login
  ]
  worksheet['!cols'] = columnWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')

  // Generate and download file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const exportToPDF = (users: ExportableUser[], filename: string = 'users') => {
  // Create new PDF document
  const doc = new jsPDF('l', 'mm', 'a4') // Landscape orientation for better table fit

  // Add title
  doc.setFontSize(20)
  doc.text('User Management Report', 14, 22)

  // Add generation date
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)

  // Add summary
  const totalUsers = users.length
  const suppliers = users.filter(u => u.role === 'supplier').length
  const buyers = users.filter(u => u.role === 'buyer').length
  const activeUsers = users.filter(u => u.isActive).length
  const verifiedUsers = users.filter(u => u.isVerified).length

  doc.setFontSize(12)
  doc.text(`Total Users: ${totalUsers} | Suppliers: ${suppliers} | Buyers: ${buyers} | Active: ${activeUsers} | Verified: ${verifiedUsers}`, 14, 40)

  // Prepare table data
  const tableData = users.map(user => [
    user.userId,
    user.name || 'N/A',
    user.email || 'N/A',
    user.mobile || 'N/A',
    user.role.charAt(0).toUpperCase() + user.role.slice(1),
    user.companyName || 'N/A',
    user.isActive ? 'Active' : 'Inactive',
    user.isVerified ? 'Yes' : 'No',
    user.totalOrders || 0
  ])

  // Add table using autoTable plugin
  autoTable(doc, {
    startY: 50,
    head: [['User ID', 'Name', 'Email', 'Mobile', 'Role', 'Company', 'Status', 'Verified', 'Orders']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 20 }, // User ID
      1: { cellWidth: 25 }, // Name
      2: { cellWidth: 30 }, // Email
      3: { cellWidth: 20 }, // Mobile
      4: { cellWidth: 15 }, // Role
      5: { cellWidth: 30 }, // Company
      6: { cellWidth: 15 }, // Status
      7: { cellWidth: 15 }, // Verified
      8: { cellWidth: 15 }  // Orders
    },
    margin: { left: 14, right: 14 }
  })

  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10)
  }

  // Save the PDF
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
}

export const exportToCSV = (users: ExportableUser[], filename: string = 'users') => {
  // Prepare CSV data
  const headers = [
    'User ID', 'Name', 'Email', 'Mobile', 'Role', 'Company Name', 
    'GST Number', 'Status', 'Verified', 'Total Orders', 'Registration Date', 'Last Login'
  ]
  
  const csvData = users.map(user => [
    user.userId,
    user.name || 'N/A',
    user.email || 'N/A',
    user.mobile || 'N/A',
    user.role.charAt(0).toUpperCase() + user.role.slice(1),
    user.companyName || 'N/A',
    user.gstNumber || 'N/A',
    user.isActive ? 'Active' : 'Inactive',
    user.isVerified ? 'Yes' : 'No',
    user.totalOrders || 0,
    user.registrationDate || 'N/A',
    user.lastLogin || 'N/A'
  ])

  // Convert to CSV string
  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
