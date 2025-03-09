import React from 'react';

export const metadata = {
  title: 'Security Policy | Change Management',
  description: 'Our commitment to security and data protection.',
};

export default function SecurityPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Security Policy</h1>
      
      <div className="prose prose-lg max-w-none">
        <h2>Our Commitment to Security</h2>
        <p>
          At Change Management, we take the security of your data seriously. This policy outlines the measures we take to protect your information and ensure the security of our platform.
        </p>
        
        <h2>Data Protection</h2>
        <p>
          All data transmitted between your browser and our servers is encrypted using TLS (Transport Layer Security). We employ industry-standard security measures to protect your data at rest, including encryption and secure access controls.
        </p>
        
        <h2>Authentication and Access</h2>
        <p>
          We use Clerk for authentication, which provides secure login methods including multi-factor authentication options. User passwords are never stored in plaintext, and access to user data is strictly controlled.
        </p>
        
        <h2>Payment Processing</h2>
        <p>
          All payment processing is handled by Stripe, a PCI-DSS compliant payment processor. We never store your full credit card details on our servers.
        </p>
        
        <h2>Security Headers</h2>
        <p>
          Our application implements modern security headers including Content Security Policy (CSP), Strict Transport Security (HSTS), and other protections against common web vulnerabilities such as XSS and CSRF attacks.
        </p>
        
        <h2>Vulnerability Reporting</h2>
        <p>
          If you discover a security vulnerability in our platform, please report it to us by emailing <a href="mailto:charlie.hay.99@gmail.com" className="text-blue-600 hover:underline">charlie.hay.99@gmail.com</a>. We appreciate responsible disclosure and will work quickly to address any issues.
        </p>
        
        <h2>Data Retention</h2>
        <p>
          We retain your data only as long as necessary to provide you with our services and as required by applicable laws. You can request deletion of your account and associated data at any time.
        </p>
        
        <h2>Third-Party Services</h2>
        <p>
          We use several third-party services to operate our platform. Each of these services has been vetted for security and compliance with data protection regulations.
        </p>
        
        <h2>Updates to This Policy</h2>
        <p>
          This security policy may be updated from time to time. We will notify users of significant changes through our website or via email.
        </p>
        
        <h2>Contact Us</h2>
        <p>
          If you have any questions about our security practices, please contact us at <a href="mailto:charlie.hay.99@gmail.com" className="text-blue-600 hover:underline">charlie.hay.99@gmail.com</a>.
        </p>
      </div>
    </div>
  );
} 