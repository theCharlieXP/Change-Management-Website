#!/usr/bin/env node

/**
 * Security Audit Script
 * 
 * This script performs a basic security audit of the application.
 * It checks for common security issues and provides recommendations.
 * 
 * Usage:
 *   node scripts/security-audit.js
 */

require('dotenv').config();
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

// Security audit results
const results = {
  pass: [],
  warn: [],
  fail: [],
};

console.log(`${colors.bold}${colors.blue}=== Security Audit ====${colors.reset}\n`);

// Check if .env file is in .gitignore
function checkEnvInGitignore() {
  try {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    const lines = gitignore.split('\n');
    
    if (lines.some(line => line.trim() === '.env' || line.trim() === '*.env')) {
      results.pass.push('Environment files (.env) are properly ignored in .gitignore');
    } else {
      results.fail.push('Environment files (.env) are NOT listed in .gitignore - add them to prevent secrets from being committed');
    }
    
    if (lines.some(line => line.trim() === '.env.local')) {
      results.pass.push('Local environment files (.env.local) are properly ignored in .gitignore');
    } else {
      results.warn.push('Local environment files (.env.local) are not explicitly listed in .gitignore');
    }
  } catch (error) {
    results.fail.push('Could not read .gitignore file');
  }
}

// Check for security headers in next.config.js
function checkSecurityHeaders() {
  try {
    const nextConfig = fs.readFileSync('next.config.js', 'utf8');
    
    if (nextConfig.includes('Strict-Transport-Security')) {
      results.pass.push('HSTS security header is configured');
    } else {
      results.fail.push('HSTS security header is not configured in next.config.js');
    }
    
    if (nextConfig.includes('Content-Security-Policy') || fs.existsSync('middleware.ts') && fs.readFileSync('middleware.ts', 'utf8').includes('Content-Security-Policy')) {
      results.pass.push('Content Security Policy is configured');
    } else {
      results.fail.push('Content Security Policy is not configured');
    }
    
    if (nextConfig.includes('X-Frame-Options')) {
      results.pass.push('X-Frame-Options header is configured');
    } else {
      results.warn.push('X-Frame-Options header is not configured in next.config.js');
    }
  } catch (error) {
    results.fail.push('Could not read next.config.js file');
  }
}

// Check for rate limiting
function checkRateLimiting() {
  try {
    if (fs.existsSync('lib/rate-limit.ts')) {
      results.pass.push('Rate limiting implementation found');
      
      // Check if rate limiting is applied to API routes
      let apiRoutesWithRateLimit = 0;
      const apiDir = 'app/api';
      
      if (fs.existsSync(apiDir)) {
        const findApiRoutes = (dir) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
              findApiRoutes(fullPath);
            } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
              const content = fs.readFileSync(fullPath, 'utf8');
              if (content.includes('rateLimit') || content.includes('rate-limit')) {
                apiRoutesWithRateLimit++;
              }
            }
          }
        };
        
        findApiRoutes(apiDir);
        
        if (apiRoutesWithRateLimit > 0) {
          results.pass.push(`Rate limiting is applied to ${apiRoutesWithRateLimit} API routes`);
        } else {
          results.warn.push('Rate limiting implementation exists but may not be applied to API routes');
        }
      }
    } else {
      results.warn.push('No rate limiting implementation found');
    }
  } catch (error) {
    results.warn.push('Could not check for rate limiting implementation');
  }
}

// Check for npm vulnerabilities
function checkNpmVulnerabilities() {
  try {
    console.log(`${colors.cyan}Running npm audit...${colors.reset}`);
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    const auditResult = JSON.parse(auditOutput);
    
    if (auditResult.metadata.vulnerabilities.high > 0 || auditResult.metadata.vulnerabilities.critical > 0) {
      results.fail.push(`npm audit found ${auditResult.metadata.vulnerabilities.high} high and ${auditResult.metadata.vulnerabilities.critical} critical vulnerabilities`);
    } else if (auditResult.metadata.vulnerabilities.moderate > 0) {
      results.warn.push(`npm audit found ${auditResult.metadata.vulnerabilities.moderate} moderate vulnerabilities`);
    } else {
      results.pass.push('npm audit found no high or critical vulnerabilities');
    }
  } catch (error) {
    // If the command fails, it likely means there are vulnerabilities
    try {
      const errorOutput = error.stdout.toString();
      const auditResult = JSON.parse(errorOutput);
      
      results.fail.push(`npm audit found ${auditResult.metadata.vulnerabilities.high} high and ${auditResult.metadata.vulnerabilities.critical} critical vulnerabilities`);
    } catch (parseError) {
      results.warn.push('Could not run npm audit successfully');
    }
  }
}

// Check for robots.txt and security.txt
function checkWebsiteFiles() {
  if (fs.existsSync('public/robots.txt')) {
    results.pass.push('robots.txt file exists');
  } else {
    results.warn.push('robots.txt file not found in public directory');
  }
  
  if (fs.existsSync('public/.well-known/security.txt')) {
    results.pass.push('security.txt file exists');
  } else {
    results.warn.push('security.txt file not found in public/.well-known directory');
  }
  
  if (fs.existsSync('public/sitemap.xml')) {
    results.pass.push('sitemap.xml file exists');
  } else {
    results.warn.push('sitemap.xml file not found in public directory');
  }
}

// Check for error handling
function checkErrorHandling() {
  if (fs.existsSync('lib/error-handler.ts')) {
    results.pass.push('Centralized error handling implementation found');
  } else {
    results.warn.push('No centralized error handling implementation found');
  }
}

// Check for security monitoring
function checkSecurityMonitoring() {
  if (fs.existsSync('lib/security-monitor.ts')) {
    results.pass.push('Security monitoring implementation found');
  } else {
    results.warn.push('No security monitoring implementation found');
  }
}

// Check for backup scripts
function checkBackupScripts() {
  if (fs.existsSync('scripts/backup-database.js')) {
    results.pass.push('Database backup script found');
  } else {
    results.warn.push('No database backup script found');
  }
}

// Run all checks
function runAllChecks() {
  checkEnvInGitignore();
  checkSecurityHeaders();
  checkRateLimiting();
  checkNpmVulnerabilities();
  checkWebsiteFiles();
  checkErrorHandling();
  checkSecurityMonitoring();
  checkBackupScripts();
  
  // Print results
  console.log(`\n${colors.bold}${colors.green}=== Passed Checks ====${colors.reset}`);
  results.pass.forEach(item => console.log(`${colors.green}✓ ${item}${colors.reset}`));
  
  console.log(`\n${colors.bold}${colors.yellow}=== Warnings ====${colors.reset}`);
  results.warn.forEach(item => console.log(`${colors.yellow}⚠ ${item}${colors.reset}`));
  
  console.log(`\n${colors.bold}${colors.red}=== Failed Checks ====${colors.reset}`);
  results.fail.forEach(item => console.log(`${colors.red}✗ ${item}${colors.reset}`));
  
  // Summary
  console.log(`\n${colors.bold}${colors.blue}=== Summary ====${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.pass.length}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warn.length}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.fail.length}${colors.reset}`);
  
  if (results.fail.length > 0) {
    console.log(`\n${colors.bold}${colors.red}Please address the failed checks before deploying to production.${colors.reset}`);
    process.exit(1);
  } else if (results.warn.length > 0) {
    console.log(`\n${colors.bold}${colors.yellow}Consider addressing the warnings to improve security.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bold}${colors.green}All security checks passed!${colors.reset}`);
    process.exit(0);
  }
}

// Run the audit
runAllChecks(); 