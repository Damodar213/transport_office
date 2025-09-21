const fs = require('fs');
const path = require('path');

// Function to fix OPTIONS function syntax errors
function fixOptionsFunctions(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // Fix the specific pattern: return handleCors(request)}) followed by return addCorsHeaders(response)
    const pattern = /return handleCors\(request\}\)\)\s*return addCorsHeaders\(response\)\s*}/g;
    if (pattern.test(content)) {
      content = content.replace(pattern, 'return handleCors(request)\n}');
      fixed = true;
    }

    if (fixed) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed OPTIONS function in ${filePath}`);
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

console.log(`Fixing OPTIONS functions in ${routeFiles.length} route files...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixOptionsFunctions(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed OPTIONS functions in ${fixedCount} files!`);
