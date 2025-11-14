import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateMultimodalContent, ERROR_TYPES } from '@/lib/services/geminiClient';

export async function POST(request: NextRequest) {
  try {
    console.log("Condense summary API route received request");
    
    // Extract the user API Key from headers
    const userApiKey = request.headers.get('X-User-API-Key');
    if (!userApiKey) {
      return NextResponse.json(
        { error: "API Key no proporcionada.", errorType: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }
    
    // Extract the summary text from the request body
    const body = await request.json();
    const { markdownContent, condensationType = 'shorter' } = body;
    
    if (!markdownContent) {
      return NextResponse.json(
        { error: 'No summary content provided', errorType: ERROR_TYPES.UNKNOWN_ERROR },
        { status: 400 }
      );
    }
    
    console.log(`Received summary content size: ${Math.round(markdownContent.length / 1024)}KB`);
    
    // Ensure the content isn't too large for the API
    const maxContentLength = 100000;
    if (markdownContent.length > maxContentLength) {
      console.log(`Content too large (${Math.round(markdownContent.length / 1024)}KB), truncating...`);
      return NextResponse.json(
        { error: 'Summary content too large. Please reduce the size of your content.', errorType: ERROR_TYPES.FILE_TOO_LARGE },
        { status: 400 }
      );
    }
    
    // Create a prompt for condensing the summary
    let condenseSummaryPrompt = `
# INSTRUCCIONES PARA CONDENSAR RESUMEN

`;

    // Adapt instructions based on condensationType
    switch(condensationType) {
      case 'shorter':
        condenseSummaryPrompt += `
Necesito una versión más concisa del siguiente resumen. Por favor:

1. Mantén solo la información más importante y relevante
2. Reduce la longitud aproximadamente a la mitad, manteniendo el contexto esencial
3. Preserva la estructura con encabezados Markdown
4. Mantén el formato compatible con Notion (Markdown)
5. Elimina detalles secundarios o ejemplos redundantes
6. Mantén la calidad académica y profesional del contenido
7. Organiza el contenido en secciones claras y concisas
`;
        break;
      case 'clarity':
        condenseSummaryPrompt += `
Necesito una versión más clara y mejor organizada del siguiente resumen. Por favor:

1. Mejora la claridad conceptual sin necesariamente reducir la longitud
2. Reorganiza el contenido para una mejor progresión lógica
3. Refina la estructura de encabezados para mayor coherencia
4. Aclara explicaciones confusas o ambiguas
5. Refuerza las conexiones entre conceptos relacionados
6. Mejora la precisión terminológica
7. Añade breves aclaraciones donde sea necesario
`;
        break;
      case 'examples':
        condenseSummaryPrompt += `
Necesito una versión mejorada del siguiente resumen con ejemplos prácticos. Por favor:

1. Mantén la estructura general y la información clave
2. Añade ejemplos concretos y prácticos para los conceptos principales
3. Refuerza la comprensión con analogías o casos de estudio breves
4. Incluye aplicaciones prácticas de los conceptos teóricos
5. Asegura que los ejemplos sean claros y relevantes para el tema
6. Mantén el formato Markdown compatible con Notion
7. No aumentes excesivamente la longitud del resumen
`;
        break;
      default:
        condenseSummaryPrompt += `
Necesito una versión revisada del siguiente resumen. Por favor:

1. Mantén solo la información más importante y relevante
2. Optimiza la estructura para mayor claridad
3. Preserva los encabezados Markdown
4. Mantén el formato compatible con Notion
`;
    }

    condenseSummaryPrompt += `

Aquí está el resumen original a procesar:

${markdownContent}
`;

    try {
      // Call Gemini API with multimodal content
      console.log('Calling Gemini API to condense summary...');
      const startTime = Date.now();
      
      const parts = [{ text: condenseSummaryPrompt }];
      const systemInstruction = "Eres un asistente académico experto que ayuda a mejorar resúmenes educativos en formato Markdown para Notion.";
      
      const geminiResponse = await generateMultimodalContent(userApiKey, parts, systemInstruction);
      const generationTime = Date.now() - startTime;
      
      console.log('Successfully received condensed summary from Gemini API');
      console.log(`Total generation time including network: ${generationTime}ms`);
      
      // Extract the markdown generated and metrics
      const { generatedText: condensedMarkdown, stats } = geminiResponse;
      
      // Return the condensed markdown and include usage metrics
      return NextResponse.json({ 
        notionMarkdown: condensedMarkdown,
        stats: {
          generationTimeMs: generationTime,
          ...stats
        }
      });
    } catch (geminiError: any) {
      console.error('Gemini API error:', geminiError);
      
      // Extract error type if available, defaults to UNKNOWN_ERROR
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
    console.error('Unexpected error in condense summary API route:', error);
    
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