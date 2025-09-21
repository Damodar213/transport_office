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

// Function to fix all remaining syntax errors
function fixAllSyntaxErrors(content) {
  let fixed = content;
  let changes = 0;

  // Fix incomplete JSON objects with missing closing braces
  fixed = fixed.replace(/(\s+)(\w+):\s*([^,}]+)\s*$/gm, (match, indent, key, value) => {
    if (!value.includes('}') && !value.includes(')') && !value.includes(']')) {
      changes++;
      return `${indent}${key}: ${value}\n${indent}}`;
    }
    return match;
  });

  // Fix malformed object properties
  fixed = fixed.replace(/(\s+)(\w+):\s*([^,}]+)\s*\n\s*}\s*\n\s*}/g, '$1$2: $3\n$1}');

  // Fix incomplete function calls
  fixed = fixed.replace(/(\w+)\s*\(\s*([^)]*)\s*$/gm, '$1($2)');

  // Fix missing commas in object literals
  fixed = fixed.replace(/(\w+):\s*([^,}]+)\s*\n\s*}/g, '$1: $2\n}');

  // Fix incomplete ternary operators
  fixed = fixed.replace(/(\w+)\s*\?\s*([^:]+)\s*$/gm, '$1 ? $2 : ""');

  // Fix incomplete array literals
  fixed = fixed.replace(/(\w+)\s*\[\s*([^\]]*)\s*$/gm, '$1[$2]');

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
      const { content: fixedContent, changes } = fixAllSyntaxErrors(content);
      
      if (changes > 0) {
        fs.writeFileSync(filePath, fixedContent);
        console.log(`Fixed ${changes} syntax errors in ${path.relative(__dirname, filePath)}`);
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
