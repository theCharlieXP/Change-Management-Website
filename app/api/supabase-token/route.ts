import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { userId, getToken } = getAuth(req)
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Not authenticated', 
          details: 'No user found' 
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const supabaseAccessToken = await getToken({
      template: 'supabase'
    })

    if (!supabaseAccessToken) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'No Supabase access token available', 
          details: 'Failed to get Supabase token from Clerk' 
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Log token type and length for debugging
    console.log('Token type:', typeof supabaseAccessToken)
    console.log('Token length:', supabaseAccessToken.length)

    return new NextResponse(
      JSON.stringify({ 
        supabaseAccessToken,
        tokenType: typeof supabaseAccessToken,
        tokenLength: supabaseAccessToken.length
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error getting Supabase token:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 