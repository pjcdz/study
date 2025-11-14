import { NextResponse } from 'next/server';
import { demoSummaryContent } from '@/lib/mock-data';

export async function POST(request: Request) {
  try {
    // Check if we're in demo mode
    const useDemoContent = process.env.USE_DEMO_CONTENT === 'true';
    
    // Return mock data if in demo mode
    if (useDemoContent) {
      console.log('🧪 API route: Using mock processed files data');
      // Add a small delay to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800));
      return NextResponse.json({
        success: true,
        summary: demoSummaryContent.substring(0, 1000) + "..." // Return a preview portion of the demo content
      });
    }
    
    const body = await request.json();
    const { text, inputText } = body;
    
    // Combine text with inputText if provided
    let processedText = text;
    if (inputText) {
      processedText += `\n\nAdditional context:\n${inputText}`;
    }
    
    // In a real application, you might want to send this to an AI service
    // or do more sophisticated processing
    
    return NextResponse.json({
      success: true,
      summary: processedText.substring(0, 10000) // Returning a truncated version to avoid overload
    });
  } catch (error) {
    console.error('Error in process-files API route:', error);
    
    // If we're in demo mode, still return mock data even if there's an error
    if (process.env.USE_DEMO_CONTENT === 'true') {
      console.log('🧪 API route: Error occurred but returning mock processed files data');
      return NextResponse.json({
        success: true,
        summary: demoSummaryContent.substring(0, 1000) + "..." 
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to process files' },
      { status: 500 }
    );
  }
}