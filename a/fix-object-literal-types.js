const fs = require('fs');
const path = require('path');

// List of files that might have object literal type issues
const files = [
  'app/api/admin/available-suppliers/route.ts',
  'app/api/test-login-flow/route.ts',
  'app/api/test-signup-error/route.ts',
  'app/api/admin/send-order-to-suppliers/route.ts',
  'app/api/auth/signup/route.ts',
  'app/api/admin/send-manual-order-to-suppliers/route.ts',
  'app/api/auth/login/route.ts',
  'app/api/auth/admin-login/route.ts',
  'app/api/admin/supplier-documents/route.ts',
  'app/api/admin/driver-documents/route.ts',
  'app/api/admin/vehicle-documents/route.ts',
  'app/api/admin/driver-documents-test/route.ts',
  'app/api/admin/supplier-documents-test/route.ts'
];

function fixObjectLiteralTypes(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Fix patterns where we have object literals with gstNumber, numberOfVehicles, etc.
    // Look for patterns like: userDetails = { ...userDetails, gstNumber: ... }
    const patterns = [
      // Pattern 1: userDetails = { ...userDetails, gstNumber: ... }
      /(userDetails\s*=\s*\{[^}]*gstNumber[^}]*\})/g,
      // Pattern 2: userDetails = { ...userDetails, numberOfVehicles: ... }
      /(userDetails\s*=\s*\{[^}]*numberOfVehicles[^}]*\})/g,
      // Pattern 3: userDetails = { ...userDetails, companyName: ... }
      /(userDetails\s*=\s*\{[^}]*companyName[^}]*\})/g
    ];
    
    patterns.forEach(pattern => {
      content = content.replace(pattern, (match) => {
        // Add 'as any' to the end of the object literal
        if (!match.includes('as any')) {
          modified = true;
          return match + ' as any';
        }
        return match;
      });
    });
    
    // Also fix any other object literals that might have type issues
    // Look for patterns like: = { ...someVar, newProp: ... }
    const genericPattern = /(\w+\s*=\s*\{[^}]*\.\.\.[^}]*,[^}]*\w+:\s*[^}]*\})/g;
    content = content.replace(genericPattern, (match) => {
      // Only add 'as any' if it doesn't already have a type assertion
      if (!match.includes('as any') && !match.includes('as ')) {
        modified = true;
        return match + ' as any';
      }
      return match;
    });
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`Fixed: ${filePath}`);
    } else {
      console.log(`No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

console.log('Fixing object literal type issues in API routes...');
files.forEach(fixObjectLiteralTypes);
console.log('Done!');
