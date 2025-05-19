import geminiClient, { 
  generateMultimodalContent, 
  processFileForGemini,
  cleanupFile,
  ERROR_TYPES, 
  MAX_INLINE_FILE_SIZE 
} from '../services/geminiClient.js';
import { prompts } from '../config/prompts.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
const readFileAsync = promisify(fs.readFile);

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // Aumentado a 100MB para soportar PDFs grandes
});

export const summaryController = {
  /**
   * Process text and files content to generate a Notion-formatted summary
   * @param {object} req - Request object with textPrompt in body and file in req.files
   * @param {object} res - Response object
   */
  getSummary: async (req, res) => {
    // Track uploaded file IDs
    const uploadedFileIds = [];
    
    try {
      console.log("Summary controller received request");
      
      // Extract the user API Key from headers
      const userApiKey = req.headers['x-user-api-key'];
      if (!userApiKey) {
        return res.status(401).json({ error: "API Key no proporcionada." });
      }
      
      // Get text prompt from request
      const { textPrompt } = req.body;
      
      // Prepare parts array for multimodal content
      const parts = [];
      
      // Add text prompt to parts if provided
      if (textPrompt && textPrompt.trim() !== "") {
        parts.push({ text: textPrompt });
      }
      
      // Add files to parts if provided
      if (req.files && req.files.length > 0) {
        console.log(`Received ${req.files.length} files`);
        
        for (const file of req.files) {
          console.log(`Processing file: ${file.originalname}, type: ${file.mimetype}, size: ${Math.round(file.size / (1024 * 1024))}MB`);
          
          try {
            // Process file for Gemini
            const filePart = await processFileForGemini(
              file.buffer, 
              file.mimetype, 
              userApiKey,
              file.originalname
            );
            
            // Store the file ID for later cleanup if it exists
            if (filePart.fileId) {
              uploadedFileIds.push(filePart.fileId);
            }
            
            parts.push(filePart);
          } catch (fileError) {
            console.error(`Error procesando archivo ${file.originalname}:`, fileError);
            // Attempt to clean up any files already uploaded before returning error
            if (uploadedFileIds.length > 0) {
              console.log(`Cleaning up ${uploadedFileIds.length} files due to processing error`);
              for (const fileId of uploadedFileIds) {
                await cleanupFile(fileId, userApiKey).catch(err => 
                  console.log(`Non-critical error during file cleanup: ${err.message}`)
                );
              }
            }
            return res.status(400).json({
              error: `Error procesando archivo ${file.originalname}: ${fileError.message}`,
              errorType: fileError.type || ERROR_TYPES.UNKNOWN_ERROR
            });
          }
        }
      }
      
      // Validate that either text or files are provided
      if (parts.length === 0) {
        return res.status(400).json({ error: "Se requiere un archivo o un texto para procesar" });
      }
      
      // If only files were uploaded with no text prompt, add a default prompt
      if ((req.files && req.files.length > 0) && (!textPrompt || textPrompt.trim() === "")) {
        let defaultPrompt = "Por favor analiza el contenido de estos archivos y genera un resumen detallado en formato Notion Markdown siguiendo todas las instrucciones establecidas.";
        
        // If only one file, make the prompt more specific
        if (req.files.length === 1) {
          const file = req.files[0];
          if (file.mimetype === 'application/pdf') {
            defaultPrompt = `Este es un documento PDF llamado "${file.originalname}". Por favor analiza su contenido completo y genera un resumen detallado en formato Notion Markdown siguiendo todas las instrucciones establecidas. El resumen debe ser extenso, completo y bien estructurado.`;
          } else if (file.mimetype.startsWith('image/')) {
            defaultPrompt = `Esta es una imagen llamada "${file.originalname}". Por favor analiza su contenido visual y genera un resumen detallado en formato Notion Markdown siguiendo todas las instrucciones establecidas. El resumen debe incluir todos los elementos visuales importantes y el texto visible en la imagen.`;
          }
        }
        
        // Add default prompt as first item in parts
        parts.unshift({ text: defaultPrompt });
        console.log(`Added default prompt for ${req.files.length} files`);
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
        return res.json({ 
          notionMarkdown,
          stats: {
            generationTimeMs: generationTime,
            ...stats
          }
        });
      } catch (geminiError) {
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
        return res.status(statusCode).json({ 
          error: geminiError.message || 'Error al comunicarse con la API de Gemini',
          errorType: errorType
        });
      }
    } catch (error) {
      console.error('Unexpected error in getSummary controller:', error);
      
      // Attempt to clean up any files already uploaded
      if (uploadedFileIds && uploadedFileIds.length > 0 && req && req.headers) {
        const userApiKey = req.headers['x-user-api-key'];
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
      
      // Extract the user API Key from headers
      const userApiKey = req.headers['x-user-api-key'];
      if (!userApiKey) {
        return res.status(401).json({ error: "API Key no proporcionada." });
      }
      
      // Extract the summary text from the request body
      const { markdownContent, condensationType = 'shorter' } = req.body;
      
      if (!markdownContent) {
        return res.status(400).json({ error: 'No summary content provided' });
      }
      
      console.log(`Received summary content size: ${Math.round(markdownContent.length / 1024)}KB`);
      
      // Ensure the content isn't too large for the API
      const maxContentLength = 100000;
      if (markdownContent.length > maxContentLength) {
        console.log(`Content too large (${Math.round(markdownContent.length / 1024)}KB), truncating...`);
        return res.status(400).json({ error: 'Summary content too large. Please reduce the size of your content.' });
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
        return res.json({ 
          notionMarkdown: condensedMarkdown,
          stats: {
            generationTimeMs: generationTime,
            ...stats
          }
        });
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError);
        
        // Extract error type if available, defaults to UNKNOWN_ERROR
        const errorType = geminiError.type || ERROR_TYPES.UNKNOWN_ERROR;
        const statusCode = geminiError.status || 500;
        
        // Return a more detailed error message with type
        return res.status(statusCode).json({ 
          error: geminiError.message || 'Error al comunicarse con la API de Gemini',
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