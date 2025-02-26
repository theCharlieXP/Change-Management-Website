import { authMiddleware } from "@clerk/nextjs"
import { NextResponse } from "next/server"

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",              // Landing page
    "/api/send",      // Contact form endpoint
    "/sign-in",       // Sign in page
    "/sign-up",       // Sign up page
  ],
  
  // Routes that can always be accessed, even if not authenticated
  ignoredRoutes: [
    "/_next/static/(.*)",    // Next.js static files
    "/favicon.ico",          // Favicon
  ],

  // Redirect users after login
  afterAuth(auth, req) {
    // If the user is authenticated and trying to access the dashboard root
    if (auth.userId && req.nextUrl.pathname === "/dashboard") {
      // Redirect to the projects page
      const projectsUrl = new URL("/dashboard/projects", req.url);
      return NextResponse.redirect(projectsUrl);
    }
  }
})

// Configure Middleware Matcher
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
} 