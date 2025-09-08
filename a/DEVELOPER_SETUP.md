# Developer Setup Guide

This guide helps you set up the project for development on multiple machines without conflicts.

## 🚨 Important: Separate Environment Setup

Since you're working on the same project with your friend, you need separate environment configurations to avoid conflicts.

## Step 1: Create Your Local Environment File

1. **Copy the example environment file:**
   ```bash
   cp env.local.example .env.local
   ```

2. **Edit `.env.local` with your specific settings:**
   ```env
   # Database Configuration - USE DIFFERENT DATABASES
   DATABASE_URL=postgresql://your_username:your_password@localhost:5432/transport_office_your_name
   
   # Application Configuration
   NEXT_PUBLIC_WEBSITE_URL=http://localhost:3000
   NODE_ENV=development
   
   # Optional: Cloudflare R2 (if you have your own account)
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id_here
   CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key_here
   CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name_here
   CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.your-account-id.r2.cloudflarestorage.com
   ```

## Step 2: Database Setup Options

### Option A: Local PostgreSQL (Recommended)
1. Install PostgreSQL locally
2. Create separate databases for each developer:
   ```sql
   CREATE DATABASE transport_office_arun;
   CREATE DATABASE transport_office_friend;
   ```

### Option B: Separate Cloud Databases
1. Create separate database instances on:
   - [Neon](https://neon.tech) (Free tier available)
   - [Railway](https://railway.app) (Free tier available)
   - [Supabase](https://supabase.com) (Free tier available)

### Option C: Shared Database with Different Schemas
If you must use the same database:
```sql
CREATE SCHEMA arun_dev;
CREATE SCHEMA friend_dev;
```
Then modify your DATABASE_URL to include the schema:
```
DATABASE_URL=postgresql://user:pass@host:port/db?schema=arun_dev
```

## Step 3: Git Configuration

1. **Add `.env.local` to `.gitignore`** (should already be there):
   ```gitignore
   .env.local
   .env.*.local
   ```

2. **Never commit environment files:**
   ```bash
   git status  # Make sure .env.local is not listed
   ```

## Step 4: Development Workflow

### Before Starting Development:
1. Pull latest changes:
   ```bash
   git pull origin main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Check your environment:
   ```bash
   npm run dev
   # Visit http://localhost:3000/api/test-db-connection
   ```

### When Making Changes:
1. Test locally first
2. Commit your changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

3. **Coordinate with your friend** - don't push at the same time

## Step 5: Troubleshooting Common Issues

### Database Connection Issues:
```bash
# Test database connection
curl http://localhost:3000/api/test-db-connection

# Check environment variables
node -e "console.log(process.env.DATABASE_URL)"
```

### Session Conflicts:
- Clear your browser cookies for localhost:3000
- Restart your development server
- Check that you're using different database instances

### Port Conflicts:
If port 3000 is busy:
```bash
npm run dev -- -p 3001
```

## Step 6: Production Deployment

When deploying to production:

1. **Set environment variables in your hosting platform:**
   - Vercel: Project Settings → Environment Variables
   - Railway: Variables tab
   - Render: Environment tab

2. **Use production database URL**
3. **Set NODE_ENV=production**
4. **Set COOKIE_SECURE=true**

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `NEXT_PUBLIC_WEBSITE_URL` | Yes | Your website URL | `http://localhost:3000` |
| `NODE_ENV` | No | Environment mode | `development` or `production` |
| `CLOUDFLARE_*` | No | For file uploads | See Cloudflare setup |

## Quick Commands

```bash
# Start development server
npm run dev

# Test database connection
curl http://localhost:3000/api/test-db-connection

# Check environment
node -e "console.log(require('./lib/config').config)"

# Build for production
npm run build
npm start
```

## Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Check the terminal for server errors
3. Verify your environment variables
4. Test database connectivity
5. Clear browser cache and cookies


