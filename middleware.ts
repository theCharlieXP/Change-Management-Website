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
    "/api/stripe-webhook",
    "/api/test-db",
    "/api/test-rest"
  ],
  // Add routes that don't require authentication
  ignoredRoutes: [
    "/api/webhook",
    "/api/stripe-webhook",
    "/api/test-db",
    "/api/test-rest"
  ],
  async afterAuth(auth, req) {
    // Get the current path
    const url = new URL(req.url);
    const path = url.pathname;

    // Handle CORS headers
    const origin = req.headers.get("origin") || "*"
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id, X-Session-Token",
      "Access-Control-Allow-Credentials": "true",
    }
    
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
      })
    }

    // Create base response with CORS headers
    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // If user is signed in and trying to access auth pages, redirect to dashboard
    if (auth.userId && (path === '/sign-in' || path === '/sign-up' || path === '/')) {
      return NextResponse.redirect(new URL('/dashboard/projects', req.url));
    }

    // Special handling for profile API
    if (path === '/api/auth/profile') {
      if (!auth.userId) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Please sign in to access this resource' },
          { status: 401, headers: corsHeaders }
        );
      }

      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('X-User-Id', auth.userId);
      
      if (auth.sessionId) {
        requestHeaders.set('X-Session-Id', auth.sessionId);
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
        headers: corsHeaders,
      });
    }

    // If user is not signed in and trying to access protected pages, redirect to sign-in
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', path);
      return NextResponse.redirect(signInUrl);
    }

    // Add auth headers if user is signed in
    if (auth.userId) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('X-User-Id', auth.userId);
      
      if (auth.sessionId) {
        requestHeaders.set('X-Session-Id', auth.sessionId);
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
        headers: corsHeaders,
      });
    }

    return response;
  }
})

// Configure Middleware Matcher
export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/(api|trpc)(.*)"
  ]
} 