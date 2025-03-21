import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default clerkMiddleware(async (auth, req) => {
  // Check if the request is for a public route
  const publicRoutes = [
    "/",              // Landing page
    "/api/send",      // Contact form endpoint
    "/sign-in",       // Sign in page
    "/sign-up",       // Sign up page
    "/communications-amigo", // Communications Amigo page
    "/api/stripe-config-check", // Stripe configuration check endpoint
    "/api/test-tavily", // Test Tavily API endpoint
    "/api/insights/debug", // Debug endpoint for environment variables
  ];
  
  // Check if the request is for an ignored route
  const ignoredRoutes = [
    "/_next/static/(.*)",    // Next.js static files
    "/favicon.ico",          // Favicon
  ];
  
  // Check if the current path matches any of the public routes
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname === route || 
    req.nextUrl.pathname.startsWith(route + '/')
  );
  
  // Check if the current path matches any of the ignored routes
  const isIgnoredRoute = ignoredRoutes.some(pattern => {
    const regex = new RegExp(`^${pattern.replace(/\(.*\)/g, '.*')}$`);
    return regex.test(req.nextUrl.pathname);
  });
  
  // If it's a public or ignored route, allow access
  if (isPublicRoute || isIgnoredRoute) {
    // Continue to the requested route
    const response = NextResponse.next();
    
    // Add Content Security Policy
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://clerk.changeamigo.com https://*.clerk.accounts.dev https://*.clerk.com https://gc.zgo.at https://*.goatcounter.com; connect-src 'self' https://api.stripe.com https://clerk.changeamigo.com https://*.clerk.accounts.dev https://*.clerk.com https://*.supabase.co https://*.goatcounter.com; img-src 'self' data: https://clerk.changeamigo.com https://*.clerk.accounts.dev https://*.clerk.com https://*.goatcounter.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src https://js.stripe.com https://clerk.changeamigo.com https://*.clerk.accounts.dev https://*.clerk.com; worker-src 'self' blob:; child-src 'self' blob:; object-src 'self' data:;"
    );
    
    return response;
  }
  
  // For protected routes, get the authentication state
  const { userId } = await auth();
  
  // If the user is authenticated and trying to access the dashboard root
  if (userId && req.nextUrl.pathname === "/dashboard") {
    // Redirect to the projects page
    const projectsUrl = new URL("/dashboard/projects", req.url);
    return NextResponse.redirect(projectsUrl);
  }
  
  // If the user is not authenticated and trying to access a protected route
  if (!userId && !isPublicRoute && !isIgnoredRoute) {
    // Redirect to the sign-in page
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  // For authenticated users accessing protected routes
  const response = NextResponse.next();
  
  // Add Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://clerk.changeamigo.com https://*.clerk.accounts.dev https://*.clerk.com https://gc.zgo.at https://*.goatcounter.com; connect-src 'self' https://api.stripe.com https://clerk.changeamigo.com https://*.clerk.accounts.dev https://*.clerk.com https://*.supabase.co https://*.goatcounter.com; img-src 'self' data: https://clerk.changeamigo.com https://*.clerk.accounts.dev https://*.clerk.com https://*.goatcounter.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src https://js.stripe.com https://clerk.changeamigo.com https://*.clerk.accounts.dev https://*.clerk.com; worker-src 'self' blob:; child-src 'self' blob:; object-src 'self' data:;"
  );
  
  return response;
})

// Configure Middleware Matcher
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
} 