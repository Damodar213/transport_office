const fs = require('fs');
const path = require('path');

// Function to fix CORS syntax errors in a file
function fixCorsSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix pattern: return addCorsHeaders(response) inside JSON objects
    // Look for lines that have return addCorsHeaders(response) in the middle of JSON
    const lines = content.split('\n');
    const fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line has the problematic pattern
      if (line.includes('return addCorsHeaders(response)') && 
          (line.includes('{') || line.includes('}') || line.includes('"'))) {
        
        // This is a broken line, we need to fix it
        const prevLine = i > 0 ? lines[i-1] : '';
        const nextLine = i < lines.length - 1 ? lines[i+1] : '';
        
        // If the previous line ends with a quote and this line has return addCorsHeaders
        if (prevLine.trim().endsWith('"') && line.includes('return addCorsHeaders(response)')) {
          // Remove the return statement from this line
          const fixedLine = line.replace(/.*return addCorsHeaders\(response\).*/, '');
          if (fixedLine.trim()) {
            fixedLines.push(fixedLine);
          }
          modified = true;
          continue;
        }
        
        // If this line has both JSON content and return statement
        if (line.includes('"') && line.includes('return addCorsHeaders(response)')) {
          // Split the line and fix it
          const parts = line.split('return addCorsHeaders(response)');
          if (parts[0].trim()) {
            fixedLines.push(parts[0].trim());
          }
          modified = true;
          continue;
        }
      }
      
      fixedLines.push(line);
    }
    
    // Join the lines back
    content = fixedLines.join('\n');
    
    // Additional fixes for common patterns
    // Fix: "message": "text return addCorsHeaders(response)"
    content = content.replace(
      /"message":\s*"([^"]*?)\s*return addCorsHeaders\(response\)"/g,
      '"message": "$1"'
    );
    
    // Fix: "error": "text return addCorsHeaders(response)"
    content = content.replace(
      /"error":\s*"([^"]*?)\s*return addCorsHeaders\(response\)"/g,
      '"error": "$1"'
    );
    
    // Fix: exportedAt: new Date() return addCorsHeaders(response).toISOString()
    content = content.replace(
      /exportedAt:\s*new Date\(\)\s*return addCorsHeaders\(response\)\.toISOString\(\)/g,
      'exportedAt: new Date().toISOString()'
    );
    
    if (modified || content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed syntax errors in ${filePath}`);
      return true;
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

console.log(`Checking ${routeFiles.length} route files for CORS syntax errors...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixCorsSyntaxErrors(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed syntax errors in ${fixedCount} files!`);
