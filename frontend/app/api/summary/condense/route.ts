import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Condensed version of the mock data for demo mode
const mockCondensedResponse = {
  condensedSummary: "# Condensed: Machine Learning Fundamentals\n\n" +
                   "- **Machine Learning**: AI that learns from experience\n" +
                   "- **Types**: Supervised, Unsupervised, Reinforcement Learning\n" +
                   "- **Algorithms**: Regression, Classification, Clustering\n" +
                   "- **Neural Networks**: Perceptron, MLP, CNN, RNN\n" +
                   "- **Key Considerations**: Feature Engineering, Overfitting/Underfitting, Hyperparameters",
  stats: {
    generationTimeMs: 653,
    inputTokens: 789,
    outputTokens: 123,
    totalTokens: 912
  }
};

export const POST = async (request: NextRequest) => {
  try {
    // Check if we're in demo mode
    const useDemoContent = process.env.USE_DEMO_CONTENT === 'true';
    
    // Return mock data if in demo mode
    if (useDemoContent) {
      console.log('🧪 API route: Using mock condensed summary data');
      // Add a small delay to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 900));
      return NextResponse.json(mockCondensedResponse);
    }
    
    // Get the body from the request
    const body = await request.json();
    
    // The backend URL from environment variable or fallback
    const backendUrl = process.env.BACKEND_URL || 'http://backend:4000';
    
    console.log(`API proxy: Forwarding condense summary request to ${backendUrl}/summary/condense`);
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/summary/condense`, {
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
    console.error('Error in condense summary API route:', error);
    
    // If we're in demo mode, still return mock data even if there's an error
    if (process.env.USE_DEMO_CONTENT === 'true') {
      console.log('🧪 API route: Error occurred but returning mock condensed summary data');
      return NextResponse.json(mockCondensedResponse);
    }
    
    return NextResponse.json(
      { error: 'Failed to connect to backend service', details: (error as Error).message },
      { status: 500 }
    );
  }
}