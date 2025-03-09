#!/usr/bin/env node

/**
 * Script to update Clerk imports for v6 compatibility
 * 
 * This script:
 * 1. Updates import paths from '@clerk/nextjs' to '@clerk/nextjs/server'
 * 2. Updates auth() calls to be async (await auth())
 * 3. Updates auth.protect() calls to auth.protect()
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Find all files that import auth from @clerk/nextjs
console.log(`${colors.bold}${colors.blue}=== Finding files with Clerk imports ====${colors.reset}\n`);

const findCommand = "grep -r \"import { auth } from '@clerk/nextjs/server'\" --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' .";
let filesToUpdate = [];

try {
  const grepOutput = execSync(findCommand, { encoding: 'utf8' });
  const lines = grepOutput.split('\n').filter(Boolean);
  
  filesToUpdate = lines.map(line => {
    const [filePath] = line.split(':');
    return filePath;
  });
  
  console.log(`${colors.green}Found ${filesToUpdate.length} files to update${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error finding files: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Update each file
console.log(`\n${colors.bold}${colors.blue}=== Updating files ====${colors.reset}\n`);

let updatedFiles = 0;
let errorFiles = 0;

for (const filePath of filesToUpdate) {
  try {
    console.log(`${colors.cyan}Processing ${filePath}...${colors.reset}`);
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Update import path
    content = content.replace(
      /import\s+\{\s*auth\s*\}\s+from\s+['"]@clerk\/nextjs['"]/g,
      "import { auth } from '@clerk/nextjs/server'"
    );
    
    // 2. Update auth() calls to be async
    // This is a simplified approach and might need manual review
    
    // Find function declarations/expressions that use auth()
    const functionRegex = /\b(async\s+)?(function\s+\w+\s*\([^)]*\)|const\s+\w+\s*=\s*(\([^)]*\)\s*=>|function\s*\([^)]*\)))/g;
    const authCallRegex = /const\s+\{\s*([^}]+)\s*\}\s*=\s*auth\(\)/g;
    
    // Find all function declarations
    const functionMatches = [...content.matchAll(functionRegex)];
    
    for (const match of functionMatches) {
      const functionText = match[0];
      const isAlreadyAsync = !!match[1];
      const functionStartIndex = match.index;
      
      // Check if this function contains auth() calls
      const functionEndIndex = findFunctionEndIndex(content, functionStartIndex);
      const functionBody = content.substring(functionStartIndex, functionEndIndex);
      
      if (authCallRegex.test(functionBody) && !isAlreadyAsync) {
        // Add async keyword to function
        const newFunctionText = 'async ' + functionText;
        content = content.substring(0, functionStartIndex) + 
                 newFunctionText + 
                 content.substring(functionStartIndex + functionText.length);
      }
    }
    
    // Update auth() calls
    content = content.replace(
      /const\s+\{\s*([^}]+)\s*\}\s*=\s*auth\(\)/g,
      "const authData = await auth();\nconst { $1 } = authData"
    );
    
    // 3. Update auth.protect() calls to auth.protect()
    content = content.replace(
      /auth\(\)\.protect\(\)/g,
      "auth.protect()"
    );
    
    // Write updated content back to file
    fs.writeFileSync(filePath, content, 'utf8');
    updatedFiles++;
    
    console.log(`${colors.green}✓ Updated ${filePath}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Error updating ${filePath}: ${error.message}${colors.reset}`);
    errorFiles++;
  }
}

// Helper function to find the end of a function
function findFunctionEndIndex(content, startIndex) {
  let braceCount = 0;
  let inFunction = false;
  
  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];
    
    if (char === '{') {
      braceCount++;
      inFunction = true;
    } else if (char === '}') {
      braceCount--;
      
      if (inFunction && braceCount === 0) {
        return i + 1;
      }
    }
  }
  
  return content.length;
}

// Print summary
console.log(`\n${colors.bold}${colors.blue}=== Summary ====${colors.reset}`);
console.log(`${colors.green}Updated: ${updatedFiles} files${colors.reset}`);
console.log(`${colors.red}Errors: ${errorFiles} files${colors.reset}`);

if (errorFiles > 0) {
  console.log(`\n${colors.yellow}Some files could not be updated automatically. Please review them manually.${colors.reset}`);
  process.exit(1);
} else {
  console.log(`\n${colors.green}All files updated successfully!${colors.reset}`);
  process.exit(0);
} 