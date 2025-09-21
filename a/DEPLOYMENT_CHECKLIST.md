# 🚀 Deployment Checklist

## Railway Backend Deployment

### ✅ Pre-deployment Setup
- [x] Syntax errors fixed across 100+ API routes
- [x] Procfile configured for Railway
- [x] next.config.mjs created with standalone output
- [x] Package.json has correct build scripts

### 🔧 Railway Configuration
1. **Connect Repository**
   - [ ] Go to Railway.app
   - [ ] New Project → Deploy from GitHub
   - [ ] Select `transport_office` repository
   - [ ] Choose `master` branch

2. **Environment Variables**
   ```bash
   NODE_ENV=production
   NEXT_PUBLIC_WEBSITE_URL=https://your-app-name.railway.app
   DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```

3. **Database Setup**
   - [ ] Railway will auto-create PostgreSQL database
   - [ ] Copy DATABASE_URL to environment variables
   - [ ] Test database connection

### 🚀 Deploy
- [ ] Railway will auto-deploy on git push
- [ ] Monitor build logs
- [ ] Test API endpoints

## Vercel Frontend Deployment

### ✅ Pre-deployment Setup
- [x] vercel.json configured
- [x] API configuration supports environment variables
- [x] Next.js app structure ready

### 🔧 Vercel Configuration
1. **Connect Repository**
   - [ ] Go to Vercel.com
   - [ ] New Project → Import from GitHub
   - [ ] Select `transport_office` repository
   - [ ] Set Root Directory to `a`

2. **Environment Variables**
   ```bash
   NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
   NEXT_PUBLIC_WEBSITE_URL=https://your-vercel-app.vercel.app
   NODE_ENV=production
   ```

3. **Build Settings**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 🚀 Deploy
- [ ] Vercel will auto-deploy
- [ ] Test frontend functionality
- [ ] Verify API connections

## 🔗 Post-Deployment

### Testing
- [ ] Test user registration/login
- [ ] Test order placement
- [ ] Test file uploads
- [ ] Test admin functions

### Monitoring
- [ ] Check Railway logs
- [ ] Check Vercel analytics
- [ ] Monitor database performance

## 🆘 Troubleshooting

### Common Issues
1. **Build Failures**: Check syntax errors (already fixed)
2. **Database Connection**: Verify DATABASE_URL
3. **CORS Issues**: Check API configuration
4. **Environment Variables**: Ensure all required vars are set

### Support
- Railway: Check deployment logs
- Vercel: Check build logs
- Database: Test connection endpoints
