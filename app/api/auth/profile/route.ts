import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  try {
    console.log('Profile API route accessed');
    
    // Get auth info from Clerk
    const authData = await auth();
const { userId  } = authData;
    const headersList = headers();
    const headerUserId = headersList.get('x-user-id');
    const authHeader = headersList.get('authorization');
    
    console.log('Auth info:', {
      clerkUserId: userId,
      headerUserId,
      hasAuthHeader: !!authHeader,
      authHeaderStart: authHeader ? authHeader.substring(0, 20) : null
    });

    // Verify user is authenticated
    if (!userId) {
      console.log('No Clerk userId found');
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Please sign in to access this resource'
      }, { status: 401 });
    }

    // Simplified header check
    if (!headerUserId || !authHeader) {
      console.log('Missing required headers:', { 
        hasUserId: !!headerUserId, 
        hasAuthHeader: !!authHeader 
      });
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Missing required authentication headers'
      }, { status: 401 });
    }

    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.error('Error setting cookie:', error);
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              console.error('Error removing cookie:', error);
            }
          },
        },
      }
    );

    // Test Supabase connection
    try {
      console.log('Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count');
      
      if (testError) {
        console.error('Supabase connection test failed:', {
          error: testError,
          env: {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
          }
        });
        throw testError;
      }
      
      console.log('Supabase connection test successful');
    } catch (testError: any) {
      console.error('Supabase connection test error:', testError);
      return NextResponse.json({ 
        error: 'Database connection error', 
        details: {
          message: testError.message,
          code: testError.code,
          hint: testError.hint
        }
      }, { status: 500 });
    }

    // Check for existing profile
    console.log('Checking for existing profile for user:', userId);
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('Profile check result:', { 
      hasProfile: !!profile, 
      errorCode: fetchError?.code,
      errorMessage: fetchError?.message 
    });

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return NextResponse.json({ 
        error: 'Database error', 
        message: 'Error fetching profile',
        details: fetchError.message
      }, { status: 500 });
    }

    // Create new profile if it doesn't exist
    if (!profile) {
      console.log('Creating new profile for user:', userId);
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          user_id: userId,
          tier: 'free',
          credits: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return NextResponse.json({ 
          error: 'Database error', 
          message: 'Error creating profile',
          details: insertError.message
        }, { status: 500 });
      }

      console.log('Successfully created new profile');
      return NextResponse.json({ 
        profile: newProfile, 
        created: true 
      });
    }

    console.log('Returning existing profile');
    return NextResponse.json({ 
      profile, 
      created: false 
    });

  } catch (error) {
    console.error('Error in profile route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 