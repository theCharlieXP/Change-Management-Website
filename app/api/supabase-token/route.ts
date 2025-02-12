import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { SignJWT } from 'jose'

// Get the JWT secret from environment variable
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('Missing SUPABASE_JWT_SECRET environment variable')
}

// Decode base64 secret
function base64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const b64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = Buffer.from(b64, 'base64')
  return new Uint8Array(rawData)
}

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + 3600 // 1 hour from now

    // Create claims object
    const claims = {
      aud: 'authenticated',
      exp,
      sub: userId,
      role: 'authenticated',
      iat: now,
      email: '',
    }

    // Create a JWT token that Supabase will accept
    const token = await new SignJWT(claims)
      .setProtectedHeader({ 
        alg: 'HS256',
        typ: 'JWT'
      })
      .sign(base64ToUint8Array(JWT_SECRET as string))

    console.log('Generated token info:', {
      userId,
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
      claims
    })

    return new NextResponse(
      JSON.stringify({
        supabaseAccessToken: token,
        tokenType: 'jwt',
        tokenLength: token.length
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error generating Supabase token:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to generate token',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
} 