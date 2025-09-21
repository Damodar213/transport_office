const fs = require('fs');
const path = require('path');

// Function to fix syntax errors in a file
function fixSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // Fix 1: Add missing closing braces for NextResponse.json objects
    // Pattern: NextResponse.json({ ... } catch (error) {
    content = content.replace(
      /NextResponse\.json\(\s*\{([^}]*?)\s*\}\s*catch\s*\(/g,
      (match, jsonContent) => {
        // Find the matching closing brace
        let braceCount = 0;
        let i = 0;
        while (i < jsonContent.length) {
          if (jsonContent[i] === '{') braceCount++;
          if (jsonContent[i] === '}') braceCount--;
          i++;
        }
        
        if (braceCount > 0) {
          // Add missing closing braces
          const missingBraces = '}'.repeat(braceCount);
          return `NextResponse.json({${jsonContent}${missingBraces}})\n    return addCorsHeaders(response)\n\n  } catch (`;
        }
        return match;
      }
    );

    // Fix 2: Add missing closing braces and return statements
    // Pattern: } catch (error) { without proper closing
    content = content.replace(
      /(\s*const response = NextResponse\.json\(\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, jsonStart) => {
        return `${jsonStart}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 3: Fix unterminated string literals
    content = content.replace(
      /message:\s*"([^"]*?)\s*$/gm,
      'message: "$1"'
    );

    // Fix 4: Add missing return statements before catch blocks
    content = content.replace(
      /(\s*const response = NextResponse\.json\(\{[^}]*?\})\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, jsonBlock) => {
        return `${jsonBlock})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 5: Fix incomplete try-catch blocks
    content = content.replace(
      /(\s*const response = NextResponse\.json\(\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, jsonStart) => {
        return `${jsonStart}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 6: Add missing closing braces for function blocks
    content = content.replace(
      /(\s*const response = NextResponse\.json\(\{[^}]*?\})\s*\}\s*$/gm,
      (match, jsonBlock) => {
        return `${jsonBlock})\n    return addCorsHeaders(response)\n  }`;
      }
    );

    // Fix 7: Fix duplicate error handling
    content = content.replace(
      /error instanceof Error \? error instanceof Error \? error\.message : "Unknown error" : "Unknown error"/g,
      'error instanceof Error ? error.message : "Unknown error"'
    );

    // Fix 8: Add missing status codes
    content = content.replace(
      /NextResponse\.json\(\{\s*error:\s*"[^"]*"\s*\}\)/g,
      'NextResponse.json({ error: "$1" }, { status: 500 })'
    );

    // Fix 9: Fix incomplete JSON objects
    content = content.replace(
      /(\s*const response = NextResponse\.json\(\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, jsonStart) => {
        return `${jsonStart}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 10: Add missing closing braces for if statements
    content = content.replace(
      /(\s*if\s*\([^)]*\)\s*\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, ifBlock) => {
        return `${ifBlock}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed syntax errors in ${filePath}`);
      fixed = true;
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

console.log(`Checking ${routeFiles.length} route files for syntax errors...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixSyntaxErrors(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed syntax errors in ${fixedCount} files!`);
