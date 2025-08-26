# Transport Office

A comprehensive transport management system for connecting suppliers and buyers.

## Features

- **User Management**: Admin dashboard for managing suppliers and buyers
- **WhatsApp Integration**: Send messages to users directly via WhatsApp
- **Order Management**: Track and manage transport orders
- **Document Verification**: Verify supplier documents
- **Real-time Notifications**: Stay updated with system activities

## WhatsApp Messaging Feature

The admin panel includes a WhatsApp messaging feature that allows administrators to send messages to users (suppliers/buyers) directly through WhatsApp.

### How to Use:

1. Go to Admin Dashboard → User Management
2. Find the user you want to message
3. Click the WhatsApp icon (green message icon) in the Actions column
4. Fill in the required details:
   - Number of vehicles needed
   - District/location
   - Additional custom message (optional)
5. Review the message preview
6. Click "Send WhatsApp Message" to open WhatsApp with the pre-filled message

### Configuration

To update the website URL for deployment:

1. Update the `NEXT_PUBLIC_WEBSITE_URL` environment variable in your deployment
2. Or modify the `websiteUrl` in `lib/config.ts` directly

Example for Vercel deployment:
```bash
# Set environment variable in Vercel dashboard
NEXT_PUBLIC_WEBSITE_URL=https://your-app.vercel.app
```

## Installation

```bash
npm install
npm run dev
```

## Environment Variables

- `NEXT_PUBLIC_WEBSITE_URL`: Your deployed website URL (for WhatsApp messages)
- `DATABASE_URL`: PostgreSQL connection string (optional)
- `DEFAULT_ADMIN_PASSWORD`: Default admin password (default: admin123)