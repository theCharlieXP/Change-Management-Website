import * as React from 'react';

interface EmailTemplateProps {
  name: string;
  email: string;
  message: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  name,
  email,
  message
}) => {
  return (
    <div>
      <h1>New Website Feedback</h1>
      <p>From: {name}</p>
      <p>Email: {email}</p>
      <p>Message: {message}</p>
    </div>
  );
};

export default EmailTemplate; 