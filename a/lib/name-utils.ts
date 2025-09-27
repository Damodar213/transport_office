/**
 * Utility functions for formatting names and proper nouns
 */

/**
 * Capitalizes the first letter of each word in a string
 * @param str - The string to capitalize
 * @returns The capitalized string
 */
export function capitalizeWords(str: string | null | undefined): string {
  if (!str) return ''
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The string with first letter capitalized
 */
export function capitalizeFirst(str: string | null | undefined): string {
  if (!str) return ''
  
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Capitalizes names (first and last name)
 * @param name - The name to capitalize
 * @returns The capitalized name
 */
export function capitalizeName(name: string | null | undefined): string {
  if (!name) return ''
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Capitalizes company names and places
 * @param str - The string to capitalize
 * @returns The capitalized string
 */
export function capitalizePlace(str: string | null | undefined): string {
  if (!str) return ''
  
  // Common words that should remain lowercase unless they're the first word
  const lowercaseWords = ['of', 'the', 'and', 'in', 'on', 'at', 'to', 'for', 'with', 'by']
  
  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0 || !lowercaseWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }
      return word
    })
    .join(' ')
}

/**
 * Formats document type labels
 * @param type - The document type
 * @returns The formatted document type
 */
export function formatDocumentType(type: string): string {
  const typeMap: Record<string, string> = {
    'pan': 'PAN Card',
    'gst': 'GST Certificate',
    'aadhaar': 'Aadhaar Card',
    'rc': 'RC Card',
    'insurance': 'Insurance',
    'license': 'Driving License',
    'puc': 'PUC Certificate',
    'fitness': 'Fitness Certificate'
  }
  
  return typeMap[type.toLowerCase()] || capitalizeWords(type)
}

/**
 * Formats status labels
 * @param status - The status
 * @returns The formatted status
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'active': 'Active',
    'inactive': 'Inactive',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  }
  
  return statusMap[status.toLowerCase()] || capitalizeFirst(status)
}
