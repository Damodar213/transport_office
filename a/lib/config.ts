// Configuration file for the transport office application
// Update these values when deploying to production

export const config = {
  // Website URL - Update this when deploying to Vercel
  websiteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL || "https://your-app.vercel.app",
  
  // WhatsApp message template
  whatsapp: {
    // Default message template
    defaultTemplate: `Hello {name},

We need {vehicleCount} vehicles for transport services in {district}.

{customMessage}

Please visit our platform to view and accept this request: {websiteUrl}

Best regards,
Transport Office Team`
  }
}
