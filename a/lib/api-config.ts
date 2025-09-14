// API configuration for different environments
export const API_CONFIG = {
  // Get API base URL from environment variables
  baseURL: process.env.NEXT_PUBLIC_API_URL || 
           (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  
  // API endpoints
  endpoints: {
    login: '/api/auth/login',
    adminLogin: '/api/auth/admin-login',
    health: '/api/health',
    users: '/api/users',
    orders: '/api/orders',
    documents: '/api/documents'
  }
}

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.baseURL}${endpoint}`
}

// Helper function to get API endpoint
export function getApiEndpoint(key: keyof typeof API_CONFIG.endpoints): string {
  return getApiUrl(API_CONFIG.endpoints[key])
}
