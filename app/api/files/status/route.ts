import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import sessionManager from '@/lib/services/sessionManager';

export async function GET(request: NextRequest) {
  try {
    // Get the user's API key from the request headers
    const userApiKey = request.headers.get('X-User-API-Key');
    if (!userApiKey) {
      return NextResponse.json(
        { error: "API Key no proporcionada." },
        { status: 401 }
      );
    }
    
    // Get the status of files for this user
    const fileStatus = sessionManager.getFileStatus(userApiKey);
    
    // Return the file status
    return NextResponse.json({ fileStatus });
  } catch (error: any) {
    console.error('Error getting file status:', error);
    return NextResponse.json(
      {
        error: `Error retrieving file status: ${error.message}`
      },
      { status: 500 }
    );
  }
}
