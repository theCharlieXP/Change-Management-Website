import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit, getRateLimitConfig } from '@/lib/rate-limit';
import { handleApiError, createError, ErrorType } from '@/lib/error-handler';

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
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown-ip';
    
    // Apply rate limiting
    const rateLimitResult = await rateLimit(
      ip.toString(),
      getRateLimitConfig('contact')
    );
    
    // If rate limit exceeded, return 429 Too Many Requests
    if (!rateLimitResult.success) {
      throw createError('Too many requests', ErrorType.RATE_LIMIT, {
        limit: rateLimitResult.limit,
        reset: rateLimitResult.reset.toISOString()
      });
    }

    // Check environment variables at request time
    if (!process.env.RESEND_API_KEY) {
      throw createError('Server configuration error - Missing API Key', ErrorType.SERVER);
    }

    // Parse and validate the request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      throw createError('Invalid JSON', ErrorType.VALIDATION);
    }

    const { name, email, message } = body;

    // Validate fields
    if (!name || !email || !message) {
      throw createError('Missing required fields', ErrorType.VALIDATION, { 
        name: !!name, 
        email: !!email, 
        message: !!message 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError('Invalid email format', ErrorType.VALIDATION);
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

      const result = await resend.emails.send(emailData);

      // Add rate limit headers to successful response
      return NextResponse.json(
        { 
          success: true,
          data: result,
          sentTo: RESEND_TO_EMAIL,
          mode: process.env.NODE_ENV === 'production' ? 'production' : 'testing'
        },
        { 
          status: 200,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString()
          }
        }
      );
    } catch (e) {
      throw createError(
        'Failed to send email', 
        ErrorType.EXTERNAL_SERVICE, 
        { 
          details: e instanceof Error ? e.message : 'Unknown error',
          recipient: RESEND_TO_EMAIL
        }
      );
    }
  } catch (e) {
    // Use centralized error handling
    const { statusCode, response } = handleApiError(e, '/api/send');
    
    // Add rate limit headers if this is a rate limit error
    const headers: Record<string, string> = {};
    if ((e as any).type === ErrorType.RATE_LIMIT && (e as any).context) {
      const context = (e as any).context;
      if (context.limit) headers['X-RateLimit-Limit'] = context.limit.toString();
      if (context.reset) {
        headers['X-RateLimit-Reset'] = context.reset;
        const resetDate = new Date(context.reset);
        const secondsToReset = Math.ceil((resetDate.getTime() - Date.now()) / 1000);
        headers['Retry-After'] = secondsToReset.toString();
      }
    }
    
    return NextResponse.json(response, { status: statusCode, headers });
  }
} 