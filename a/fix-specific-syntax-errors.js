const fs = require('fs');
const path = require('path');

// Function to fix specific syntax errors
function fixSpecificErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // Fix 1: Remove extra characters from OPTIONS functions
    content = content.replace(
      /return handleCors\(request\}\)\)\s*return addCorsHeaders\(response\)\s*}/g,
      'return handleCors(request)\n}'
    );

    // Fix 2: Fix incomplete JSON objects with missing closing braces
    content = content.replace(
      /NextResponse\.json\(\{\s*error: "([^"]*)",\s*message: "([^"]*)\s*return addCorsHeaders\(response\)"\s*\}\)/g,
      'NextResponse.json({\n        error: "$1",\n        message: "$2"\n      })\n      return addCorsHeaders(response)'
    );

    // Fix 3: Fix incomplete try-catch blocks
    content = content.replace(
      /const response = NextResponse\.json\(\{\s*message: "([^"]*)",\s*([^}]*)\s*return addCorsHeaders\(response\)\s*\}\)/g,
      'const response = NextResponse.json({\n        message: "$1",\n        $2\n      })\n      return addCorsHeaders(response)'
    );

    // Fix 4: Fix malformed function declarations
    content = content.replace(
      /export async function OPTIONS\(request: NextRequest\) \{\s*return handleCors\(request\}\)\)\s*return addCorsHeaders\(response\)\s*}/g,
      'export async function OPTIONS(request: NextRequest) {\n  return handleCors(request)\n}'
    );

    // Fix 5: Fix incomplete if statements
    content = content.replace(
      /if \(!getPool\(\)\) \{\}\)\s*return addCorsHeaders\(response\)\s*}/g,
      'if (!getPool()) {\n      return NextResponse.json({ error: "Database not available" }, { status: 500 })\n    }'
    );

    // Fix 6: Fix malformed role checks
    content = content.replace(
      /if \(session\.role !== '[^']*'\) \{\}\)\s*return addCorsHeaders\(response\)\s*}/g,
      'if (session.role !== \'supplier\') {\n      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })\n    }'
    );

    // Fix 7: Fix incomplete JSON objects in NextResponse.json
    content = content.replace(
      /NextResponse\.json\(\{\s*error: "([^"]*)",\s*message: "([^"]*)\s*return addCorsHeaders\(response\)"\s*\}\)/g,
      'NextResponse.json({\n        error: "$1",\n        message: "$2"\n      })\n      return addCorsHeaders(response)'
    );

    // Fix 8: Fix incomplete try-catch blocks
    content = content.replace(
      /const response = NextResponse\.json\(\{\s*message: "([^"]*)",\s*([^}]*)\s*return addCorsHeaders\(response\)\s*\}\)/g,
      'const response = NextResponse.json({\n        message: "$1",\n        $2\n      })\n      return addCorsHeaders(response)'
    );

    // Fix 9: Fix malformed function declarations
    content = content.replace(
      /export async function OPTIONS\(request: NextRequest\) \{\s*return handleCors\(request\}\)\)\s*return addCorsHeaders\(response\)\s*}/g,
      'export async function OPTIONS(request: NextRequest) {\n  return handleCors(request)\n}'
    );

    // Fix 10: Fix incomplete if statements
    content = content.replace(
      /if \(!getPool\(\)\) \{\}\)\s*return addCorsHeaders\(response\)\s*}/g,
      'if (!getPool()) {\n      return NextResponse.json({ error: "Database not available" }, { status: 500 })\n    }'
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed syntax errors in ${filePath}`);
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

console.log(`Fixing specific syntax errors in ${routeFiles.length} route files...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixSpecificErrors(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed syntax errors in ${fixedCount} files!`);
