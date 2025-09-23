# Cloudflare R2 Integration - Complete Setup

## 🎉 Integration Complete!

Your transport office application has been successfully integrated with Cloudflare R2 for secure document storage. Here's what has been implemented:

## ✅ What's Been Done

### 1. **Dependencies Installed**
- `@aws-sdk/client-s3` - For Cloudflare R2 API interactions
- `@aws-sdk/s3-request-presigner` - For signed URL generation

### 2. **Core Services Created**
- **`lib/cloudflare-r2.ts`** - Main service for R2 operations
  - File upload to R2
  - Signed URL generation
  - File deletion
  - Key generation and URL extraction

### 3. **API Endpoints Updated**
- **`app/api/upload/route.ts`** - Now uses Cloudflare R2 instead of local storage
  - Supports user-specific file organization
  - Enhanced error handling
  - File deletion capabilities

### 4. **File Utilities Enhanced**
- **`lib/file-utils.ts`** - Updated to work with Cloudflare URLs
  - Cloudflare URL detection
  - File key extraction
  - Category-based organization

### 5. **Components Updated**
- **`components/ui/file-upload.tsx`** - Enhanced with userId support
- **`components/examples/cloudflare-file-upload-example.tsx`** - Example implementation

### 6. **Migration Tools**
- **`scripts/migrate-to-cloudflare.js`** - Migrate existing local files to R2
- **Package.json scripts** - Easy migration commands

### 7. **Documentation**
- **`CLOUDFLARE_SETUP.md`** - Comprehensive setup guide
- **`env.local.example`** - Environment variable template

## 🚀 Quick Start

### 1. Set Up Environment Variables
```bash
cp env.local.example .env.local
```

Edit `.env.local` with your Cloudflare credentials:
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key_here
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name_here
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.your-account-id.r2.cloudflarestorage.com
```

### 2. Test the Integration
```bash
npm run dev
```

Visit your signup page and try uploading a document.

### 3. Migrate Existing Files (Optional)
```bash
# See what will be migrated
npm run migrate-to-cloudflare:dry-run

# Run migration
npm run migrate-to-cloudflare
```

## 📁 File Organization

Files are now organized in Cloudflare R2 as:
```
your-bucket/
├── supplier-documents/
│   └── user123/
│       ├── 1703123456789_aadhaar.pdf
│       ├── 1703123456790_pan.pdf
│       └── 1703123456791_gst.pdf
├── vehicle-documents/
│   └── user123/
│       ├── 1703123456792_rc.pdf
│       └── 1703123456793_insurance.pdf
└── general/
    └── 1703123456794_document.pdf
```

## 🔧 Key Features

### **Secure File Storage**
- Files stored in Cloudflare R2 with proper access controls
- User-specific organization prevents unauthorized access
- Metadata tracking for audit purposes

### **Enhanced File Management**
- Automatic file validation (type, size)
- Progress indicators during upload
- Easy file deletion and management
- Signed URLs for secure access

### **Scalable Architecture**
- No local storage limitations
- Global CDN distribution
- Automatic scaling with usage

### **Developer Friendly**
- Simple API integration
- Comprehensive error handling
- Easy migration from local storage
- Detailed logging and debugging

## 🛡️ Security Features

1. **Access Control**
   - User-specific file organization
   - Signed URLs for temporary access
   - Proper CORS configuration

2. **File Validation**
   - Type checking (PDF, JPG, PNG only)
   - Size limits (5MB default)
   - Filename sanitization

3. **Audit Trail**
   - Upload timestamps
   - User tracking
   - File metadata storage

## 📊 Usage Examples

### Basic File Upload
```typescript
import { FileUpload } from "@/components/ui/file-upload"

<FileUpload
  label="Aadhaar Card"
  name="aadhaar"
  userId="user123"
  onFileChange={(file, url) => {
    // Handle uploaded file
    console.log("File uploaded:", url)
  }}
/>
```

### Programmatic Upload
```typescript
import { uploadFile } from "@/lib/file-utils"

const result = await uploadFile(file, "aadhaar", "user123")
console.log("Uploaded to:", result.url)
```

### File Deletion
```typescript
import { deleteFile } from "@/lib/file-utils"

await deleteFile("aadhaar/user123/1703123456789_aadhaar.pdf")
```

## 🔍 Troubleshooting

### Common Issues

1. **Environment Variables Not Loaded**
   - Ensure `.env.local` exists and is properly formatted
   - Restart your development server after changes

2. **Upload Failures**
   - Check Cloudflare R2 bucket permissions
   - Verify API token has correct permissions
   - Check browser console for detailed error messages

3. **CORS Issues**
   - Configure CORS settings in your R2 bucket
   - Ensure public URL is correctly formatted

### Debug Mode
Add to your `.env.local`:
```env
DEBUG=cloudflare-r2
```

## 📈 Next Steps

1. **Production Deployment**
   - Set up production R2 bucket
   - Configure production environment variables
   - Set up monitoring and alerts

2. **Advanced Features**
   - Implement file versioning
   - Add virus scanning
   - Set up automated backups

3. **Performance Optimization**
   - Enable Cloudflare CDN
   - Implement image optimization
   - Set up caching strategies

## 🆘 Support

- **Documentation**: See `CLOUDFLARE_SETUP.md` for detailed setup instructions
- **Examples**: Check `components/examples/cloudflare-file-upload-example.tsx`
- **Migration**: Use `scripts/migrate-to-cloudflare.js` for existing files

## 🎯 Benefits

✅ **Scalable**: No storage limits, global distribution  
✅ **Secure**: User-specific organization, signed URLs  
✅ **Fast**: CDN-backed delivery, optimized performance  
✅ **Cost-effective**: Pay only for what you use  
✅ **Reliable**: 99.9% uptime SLA from Cloudflare  
✅ **Developer-friendly**: Simple API, comprehensive documentation  

Your transport office application is now ready to handle document uploads at scale with Cloudflare R2! 🚀








