const fs = require('fs');
const path = require('path');

// Function to fix CORS syntax errors in a file
function fixCorsSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Fix pattern: return addCorsHeaders(response) inside JSON objects
    // Pattern 1: "text return addCorsHeaders(response)"
    content = content.replace(
      /"([^"]*?)\s*return addCorsHeaders\(response\)"/g,
      '"$1"'
    );
    
    // Pattern 2: return addCorsHeaders(response) inside JSON object properties
    content = content.replace(
      /(\s+)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*return addCorsHeaders\(response\)/g,
      '$1$2: $3'
    );
    
    // Pattern 3: return addCorsHeaders(response) in the middle of JSON
    content = content.replace(
      /(\s+)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*return addCorsHeaders\(response\)\s*([,}])/g,
      '$1$2: $3$4'
    );
    
    // Pattern 4: Fix broken JSON structure where return statement is in the middle
    const lines = content.split('\n');
    const fixedLines = [];
    let inJsonObject = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Track if we're inside a JSON object
      if (line.includes('{')) {
        braceCount += (line.match(/\{/g) || []).length;
        inJsonObject = braceCount > 0;
      }
      if (line.includes('}')) {
        braceCount -= (line.match(/\}/g) || []).length;
        inJsonObject = braceCount > 0;
      }
      
      // If we find return addCorsHeaders(response) inside a JSON object, fix it
      if (inJsonObject && line.includes('return addCorsHeaders(response)')) {
        // Remove the return statement from this line
        const fixedLine = line.replace(/\s*return addCorsHeaders\(response\)\s*/, '');
        if (fixedLine.trim()) {
          fixedLines.push(fixedLine);
        }
        continue;
      }
      
      fixedLines.push(line);
    }
    
    content = fixedLines.join('\n');
    
    // Pattern 5: Fix cases where return addCorsHeaders(response) is on its own line inside JSON
    content = content.replace(
      /(\s+)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*\n\s*return addCorsHeaders\(response\)\s*\n\s*([,}])/g,
      '$1$2: $3\n$1$4'
    );
    
    // Pattern 6: Fix version string concatenation issues
    content = content.replace(
      /version:\s*version\.split\(' '\)\s*return addCorsHeaders\(response\)\[0\]/g,
      'version: version.split(\' \')[0]'
    );
    
    if (content !== originalContent) {
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

console.log(`Checking ${routeFiles.length} route files for remaining CORS syntax errors...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixCorsSyntaxErrors(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed syntax errors in ${fixedCount} files!`);
