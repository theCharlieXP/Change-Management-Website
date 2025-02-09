import { auth } from '@clerk/nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Profile API route accessed');
    const { userId } = auth();
    console.log('Auth userId:', userId);
    
    if (!userId) {
      console.log('No userId found in auth');
      return NextResponse.json({ error: 'Unauthorized', details: 'No userId found' }, { status: 401 });
    }

    console.log('Creating Supabase client');
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
      
      console.log('Supabase connection test:', { 
        data: testData, 
        error: testError,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      });
      
      if (testError) {
        throw new Error(`Supabase connection test failed: ${testError.message}`);
      }
    } catch (testError) {
      console.error('Supabase connection test error:', testError);
      return NextResponse.json({ 
        error: 'Database connection error', 
        details: testError,
        env: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 500 });
    }

    console.log('Checking for existing profile');
    // Check if profile exists
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('Profile check result:', { profile, error: fetchError });

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return NextResponse.json({ 
        error: 'Error fetching profile', 
        details: fetchError,
        userId: userId
      }, { status: 500 });
    }

    // If profile doesn't exist, create it
    if (!profile) {
      console.log('Creating new profile for user:', userId);
      const newProfileData = {
        user_id: userId,
        tier: 'free',
        credits: 100,
      };
      console.log('New profile data:', newProfileData);

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([newProfileData])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return NextResponse.json({ 
          error: 'Error creating profile', 
          details: insertError,
          attemptedData: newProfileData
        }, { status: 500 });
      }

      console.log('Successfully created new profile:', newProfile);
      return NextResponse.json({ profile: newProfile, created: true });
    }

    console.log('Found existing profile:', profile);
    return NextResponse.json({ profile, created: false });
  } catch (error) {
    console.error('Error in profile route:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error,
      location: 'profile route catch block'
    }, { status: 500 });
  }
} 