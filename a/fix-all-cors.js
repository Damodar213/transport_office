const fs = require('fs');
const path = require('path');

// Function to add CORS headers to a file
function addCorsToFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has CORS import
    if (content.includes('from "@/lib/cors"')) {
      console.log(`Skipping ${filePath} - already has CORS`);
      return;
    }
    
    // Skip if it's the cors.ts file itself
    if (filePath.includes('cors.ts')) {
      return;
    }
    
    let modified = false;
    
    // Add CORS import
    if (content.includes('import { NextResponse }') || content.includes('import { type NextRequest')) {
      const importMatch = content.match(/import.*from.*"next\/server"/);
      if (importMatch) {
        const importLine = importMatch[0];
        const corsImport = 'import { handleCors, addCorsHeaders } from "@/lib/cors"';
        
        if (!content.includes(corsImport)) {
          content = content.replace(importLine, importLine + '\n' + corsImport);
          modified = true;
        }
      }
    }
    
    // Add OPTIONS handler for POST routes
    if (content.includes('export async function POST')) {
      const postMatch = content.match(/export async function POST\([^)]*\)\s*{/);
      if (postMatch && !content.includes('export async function OPTIONS')) {
        const postLine = postMatch[0];
        const optionsHandler = `export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

`;
        
        content = content.replace(postLine, optionsHandler + postLine);
        modified = true;
      }
    }
    
    // Add CORS handling to POST function
    if (content.includes('export async function POST')) {
      const postMatch = content.match(/export async function POST\([^)]*\)\s*{/);
      if (postMatch) {
        const postLine = postMatch[0];
        const corsHandling = `  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

`;
        
        if (!content.includes('Handle CORS preflight')) {
          content = content.replace(postLine, postLine + '\n' + corsHandling);
          modified = true;
        }
      }
    }
    
    // Add CORS headers to responses
    if (content.includes('NextResponse.json(') && !content.includes('addCorsHeaders(')) {
      // Find all NextResponse.json calls and wrap them
      content = content.replace(
        /return NextResponse\.json\(([^)]+)\)/g,
        (match, args) => {
          if (match.includes('addCorsHeaders')) return match;
          return `const response = NextResponse.json(${args})\n    return addCorsHeaders(response)`;
        }
      );
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes needed for ${filePath}`);
    }
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
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

console.log(`Found ${routeFiles.length} route files`);
console.log('Adding CORS support to all API routes...\n');

routeFiles.forEach(file => {
  addCorsToFile(file);
});

console.log('\nCORS fix completed!');
