/**
 * This file provides utility functions to check Supabase configuration
 * and ensure environment variables are properly loaded.
 */

// Check if we're running on the client side
const isClient = typeof window !== 'undefined'

// Check if Supabase environment variables are configured
export function checkSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Only check for service key on the server
  const serviceKey = !isClient ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined;
  
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
      isClient,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME
    }
  };
  
  console.log('Supabase configuration check:', config);
  
  // For client-side, we only need URL and anon key
  if (isClient && (!url || !anonKey)) {
    console.error('Missing required client-side Supabase environment variables');
    return false;
  }
  
  // For server-side, we need URL, anon key, and service key
  if (!isClient && (!url || !anonKey || !serviceKey)) {
    console.error('Missing required server-side Supabase environment variables');
    return false;
  }
  
  return true;
}

// Initialize Supabase configuration check on import
checkSupabaseConfig(); 