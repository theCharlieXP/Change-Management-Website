import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Log all available environment variables (without values)
console.log('Available environment variables:', Object.keys(process.env));

// Log environment variable status (not the actual values)
console.log('Environment variables status:', {
  hasResendKey: !!process.env.RESEND_API_KEY,
  hasContactEmail: !!process.env.CONTACT_FORM_EMAIL,
  resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 3),
  contactEmail: process.env.CONTACT_FORM_EMAIL
});

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuration for email sending
const RESEND_FROM_EMAIL = 'onboarding@resend.dev';
const RESEND_TO_EMAIL = 'charlie.hay.99@gmail.com';

export async function POST(request: Request) {
  try {
    // Check environment variables at request time
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is missing');
      return NextResponse.json(
        { error: 'Server configuration error - Missing API Key' },
        { status: 500 }
      );
    }

    // Parse and validate the request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('JSON parse error:', e);
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const { name, email, message } = body;

    // Validate fields
    if (!name || !email || !message) {
      console.error('Missing fields:', { name: !!name, email: !!email, message: !!message });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email
    try {
      const emailData = {
        from: RESEND_FROM_EMAIL,
        to: RESEND_TO_EMAIL,
        subject: 'New Contact Form Message',
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
        reply_to: email
      };

      console.log('Preparing to send email with the following configuration:', {
        fromAddress: emailData.from,
        toAddress: emailData.to,
        subject: emailData.subject,
        replyTo: emailData.reply_to,
        apiKeyPresent: !!process.env.RESEND_API_KEY,
        apiKeyLength: process.env.RESEND_API_KEY?.length,
        apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 3)
      });

      const result = await resend.emails.send(emailData);

      console.log('Resend API response:', {
        success: true,
        response: result,
        fullResponse: JSON.stringify(result, null, 2)
      });

      return NextResponse.json(
        { 
          success: true,
          data: result,
          sentTo: RESEND_TO_EMAIL,
          mode: 'testing'
        },
        { status: 200 }
      );
    } catch (e) {
      console.error('Resend API detailed error:', {
        error: e,
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined,
        name: e instanceof Error ? e.name : undefined,
        attemptedRecipient: RESEND_TO_EMAIL
      });

      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: e instanceof Error ? e.message : 'Unknown error',
          recipient: RESEND_TO_EMAIL
        },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error('Server error:', e);
    return NextResponse.json(
      { 
        error: 'Server error',
        details: e instanceof Error ? e.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 