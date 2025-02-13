import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing direct REST API access');
    
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Test a simple REST API call
    const response = await fetch(`${baseUrl}/rest/v1/profiles?select=count`, {
      method: 'GET',
      headers: {
        'apikey': anonKey!,
        'Authorization': `Bearer ${anonKey}`,
      },
    });

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = null;
    }

    return NextResponse.json({
      status: 'complete',
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      rawResponse: responseText
    });

  } catch (error) {
    console.error('Error in test-rest route:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
} 