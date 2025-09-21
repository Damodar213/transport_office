const fs = require('fs');
const path = require('path');

// List of files that need rowCount fixes
const files = [
  'app/api/admin/load-types/route.ts',
  'app/api/supplier/notifications/mark-all-read/route.ts',
  'app/api/admin/transport-requests/route.ts',
  'app/api/admin/update-order-notification-status/route.ts',
  'app/api/buyer/accepted-requests/route.ts',
  'app/api/admin/suppliers-confirmed/route.ts',
  'app/api/buyer/notifications/mark-all-read/route.ts',
  'app/api/supplier-orders/route.ts',
  'app/api/migrate-fix-order-submissions-status/route.ts'
];

function fixRowCountErrors(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix rowCount to rows.length
    content = content.replace(/\.rowCount/g, '.rows.length');
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

console.log('Fixing rowCount errors in API routes...');
files.forEach(fixRowCountErrors);
console.log('Done!');
