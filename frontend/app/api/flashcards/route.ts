import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const POST = async (request: NextRequest) => {
  try {
    // Get the body from the request
    const body = await request.json();
    
    // The backend URL from environment variable or fallback
    const backendUrl = process.env.BACKEND_URL || 'http://backend:4000';
    
    console.log(`API proxy: Forwarding flashcards request to ${backendUrl}/flashcards`);
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // Important for Docker networking
      next: { revalidate: 0 }
    });
    
    // Parse response
    const data = await response.json();
    
    // Return response from backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in flashcards API route:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend service', details: (error as Error).message },
      { status: 500 }
    );
  }
}