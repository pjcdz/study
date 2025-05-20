import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
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
    return NextResponse.json(
      { success: false, error: 'Failed to process files' },
      { status: 500 }
    );
  }
}