const fs = require('fs');
const path = require('path');

// Function to clean up duplicate CORS statements
function cleanupDuplicateCors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Remove duplicate return addCorsHeaders(response) statements
    // Pattern 1: Multiple consecutive return addCorsHeaders(response) lines
    content = content.replace(
      /(\s*return addCorsHeaders\(response\)\s*\n)+/g,
      '    return addCorsHeaders(response)\n'
    );
    
    // Pattern 2: return addCorsHeaders(response) inside JSON objects
    content = content.replace(
      /(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*return addCorsHeaders\(response\)/g,
      '$1$2: $3'
    );
    
    // Pattern 3: return addCorsHeaders(response) in the middle of JSON
    content = content.replace(
      /(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*return addCorsHeaders\(response\)\s*([,}])/g,
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
      
      // If we find return addCorsHeaders(response) inside a JSON object, remove it
      if (inJsonObject && line.includes('return addCorsHeaders(response)')) {
        // Skip this line
        continue;
      }
      
      // Remove duplicate return addCorsHeaders(response) lines
      if (trimmedLine === 'return addCorsHeaders(response)') {
        // Check if the previous line is also return addCorsHeaders(response)
        const prevLine = i > 0 ? lines[i-1].trim() : '';
        if (prevLine === 'return addCorsHeaders(response)') {
          // Skip this duplicate line
          continue;
        }
      }
      
      fixedLines.push(line);
    }
    
    content = fixedLines.join('\n');
    
    // Pattern 5: Fix cases where return addCorsHeaders(response) is on its own line inside JSON
    content = content.replace(
      /(\s+)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*\n\s*return addCorsHeaders\(response\)\s*\n\s*([,}])/g,
      '$1$2: $3\n$1$4'
    );
    
    // Pattern 6: Clean up multiple consecutive return statements
    content = content.replace(
      /(\s*return addCorsHeaders\(response\)\s*\n){2,}/g,
      '    return addCorsHeaders(response)\n'
    );
    
    // Pattern 7: Fix malformed JSON with return statements inside
    content = content.replace(
      /(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*return addCorsHeaders\(response\)\s*([,}])/g,
      '$1$2: $3$4'
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Cleaned up duplicate CORS statements in ${filePath}`);
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

console.log(`Checking ${routeFiles.length} route files for duplicate CORS statements...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (cleanupDuplicateCors(file)) {
    fixedCount++;
  }
});

console.log(`\nCleaned up duplicate CORS statements in ${fixedCount} files!`);
