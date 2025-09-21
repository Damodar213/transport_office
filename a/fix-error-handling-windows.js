const fs = require('fs');
const path = require('path');

// List of files that need fixing (from the grep output we saw earlier)
const files = [
  'app/api/admin/buyers/route.ts',
  'app/api/supplier/notifications/[id]/route.ts',
  'app/api/supplier/notifications/[id]/read/route.ts',
  'app/api/admin/transport-request-notifications/[id]/route.ts',
  'app/api/order-submissions/[orderId]/route.ts',
  'app/api/users/[userId]/route.ts',
  'app/api/admin/supplier-vehicle-location-notifications/[id]/read/route.ts',
  'app/api/buyer-requests/[id]/route.ts',
  'app/api/buyer-requests/[id]/status/route.ts',
  'app/api/admin/transport-request-notifications/[id]/read/route.ts',
  'app/api/admin/notifications/[id]/route.ts',
  'app/api/buyer/notifications/[id]/route.ts',
  'app/api/buyer/notifications/[id]/read/route.ts',
  'app/api/admin/notifications/[id]/read/route.ts',
  'app/api/supplier/accept-order/route.ts',
  'app/api/auth/me/route.ts',
  'app/api/admin/states/route.ts',
  'app/api/admin/settings/route.ts',
  'app/api/migrate-fix-order-submissions-status/route.ts',
  'app/api/order-submissions/route.ts',
  'app/api/supplier-orders/route.ts',
  'app/api/admin/notifications/route.ts',
  'app/api/supplier/notifications/route.ts',
  'app/api/admin/send-manual-order-to-suppliers/route.ts',
  'app/api/admin/manual-order/route.ts',
  'app/api/buyer-requests/route.ts',
  'app/api/buyer/notifications/mark-all-read/route.ts',
  'app/api/buyer/notifications/route.ts',
  'app/api/supplier/orders/route.ts',
  'app/api/admin/suppliers-confirmed/route.ts',
  'app/api/admin/send-to-buyer/route.ts',
  'app/api/buyer/notifications/clear-all/route.ts',
  'app/api/migrate-add-submission-fields/route.ts',
  'app/api/buyer/accepted-requests/route.ts',
  'app/api/supplier/accept-order/route.ts.backup',
  'app/api/test-db/route.ts',
  'app/api/admin/update-order-notification-status/route.ts',
  'app/api/admin/update-manual-order-status/route.ts',
  'app/api/admin/transport-requests/route.ts',
  'app/api/auth/signup/route.ts',
  'app/api/supplier/notifications/mark-all-read/route.ts',
  'app/api/admin/supplier-vehicle-location-notifications/route.ts',
  'app/api/migrate-manual-orders/route.ts',
  'app/api/admin/manual-orders/route.ts',
  'app/api/health/route.ts',
  'app/api/admin/debug-accepted-requests/route.ts',
  'app/api/admin/send-order-to-suppliers/route.ts',
  'app/api/test-db-connection/route.ts',
  'app/api/admin/transport-request-notifications/route.ts',
  'app/api/admin/transport-request-notifications/mark-all-read/route.ts',
  'app/api/buyer/notifications/count/route.ts',
  'app/api/supplier-confirmed-orders/route.ts',
  'app/api/users/route.ts',
  'app/api/admin/vehicle-documents-simple/route.ts',
  'app/api/admin/driver-documents-simple/route.ts',
  'app/api/admin/suppliers/route.ts',
  'app/api/admin/cleanup-orphaned-files/route.ts',
  'app/api/admin/districts/route.ts',
  'app/api/test-buyer-requests/route.ts',
  'app/api/test-buyer-auth/route.ts',
  'app/api/test-data-isolation/route.ts',
  'app/api/supplier-trucks/route.ts',
  'app/api/migrate-fix-truck-columns/route.ts',
  'app/api/supplier-drivers/route.ts',
  'app/api/create-user-111111/route.ts',
  'app/api/debug-suppliers/route.ts',
  'app/api/fix-missing-supplier/route.ts',
  'app/api/check-supplier-111111/route.ts',
  'app/api/test-formdata/route.ts',
  'app/api/check-user-12233/route.ts',
  'app/api/test-formdata-alternative/route.ts',
  'app/api/debug-signup/route.ts',
  'app/api/test-request-handling/route.ts',
  'app/api/test-signup-imports/route.ts',
  'app/api/test-cloudflare-import/route.ts',
  'app/api/test-signup-minimal/route.ts',
  'app/api/test-signup-simple/route.ts',
  'app/api/test-signup-error/route.ts',
  'app/api/test-new-registration/route.ts',
  'app/api/test-supplier-registration/route.ts',
  'app/api/test-registration-issues/route.ts',
  'app/api/test-auth-fix/route.ts',
  'app/api/test-password-verification/route.ts',
  'app/api/test-login-flow/route.ts',
  'app/api/test-user-12233/route.ts',
  'app/api/test-all-documents/route.ts',
  'app/api/test-vehicle-docs-simple/route.ts',
  'app/api/test-driver-join-fixed/route.ts',
  'app/api/debug-data-types/route.ts',
  'app/api/test-driver-join/route.ts',
  'app/api/debug-driver-docs/route.ts',
  'app/api/migrate-existing-vehicle-docs/route.ts',
  'app/api/migrate-existing-driver-docs/route.ts',
  'app/api/test-create-driver-doc/route.ts',
  'app/api/test-driver-docs-simple/route.ts',
  'app/api/test-simple-driver-docs/route.ts',
  'app/api/test-drivers-table/route.ts',
  'app/api/test-driver-documents/route.ts',
  'app/api/test-vehicle-documents/route.ts',
  'app/api/upload/route.ts',
  'app/api/migrate-create-vehicle-driver-documents/route.ts',
  'app/api/test-supplier-documents/route.ts',
  'app/api/migrate-create-supplier-documents/route.ts',
  'app/api/driver-blocking-orders/route.ts',
  'app/api/check-driver-references/route.ts',
  'app/api/supplier/notifications/count/route.ts',
  'app/api/migrate/route.ts',
  'app/api/admin/load-types/route.ts',
  'app/api/admin/dashboard-stats/route.ts',
  'app/api/test-db-admin/route.ts',
  'app/api/supplier/notifications/clear-all/route.ts',
  'app/api/reset-admin-password/route.ts',
  'app/api/migrate-trucks/route.ts',
  'app/api/migrate-rename-transport-orders/route.ts',
  'app/api/migrate-remove-driver-experience/route.ts',
  'app/api/migrate-create-buyer-requests/route.ts',
  'app/api/migrate-add-truck-fields/route.ts',
  'app/api/migrate-add-driver-to-orders/route.ts',
  'app/api/list-users/route.ts',
  'app/api/get-driver-details/route.ts',
  'app/api/check-schema/route.ts',
  'app/api/change-admin-password/route.ts',
  'app/api/admin/settings/test-db/route.ts',
  'app/api/admin/notifications/mark-all-read/route.ts',
  'app/api/admin/notifications/clear-all/route.ts',
  'app/api/admin/export-users/route.ts',
  'app/api/admin/confirmed-orders/route.ts',
  'app/api/admin/available-suppliers/route.ts'
];

function fixErrorHandling(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix error.message to proper error handling
    content = content.replace(
      /error\.message/g,
      'error instanceof Error ? error.message : "Unknown error"'
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

console.log('Fixing error handling in API routes...');
files.forEach(fixErrorHandling);
console.log('Done!');
