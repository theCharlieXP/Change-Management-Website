import { authMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from 'next/server'

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  // Add all public routes here
  publicRoutes: ["/", "/api/send"]
})

// Configure Middleware Matcher
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
} 