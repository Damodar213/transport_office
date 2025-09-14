# Railway Deployment Guide

## Step 1: Deploy to Railway

### 1.1 Create Railway Account
1. Go to https://railway.app/
2. Sign up with GitHub
3. Connect your GitHub account

### 1.2 Deploy Your Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `transport-o` repository
4. Select the `a` folder as the root directory

### 1.3 Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL database
4. Copy the `DATABASE_URL` from the database service

### 1.4 Configure Environment Variables
In your Railway project settings, add these environment variables:

```
NODE_ENV=production
NEXT_PUBLIC_WEBSITE_URL=https://your-app-name.railway.app
SESSION_MAX_AGE=604800
COOKIE_SECURE=true
DEBUG_MODE=false
```

**Important**: Replace `DATABASE_URL` with the one Railway provides for your PostgreSQL database.

### 1.5 Deploy
1. Railway will automatically build and deploy your app
2. Your backend will be available at: `https://your-app-name.railway.app`
3. Test the health endpoint: `https://your-app-name.railway.app/api/health`

## Step 2: Update Frontend for Production

### 2.1 Update API URLs
Update your frontend to use the Railway backend URL instead of localhost.

### 2.2 Environment Variables for Vercel
You'll need to set these in Vercel:
```
NEXT_PUBLIC_API_URL=https://your-app-name.railway.app
```

## Step 3: Database Migration

### 3.1 Run Database Setup
After deployment, you may need to run database migrations or setup scripts.

### 3.2 Test Database Connection
Visit: `https://your-app-name.railway.app/api/health`

## Troubleshooting

### Common Issues:
1. **Build Failures**: Check Node.js version compatibility
2. **Database Connection**: Verify DATABASE_URL is correct
3. **Environment Variables**: Ensure all required variables are set
4. **Health Check**: Monitor the `/api/health` endpoint

### Railway CLI (Optional):
```bash
npm install -g @railway/cli
railway login
railway link
railway up
```

## Cost Optimization

### Free Tier:
- 2 vCPU, 1GB RAM
- 1GB storage
- 100GB bandwidth/month
- Sleeps after 30 days of inactivity

### Pro Tier ($5/month):
- 8 vCPU, 8GB RAM
- 100GB storage
- 1TB bandwidth/month
- Always online
- Better performance

## Next Steps:
1. Deploy to Railway
2. Test the backend
3. Deploy frontend to Vercel
4. Configure environment variables
5. Test the complete application
