// Localized Sentry monitoring API route handler
// This endpoint accepts POST requests from Sentry SDK and forwards them to Sentry

import { NextRequest, NextResponse } from 'next/server';

// This handler accepts POST requests for Sentry monitoring
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Forward the request to Sentry's ingestion endpoint
    // The DSN information is already in the request's URL parameters
    // so we just need to proxy the request body
    
    const url = new URL(request.url);
    const params = url.searchParams.toString();
    const sentryIngestUrl = `https://o4509353727033344.ingest.us.sentry.io/api/4509365248917504/envelope/?${params}`;
    
    const sentryResponse = await fetch(sentryIngestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      body,
    });
    
    // Return the response from Sentry
    return NextResponse.json(
      { success: sentryResponse.ok },
      { status: sentryResponse.status }
    );
  } catch (error) {
    console.error('Sentry monitoring error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}