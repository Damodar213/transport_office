const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix common syntax errors
function fixSyntaxErrors(content) {
  let fixed = content;
  let changes = 0;

  // Fix missing closing braces in JSON objects
  fixed = fixed.replace(/(\s+)(\w+):\s*([^,}]+)\s*$/gm, (match, indent, key, value) => {
    if (!value.includes('}') && !value.includes(')')) {
      changes++;
      return `${indent}${key}: ${value}\n${indent}}`;
    }
    return match;
  });

  // Fix malformed OPTIONS functions
  fixed = fixed.replace(/return handleCors\(request\)\}\)\s*return addCorsHeaders\(response\)\s*}/g, 'return handleCors(request)\n}');

  // Fix missing closing braces in try-catch blocks
  fixed = fixed.replace(/(\s+)(\w+):\s*([^,}]+)\s*$/gm, (match, indent, key, value) => {
    if (!value.includes('}') && !value.includes(')')) {
      changes++;
      return `${indent}${key}: ${value}\n${indent}}`;
    }
    return match;
  });

  // Fix incomplete JSON objects
  fixed = fixed.replace(/(\s+)(\w+):\s*([^,}]+)\s*$/gm, (match, indent, key, value) => {
    if (!value.includes('}') && !value.includes(')')) {
      changes++;
      return `${indent}${key}: ${value}\n${indent}}`;
    }
    return match;
  });

  // Fix missing semicolons after closing braces
  fixed = fixed.replace(/(\s+)\}\s*$/gm, '$1}\n');

  // Fix malformed function declarations
  fixed = fixed.replace(/export async function (\w+)\([^)]*\)\s*\{\s*return handleCors\(request\)\}\)\s*return addCorsHeaders\(response\)\s*}/g, 
    'export async function $1(request: NextRequest) {\n  return handleCors(request)\n}');

  return { content: fixed, changes };
}

// Main function
function main() {
  const apiDir = path.join(__dirname, 'app', 'api');
  
  if (!fs.existsSync(apiDir)) {
    console.log('API directory not found');
    return;
  }

  const tsFiles = findTsFiles(apiDir);
  let totalFiles = 0;
  let totalChanges = 0;

  console.log(`Found ${tsFiles.length} TypeScript files to check...`);

  tsFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: fixedContent, changes } = fixSyntaxErrors(content);
      
      if (changes > 0) {
        fs.writeFileSync(filePath, fixedContent);
        console.log(`Fixed ${changes} issues in ${path.relative(__dirname, filePath)}`);
        totalFiles++;
        totalChanges += changes;
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  });

  console.log(`\nFixed ${totalChanges} syntax errors in ${totalFiles} files`);
}

main();
