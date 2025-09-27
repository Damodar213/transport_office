# Deployment Testing Guide

## Step 1: Test Railway Backend

### 1.1 Health Check
```bash
curl https://your-railway-app.railway.app/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T...",
  "database": {
    "healthy": true,
    "message": "Database connection is healthy"
  },
  "uptime": 123.45,
  "memory": {...},
  "version": "v18.17.0"
}
```

### 1.2 Test Authentication
```bash
# Test admin login
curl -X POST https://your-railway-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"admin123","password":"admin123","role":"admin"}'

# Test supplier login
curl -X POST https://your-railway-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"sude","password":"111111","role":"supplier"}'

# Test buyer login
curl -X POST https://your-railway-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"a","password":"1","role":"buyer"}'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "user": {
    "userId": 72,
    "userIdString": "admin123",
    "role": "admin",
    "email": "damodark818@gmail.com",
    "name": "Damodar k",
    "companyName": null
  }
}
```

## Step 2: Test Vercel Frontend

### 2.1 Basic Access
1. Visit: `https://your-vercel-app.vercel.app`
2. Check if the page loads correctly
3. Verify all assets (CSS, JS, images) load

### 2.2 Login Functionality
1. Go to: `https://your-vercel-app.vercel.app/login`
2. Test login with these credentials:

**Admin:**
- User ID: `admin123`
- Password: `admin123`

**Supplier:**
- User ID: `sude`
- Password: `111111`

**Buyer:**
- User ID: `a`
- Password: `1`

### 2.3 Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for any errors or warnings
4. Check Network tab for failed API calls

## Step 3: Test Complete Flow

### 3.1 End-to-End Testing
1. **Login**: Use any of the test credentials
2. **Dashboard**: Verify you're redirected to the correct dashboard
3. **Navigation**: Test navigation between pages
4. **API Calls**: Check if all API calls work
5. **Logout**: Test logout functionality

### 3.2 Performance Testing
1. **Page Load Speed**: Check if pages load quickly
2. **API Response Time**: Monitor API response times
3. **Database Queries**: Check if database queries are fast

## Step 4: Monitor and Debug

### 4.1 Railway Monitoring
1. Go to Railway dashboard
2. Check "Metrics" tab for:
   - CPU usage
   - Memory usage
   - Database connections
   - Response times

### 4.2 Vercel Monitoring
1. Go to Vercel dashboard
2. Check "Analytics" tab for:
   - Page views
   - Performance metrics
   - Error rates

### 4.3 Log Monitoring
1. **Railway Logs**: Check for errors in Railway dashboard
2. **Vercel Logs**: Check for errors in Vercel dashboard
3. **Browser Console**: Check for client-side errors

## Troubleshooting Common Issues

### Backend Issues:
1. **Database Connection**: Check DATABASE_URL
2. **Environment Variables**: Verify all required variables are set
3. **Build Failures**: Check Railway build logs
4. **API Errors**: Check Railway application logs

### Frontend Issues:
1. **API Calls Failing**: Check NEXT_PUBLIC_API_URL
2. **Build Failures**: Check Vercel build logs
3. **CORS Errors**: Check Railway CORS settings
4. **Environment Variables**: Verify all variables are set

### Performance Issues:
1. **Slow Loading**: Check Railway resource usage
2. **Database Slow**: Check database connection pool
3. **API Timeouts**: Check Railway timeout settings

## Success Criteria:

✅ **Backend Health Check**: Returns 200 OK
✅ **Authentication**: All login credentials work
✅ **Frontend Loading**: Pages load without errors
✅ **API Integration**: Frontend successfully calls backend APIs
✅ **Database**: All database operations work
✅ **Performance**: Response times under 2 seconds
✅ **Error Handling**: Proper error messages displayed

## Next Steps After Testing:

1. **Fix any issues** found during testing
2. **Optimize performance** if needed
3. **Set up monitoring** and alerts
4. **Configure custom domains** if desired
5. **Set up CI/CD** for automatic deployments
