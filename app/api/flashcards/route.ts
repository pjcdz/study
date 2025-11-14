import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateMultimodalContent, fileToGenerativePart, ERROR_TYPES } from '@/lib/services/geminiClient';
import { prompts } from '@/lib/config/prompts';

export async function POST(request: NextRequest) {
  try {
    console.log("Flashcard API route received request");
    
    // Extract the user API Key from headers
    const userApiKey = request.headers.get('X-User-API-Key');
    if (!userApiKey) {
      return NextResponse.json(
        { error: "API Key no proporcionada.", errorType: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }
    
    // Check content type to determine how to parse the request
    const contentType = request.headers.get('Content-Type') || '';
    let textPrompt: string | null = null;
    let fileEntry: FormDataEntryValue | null = null;
    
    if (contentType.includes('application/json')) {
      // Handle JSON request (text-only)
      const body = await request.json();
      textPrompt = body.textPrompt || null;
    } else {
      // Handle FormData request (with files)
      const formData = await request.formData();
      textPrompt = formData.get('textPrompt') as string | null;
      
      // Get file - check for 'file' or 'file0' (frontend sends file0)
      fileEntry = formData.get('file');
      if (!fileEntry) {
        fileEntry = formData.get('file0');
      }
    }
    
    // Prepare parts array for multimodal content
    const parts: any[] = [];
    
    // Add text prompt to parts if provided
    if (textPrompt && textPrompt.trim() !== "") {
      parts.push({ text: textPrompt });
    }
    
    // Add file to parts if provided
    if (fileEntry && fileEntry instanceof File) {
      const file = fileEntry;
      console.log(`Received file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      parts.push(fileToGenerativePart(buffer, file.type));
    }
    
    // Validate that either text or file is provided
    if (parts.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un archivo o un texto para procesar", errorType: ERROR_TYPES.UNKNOWN_ERROR },
        { status: 400 }
      );
    }
    
    // If only a file was uploaded with no text prompt, add a default prompt
    if (fileEntry && fileEntry instanceof File && (!textPrompt || textPrompt.trim() === "")) {
      const file = fileEntry;
      let defaultPrompt;
      
      if (file.type === 'application/pdf') {
        defaultPrompt = `Este es un documento PDF llamado "${file.name}". Por favor analiza su contenido completo y genera tarjetas de estudio en formato TSV (valores separados por tabuladores). Cada tarjeta debe tener una pregunta y una respuesta separadas por un tabulador.`;
      } else {
        defaultPrompt = `Esta es una imagen llamada "${file.name}". Por favor analiza su contenido visual y genera tarjetas de estudio en formato TSV (valores separados por tabuladores) basadas en la información visible. Cada tarjeta debe tener una pregunta y una respuesta separadas por un tabulador.`;
      }
      
      // Add default prompt as first item in parts
      parts.unshift({ text: defaultPrompt });
      console.log(`Added default prompt for ${file.type} file`);
    }
    
    // Get the system instruction from prompts
    const systemInstruction = prompts.flashcardPrompt;
    
    try {
      // Call Gemini API with multimodal content using user's API key
      console.log('Calling Gemini API with multimodal content...');
      const startTime = Date.now();
      
      // Use the multimodal function
      const geminiResponse = await generateMultimodalContent(userApiKey, parts, systemInstruction);
      const generationTime = Date.now() - startTime;
      
      console.log('Successfully received response from Gemini API');
      console.log(`Total generation time including network: ${generationTime}ms`);
      
      // Extract the flashcards generated and the metrics
      const { generatedText: flashcards, stats } = geminiResponse;
      
      // Return the generated flashcards and include usage metrics
      return NextResponse.json({ 
        flashcards,
        stats: {
          generationTimeMs: generationTime,
          ...stats
        }
      });
    } catch (geminiError: any) {
      console.error('Gemini API error during flashcard generation:', geminiError);
      
      // Extract the error type and status code
      const errorType = geminiError.type || ERROR_TYPES.UNKNOWN_ERROR;
      const statusCode = geminiError.status || 500;
      
      // Return a detailed error message
      return NextResponse.json(
        { 
          error: geminiError.message || 'Error al comunicarse con la API de Gemini',
          errorType: errorType
        },
        { status: statusCode }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in flashcards API route:', error);
    
    // Ensure we always return a valid JSON response
    return NextResponse.json(
      { 
        error: `Internal server error: ${error.message}`,
        errorType: ERROR_TYPES.UNKNOWN_ERROR,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}