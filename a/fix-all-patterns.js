const fs = require('fs');
const path = require('path');

// Function to fix all syntax error patterns
function fixAllPatterns(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // Pattern 1: Fix OPTIONS functions with extra characters
    const pattern1 = /return handleCors\(request\}\)\)\s*return addCorsHeaders\(response\)\s*}/g;
    if (pattern1.test(content)) {
      content = content.replace(pattern1, 'return handleCors(request)\n}');
      fixed = true;
    }

    // Pattern 2: Fix incomplete JSON objects
    const pattern2 = /NextResponse\.json\(\{\s*error: "([^"]*)",\s*message: "([^"]*)\s*return addCorsHeaders\(response\)"\s*\}\)/g;
    if (pattern2.test(content)) {
      content = content.replace(pattern2, 'NextResponse.json({\n        error: "$1",\n        message: "$2"\n      })\n      return addCorsHeaders(response)');
      fixed = true;
    }

    // Pattern 3: Fix incomplete try-catch blocks
    const pattern3 = /const response = NextResponse\.json\(\{\s*message: "([^"]*)",\s*([^}]*)\s*return addCorsHeaders\(response\)\s*\}\)/g;
    if (pattern3.test(content)) {
      content = content.replace(pattern3, 'const response = NextResponse.json({\n        message: "$1",\n        $2\n      })\n      return addCorsHeaders(response)');
      fixed = true;
    }

    // Pattern 4: Fix malformed if statements
    const pattern4 = /if \(!getPool\(\)\) \{\}\)\s*return addCorsHeaders\(response\)\s*}/g;
    if (pattern4.test(content)) {
      content = content.replace(pattern4, 'if (!getPool()) {\n      return NextResponse.json({ error: "Database not available" }, { status: 500 })\n    }');
      fixed = true;
    }

    // Pattern 5: Fix malformed role checks
    const pattern5 = /if \(session\.role !== '[^']*'\) \{\}\)\s*return addCorsHeaders\(response\)\s*}/g;
    if (pattern5.test(content)) {
      content = content.replace(pattern5, 'if (session.role !== \'supplier\') {\n      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })\n    }');
      fixed = true;
    }

    if (fixed) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed patterns in ${filePath}`);
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

console.log(`Fixing all patterns in ${routeFiles.length} route files...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixAllPatterns(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed patterns in ${fixedCount} files!`);
