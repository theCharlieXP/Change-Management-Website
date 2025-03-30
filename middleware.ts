import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default clerkMiddleware(async (auth, req) => {
  // Debug logging for middleware
  console.log('Middleware processing request:', {
    path: req.nextUrl.pathname,
    cookies: req.cookies.getAll().map(c => c.name),
    hasAuthToken: !!req.cookies.get('__session'),
    method: req.method,
    url: req.url,
    search: req.nextUrl.search,
    isApi: req.nextUrl.pathname.startsWith('/api/'),
  })

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
    "/api/insights/search", // Search API endpoint
    "/api/insights/search-basic", // Simplified search API for debugging
    "/api/test-env",   // Environment test endpoint
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
  
  // For requests to the API, skip middleware for authentication (will be handled by the API endpoint)
  const isApiRequest = req.nextUrl.pathname.startsWith('/api/');
  if (isApiRequest) {
    console.log('Middleware: API request detected, letting route handler handle auth:', req.nextUrl.pathname);
    return NextResponse.next();
  }

  // If it's a public or ignored route, allow access
  if (isPublicRoute || isIgnoredRoute) {
    console.log('Middleware: Allowing public/ignored route:', req.nextUrl.pathname)
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
  
  console.log('Middleware: Auth check for protected route:', {
    path: req.nextUrl.pathname,
    hasUserId: !!userId
  })
  
  // If the user is authenticated and trying to access the dashboard root
  if (userId && req.nextUrl.pathname === "/dashboard") {
    console.log('Middleware: Redirecting from dashboard root to projects page')
    // Redirect to the projects page
    const projectsUrl = new URL("/dashboard/projects", req.url);
    return NextResponse.redirect(projectsUrl);
  }
  
  // If the user is not authenticated and trying to access a protected route
  if (!userId && !isPublicRoute && !isIgnoredRoute) {
    console.log('Middleware: Unauthenticated request to protected route, redirecting to sign-in:', req.nextUrl.pathname)
    // Redirect to the sign-in page
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  // Special handling for project viewer pages 
  if (req.nextUrl.pathname.match(/^\/project-view\/[^\/]+$/)) {
    console.log('Middleware: Project viewer page detected:', req.nextUrl.pathname);
    
    // If user is authenticated, redirect directly to the project page
    if (userId) {
      console.log('Middleware: Authenticated access to project viewer - redirecting directly');
      
      // Extract the project ID from the URL
      const projectId = req.nextUrl.pathname.split('/').pop();
      
      // Redirect directly to the project page
      const projectUrl = new URL(`/dashboard/projects/${projectId}`, req.url);
      return NextResponse.redirect(projectUrl);
    } else {
      // If user is not authenticated, redirect to sign-in
      console.log('Middleware: Unauthenticated access to project viewer, redirecting to sign-in');
      const signInUrl = new URL("/sign-in", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  // Special handling for project detail pages
  if (req.nextUrl.pathname.match(/^\/dashboard\/projects\/[^\/]+$/)) {
    console.log('Middleware: Project details page detected:', req.nextUrl.pathname);
    
    // If user is authenticated, simply allow access
    if (userId) {
      console.log('Middleware: Authenticated access to project details - proceeding normally');
      return NextResponse.next();
    } else {
      // If user is not authenticated, redirect to sign-in
      console.log('Middleware: Unauthenticated access to project details, redirecting to sign-in');
      const signInUrl = new URL("/sign-in", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  // Special handling for hybrid project pages 
  if (req.nextUrl.pathname.match(/^\/hybrid-project\/[^\/]+$/)) {
    console.log('Middleware: Hybrid project page detected:', {
      path: req.nextUrl.pathname,
      cookies: req.cookies.getAll().map(c => c.name).join(', '),
      hasAuthToken: !!req.cookies.get('__session'),
      userId
    });
    
    // If user is authenticated, let them through
    if (userId) {
      console.log('Middleware: Authenticated access to hybrid project page - ALLOWING ACCESS');
      // IMPORTANT! Add special header to help debugging and prevent any application-level redirects
      const response = NextResponse.next();
      
      // Add headers to signal this page should not be redirected
      response.headers.set('X-Hybrid-Project-Access', 'allowed');
      response.headers.set('X-No-Redirect', 'true');
      
      return response;
    } else {
      // If user is not authenticated, redirect to sign-in
      console.log('Middleware: Unauthenticated access to hybrid project page, redirecting to sign-in');
      const signInUrl = new URL("/sign-in", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  // Special handling for static project data API
  if (req.nextUrl.pathname.match(/^\/static-project-data\/[^\/]+$/)) {
    console.log('Middleware: Static project data API request detected:', req.nextUrl.pathname);
    return NextResponse.next();
  }
  
  // Special handling for direct project view pages
  if (req.nextUrl.pathname.match(/^\/direct-project-view\/[^\/]+$/)) {
    console.log('Middleware: Direct project view page detected:', {
      path: req.nextUrl.pathname,
      cookies: req.cookies.getAll().map(c => c.name).join(', '),
      hasAuthToken: !!req.cookies.get('__session'),
      userId
    });
    
    // If user is authenticated, let them through with no interference
    if (userId) {
      console.log('Middleware: Authenticated access to direct project view - ALLOWING ACCESS WITH NO REDIRECTION');
      const response = NextResponse.next();
      
      // Add special headers to explicitly prevent any redirection
      response.headers.set('X-Direct-Project-Access', 'allowed');
      response.headers.set('X-No-Redirect', 'true');
      
      return response;
    } else {
      // If user is not authenticated, redirect to sign-in
      console.log('Middleware: Unauthenticated access to direct project view, redirecting to sign-in');
      const signInUrl = new URL("/sign-in", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  // For authenticated users accessing protected routes
  console.log('Middleware: Allowing authenticated access to protected route:', req.nextUrl.pathname)
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