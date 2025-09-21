const fs = require('fs');
const path = require('path');

// Function to fix exact syntax error patterns
function fixExactPatterns(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // Fix the exact pattern: return handleCors(request)}) followed by return addCorsHeaders(response)
    if (content.includes('return handleCors(request)})')) {
      content = content.replace(/return handleCors\(request\}\)\)\s*return addCorsHeaders\(response\)\s*}/g, 'return handleCors(request)\n}');
      fixed = true;
    }

    if (fixed) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed exact patterns in ${filePath}`);
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

console.log(`Fixing exact patterns in ${routeFiles.length} route files...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixExactPatterns(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed exact patterns in ${fixedCount} files!`);
