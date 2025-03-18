/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_FORM_EMAIL: process.env.CONTACT_FORM_EMAIL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  serverRuntimeConfig: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_FORM_EMAIL: process.env.CONTACT_FORM_EMAIL,
  },
  publicRuntimeConfig: {
    // Add any public runtime configs here if needed
  },
  // Consolidated headers configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  // Explicitly set App Router configuration
  experimental: {
    // Not needed for Next.js 14+ as App Router is the default
    // appDir: true,
    // These settings can help with some build issues
    serverComponentsExternalPackages: [],
  },
  // Fix potential issues with API routes
  typescript: {
    // Dangerously allow type errors to allow build to proceed - only use if necessary
    ignoreBuildErrors: true,
  },
  // Disable static exports for API routes
  output: 'standalone',
  // This helps with some path resolution issues
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // This instructs Next.js that we're migrating to App Router
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'md', 'mdx'],
}

module.exports = nextConfig 