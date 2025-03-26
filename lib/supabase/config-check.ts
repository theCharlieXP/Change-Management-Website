/**
 * This file provides utility functions to check Supabase configuration
 * and ensure environment variables are properly loaded.
 */

// Check if Supabase environment variables are configured
export function checkSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const config = {
    hasUrl: !!url,
    hasAnonKey: !!anonKey,
    hasServiceKey: !!serviceKey,
    urlFormat: url && url.startsWith('https://') ? 'valid' : 'invalid',
    keyLengths: {
      anonKey: anonKey?.length || 0,
      serviceKey: serviceKey?.length || 0
    },
    // Add more detailed environment info
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME,
      NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV
    }
  };
  
  console.log('Supabase configuration check:', config);
  
  if (!url || !anonKey) {
    console.error('Missing required Supabase environment variables');
    return false;
  }
  
  return true;
}

// Initialize Supabase configuration check on import
checkSupabaseConfig(); 