// Route checking script
const fs = require('fs');
const path = require('path');

console.log('Checking routes for potential issues...');
const appDir = path.resolve(__dirname, '../app');

// Check if app directory exists
if (!fs.existsSync(appDir)) {
  console.error('App directory does not exist!');
  process.exit(1);
}

// Function to check if a route exists and has the correct structure
function checkRoute(routePath) {
  const parts = routePath.split('/').filter(Boolean);
  let currentPath = appDir;
  
  console.log(`Checking route: ${routePath}`);
  
  for (const part of parts) {
    currentPath = path.join(currentPath, part);
    
    if (!fs.existsSync(currentPath)) {
      console.log(`❌ Path does not exist: ${currentPath}`);
      return false;
    }
    
    console.log(`✅ Path exists: ${currentPath}`);
  }
  
  // Check for route.ts file
  const routeFile = path.join(currentPath, 'route.ts');
  const routeTsxFile = path.join(currentPath, 'route.tsx');
  const routeJsFile = path.join(currentPath, 'route.js');
  const routeJsxFile = path.join(currentPath, 'route.jsx');
  
  if (fs.existsSync(routeFile)) {
    console.log(`✅ Route handler exists: ${routeFile}`);
    return true;
  } else if (fs.existsSync(routeTsxFile)) {
    console.log(`✅ Route handler exists: ${routeTsxFile}`);
    return true;
  } else if (fs.existsSync(routeJsFile)) {
    console.log(`✅ Route handler exists: ${routeJsFile}`);
    return true;
  } else if (fs.existsSync(routeJsxFile)) {
    console.log(`✅ Route handler exists: ${routeJsxFile}`);
    return true;
  }
  
  console.log(`❌ No route handler found at: ${currentPath}`);
  return false;
}

// Check critical routes that are causing errors
console.log('\nChecking critical routes:');
const criticalRoutes = [
  '/api/communications/save',
  '/api/communications/save/route',
  '/api/communications/delete',
  '/api/admin/setup-usage-tracking'
];

for (const route of criticalRoutes) {
  checkRoute(route);
}

// Check for any potential Pages Router files that shouldn't be there
console.log('\nChecking for Pages Router files that might cause conflicts:');
const pagesRouterFiles = [
  path.resolve(__dirname, '../pages'),
  path.resolve(__dirname, '../pages/_app.js'),
  path.resolve(__dirname, '../pages/_app.tsx'),
  path.resolve(__dirname, '../pages/_document.js'),
  path.resolve(__dirname, '../pages/_document.tsx'),
];

for (const file of pagesRouterFiles) {
  if (fs.existsSync(file)) {
    console.log(`❌ Pages Router file exists and may cause conflicts: ${file}`);
  } else {
    console.log(`✅ No conflict: ${file} does not exist`);
  }
} 