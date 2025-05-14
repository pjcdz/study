import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const GET = async (request: NextRequest) => {
  try {
    // Check if we're in demo mode
    const useDemoContent = process.env.USE_DEMO_CONTENT === 'true';
    
    // Return mock health data if in demo mode
    if (useDemoContent) {
      console.log('🧪 API route: Using mock health data');
      
      return NextResponse.json({
        frontend: { status: 'ok', message: 'Frontend is running in demo mode' },
        backend: { status: 'ok', message: 'Mock backend is simulated as healthy' },
        demoMode: true,
        timestamp: new Date().toISOString()
      });
    }
    
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
    
    // If we're in demo mode, still return healthy data even if there's an error
    if (process.env.USE_DEMO_CONTENT === 'true') {
      console.log('🧪 API route: Error occurred but returning mock health data');
      
      return NextResponse.json({
        frontend: { status: 'ok', message: 'Frontend is running in demo mode' },
        backend: { status: 'ok', message: 'Mock backend is simulated as healthy' },
        demoMode: true,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      frontend: { status: 'ok', message: 'Frontend is running' },
      backend: { status: 'error', message: `Failed to connect to backend: ${(error as Error).message}` },
      timestamp: new Date().toISOString()
    });
  }
}