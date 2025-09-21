const fs = require('fs');
const path = require('path');

// Function to clean up syntax errors introduced by automated scripts
function cleanupSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // Fix 1: Remove extra characters from OPTIONS functions
    content = content.replace(
      /return handleCors\(request\}\)\)\s*return addCorsHeaders\(response\)\s*}/g,
      'return handleCors(request)\n}'
    );

    // Fix 2: Fix malformed if statements
    content = content.replace(
      /if \(!pool\) \{\}\)\s*return addCorsHeaders\(response\)\s*}/g,
      'if (!pool) {\n      return NextResponse.json({ error: "Database not available" }, { status: 500 })\n    }'
    );

    // Fix 3: Fix malformed return statements
    content = content.replace(
      /return createApiError\([^)]*\)\}\)\s*return addCorsHeaders\(response\)\s*}/g,
      'return createApiError("Database not available", null, 503)\n    }'
    );

    // Fix 4: Fix malformed console.log statements
    content = content.replace(
      /console\.log\([^)]*\)\}\)\s*return addCorsHeaders\(response\)\s*}/g,
      'console.log("Import successful")\n    }'
    );

    // Fix 5: Fix malformed if statements with session
    content = content.replace(
      /if \(!session\) \{\}\)\s*return addCorsHeaders\(response\)\s*}/g,
      'if (!session) {\n      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })\n    }'
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Cleaned up syntax errors in ${filePath}`);
      fixed = true;
    }

    return fixed;
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find all route.ts files
function findRouteFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item === 'route.ts') {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Main execution
const apiDir = path.join(__dirname, 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`Cleaning up syntax errors in ${routeFiles.length} route files...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (cleanupSyntaxErrors(file)) {
    fixedCount++;
  }
});

console.log(`\nCleaned up syntax errors in ${fixedCount} files!`);
