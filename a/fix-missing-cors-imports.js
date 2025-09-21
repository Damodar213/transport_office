const fs = require('fs');
const path = require('path');

// Function to add missing CORS imports to a file
function addMissingCorsImport(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Skip if file doesn't use addCorsHeaders
    if (!content.includes('addCorsHeaders')) {
      return false;
    }
    
    // Skip if file already has CORS import
    if (content.includes('from "@/lib/cors"')) {
      return false;
    }
    
    // Add CORS import after the first import statement
    const importMatch = content.match(/import.*from.*"next\/server"/);
    if (importMatch) {
      const importLine = importMatch[0];
      const corsImport = 'import { handleCors, addCorsHeaders } from "@/lib/cors"';
      
      if (!content.includes(corsImport)) {
        content = content.replace(importLine, importLine + '\n' + corsImport);
        fs.writeFileSync(filePath, content);
        console.log(`Added CORS import to ${filePath}`);
        return true;
      }
    }
    
    return false;
    
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

console.log(`Checking ${routeFiles.length} route files for missing CORS imports...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (addMissingCorsImport(file)) {
    fixedCount++;
  }
});

console.log(`\nAdded CORS imports to ${fixedCount} files!`);
