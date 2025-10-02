# WhatsApp Deployment Guide

## Overview

Your WhatsApp messages now include dynamic links to your deployed website. This guide explains how to set up the environment variable so you never have to update code when deploying.

## How It Works

✅ **No Code Changes Needed**: The WhatsApp messages automatically use your deployed URL
✅ **Environment Variable**: Just update `NEXT_PUBLIC_WEBSITE_URL` in your deployment platform
✅ **No Deployment Cycle**: Change the URL without redeploying code

## WhatsApp Message Format

Your WhatsApp messages now include:

```
🚛 *NEW TRANSPORT ORDER AVAILABLE*

📋 *Order Details:*
• Order: ORD-1
• Load Type: Steel
• Weight: 25 tons
• From: Mumbai → Delhi
• Required Date: 2025-10-15

🌐 *Access Your Supplier Dashboard:*
https://your-app.vercel.app/supplier/dashboard

*Contact for more details:*
*MAHALAXMI TRANSPORT*
📞 8217563933
📞 80736 27241
```

## Setup Instructions

### 1. For Vercel Deployment

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add/Update: `NEXT_PUBLIC_WEBSITE_URL = https://your-app.vercel.app`
5. Redeploy (one time only)

### 2. For Railway Deployment

1. Go to your Railway dashboard
2. Select your project
3. Go to Variables tab
4. Add/Update: `NEXT_PUBLIC_WEBSITE_URL = https://your-app.railway.app`
5. Railway will auto-redeploy

### 3. For Other Platforms

Set the environment variable:
```bash
NEXT_PUBLIC_WEBSITE_URL=https://your-deployed-domain.com
```

## Important Notes

- ✅ **Set this BEFORE first deployment** to avoid any deployment cycles
- ✅ **Use your actual deployed URL** (not localhost)
- ✅ **Include https://** in the URL
- ✅ **No trailing slash** needed

## Testing

1. Deploy your app with the environment variable set
2. Send a test WhatsApp message from admin panel
3. Verify the link in WhatsApp points to your deployed site
4. Test that suppliers can access the dashboard via the link

## Fallback

If the environment variable is not set, it defaults to `http://localhost:3000` for development.

## Example Environment Variables

```bash
# For Vercel
NEXT_PUBLIC_WEBSITE_URL=https://transport-office.vercel.app

# For Railway  
NEXT_PUBLIC_WEBSITE_URL=https://transport-office-production.up.railway.app

# For Custom Domain
NEXT_PUBLIC_WEBSITE_URL=https://mahalaxmitransport.com
```

## Benefits

✅ **No code updates** when changing domains
✅ **No redeployment cycles** 
✅ **Easy domain changes**
✅ **Works across all deployment platforms**
✅ **Automatic fallback for development**
