# Vercel Deployment Guide

## Step 1: Deploy to Vercel

### 1.1 Create Vercel Account
1. Go to https://vercel.com/
2. Sign up with GitHub
3. Connect your GitHub account

### 1.2 Deploy Your Project
1. Click "New Project"
2. Import your `transport-o` repository
3. Select the `a` folder as the root directory
4. Framework: Next.js (auto-detected)

### 1.3 Configure Environment Variables
In your Vercel project settings, add these environment variables:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
NEXT_PUBLIC_WEBSITE_URL=https://your-vercel-app.vercel.app
```

**Important**: Replace `NEXT_PUBLIC_API_URL` with your Railway backend URL.

### 1.4 Deploy
1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. Your frontend will be available at: `https://your-app-name.vercel.app`

## Step 2: Update API Calls

### 2.1 Update API Base URL
Your frontend will automatically use the Railway backend URL for API calls.

### 2.2 Test API Integration
1. Visit your Vercel frontend
2. Try logging in
3. Check browser console for any API errors

## Step 3: Domain Configuration (Optional)

### 3.1 Custom Domain
1. In Vercel dashboard, go to "Domains"
2. Add your custom domain
3. Configure DNS settings

### 3.2 SSL Certificate
Vercel automatically provides SSL certificates for all domains.

## Troubleshooting

### Common Issues:
1. **Build Failures**: Check Next.js configuration
2. **API Errors**: Verify Railway backend URL
3. **Environment Variables**: Ensure all variables are set
4. **CORS Issues**: Check Railway CORS settings

### Vercel CLI (Optional):
```bash
npm install -g vercel
vercel login
vercel --prod
```

## Cost Optimization

### Free Tier:
- 100GB bandwidth/month
- 100 serverless function executions
- Sleeps after 30 days of inactivity

### Pro Tier ($20/month):
- 1TB bandwidth/month
- 1M serverless function executions
- Always online
- Better performance
- Custom domains

## Environment Variables Reference

### Required:
```
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
```

### Optional:
```
NEXT_PUBLIC_WEBSITE_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
```

## Next Steps:
1. Deploy to Vercel
2. Configure environment variables
3. Test the frontend
4. Connect frontend to Railway backend
5. Test complete application flow
