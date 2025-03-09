#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * This script creates a backup of the Supabase database.
 * It can be run manually or scheduled with a cron job.
 * 
 * Usage:
 *   node scripts/backup-database.js
 * 
 * Environment variables:
 *   SUPABASE_URL - Supabase URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 *   BACKUP_STORAGE_PATH - Path to store backups (default: ./backups)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BACKUP_STORAGE_PATH = process.env.BACKUP_STORAGE_PATH || './backups';
const BACKUP_RETENTION_DAYS = 30; // Keep backups for 30 days

// Ensure required environment variables are set
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_STORAGE_PATH)) {
  fs.mkdirSync(BACKUP_STORAGE_PATH, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_STORAGE_PATH}`);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function backupDatabase() {
  try {
    console.log('Starting database backup...');
    
    // Generate timestamp for the backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.json`;
    const backupFilePath = path.join(BACKUP_STORAGE_PATH, backupFileName);
    
    // Get list of tables to backup
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%');
    
    if (tablesError) {
      throw new Error(`Failed to get tables: ${tablesError.message}`);
    }
    
    // Create backup object to store all data
    const backup = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        tables: tables.map(t => t.table_name),
      },
      data: {}
    };
    
    // Backup each table
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`Backing up table: ${tableName}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) {
        console.error(`Error backing up table ${tableName}: ${error.message}`);
        continue;
      }
      
      backup.data[tableName] = data;
      console.log(`Backed up ${data.length} rows from ${tableName}`);
    }
    
    // Write backup to file
    fs.writeFileSync(backupFilePath, JSON.stringify(backup, null, 2));
    console.log(`Backup saved to: ${backupFilePath}`);
    
    // Clean up old backups
    cleanupOldBackups();
    
    console.log('Database backup completed successfully');
    return backupFilePath;
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

function cleanupOldBackups() {
  console.log('Cleaning up old backups...');
  
  const files = fs.readdirSync(BACKUP_STORAGE_PATH);
  const now = new Date();
  
  for (const file of files) {
    if (!file.startsWith('backup-')) continue;
    
    const filePath = path.join(BACKUP_STORAGE_PATH, file);
    const stats = fs.statSync(filePath);
    const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24); // Age in days
    
    if (fileAge > BACKUP_RETENTION_DAYS) {
      console.log(`Removing old backup: ${file} (${Math.round(fileAge)} days old)`);
      fs.unlinkSync(filePath);
    }
  }
}

// Run the backup
backupDatabase().catch(console.error); 