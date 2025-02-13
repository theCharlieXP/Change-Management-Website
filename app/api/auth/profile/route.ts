import { auth } from '@clerk/nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  try {
    console.log('Profile API route accessed');
    
    // Get auth info from Clerk
    const { userId } = auth();
    const headersList = headers();
    const headerUserId = headersList.get('x-user-id');
    const authHeader = headersList.get('authorization');
    
    console.log('Auth info:', { 
      clerkUserId: userId,
      headerUserId,
      hasAuthHeader: !!authHeader
    });

    // Verify user is authenticated
    if (!userId || !headerUserId || userId !== headerUserId) {
      console.log('Authentication mismatch or missing:', {
        clerkUserId: userId,
        headerUserId,
        match: userId === headerUserId
      });
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Invalid or missing authentication',
        debug: { 
          clerkUserId: userId,
          headerUserId,
          hasAuthHeader: !!authHeader
        }
      }, { status: 401 });
    }

    // Create Supabase client with service role
    console.log('Creating Supabase client');
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
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
        console.error('Supabase connection test failed:', testError);
        throw testError;
      }
      
      console.log('Supabase connection test successful:', testData);
    } catch (testError: any) {
      console.error('Supabase connection test error:', testError);
      return NextResponse.json({ 
        error: 'Database connection error', 
        details: {
          message: testError.message,
          code: testError.code,
          hint: testError.hint
        },
        env: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 500 });
    }

    // Check for existing profile
    console.log('Checking for existing profile');
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
        error: 'Error fetching profile', 
        details: {
          message: fetchError.message,
          code: fetchError.code,
          hint: fetchError.hint
        },
        userId
      }, { status: 500 });
    }

    // Create new profile if it doesn't exist
    if (!profile) {
      console.log('Creating new profile for user:', userId);
      const newProfileData = {
        user_id: userId,
        tier: 'free',
        credits: 100,
      };
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([newProfileData])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return NextResponse.json({ 
          error: 'Error creating profile', 
          details: {
            message: insertError.message,
            code: insertError.code,
            hint: insertError.hint
          },
          attemptedData: newProfileData
        }, { status: 500 });
      }

      console.log('Successfully created new profile:', newProfile);
      return NextResponse.json({ profile: newProfile, created: true });
    }

    console.log('Found existing profile:', profile);
    return NextResponse.json({ profile, created: false });
  } catch (error: any) {
    console.error('Error in profile route:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: {
        message: error.message,
        code: error.code,
        hint: error.hint
      },
      location: 'profile route catch block'
    }, { status: 500 });
  }
} 