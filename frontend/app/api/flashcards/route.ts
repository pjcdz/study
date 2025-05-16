import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockFlashcardsResponse } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    // Check if we're in demo mode
    const useDemoContent = process.env.USE_DEMO_CONTENT === 'true';
    
    // Return mock data if in demo mode
    if (useDemoContent) {
      console.log('🧪 API route: Using mock flashcards data');
      // Add a small delay to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 800));
      return NextResponse.json(mockFlashcardsResponse);
    }
    
    // Get the user API key from the request headers
    const userApiKey = request.headers.get('X-User-API-Key');
    if (!userApiKey) {
      return NextResponse.json(
        { error: 'API Key no proporcionada', errorType: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }
    
    // The backend URL from environment variable or fallback
    const backendUrl = process.env.BACKEND_URL || 'http://backend:4000';
    console.log(`API proxy: Forwarding flashcards request to ${backendUrl}/flashcards`);
    
    let response;
    
    // Check if this is a multipart/form-data request (has files)
    const contentType = request.headers.get('Content-Type') || '';
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload request
      const formData = await request.formData();
      
      // Forward the request with FormData to the backend
      response = await fetch(`${backendUrl}/flashcards`, {
        method: 'POST',
        headers: {
          'X-User-API-Key': userApiKey,
          // Don't set Content-Type - fetch will set it automatically with correct boundary
        },
        body: formData,
        next: { revalidate: 0 }
      });
    } else {
      // Handle regular JSON request without files
      const body = await request.json();
      
      response = await fetch(`${backendUrl}/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-API-Key': userApiKey
        },
        body: JSON.stringify(body),
        next: { revalidate: 0 }
      });
    }
    
    // Parse response
    const data = await response.json();
    
    // Return response from backend with same status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in flashcards API route:', error);
    
    // If we're in demo mode, still return mock data even if there's an error
    if (process.env.USE_DEMO_CONTENT === 'true') {
      console.log('🧪 API route: Error occurred but returning mock flashcards data');
      return NextResponse.json(mockFlashcardsResponse);
    }
    
    return NextResponse.json(
      { error: 'Failed to connect to backend service', details: (error as Error).message },
      { status: 500 }
    );
  }
}