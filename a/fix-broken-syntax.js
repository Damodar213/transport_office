const fs = require('fs');
const path = require('path');

// Function to fix broken syntax in a file
function fixBrokenSyntax(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Fix pattern 1: Missing closing parenthesis and return statement
    content = content.replace(
      /(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*\n(\s*)\}\s*$/gm,
      '$1$2: $3\n$4})\n$4return addCorsHeaders(response)'
    );
    
    // Fix pattern 2: Missing closing parenthesis in NextResponse.json
    content = content.replace(
      /NextResponse\.json\(\s*\{\s*([^}]+)\s*\n(\s*)\}\s*$/gm,
      'NextResponse.json({\n$1\n$2})\n$2return addCorsHeaders(response)'
    );
    
    // Fix pattern 3: Missing closing brace and return statement
    content = content.replace(
      /(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*\n(\s*)\}\s*catch/gm,
      '$1$2: $3\n$4})\n$4return addCorsHeaders(response)\n$4\n$4} catch'
    );
    
    // Fix pattern 4: Missing closing parenthesis before catch
    content = content.replace(
      /(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*\n(\s*)\}\s*catch/gm,
      '$1$2: $3\n$4})\n$4return addCorsHeaders(response)\n$4\n$4} catch'
    );
    
    // Fix pattern 5: Missing closing brace and return statement at end of function
    content = content.replace(
      /(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*\n(\s*)\}\s*$/gm,
      '$1$2: $3\n$4})\n$4return addCorsHeaders(response)\n$4}'
    );
    
    // Fix pattern 6: Missing closing parenthesis in error responses
    content = content.replace(
      /(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*\n(\s*)\}\s*$/gm,
      '$1$2: $3\n$4})\n$4return addCorsHeaders(response)'
    );
    
    // Fix pattern 7: Missing closing brace in try-catch blocks
    content = content.replace(
      /(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*\n(\s*)\}\s*catch/gm,
      '$1$2: $3\n$4})\n$4return addCorsHeaders(response)\n$4\n$4} catch'
    );
    
    // Fix pattern 8: Missing closing parenthesis in JSON objects
    content = content.replace(
      /(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*\n(\s*)\}\s*$/gm,
      '$1$2: $3\n$4})\n$4return addCorsHeaders(response)'
    );
    
    // Fix pattern 9: Missing closing brace in error handling
    content = content.replace(
      /(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*\n(\s*)\}\s*$/gm,
      '$1$2: $3\n$4})\n$4return addCorsHeaders(response)'
    );
    
    // Fix pattern 10: Missing closing parenthesis in response objects
    content = content.replace(
      /(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*([^,}]+)\s*\n(\s*)\}\s*$/gm,
      '$1$2: $3\n$4})\n$4return addCorsHeaders(response)'
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed broken syntax in ${filePath}`);
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

console.log(`Checking ${routeFiles.length} route files for broken syntax...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixBrokenSyntax(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed broken syntax in ${fixedCount} files!`);
