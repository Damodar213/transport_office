# Cloudflare R2 Integration Setup Guide

This guide will help you set up Cloudflare R2 for storing document images (Aadhaar, RC, etc.) in your transport office application.

## Prerequisites

- A Cloudflare account
- Access to Cloudflare dashboard
- Your transport office application running locally

## Step 1: Create a Cloudflare R2 Bucket

1. **Log in to Cloudflare Dashboard**
   - Go to [https://dash.cloudflare.com](https://dash.cloudflare.com)
   - Sign in to your account

2. **Navigate to R2 Object Storage**
   - In the left sidebar, click on "R2 Object Storage"
   - Click "Create bucket"

3. **Configure Your Bucket**
   - **Bucket name**: Choose a unique name (e.g., `transport-office-documents`)
   - **Location**: Choose the region closest to your users
   - Click "Create bucket"

## Step 2: Create R2 API Token

1. **Go to R2 API Tokens**
   - In the R2 dashboard, click on "Manage R2 API tokens"
   - Click "Create API token"

2. **Configure the Token**
   - **Token name**: `transport-office-upload`
   - **Permissions**: 
     - Object: `Edit`
     - Bucket: Select your bucket name
   - **TTL**: Set appropriate expiration (recommend 1 year for production)
   - Click "Create API token"

3. **Save Your Credentials**
   - Copy the **Access Key ID**
   - Copy the **Secret Access Key**
   - **Important**: Store these securely - you won't be able to see the secret key again

## Step 3: Configure Your Application

1. **Create Environment File**
   ```bash
   cp env.local.example .env.local
   ```

2. **Update Environment Variables**
   Open `.env.local` and fill in your Cloudflare credentials:
   ```env
   # Cloudflare R2 Configuration
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id_here
   CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key_here
   CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name_here
   CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.your-account-id.r2.cloudflarestorage.com
   ```

3. **Find Your Account ID**
   - In Cloudflare dashboard, go to the right sidebar
   - Your Account ID is displayed under "Account ID"

4. **Set Up Public URL**
   - Go to your R2 bucket settings
   - Enable "Public access" if you want direct file access
   - The public URL format is: `https://your-bucket.your-account-id.r2.cloudflarestorage.com`

## Step 4: Test the Integration

1. **Start Your Application**
   ```bash
   npm run dev
   ```

2. **Test File Upload**
   - Go to the signup page
   - Try uploading a document (Aadhaar, RC, etc.)
   - Check the browser network tab to see if the upload succeeds
   - Verify the file appears in your R2 bucket

## Step 5: Migrate Existing Files (Optional)

If you have existing files in the `public/uploads` directory, you can migrate them to Cloudflare R2:

1. **Run Migration Script**
   ```bash
   # Dry run first to see what will be migrated
   node scripts/migrate-to-cloudflare.js --dry-run
   
   # Run actual migration
   node scripts/migrate-to-cloudflare.js
   
   # Run migration and delete local files
   node scripts/migrate-to-cloudflare.js --delete-local
   ```

2. **Verify Migration**
   - Check your R2 bucket for uploaded files
   - Verify document URLs in your application still work

## Step 6: Configure CORS (If Needed)

If you encounter CORS issues when accessing files directly:

1. **Go to R2 Bucket Settings**
2. **Add CORS Configuration**
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env.local` to version control
   - Use different buckets for development and production
   - Rotate API tokens regularly

2. **File Access**
   - Consider using signed URLs for sensitive documents
   - Implement proper authentication for file access
   - Set appropriate bucket policies

3. **File Validation**
   - The application already validates file types and sizes
   - Consider adding virus scanning for production use

## Troubleshooting

### Common Issues

1. **"Access Denied" Error**
   - Verify your API token has correct permissions
   - Check if the bucket name is correct
   - Ensure your account ID is correct

2. **"Bucket Not Found" Error**
   - Verify the bucket exists in your R2 dashboard
   - Check the bucket name spelling

3. **CORS Issues**
   - Configure CORS settings in your R2 bucket
   - Check if the public URL is correctly formatted

4. **File Upload Fails**
   - Check browser console for error messages
   - Verify environment variables are loaded
   - Test with a smaller file first

### Debug Mode

To enable debug logging, add this to your `.env.local`:
```env
DEBUG=cloudflare-r2
```

## Production Deployment

1. **Update Environment Variables**
   - Set production values in your deployment platform
   - Use a production bucket name
   - Set appropriate CORS policies

2. **Update Public URL**
   - Use your production domain for the public URL
   - Consider using a custom domain for better branding

3. **Monitor Usage**
   - Set up Cloudflare analytics
   - Monitor storage costs
   - Set up alerts for unusual activity

## Cost Optimization

1. **Storage Classes**
   - Use appropriate storage classes for different file types
   - Consider lifecycle policies for old files

2. **CDN Integration**
   - Enable Cloudflare CDN for faster file delivery
   - Use appropriate cache settings

3. **Monitoring**
   - Monitor storage usage
   - Set up billing alerts

## Support

If you encounter issues:

1. Check the Cloudflare R2 documentation
2. Review the application logs
3. Test with a simple file upload first
4. Verify all environment variables are set correctly

## File Structure

After setup, your files will be organized in R2 as:
```
your-bucket/
├── supplier-documents/
│   ├── user123/
│   │   ├── 1703123456789_aadhaar.pdf
│   │   ├── 1703123456790_pan.pdf
│   │   └── 1703123456791_gst.pdf
│   └── user456/
│       └── 1703123456792_aadhaar.pdf
├── vehicle-documents/
│   └── user123/
│       ├── 1703123456793_rc.pdf
│       └── 1703123456794_insurance.pdf
└── general/
    └── 1703123456795_document.pdf
```

This structure helps organize files by category and user, making management easier.














