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

// Function to clean up excessive braces
function cleanupExcessiveBraces(content) {
  let fixed = content;
  let changes = 0;

  // Remove excessive closing braces (3 or more consecutive closing braces)
  fixed = fixed.replace(/\n\s*}\s*\n\s*}\s*\n\s*}\s*\n/g, '\n  }\n');
  changes++;

  // Remove excessive closing braces (2 consecutive closing braces)
  fixed = fixed.replace(/\n\s*}\s*\n\s*}\s*\n/g, '\n  }\n');
  changes++;

  // Fix malformed object properties
  fixed = fixed.replace(/(\w+):\s*([^,}]+)\s*\n\s*}\s*\n\s*}\s*\n\s*}\s*\n/g, '$1: $2\n  }');
  changes++;

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
      const { content: fixedContent, changes } = cleanupExcessiveBraces(content);
      
      if (changes > 0) {
        fs.writeFileSync(filePath, fixedContent);
        console.log(`Cleaned up ${changes} excessive braces in ${path.relative(__dirname, filePath)}`);
        totalFiles++;
        totalChanges += changes;
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  });

  console.log(`\nCleaned up ${totalChanges} excessive braces in ${totalFiles} files`);
}

main();
