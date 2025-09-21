const fs = require('fs');
const path = require('path');

// Function to fix remaining syntax errors in a file
function fixRemainingSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // Fix 1: Fix unterminated string literals in mock mode messages
    content = content.replace(
      /message:\s*"([^"]*?)\s*$/gm,
      'message: "$1"'
    );

    // Fix 2: Fix missing closing braces for NextResponse.json objects
    content = content.replace(
      /(\s*const response = NextResponse\.json\(\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, jsonStart) => {
        return `${jsonStart}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 3: Fix incomplete try-catch blocks
    content = content.replace(
      /(\s*const response = NextResponse\.json\(\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, jsonStart) => {
        return `${jsonStart}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 4: Fix missing closing braces for function blocks
    content = content.replace(
      /(\s*const response = NextResponse\.json\(\{[^}]*?\})\s*\}\s*$/gm,
      (match, jsonBlock) => {
        return `${jsonBlock})\n    return addCorsHeaders(response)\n  }`;
      }
    );

    // Fix 5: Fix incomplete if statements
    content = content.replace(
      /(\s*if\s*\([^)]*\)\s*\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, ifBlock) => {
        return `${ifBlock}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 6: Fix missing closing braces for try blocks
    content = content.replace(
      /(\s*try\s*\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, tryBlock) => {
        return `${tryBlock}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 7: Fix incomplete function blocks
    content = content.replace(
      /(\s*export async function [^{]*\{[^}]*?)\s*\}\s*$/gm,
      (match, funcBlock) => {
        return `${funcBlock}})\n    return addCorsHeaders(response)\n  }`;
      }
    );

    // Fix 8: Fix missing closing braces for object literals
    content = content.replace(
      /(\s*const response = NextResponse\.json\(\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, jsonStart) => {
        return `${jsonStart}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 9: Fix incomplete JSON objects
    content = content.replace(
      /(\s*const response = NextResponse\.json\(\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, jsonStart) => {
        return `${jsonStart}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 10: Fix missing closing braces for if statements
    content = content.replace(
      /(\s*if\s*\([^)]*\)\s*\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, ifBlock) => {
        return `${ifBlock}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 11: Fix incomplete try-catch blocks
    content = content.replace(
      /(\s*try\s*\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, tryBlock) => {
        return `${tryBlock}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 12: Fix missing closing braces for function blocks
    content = content.replace(
      /(\s*export async function [^{]*\{[^}]*?)\s*\}\s*$/gm,
      (match, funcBlock) => {
        return `${funcBlock}})\n    return addCorsHeaders(response)\n  }`;
      }
    );

    // Fix 13: Fix incomplete object literals
    content = content.replace(
      /(\s*const response = NextResponse\.json\(\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, jsonStart) => {
        return `${jsonStart}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 14: Fix missing closing braces for if statements
    content = content.replace(
      /(\s*if\s*\([^)]*\)\s*\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, ifBlock) => {
        return `${ifBlock}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 15: Fix incomplete try-catch blocks
    content = content.replace(
      /(\s*try\s*\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, tryBlock) => {
        return `${tryBlock}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 16: Fix missing closing braces for function blocks
    content = content.replace(
      /(\s*export async function [^{]*\{[^}]*?)\s*\}\s*$/gm,
      (match, funcBlock) => {
        return `${funcBlock}})\n    return addCorsHeaders(response)\n  }`;
      }
    );

    // Fix 17: Fix incomplete object literals
    content = content.replace(
      /(\s*const response = NextResponse\.json\(\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, jsonStart) => {
        return `${jsonStart}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 18: Fix missing closing braces for if statements
    content = content.replace(
      /(\s*if\s*\([^)]*\)\s*\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, ifBlock) => {
        return `${ifBlock}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 19: Fix incomplete try-catch blocks
    content = content.replace(
      /(\s*try\s*\{[^}]*?)\s*\}\s*catch\s*\(error\)\s*\{/g,
      (match, tryBlock) => {
        return `${tryBlock}})\n    return addCorsHeaders(response)\n\n  } catch (error) {`;
      }
    );

    // Fix 20: Fix missing closing braces for function blocks
    content = content.replace(
      /(\s*export async function [^{]*\{[^}]*?)\s*\}\s*$/gm,
      (match, funcBlock) => {
        return `${funcBlock}})\n    return addCorsHeaders(response)\n  }`;
      }
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed remaining syntax errors in ${filePath}`);
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

console.log(`Checking ${routeFiles.length} route files for remaining syntax errors...\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixRemainingSyntaxErrors(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed remaining syntax errors in ${fixedCount} files!`);
