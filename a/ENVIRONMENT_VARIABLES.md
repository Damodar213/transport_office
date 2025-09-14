# Environment Variables Configuration

## Railway (Backend + Database)

### Required Variables:
```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@host:port/railway
NEXT_PUBLIC_WEBSITE_URL=https://your-app-name.railway.app
```

### Optional Variables:
```
SESSION_MAX_AGE=604800
COOKIE_SECURE=true
DEBUG_MODE=false
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key_here
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name_here
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.your-account-id.r2.cloudflarestorage.com
```

## Vercel (Frontend)

### Required Variables:
```
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
NEXT_PUBLIC_WEBSITE_URL=https://your-vercel-app.vercel.app
```

### Optional Variables:
```
NODE_ENV=production
```

## How to Set Environment Variables

### Railway:
1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add each variable with its value
5. Click "Deploy" to apply changes

### Vercel:
1. Go to your Vercel project dashboard
2. Go to "Settings" → "Environment Variables"
3. Add each variable with its value
4. Select environment (Production, Preview, Development)
5. Click "Save"

## Important Notes:

1. **DATABASE_URL**: Railway automatically provides this when you add a PostgreSQL database
2. **NEXT_PUBLIC_***: These variables are exposed to the browser
3. **API URLs**: Must match your actual deployment URLs
4. **Security**: Never commit sensitive variables to Git

## Testing Environment Variables:

### Railway:
```bash
curl https://your-app-name.railway.app/api/health
```

### Vercel:
```bash
curl https://your-vercel-app.vercel.app
```

## Troubleshooting:

### Common Issues:
1. **Missing Variables**: Check if all required variables are set
2. **Wrong URLs**: Verify API URLs are correct
3. **CORS Issues**: Check if Railway allows requests from Vercel
4. **Database Connection**: Verify DATABASE_URL is correct

### Debug Commands:
```bash
# Check Railway logs
railway logs

# Check Vercel logs
vercel logs

# Test API endpoints
curl https://your-railway-app.railway.app/api/health
```
