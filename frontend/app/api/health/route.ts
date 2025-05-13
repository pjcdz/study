import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const GET = async (request: NextRequest) => {
  try {
    // The backend URL from environment variable or fallback
    const backendUrl = process.env.BACKEND_URL || 'http://backend:4000';
    
    console.log(`API proxy: Checking health at ${backendUrl}/health`);
    
    // Check backend health
    const backendHealth = await fetch(`${backendUrl}/health`, {
      next: { revalidate: 0 }
    })
      .then(res => res.ok ? { status: 'ok', message: 'Backend is reachable' } : 
        { status: 'error', message: `Backend returned ${res.status}` })
      .catch(err => ({ status: 'error', message: `Backend connection error: ${err.message}` }));
    
    // Return combined health status
    return NextResponse.json({
      frontend: { status: 'ok', message: 'Frontend is running' },
      backend: backendHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in health API route:', error);
    return NextResponse.json({
      frontend: { status: 'ok', message: 'Frontend is running' },
      backend: { status: 'error', message: `Failed to connect to backend: ${(error as Error).message}` },
      timestamp: new Date().toISOString()
    });
  }
}