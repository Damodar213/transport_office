const fs = require('fs');
const path = require('path');

// Function to fix all remaining syntax errors
function fixAllRemainingSyntax(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // Fix 1: Remove extra characters from OPTIONS functions
    if (content.includes('return handleCors(request)})')) {
      content = content.replace(/return handleCors\(request\}\)\)\s*return addCorsHeaders\(response\)\s*}/g, 'return handleCors(request)\n}');
      fixed = true;
    }

    // Fix 2: Fix incomplete JSON objects with missing closing braces
    if (content.includes('`)})\n    return addCorsHeaders(response)')) {
      content = content.replace(/`\}\)\)\s*return addCorsHeaders\(response\)/g, '`)');
      fixed = true;
    }

    // Fix 3: Fix incomplete JSON objects in NextResponse.json
    if (content.includes('NextResponse.json({\n        error: "Notifications table not found",\n        message: "All notifications cleared (mock mode)\n      return addCorsHeaders(response)"\n      })')) {
      content = content.replace(/NextResponse\.json\(\{\s*error: "([^"]*)",\s*message: "([^"]*)\s*return addCorsHeaders\(response\)"\s*\}\)/g, 'NextResponse.json({\n        error: "$1",\n        message: "$2"\n      })\n      return addCorsHeaders(response)');
      fixed = true;
    }

    // Fix 4: Fix incomplete try-catch blocks
    if (content.includes('} catch (error) {\n      console.error("Error ensuring table exists:", error)\n    }')) {
      content = content.replace(/} catch \(error\) \{\s*console\.error\("Error ensuring table exists:", error\)\s*\}/g, '} catch (error) {\n      console.error("Error ensuring table exists:", error)\n    }');
      fixed = true;
    }

    // Fix 5: Fix incomplete JSON objects with missing closing braces
    if (content.includes('NextResponse.json({\n        error: "Failed to create notification",\n        details: error instanceof Error ? error.message : "Unknown error"\n  })')) {
      content = content.replace(/NextResponse\.json\(\{\s*error: "([^"]*)",\s*details: error instanceof Error \? error\.message : "Unknown error"\s*\}/g, 'NextResponse.json({\n        error: "$1",\n        details: error instanceof Error ? error.message : "Unknown error"\n      }, { status: 500 })');
      fixed = true;
    }

    if (fixed) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed remaining syntax in ${filePath}`);
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

console.log(`Fixing all remaining syntax in ${routeFiles.length} route files...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixAllRemainingSyntax(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed remaining syntax in ${fixedCount} files!`);
