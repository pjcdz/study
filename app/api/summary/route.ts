import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  generateMultimodalContent, 
  processFileForGemini,
  cleanupFile,
  ERROR_TYPES,
  type Part
} from '@/lib/services/geminiClient';
import { prompts } from '@/lib/config/prompts';

export async function POST(request: NextRequest) {
  // Track uploaded file IDs
  const uploadedFileIds: string[] = [];
  
  try {
    console.log("Summary API route received request");
    
    // Extract the user API Key from headers
    const userApiKey = request.headers.get('X-User-API-Key');
    if (!userApiKey) {
      return NextResponse.json(
        { error: "API Key no proporcionada.", errorType: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }
    
    // Get FormData from request
    const formData = await request.formData();
    const textPrompt = formData.get('textPrompt') as string | null;
    
    // Prepare parts array for multimodal content
    const parts: Part[] = [];
    
    // Add text prompt to parts if provided
    if (textPrompt && textPrompt.trim() !== "") {
      parts.push({ text: textPrompt });
    }
    
    // Add files to parts if provided
    // Get all entries that are files (file0, file1, etc.)
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value);
      }
    }
    
    if (files && files.length > 0) {
      console.log(`Received ${files.length} files`);
      
      for (const fileEntry of files) {
        if (fileEntry instanceof File) {
          const file = fileEntry;
          console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${Math.round(file.size / (1024 * 1024))}MB`);
          
          try {
            // Convert File to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Process file for Gemini
            const filePart = await processFileForGemini(
              buffer, 
              file.type, 
              userApiKey,
              file.name
            );
            
            // Store the file ID for later cleanup if it exists
            if (filePart.fileId) {
              uploadedFileIds.push(filePart.fileId);
            }
            
            parts.push(filePart);
          } catch (fileError: any) {
            console.error(`Error procesando archivo ${file.name}:`, fileError);
            // Attempt to clean up any files already uploaded before returning error
            if (uploadedFileIds.length > 0) {
              console.log(`Cleaning up ${uploadedFileIds.length} files due to processing error`);
              for (const fileId of uploadedFileIds) {
                await cleanupFile(fileId, userApiKey).catch(err => 
                  console.log(`Non-critical error during file cleanup: ${err.message}`)
                );
              }
            }
            return NextResponse.json(
              {
                error: `Error procesando archivo ${file.name}: ${fileError.message}`,
                errorType: fileError.type || ERROR_TYPES.UNKNOWN_ERROR
              },
              { status: 400 }
            );
          }
        }
      }
    }
    
    // Validate that either text or files are provided
    if (parts.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un archivo o un texto para procesar", errorType: ERROR_TYPES.UNKNOWN_ERROR },
        { status: 400 }
      );
    }
    
    // If only files were uploaded with no text prompt, add a default prompt
    if (files.length > 0 && (!textPrompt || textPrompt.trim() === "")) {
      let defaultPrompt = "Por favor analiza el contenido de estos archivos y genera un resumen detallado en formato Notion Markdown siguiendo todas las instrucciones establecidas.";
      
      // If only one file, make the prompt more specific
      if (files.length === 1 && files[0] instanceof File) {
        const file = files[0];
        if (file.type === 'application/pdf') {
          defaultPrompt = `Este es un documento PDF llamado "${file.name}". Por favor analiza su contenido completo y genera un resumen detallado en formato Notion Markdown siguiendo todas las instrucciones establecidas. El resumen debe ser extenso, completo y bien estructurado.`;
        } else if (file.type.startsWith('image/')) {
          defaultPrompt = `Esta es una imagen llamada "${file.name}". Por favor analiza su contenido visual y genera un resumen detallado en formato Notion Markdown siguiendo todas las instrucciones establecidas. El resumen debe incluir todos los elementos visuales importantes y el texto visible en la imagen.`;
        }
      }
      
      // Add default prompt as first item in parts
      parts.unshift({ text: defaultPrompt });
      console.log(`Added default prompt for ${files.length} files`);
    }
    
    // Get the system instruction from prompts
    const systemInstruction = prompts.notionPrompt;
    
    try {
      // Call Gemini API with multimodal content using user's API key
      console.log('Calling Gemini API with multimodal content...');
      const startTime = Date.now();
      
      // Use the multimodal function
      const geminiResponse = await generateMultimodalContent(userApiKey, parts, systemInstruction);
      const generationTime = Date.now() - startTime;
      
      console.log('Successfully received response from Gemini API');
      console.log(`Total generation time including network: ${generationTime}ms`);
      
      // Clean up uploaded files after successful processing
      if (uploadedFileIds.length > 0) {
        console.log(`Cleaning up ${uploadedFileIds.length} files after successful processing`);
        for (const fileId of uploadedFileIds) {
          await cleanupFile(fileId, userApiKey).catch(err => 
            console.log(`Non-critical error during file cleanup: ${err.message}`)
          );
        }
      }
      
      // Extract the markdown generated and the metrics
      const { generatedText: notionMarkdown, stats } = geminiResponse;
      
      // Return the generated markdown and include usage metrics
      return NextResponse.json({ 
        notionMarkdown,
        stats: {
          generationTimeMs: generationTime,
          ...stats
        }
      });
    } catch (geminiError: any) {
      console.error('Gemini API error:', geminiError);
      
      // Attempt to clean up any files already uploaded
      if (uploadedFileIds.length > 0) {
        console.log(`Cleaning up ${uploadedFileIds.length} files due to Gemini API error`);
        for (const fileId of uploadedFileIds) {
          await cleanupFile(fileId, userApiKey).catch(err => 
            console.log(`Non-critical error during file cleanup: ${err.message}`)
          );
        }
      }
      
      // Extract the error type and status code
      const errorType = geminiError.type || ERROR_TYPES.UNKNOWN_ERROR;
      const statusCode = geminiError.status || 500;
      
      // Return a more detailed error message with type
      return NextResponse.json(
        { 
          error: geminiError.message || 'Error al comunicarse con la API de Gemini',
          errorType: errorType
        },
        { status: statusCode }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in summary API route:', error);
    
    // Attempt to clean up any files already uploaded
    if (uploadedFileIds && uploadedFileIds.length > 0) {
      const userApiKey = request.headers.get('X-User-API-Key');
      if (userApiKey) {
        console.log(`Cleaning up ${uploadedFileIds.length} files due to unexpected error`);
        for (const fileId of uploadedFileIds) {
          await cleanupFile(fileId, userApiKey).catch(err => 
            console.log(`Non-critical error during file cleanup: ${err.message}`)
          );
        }
      }
    }
    
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