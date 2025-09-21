const fs = require('fs');
const path = require('path');

// List of API route files that need fixing
const apiFiles = [
  'app/api/buyer/notifications/[id]/read/route.ts',
  'app/api/buyer/notifications/[id]/route.ts',
  'app/api/admin/notifications/[id]/route.ts',
  'app/api/admin/transport-request-notifications/[id]/read/route.ts',
  'app/api/buyer-requests/[id]/status/route.ts',
  'app/api/buyer-requests/[id]/route.ts',
  'app/api/admin/supplier-vehicle-location-notifications/[id]/read/route.ts',
  'app/api/users/[userId]/route.ts',
  'app/api/order-submissions/[orderId]/route.ts',
  'app/api/admin/transport-request-notifications/[id]/route.ts',
  'app/api/supplier/notifications/[id]/read/route.ts',
  'app/api/supplier/notifications/[id]/route.ts',
  'app/api/orders/[id]/route.ts'
];

function fixApiRoute(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix the params type definition
    content = content.replace(
      /{ params }: { params: { ([^}]+) } }/g,
      '{ params }: { params: Promise<{ $1 }> }'
    );
    
    // Fix the params destructuring to await
    content = content.replace(
      /const { ([^}]+) } = params/g,
      'const { $1 } = await params'
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

console.log('Fixing API route TypeScript errors...');
apiFiles.forEach(fixApiRoute);
console.log('Done!');
