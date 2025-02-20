/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_FORM_EMAIL: process.env.CONTACT_FORM_EMAIL,
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