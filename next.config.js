/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_FORM_EMAIL: process.env.CONTACT_FORM_EMAIL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  },
  serverRuntimeConfig: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_FORM_EMAIL: process.env.CONTACT_FORM_EMAIL,
  },
  publicRuntimeConfig: {
    // Add any public runtime configs here if needed
  },
}

module.exports = nextConfig 