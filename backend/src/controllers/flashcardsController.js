import { generateMultimodalContent, fileToGenerativePart, ERROR_TYPES } from '../services/geminiClient.js';
import { prompts } from '../config/prompts.js';

export const flashcardsController = {
  /**
   * Generate flashcards in Quizlet-compatible TSV format from content
   * @param {object} req - Request object with textPrompt in body and/or file in req.file
   * @param {object} res - Response object
   */
  getFlashcards: async (req, res) => {
    try {
      console.log("Flashcard controller received request");
      
      // Extract the user API Key from headers
      const userApiKey = req.headers['x-user-api-key'];
      if (!userApiKey) {
        return res.status(401).json({ error: "API Key no proporcionada." });
      }
      
      // Get text prompt and file from request
      const { textPrompt } = req.body;
      const file = req.file;
      
      // Prepare parts array for multimodal content
      const parts = [];      // Add text prompt to parts if provided
      if (textPrompt && textPrompt.trim() !== "") {
        parts.push({ text: textPrompt });
      }
      
      // Add file to parts if provided
      if (file) {
        console.log(`Received file: ${file.originalname}, type: ${file.mimetype}, size: ${file.size} bytes`);
        parts.push(fileToGenerativePart(file.buffer, file.mimetype));
      }
      
      // Validate that either text or file is provided
      if (parts.length === 0) {
        return res.status(400).json({ error: "Se requiere un archivo o un texto para procesar" });
      }
      
      // If only a file was uploaded with no text prompt, add a default prompt
      if (file && (!textPrompt || textPrompt.trim() === "")) {
        let defaultPrompt;
        
        if (file.mimetype === 'application/pdf') {
          defaultPrompt = `Este es un documento PDF llamado "${file.originalname}". Por favor analiza su contenido completo y genera tarjetas de estudio en formato TSV (valores separados por tabuladores). Cada tarjeta debe tener una pregunta y una respuesta separadas por un tabulador.`;
        } else {
          defaultPrompt = `Esta es una imagen llamada "${file.originalname}". Por favor analiza su contenido visual y genera tarjetas de estudio en formato TSV (valores separados por tabuladores) basadas en la información visible. Cada tarjeta debe tener una pregunta y una respuesta separadas por un tabulador.`;
        }
        
        // Add default prompt as first item in parts
        parts.unshift({ text: defaultPrompt });
        console.log(`Added default prompt for ${file.mimetype} file`);
      }
      
      // Get the system instruction from prompts
      const systemInstruction = prompts.flashcardPrompt;
      
      try {
        // Call Gemini API with multimodal content using user's API key
        console.log('Calling Gemini API with multimodal content...');
        const startTime = Date.now();
        
        // Use the new multimodal function
        const geminiResponse = await generateMultimodalContent(userApiKey, parts, systemInstruction);
        const generationTime = Date.now() - startTime;
        
        console.log('Successfully received response from Gemini API');
        console.log(`Total generation time including network: ${generationTime}ms`);
        
        // Extract the flashcards generated and the metrics
        const { generatedText: flashcards, stats } = geminiResponse;
        
        // Return the generated flashcards and include usage metrics
        return res.json({ 
          flashcards,
          stats: {
            generationTimeMs: generationTime,
            ...stats
          }
        });
      } catch (geminiError) {
        console.error('Gemini API error during flashcard generation:', geminiError);
        
        // Extract the error type and status code
        const errorType = geminiError.type || ERROR_TYPES.UNKNOWN_ERROR;
        const statusCode = geminiError.status || 500;
        
        // Return a detailed error message
        return res.status(statusCode).json({ 
          error: geminiError.message || 'Error al comunicarse con la API de Gemini',
          errorType: errorType
        });
      }
    } catch (error) {
      console.error('Unexpected error in getFlashcards controller:', error);
      
      // Ensure we always return a valid JSON response
      return res.status(500).json({ 
        error: `Internal server error: ${error.message}`,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};