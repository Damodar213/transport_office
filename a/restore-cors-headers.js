const fs = require('fs');
const path = require('path');

// Function to restore CORS headers to a file
function restoreCorsHeaders(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Skip if file doesn't have CORS import
    if (!content.includes('from "@/lib/cors"')) {
      return false;
    }
    
    // Find all NextResponse.json calls that don't have addCorsHeaders
    const lines = content.split('\n');
    const fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
      
      // Check if this line has NextResponse.json and the next line doesn't have addCorsHeaders
      if (line.includes('NextResponse.json(') && 
          !nextLine.includes('addCorsHeaders') && 
          !nextLine.includes('return addCorsHeaders') &&
          !line.includes('addCorsHeaders')) {
        
        // Find the closing of the NextResponse.json call
        let jsonEndIndex = i;
        let braceCount = 0;
        let inString = false;
        let stringChar = '';
        
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          
          for (let k = 0; k < currentLine.length; k++) {
            const char = currentLine[k];
            
            if (!inString && (char === '"' || char === "'")) {
              inString = true;
              stringChar = char;
            } else if (inString && char === stringChar) {
              inString = false;
            } else if (!inString) {
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
            }
          }
          
          if (braceCount === 0 && currentLine.includes('}')) {
            jsonEndIndex = j;
            break;
          }
        }
        
        // Add the lines up to the JSON end
        for (let j = i; j <= jsonEndIndex; j++) {
          fixedLines.push(lines[j]);
        }
        
        // Add the CORS header line
        const indent = lines[jsonEndIndex].match(/^(\s*)/)[1];
        fixedLines.push(`${indent}return addCorsHeaders(response)`);
        
        // Skip the lines we've already processed
        i = jsonEndIndex;
        continue;
      }
      
      fixedLines.push(line);
    }
    
    content = fixedLines.join('\n');
    
    // Additional fixes for specific patterns
    // Fix: const response = NextResponse.json(...) without return addCorsHeaders
    content = content.replace(
      /(const response = NextResponse\.json\([^)]+\))\s*\n(\s*)([^r]|$)/g,
      '$1\n$2return addCorsHeaders(response)\n$2$3'
    );
    
    // Fix: return NextResponse.json(...) without addCorsHeaders
    content = content.replace(
      /(return NextResponse\.json\([^)]+\))/g,
      (match) => {
        if (!content.includes('addCorsHeaders')) {
          return `const response = ${match.replace('return ', '')}\n    return addCorsHeaders(response)`;
        }
        return match;
      }
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Restored CORS headers in ${filePath}`);
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

console.log(`Checking ${routeFiles.length} route files for missing CORS headers...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (restoreCorsHeaders(file)) {
    fixedCount++;
  }
});

console.log(`\nRestored CORS headers in ${fixedCount} files!`);
