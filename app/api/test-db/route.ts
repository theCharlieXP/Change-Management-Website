import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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

    // Test the connection by trying to access the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection test failed:', error);
      return NextResponse.json({
        status: 'error',
        error: error.message,
        details: {
          code: error.code,
          hint: error.hint,
          details: error.details
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      data
    });

  } catch (error) {
    console.error('Error in test-db route:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
} 