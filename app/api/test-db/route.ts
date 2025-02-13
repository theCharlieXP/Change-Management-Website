import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Test DB endpoint accessed');
    
    // Log environment variables (safely)
    const envStatus = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlFormat: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') ? 'valid' : 'invalid',
      keyLengths: {
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      }
    };
    
    console.log('Environment status:', envStatus);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing environment variables',
        envStatus
      }, { status: 500 });
    }

    // Try both anon and service role keys
    const clients = {
      anon: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      ),
      serviceRole: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      )
    };

    // Test results for both clients
    const results = {
      anon: { error: null as any, data: null as any },
      serviceRole: { error: null as any, data: null as any }
    };

    // Test anon client
    console.log('Testing anon client connection...');
    try {
      const { data, error } = await clients.anon
        .from('profiles')
        .select('count');
      results.anon = { data, error };
    } catch (e) {
      results.anon.error = e;
    }

    // Test service role client
    console.log('Testing service role client connection...');
    try {
      const { data, error } = await clients.serviceRole
        .from('profiles')
        .select('count');
      results.serviceRole = { data, error };
    } catch (e) {
      results.serviceRole.error = e;
    }

    // Return detailed results
    return NextResponse.json({
      status: 'complete',
      results: {
        anon: {
          success: !results.anon.error,
          error: results.anon.error ? {
            message: results.anon.error.message,
            code: results.anon.error.code,
            hint: results.anon.error.hint
          } : null,
          data: results.anon.data
        },
        serviceRole: {
          success: !results.serviceRole.error,
          error: results.serviceRole.error ? {
            message: results.serviceRole.error.message,
            code: results.serviceRole.error.code,
            hint: results.serviceRole.error.hint
          } : null,
          data: results.serviceRole.data
        }
      },
      envStatus
    });

  } catch (error) {
    console.error('Error in test-db route:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Internal server error',
      details: error,
      envStatus: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        keyLengths: {
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
          serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
        }
      }
    }, { status: 500 });
  }
} 