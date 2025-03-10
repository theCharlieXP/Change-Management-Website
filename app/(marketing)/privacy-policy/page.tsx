import React from 'react';

export const metadata = {
  title: 'Privacy Policy | Change Management',
  description: 'Our privacy policy and how we handle your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>Introduction</h2>
        <p>
          This Privacy Policy explains how Change Management (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects, uses, and shares your personal information when you use our website and services. We respect your privacy and are committed to protecting your personal data.
        </p>
        
        <h2>Information We Collect</h2>
        <p>We collect several types of information from and about users of our website, including:</p>
        <ul>
          <li><strong>Personal Data:</strong> Name, email address, and contact information you provide when registering or using our services.</li>
          <li><strong>Account Data:</strong> Information related to your account, including username, password (encrypted), and account preferences.</li>
          <li><strong>Usage Data:</strong> Information about how you use our website, features, and services.</li>
          <li><strong>Payment Data:</strong> When you make purchases, our payment processor (Stripe) collects payment information. We do not store complete credit card details on our servers.</li>
          <li><strong>Technical Data:</strong> IP address, browser type, device information, and cookies.</li>
        </ul>
        
        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our services</li>
          <li>Process transactions and send related information</li>
          <li>Send administrative information, such as updates, security alerts, and support messages</li>
          <li>Respond to your comments, questions, and requests</li>
          <li>Personalize your experience and deliver content relevant to your interests</li>
          <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
          <li>Detect, prevent, and address technical issues and fraudulent activities</li>
        </ul>
        
        <h2>Legal Basis for Processing (EU/EEA Users)</h2>
        <p>For users in the European Union or European Economic Area, we process your personal data based on the following legal grounds:</p>
        <ul>
          <li><strong>Contract:</strong> Processing necessary for the performance of a contract with you</li>
          <li><strong>Legitimate Interests:</strong> Processing necessary for our legitimate interests, provided those interests are not overridden by your rights</li>
          <li><strong>Legal Obligation:</strong> Processing necessary to comply with our legal obligations</li>
          <li><strong>Consent:</strong> Processing based on your consent</li>
        </ul>
        
        <h2>Data Sharing and Disclosure</h2>
        <p>We may share your personal information with:</p>
        <ul>
          <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (e.g., payment processing, data analysis, email delivery)</li>
          <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
        </ul>
        
        <h2>Data Retention</h2>
        <p>
          We retain your personal data only for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements.
        </p>
        
        <h2>Your Data Protection Rights</h2>
        <p>Depending on your location, you may have the following rights regarding your personal data:</p>
        <ul>
          <li><strong>Access:</strong> The right to request copies of your personal data</li>
          <li><strong>Rectification:</strong> The right to request correction of inaccurate information</li>
          <li><strong>Erasure:</strong> The right to request deletion of your personal data</li>
          <li><strong>Restriction:</strong> The right to request restriction of processing of your personal data</li>
          <li><strong>Data Portability:</strong> The right to request transfer of your personal data</li>
          <li><strong>Objection:</strong> The right to object to processing of your personal data</li>
        </ul>
        <p>
          To exercise these rights, please contact us at <a href="mailto:charlie.hay.99@gmail.com" className="text-blue-600 hover:underline">charlie.hay.99@gmail.com</a>.
        </p>
        
        <h2>Cookies and Tracking Technologies</h2>
        <p>
          We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
        </p>
        
        <h2>Data Security</h2>
        <p>
          We have implemented appropriate technical and organizational measures to secure your personal data from accidental loss and unauthorized access, use, alteration, and disclosure.
        </p>
        
        <h2>International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other than the country in which you reside. These countries may have data protection laws that are different from the laws of your country.
        </p>
        
        <h2>Children&apos;s Privacy</h2>
        <p>
          Our services are not intended for children under 16 years of age, and we do not knowingly collect personal data from children.
        </p>
        
        <h2>Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
        </p>
        
        <h2>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at <a href="mailto:charlie.hay.99@gmail.com" className="text-blue-600 hover:underline">charlie.hay.99@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}