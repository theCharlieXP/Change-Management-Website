import { authMiddleware } from "@clerk/nextjs"
import { NextResponse } from 'next/server'

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  // Add all public routes here
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/webhook",
    "/api/stripe-webhook"
  ],
  // Add routes that don't require authentication
  ignoredRoutes: [
    "/api/webhook",
    "/api/stripe-webhook"
  ],
  afterAuth(auth, req) {
    // Handle CORS for authenticated requests
    const response = NextResponse.next()
    
    // Add CORS headers
    const origin = req.headers.get("origin")
    response.headers.set("Access-Control-Allow-Origin", origin || "*")
    response.headers.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    
    // Handle unauthorized requests
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }
    
    return response
  }
})

// Configure Middleware Matcher
export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/(api|trpc)(.*)"
  ]
} 