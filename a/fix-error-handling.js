const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all files with error.message
const files = execSync('grep -r "error\\.message" app/api --include="*.ts" -l', { encoding: 'utf8' }).trim().split('\n');

function fixErrorHandling(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix error.message to proper error handling
    content = content.replace(
      /error\.message/g,
      'error instanceof Error ? error.message : "Unknown error"'
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

console.log('Fixing error handling in API routes...');
files.forEach(fixErrorHandling);
console.log('Done!');
