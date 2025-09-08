# Supplier Documents Dynamic System Setup

This guide explains how to set up the dynamic supplier documents system that fetches all supplier documents from the database in the admin dashboard.

## 🚀 Quick Setup

### 1. Run the Setup Script
```bash
npm run setup-documents
```

This will:
- Create the `supplier_documents` table in your database
- Migrate existing document data from JSON files
- Test the new API endpoints

### 2. Start Your Development Server
```bash
npm run dev
```

### 3. Access Admin Dashboard
1. Go to `http://localhost:3000/admin/dashboard`
2. Click on the "Document Review" tab
3. You should now see all supplier documents dynamically loaded from the database

## 📊 What's New

### Database-Driven Document Management
- **Real-time data**: Documents are now fetched directly from the database
- **Better performance**: No more file-based storage limitations
- **Scalable**: Can handle thousands of document submissions
- **Reliable**: Uses the same robust database connection system

### Enhanced Admin Interface
- **Grouped by supplier**: Documents are organized by supplier for better management
- **Real-time updates**: Changes are immediately reflected in the dashboard
- **Better filtering**: Filter documents by status (pending, approved, rejected)
- **Improved review process**: Streamlined document approval workflow

## 🔧 Technical Details

### New Database Table: `supplier_documents`
```sql
CREATE TABLE supplier_documents (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  supplier_name VARCHAR(255),
  company_name VARCHAR(255),
  document_type VARCHAR(50) NOT NULL,
  document_url TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  review_notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### New API Endpoints

#### GET `/api/admin/supplier-documents`
Fetches all supplier documents with optional filtering:
- `?status=pending` - Filter by status
- `?limit=50` - Limit results
- `?offset=0` - Pagination offset

#### PATCH `/api/admin/supplier-documents`
Updates document status:
```json
{
  "id": 123,
  "status": "approved",
  "reviewNotes": "Document looks good",
  "reviewer": "Admin"
}
```

#### POST `/api/admin/supplier-documents`
Creates new document submission (for manual entry):
```json
{
  "userId": "supplier123",
  "supplierName": "John Doe",
  "companyName": "ABC Transport",
  "documentType": "gst",
  "documentUrl": "/uploads/documents/gst.pdf"
}
```

## 📈 Migration Process

The setup script automatically migrates existing data from:

1. **JSON file storage** (`data/documents.json`)
2. **User documents** (from `users` table `documents` column)

All existing document submissions will be preserved and moved to the new database table.

## 🔍 Testing the System

### 1. Test Database Connection
```bash
npm run test-db
```

### 2. Test Document API
```bash
curl http://localhost:3000/api/admin/supplier-documents
```

### 3. Test Document Review
1. Go to admin dashboard
2. Find a pending document
3. Click "Review" button
4. Approve or reject with notes
5. Verify the status updates immediately

## 🚨 Troubleshooting

### Documents Not Showing
1. Check if database is connected: `npm run test-db`
2. Run the setup script again: `npm run setup-documents`
3. Check browser console for errors
4. Verify admin authentication

### Migration Issues
1. Check database permissions
2. Ensure `supplier_documents` table exists
3. Check server logs for migration errors
4. Manually run migration: `POST /api/migrate-create-supplier-documents`

### API Errors
1. Check authentication (must be logged in as admin)
2. Verify database connection
3. Check API endpoint URLs
4. Review server logs for detailed error messages

## 📋 Features

### For Admins
- ✅ View all supplier documents in one place
- ✅ Filter by document status
- ✅ Review and approve/reject documents
- ✅ Add review notes
- ✅ Track review history
- ✅ Real-time updates

### For Suppliers
- ✅ Documents automatically appear in admin dashboard after upload
- ✅ Status updates are reflected immediately
- ✅ No changes needed to existing signup process

## 🔄 Data Flow

1. **Supplier Registration**: Documents uploaded during signup
2. **Database Storage**: Documents saved to `supplier_documents` table
3. **Admin Dashboard**: Real-time fetching from database
4. **Document Review**: Status updates saved to database
5. **Real-time Updates**: Changes immediately visible in dashboard

## 🎯 Benefits

- **Performance**: Faster loading with database queries
- **Reliability**: No file corruption or loss
- **Scalability**: Can handle large numbers of documents
- **Consistency**: Same data source for all operations
- **Backup**: Database backups include all document metadata
- **Search**: Can add search functionality easily
- **Analytics**: Can generate reports on document submissions

Your supplier documents system is now fully dynamic and database-driven! 🎉


