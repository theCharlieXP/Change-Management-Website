import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: ["/", "/about", "/features", "/contact"],
  afterAuth(auth, req) {
    // If the user is logged in and trying to access the home page,
    // redirect them to the dashboard
    if (auth.userId && req.nextUrl.pathname === "/") {
      const dashboardUrl = new URL("/dashboard", req.url)
      return Response.redirect(dashboardUrl)
    }

    // If the user isn't logged in and trying to access a protected route,
    // redirect them to the home page
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL("/", req.url)
      return Response.redirect(signInUrl)
    }
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 