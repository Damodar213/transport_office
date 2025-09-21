/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg'],
  images: {
    domains: ['localhost', 'your-railway-domain.railway.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.railway.app',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      }
    ]
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
}

export default nextConfig
