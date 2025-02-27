import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Change Amigo",
  description: "Privacy Policy for Change Amigo - A Friendly Change Management Partner",
};

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-emerald max-w-none">
        <p className="text-sm text-muted-foreground mb-8">
          <strong>Last Updated: February 27, 2025</strong>
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          Welcome to Change Amigo ("we," "our," or "us"). We are committed to protecting your privacy and ensuring 
          the security of your personal information. This Privacy Policy explains how we collect, use, store, and 
          protect your data when you use our website and services.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">2.1 Personal Information</h3>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Account Information</strong>: When you sign up, we collect your email address and authentication information through our third-party authentication providers.</li>
          <li><strong>Profile Information</strong>: We store basic profile data in our database, including your user ID and subscription tier.</li>
          <li><strong>Usage Data</strong>: We track how you use our features, particularly the Insight Search feature, to manage usage limits and improve our services.</li>
        </ul>

        <h3 className="text-xl font-medium mt-6 mb-3">2.2 Project Data</h3>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Project Information</strong>: We collect and store information about your change management projects, including project names, descriptions, and related content.</li>
          <li><strong>Tasks and Notes</strong>: We store tasks, notes, and other content you create within your projects.</li>
          <li><strong>Saved Insights</strong>: When you save insights from searches, we store this information in our database.</li>
        </ul>

        <h3 className="text-xl font-medium mt-6 mb-3">2.3 Technical Information</h3>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Cookies</strong>: We use cookies to maintain your session and remember your preferences. See our Cookie Policy section for more details.</li>
          <li><strong>Log Data</strong>: We automatically collect information sent by your browser, including your IP address, browser type, pages visited, and time spent on our site.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide and maintain our services</li>
          <li>Process payments and manage subscriptions through Stripe</li>
          <li>Track feature usage for free and premium tiers</li>
          <li>Improve and personalize your experience</li>
          <li>Communicate with you about your account and our services</li>
          <li>Ensure the security of our platform</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Storage and Security</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">4.1 Data Storage</h3>
        <p>
          We use Supabase to store your data securely. Our database implements row-level security policies to ensure 
          that users can only access their own data.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">4.2 Security Measures</h3>
        <p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Encryption of sensitive data</li>
          <li>Secure authentication processes</li>
          <li>Regular security assessments</li>
          <li>Limited access to personal information by our staff</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Sharing and Third-Party Services</h2>
        <p>We may share your information with:</p>

        <h3 className="text-xl font-medium mt-6 mb-3">5.1 Service Providers</h3>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Authentication</strong>: We use Clerk for user authentication</li>
          <li><strong>Payment Processing</strong>: We use Stripe to process payments and manage subscriptions</li>
          <li><strong>Database Services</strong>: We use Supabase for data storage</li>
        </ul>

        <h3 className="text-xl font-medium mt-6 mb-3">5.2 Legal Requirements</h3>
        <p>
          We may disclose your information if required by law or if we believe in good faith that such action is 
          necessary to comply with legal obligations.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights</h2>
        <p>Depending on your location, you may have the following rights regarding your personal data:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Access to your personal information</li>
          <li>Correction of inaccurate data</li>
          <li>Deletion of your data</li>
          <li>Restriction of processing</li>
          <li>Data portability</li>
          <li>Objection to processing</li>
        </ul>
        <p>
          To exercise these rights, please contact us using our <Link href="/#contact" className="text-emerald-600 hover:underline">contact form</Link>.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookie Policy</h2>
        <p>We use cookies to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Maintain your session</li>
          <li>Remember your preferences</li>
          <li>Track usage for analytics purposes</li>
          <li>Manage feature usage limits</li>
        </ul>
        <p>
          You can control cookies through your browser settings, but disabling cookies may limit your ability to use 
          certain features of our site.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
        <p>
          Our services are not intended for children under 16. We do not knowingly collect personal information from 
          children under 16. If you believe we have collected information from a child under 16, please contact us.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
          Privacy Policy on this page and updating the "Last Updated" date.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us using our <Link href="/#contact" className="text-emerald-600 hover:underline">contact form</Link>.
        </p>
      </div>
      
      <div className="mt-12 text-center">
        <Link href="/" className="text-emerald-600 hover:underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
} 