# Railway Backend Deployment Guide

## Prerequisites
- ✅ Railway account created
- ✅ Database already exists on Railway
- ✅ Frontend deployed on Vercel
- ✅ GitHub repository connected

## Step-by-Step Deployment

### 1. Create New Railway Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose repository: `transport_office`
5. Select branch: `master`

### 2. Configure Project Settings
1. **Root Directory**: Set to `/a`
2. **Build Command**: Will use Dockerfile automatically
3. **Start Command**: `npm start` (defined in Dockerfile)

### 3. Environment Variables
Add these in Railway dashboard → Variables tab:

```bash
DATABASE_URL=postgresql://postgres:YfXpeZtUiruQBplCWyQRFxbjgOndegRM@centerbeam.proxy.rlwy.net:31147/railway
CLOUDFLARE_ACCOUNT_ID=647796bf4c8eb7ab955a6a5c09111478
CLOUDFLARE_ACCESS_KEY_ID=c987b2796246f9103693cdf7a023b9a1
CLOUDFLARE_SECRET_ACCESS_KEY=9e3b690a45343225f3211111fd381329a05c8797a63f21b528663c0e6270c7f3
CLOUDFLARE_R2_BUCKET_NAME=transport-office
CLOUDFLARE_R2_PUBLIC_URL=https://pub-d6f2388c5c814d8eb8321b27558ed5e3.r2.dev
NEXT_PUBLIC_API_URL=https://your-railway-app-url.railway.app
NEXT_PUBLIC_WEBSITE_URL=https://your-vercel-app-url.vercel.app
NODE_ENV=production
```

### 4. Deploy
1. Railway will automatically start building
2. Monitor build logs in dashboard
3. Wait for deployment to complete
4. Note your Railway URL (e.g., `https://your-app-name-production.up.railway.app`)

### 5. Update Vercel Environment Variables
1. Go to Vercel dashboard
2. Project settings → Environment Variables
3. Update `NEXT_PUBLIC_API_URL` with your Railway URL

### 6. Test Deployment
```bash
# Test Railway backend
node test-railway-deployment.js https://your-railway-app-url.railway.app

# Test complete flow
# 1. Visit your Vercel frontend
# 2. Try logging in with existing credentials
# 3. Check if API calls work
```

## Expected Results
- ✅ Railway builds successfully (no pnpm errors)
- ✅ Health endpoint responds: `/api/health`
- ✅ Database connection works
- ✅ Login API accessible: `/api/auth/login`
- ✅ Frontend can communicate with backend

## Troubleshooting
- **Build fails**: Check Railway logs for specific errors
- **Database connection fails**: Verify DATABASE_URL is correct
- **API not accessible**: Check Railway URL and environment variables
- **Frontend can't reach backend**: Update NEXT_PUBLIC_API_URL in Vercel

## Cost Information
- **Railway Free Tier**: $0/month (with limitations)
- **Railway Pro**: $5/month (recommended for production)
- **Database**: Already exists, no additional cost

## Next Steps
1. Deploy backend to Railway
2. Test the complete application
3. Configure custom domains (optional)
4. Set up monitoring and alerts
