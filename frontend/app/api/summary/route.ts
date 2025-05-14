import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockSummaryResponse } from '@/lib/mock-data';

export const POST = async (request: NextRequest) => {
  try {
    // Check if we're in demo mode
    const useDemoContent = process.env.USE_DEMO_CONTENT === 'true';
    
    // Return mock data if in demo mode
    if (useDemoContent) {
      console.log('🧪 API route: Using mock summary data');
      // Add a small delay to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1200));
      return NextResponse.json(mockSummaryResponse);
    }
    
    // Get the body from the request
    const body = await request.json();
    
    // The backend URL from environment variable or fallback
    const backendUrl = process.env.BACKEND_URL || 'http://backend:4000';
    
    console.log(`API proxy: Forwarding summary request to ${backendUrl}/summary`);
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/summary`, {
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
    console.error('Error in summary API route:', error);
    
    // If we're in demo mode, still return mock data even if there's an error
    if (process.env.USE_DEMO_CONTENT === 'true') {
      console.log('🧪 API route: Error occurred but returning mock summary data');
      return NextResponse.json(mockSummaryResponse);
    }
    
    return NextResponse.json(
      { error: 'Failed to connect to backend service', details: (error as Error).message },
      { status: 500 }
    );
  }
}