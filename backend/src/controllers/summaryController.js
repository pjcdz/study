import { callGemini, ERROR_TYPES } from '../services/geminiClient.js';
import { prompts } from '../config/prompts.js';

export const summaryController = {
  /**
   * Process text and files content to generate a Notion-formatted summary
   * @param {object} req - Request object with filesText in body
   * @param {object} res - Response object
   */
  getSummary: async (req, res) => {
    try {
      console.log("Summary controller received request");
      
      // Extract the text from the request body
      const { filesText } = req.body;
      
      if (!filesText) {
        return res.status(400).json({ error: 'No content provided' });
      }
      
      // Create a context for Gemini to understand the content
      let processedContent = filesText;
      let contentType = 'text';
      let contentSizeKB = Math.round(filesText.length / 1024);
      
      console.log(`Received content size: ${contentSizeKB}KB`);
      
      // Check if we are dealing with PDF content
      if (filesText.includes('[PDF Document:')) {
        console.log("Detected PDF document metadata");
        contentType = 'pdf';
        
        // Locate PDF name for more specific instructions to Gemini
        const pdfNameMatch = filesText.match(/\[PDF Document: ([^\]]+)\]/);
        const pdfName = pdfNameMatch ? pdfNameMatch[1] : "document";
        
        console.log(`Processing PDF document with content for: ${pdfName}`);
        
        // Check if the PDF content was properly extracted
        const hasExtractedContent = filesText.includes('# Content extracted from:') || 
                                    filesText.includes('## Page');
        
        if (hasExtractedContent) {
          console.log('PDF content was successfully extracted, using actual content');
          
          // Add instruction header - but keep the extracted text
          processedContent = `# SOLICITUD DE RESUMEN PARA PDF: ${pdfName}\n\n` + 
                            `El siguiente texto fue extraído de un documento PDF. Por favor analiza este contenido real y genera un resumen detallado en formato Notion Markdown.\n\n` + 
                            `---\n\n` +
                            filesText;
        } else {
          // This is the fallback when only metadata is available (original behavior)
          console.log('No PDF content extracted, using metadata only');
          
          // Extract any additional context provided by the user
          const contextMatch = filesText.match(/Additional context provided by the user:\s*([\s\S]+?)(?:\n\n|\s*$)/i) || 
                              filesText.match(/Contexto adicional proporcionado por el usuario:\s*([\s\S]+?)(?:\n\n|\s*$)/i);
          const userContext = contextMatch ? contextMatch[1].trim() : "";
          
          // Build content with clearer instructions for Gemini
          processedContent = `# SOLICITUD DE RESUMEN PARA: ${pdfName}\n\n`;
          processedContent += `El usuario ha subido un documento PDF llamado "${pdfName}" y necesita un resumen completo en formato Notion Markdown.\n\n`;
          
          if (userContext) {
            processedContent += `## Contexto adicional proporcionado por el usuario:\n${userContext}\n\n`;
            processedContent += `Por favor, incorpora este contexto al generar el resumen.\n\n`;
          }
          
          processedContent += `## Instrucciones específicas:\n`;
          processedContent += `- Genera un resumen completo y detallado basado en el nombre del documento y el contexto proporcionado.\n`;
          processedContent += `- El documento se refiere a "${pdfName.replace('.pdf', '')}", utiliza este tema como guía.\n`;
          processedContent += `- Organiza el contenido en secciones claras con encabezados.\n`;
          processedContent += `- Incluye todos los conceptos clave que normalmente se encontrarían en un documento con este nombre.\n`;
          processedContent += `- Formatea el contenido utilizando Markdown para Notion, con énfasis en la legibilidad.\n\n`;
        }
        
        console.log("Prepared specialized prompt for PDF document");
      }
      
      // Ensure the content isn't too large for the API
      const maxContentLength = 100000;
      if (processedContent.length > maxContentLength) {
        console.log(`Content too large (${Math.round(processedContent.length / 1024)}KB), truncating...`);
        processedContent = processedContent.substring(0, maxContentLength) + "\n\n[Content truncated due to size limitations]";
      }
      
      // Combine the prompt template with the processed content
      console.log('Preparing prompt with template and content...');
      
      let prompt;
      
      // Use specific template based on content type
      if (contentType === 'pdf') {
        prompt = `${prompts.notionPrompt}\n\n${processedContent}`;
      } else {
        prompt = `${prompts.notionPrompt}\n\n${processedContent}`;
      }
      
      try {
        // Call Gemini API with the complete prompt
        console.log('Calling Gemini API...');
        const startTime = Date.now();
        
        // La función ahora devuelve un objeto con el texto y las métricas de uso
        const geminiResponse = await callGemini(prompt);
        const generationTime = Date.now() - startTime;
        
        console.log('Successfully received response from Gemini API');
        console.log(`Total generation time including network: ${generationTime}ms`);
        
        // Extraer el markdown generado y las métricas
        const { text: notionMarkdown, usageMetrics } = geminiResponse;
        
        // Return the generated markdown and include usage metrics
        return res.json({ 
          notionMarkdown,
          stats: {
            generationTimeMs: generationTime,
            ...usageMetrics
          }
        });
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError);
        
        // Extraer el tipo de error si está disponible, defaults to UNKNOWN_ERROR
        const errorType = geminiError.type || ERROR_TYPES.UNKNOWN_ERROR;
        
        // Return a more detailed error message with type
        return res.status(500).json({ 
          error: `Error from Gemini API: ${geminiError.message}`,
          errorType: errorType,
          contentType: contentType,
          contentSizeKB: contentSizeKB
        });
      }
    } catch (error) {
      console.error('Unexpected error in getSummary controller:', error);
      
      // Ensure we always return a valid JSON response
      return res.status(500).json({ 
        error: `Internal server error: ${error.message}`,
        errorType: ERROR_TYPES.UNKNOWN_ERROR,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  /**
   * Further condense an existing summary in Markdown format
   * @param {object} req - Request object with summaryText in body
   * @param {object} res - Response object
   */
  condenseExistingSummary: async (req, res) => {
    try {
      console.log("Condense summary controller received request");
      
      // Extract the summary text from the request body
      const { summaryText } = req.body;
      
      if (!summaryText) {
        return res.status(400).json({ error: 'No summary content provided' });
      }
      
      console.log(`Received summary content size: ${Math.round(summaryText.length / 1024)}KB`);
      
      // Ensure the content isn't too large for the API
      const maxContentLength = 100000;
      if (summaryText.length > maxContentLength) {
        console.log(`Content too large (${Math.round(summaryText.length / 1024)}KB), truncating...`);
        const truncatedContent = summaryText.substring(0, maxContentLength) + "\n\n[Content truncated due to size limitations]";
        return res.status(400).json({ error: 'Summary content too large' });
      }
      
      // Create a prompt for condensing the summary
      const condenseSummaryPrompt = `
# INSTRUCCIONES PARA CONDENSAR RESUMEN

Necesito una versión más concisa del siguiente resumen. Por favor:

1. Mantén solo la información más importante y relevante
2. Reduce la longitud aproximadamente a la mitad, manteniendo el contexto esencial
3. Preserva la estructura con encabezados Markdown
4. Mantén el formato compatible con Notion (Markdown)
5. Elimina detalles secundarios o ejemplos redundantes
6. Mantén la calidad académica y profesional del contenido
7. Organiza el contenido en secciones claras y concisas

Aquí está el resumen original a condensar:

${summaryText}
`;

      try {
        // Call Gemini API with the condensing prompt
        console.log('Calling Gemini API to condense summary...');
        const startTime = Date.now();
        
        const geminiResponse = await callGemini(condenseSummaryPrompt);
        const generationTime = Date.now() - startTime;
        
        console.log('Successfully received condensed summary from Gemini API');
        console.log(`Total generation time including network: ${generationTime}ms`);
        
        // Extract the markdown generated and metrics
        const { text: condensedMarkdown, usageMetrics } = geminiResponse;
        
        // Return the condensed markdown and include usage metrics
        return res.json({ 
          notionMarkdown: condensedMarkdown,
          stats: {
            generationTimeMs: generationTime,
            ...usageMetrics
          }
        });
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError);
        
        // Extract error type if available, defaults to UNKNOWN_ERROR
        const errorType = geminiError.type || ERROR_TYPES.UNKNOWN_ERROR;
        
        // Return a more detailed error message with type
        return res.status(500).json({ 
          error: `Error from Gemini API: ${geminiError.message}`,
          errorType: errorType
        });
      }
    } catch (error) {
      console.error('Unexpected error in condenseExistingSummary controller:', error);
      
      // Ensure we always return a valid JSON response
      return res.status(500).json({ 
        error: `Internal server error: ${error.message}`,
        errorType: ERROR_TYPES.UNKNOWN_ERROR,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};