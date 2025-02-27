import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Change Amigo",
  description: "Terms of Service for Change Amigo - A Friendly Change Management Partner",
};

export default function TermsOfService() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-emerald max-w-none">
        <p className="text-sm text-muted-foreground mb-8">
          <strong>Last Updated: February 27, 2025</strong>
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>
          By accessing or using Change Amigo ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
          If you disagree with any part of the terms, you may not access the Service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
        <p>
          Change Amigo is a platform designed to help change managers and organizations execute change-related projects. 
          Our services include:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Project management tools for change initiatives</li>
          <li>AI-powered insight search and summarization</li>
          <li>Task management and organization</li>
          <li>Note-taking and documentation features</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">3.1 Registration</h3>
        <p>
          To use certain features of the Service, you must register for an account. You agree to provide accurate, 
          current, and complete information during the registration process.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">3.2 Account Security</h3>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities 
          that occur under your account. You must immediately notify us of any unauthorized use of your account.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Subscription Plans and Payments</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">4.1 Free Tier</h3>
        <p>
          Our free tier provides limited access to features, including:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Up to 20 insight searches per account</li>
          <li>Basic project management tools</li>
        </ul>

        <h3 className="text-xl font-medium mt-6 mb-3">4.2 Premium Subscription</h3>
        <p>
          Our premium subscription provides additional features and higher usage limits. Subscription fees are 
          processed through Stripe.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">4.3 Payment Terms</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Payments are processed securely through Stripe</li>
          <li>Subscription fees are billed in advance on a recurring basis</li>
          <li>You authorize us to charge your payment method for all fees incurred</li>
          <li>All payments are non-refundable except as required by law</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. User Content</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">5.1 Ownership</h3>
        <p>
          You retain ownership of all content you create, upload, or store on the Service, including projects, 
          tasks, notes, and saved insights.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">5.2 License to Us</h3>
        <p>
          You grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display your content 
          solely for the purpose of providing and improving the Service.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">5.3 Prohibited Content</h3>
        <p>
          You may not upload or share content that:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Infringes on intellectual property rights</li>
          <li>Contains malicious code</li>
          <li>Violates any applicable law</li>
          <li>Contains offensive, harmful, or inappropriate material</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">6.1 Our Intellectual Property</h3>
        <p>
          The Service and its original content, features, and functionality are owned by Change Amigo and are 
          protected by international copyright, trademark, and other intellectual property laws.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">6.2 Restrictions</h3>
        <p>
          You may not:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Modify, distribute, or create derivative works based on our Service</li>
          <li>Use our Service for any commercial purpose without our consent</li>
          <li>Attempt to decompile or reverse engineer any part of the Service</li>
          <li>Remove any copyright or other proprietary notices</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, 
          consequential, or punitive damages resulting from your use of or inability to use the Service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Disclaimer of Warranties</h2>
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, either express or 
          implied, including, but not limited to, implied warranties of merchantability, fitness for a particular 
          purpose, or non-infringement.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Termination</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">9.1 Termination by You</h3>
        <p>
          You may terminate your account at any time by contacting us or using the account deletion feature if available.
        </p>

        <h3 className="text-xl font-medium mt-6 mb-3">9.2 Termination by Us</h3>
        <p>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason, 
          including if you breach the Terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to Terms</h2>
        <p>
          We reserve the right to modify or replace these Terms at any time. We will provide notice of any material 
          changes by posting the new Terms on this page and updating the "Last Updated" date.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Governing Law</h2>
        <p>
          These Terms shall be governed by the laws of the United Kingdom, without regard to its conflict of law provisions.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us using our <Link href="/#contact" className="text-emerald-600 hover:underline">contact form</Link>.
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