import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Condensed version of the mock data for demo mode
const mockSummaryResponse = {
  notionMarkdown: "# Machine Learning Fundamentals\n\n" +
                 "## Introduction\n" +
                 "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.\n\n" +
                 "## Key Concepts\n" +
                 "- **Supervised Learning**: Uses labeled data to train models\n" +
                 "- **Unsupervised Learning**: Finds patterns in unlabeled data\n" +
                 "- **Reinforcement Learning**: Learns through interaction with environment\n\n" +
                 "## Common Algorithms\n" +
                 "1. Linear Regression\n2. Decision Trees\n3. Neural Networks\n4. Support Vector Machines\n\n" +
                 "## Applications\n" +
                 "- Image recognition\n- Natural language processing\n- Recommendation systems\n- Predictive analytics"
};

export async function POST(request: NextRequest) {
  try {
    // Check if we're in demo mode
    const useDemoContent = process.env.USE_DEMO_CONTENT === 'true';
    
    // Return mock data if in demo mode
    if (useDemoContent) {
      console.log('🧪 API route: Using mock summary data with streaming simulation');
      
      // Create a readable stream for mock data simulation
      const encoder = new TextEncoder();
      const mockText = mockSummaryResponse.notionMarkdown;
      
      const stream = new ReadableStream({
        start(controller) {
          // Simulate streaming by sending chunks of the mock text
          const chunkSize = 50; // Characters per chunk
          let index = 0;
          
          const sendChunk = () => {
            if (index < mockText.length) {
              const chunk = mockText.slice(index, index + chunkSize);
              controller.enqueue(encoder.encode(chunk));
              index += chunkSize;
              
              // Send next chunk after a short delay
              setTimeout(sendChunk, 100);
            } else {
              controller.close();
            }
          };
          
          sendChunk();
        }
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
        },
      });
    }
    
    // Get the user API key from the request headers
    const userApiKey = request.headers.get('X-User-API-Key');
    if (!userApiKey) {
      return NextResponse.json(
        { error: 'API Key no proporcionada', errorType: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }
    
    // Get the body from the request
    const body = await request.formData();
    
    // The backend URL from environment variable or fallback
    const backendUrl = process.env.BACKEND_URL || 'http://backend:4000';
    
    console.log(`API proxy: Forwarding summary request to ${backendUrl}/summary`);
    
    // Forward the request to the backend with the correct header name
    const response = await fetch(`${backendUrl}/summary`, {
      method: 'POST',
      headers: {
        'X-User-API-Key': userApiKey // Use the same header name as the backend expects
      },
      body: body,
      // Important for Docker networking
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: errorText || `Backend error ${response.status}` },
        { status: response.status }
      );
    }

    // Check if response has a body for streaming
    if (!response.body) {
      return NextResponse.json(
        { error: 'No response body from backend' },
        { status: 500 }
      );
    }

    // Return the stream directly from the backend
    console.log('Creating streaming response from backend');
    const responseStream = new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
    console.log('Streaming response created successfully');
    return responseStream;
    
  } catch (error) {
    console.error('Error in summary API route:', error);
    
    // If we're in demo mode, still return mock data even if there's an error
    if (process.env.USE_DEMO_CONTENT === 'true') {
      console.log('🧪 API route: Error occurred but returning mock summary data');
      const encoder = new TextEncoder();
      const mockText = mockSummaryResponse.notionMarkdown;
      
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(mockText));
          controller.close();
        }
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to connect to backend service', details: (error as Error).message },
      { status: 500 }
    );
  }
}