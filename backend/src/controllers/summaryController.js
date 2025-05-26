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
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

const readFileAsync = promisify(fs.readFile);

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // Aumentado a 100MB para soportar PDFs grandes
});

// Enhanced summary controller with proper AI SDK streaming
export const getSummary = async (req, res) => {
  const userApiKey = req.headers['x-user-api-key'];
  console.log('Summary controller received request - STREAMING MODE');

  // Validate API key
  if (!userApiKey) {
    return res.status(401).json({ 
      error: 'API Key no proporcionada', 
      errorType: ERROR_TYPES.INVALID_API_KEY 
    });
  }

  const files = req.files;
  const { prompt: userPrompt = '' } = req.body;

  if (!files || files.length === 0) {
    res.write('ERROR: No files uploaded');
    res.end();
    return;
  }

  console.log(`Received ${files.length} files`);

  try {
    const uploadedFileIds = [];

    // Build comprehensive prompt with file descriptions
    let fullPrompt = 'Analiza los documentos adjuntos y genera un resumen académico estructurado en formato Markdown compatible con Notion.\n\n';
    
    // Add user prompt if provided
    if (userPrompt.trim()) {
      fullPrompt += `Instrucciones adicionales: ${userPrompt}\n\n`;
    }

    // Process files and extract text content first
    let fileContents = [];
    for (const file of files) {
      console.log(`Processing file: ${file.originalname}, type: ${file.mimetype}, size: ${Math.round(file.size / 1024)}KB`);
      
      try {
        const processedFile = await processFileForGemini(file, userApiKey);
        
        if (processedFile.fileId) {
          uploadedFileIds.push(processedFile.fileId);
        }

        // For streaming to work properly, we'll extract content from PDFs first
        if (file.mimetype === 'application/pdf') {
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(userApiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

          let extractedContent;
          if (processedFile.data instanceof Buffer) {
            // Small file - use inline data
            const result = await model.generateContent([
              { text: `Extrae todo el texto de este documento PDF: ${file.originalname}` },
              {
                inlineData: {
                  data: processedFile.data.toString('base64'),
                  mimeType: processedFile.mimeType
                }
              }
            ]);
            extractedContent = result.response.text();
          } else if (typeof processedFile.data === 'string') {
            // Large file - use file URI
            const result = await model.generateContent([
              { text: `Extrae todo el texto de este documento PDF: ${file.originalname}` },
              {
                fileData: {
                  fileUri: processedFile.data,
                  mimeType: processedFile.mimeType
                }
              }
            ]);
            extractedContent = result.response.text();
          }

          fileContents.push(`\n--- Contenido de ${file.originalname} ---\n${extractedContent}\n`);
          console.log(`Extracted ${extractedContent.length} characters from ${file.originalname}`);
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        fileContents.push(`\n--- Error procesando ${file.originalname} ---\n${fileError.message}\n`);
      }
    }

    // Combine everything into a single text prompt for streaming
    const combinedPrompt = fullPrompt + fileContents.join('\n');
    
    console.log(`Final prompt length: ${combinedPrompt.length} characters`);

    // Create the AI SDK model with explicit configuration
    console.log('Creating AI SDK model with API key...');
    const model = google('gemini-1.5-flash', {
      apiKey: userApiKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta'
    });

    console.log('Starting AI SDK streaming...');
    const startTime = Date.now();

    // Initialize counters
    let chunkCount = 0;
    let totalCharsStreamed = 0;

    // Set proper headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    try {
      // For AI SDK v4.3.16, let's use generateText which works reliably
      console.log('Using generateText instead of streamText for reliability...');
      
      const { generateText } = await import('ai');
      
      console.log('Calling generateText with model and prompt...');
      const result = await generateText({
        model: model,
        prompt: combinedPrompt,
        temperature: 0.3,
        maxTokens: 4000
      });

      console.log(`Generated text length: ${result.text?.length || 0}`);
      if (result.text) {
        console.log(`First 200 chars: "${result.text.slice(0, 200)}..."`);
      }

      if (result.text && result.text.length > 0) {
        // Simulate natural streaming by writing text word by word
        const text = result.text;
        const words = text.split(/(\s+)/); // Split by whitespace but keep the whitespace
        let currentChunk = '';
        const targetChunkSize = 3; // Send 3 words at a time for more natural flow
        let wordCount = 0;
        
        for (let i = 0; i < words.length; i++) {
          currentChunk += words[i];
          
          // Only count actual words, not whitespace
          if (words[i].trim().length > 0) {
            wordCount++;
          }
          
          // Send chunk when we have enough words or reach the end
          if (wordCount >= targetChunkSize || i === words.length - 1) {
            if (currentChunk.trim().length > 0) {
              res.write(currentChunk);
              chunkCount++;
              totalCharsStreamed += currentChunk.length;
              console.log(`Natural chunk #${chunkCount} (${currentChunk.length} chars, ${wordCount} words)`);
              
              // Natural delay between chunks (varies between 150-300ms for human-like typing)
              const delay = Math.random() * 150 + 150; // Random delay between 150-300ms
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            currentChunk = '';
            wordCount = 0;
          }
        }
      } else {
        throw new Error('generateText returned empty result');
      }

      const generationTime = Date.now() - startTime;
      console.log(`Total generation time: ${generationTime}ms`);
      console.log(`Total chunks streamed: ${chunkCount}`);
      console.log(`Total characters streamed: ${totalCharsStreamed}`);

      // Clean up uploaded files after successful processing
      if (uploadedFileIds.length > 0) {
        console.log(`Cleaning up ${uploadedFileIds.length} files after successful processing`);
        for (const fileId of uploadedFileIds) {
          cleanupFile(fileId, userApiKey).catch(err => 
            console.log(`Non-critical error during file cleanup: ${err.message}`)
          );
        }
      }

      // End the stream
      res.end();

    } catch (streamError) {
      console.error('AI SDK streaming error:', streamError);
      console.error('Error details:', {
        message: streamError.message,
        stack: streamError.stack,
        cause: streamError.cause
      });
      
      // Try fallback to Google SDK if AI SDK fails
      try {
        console.log('AI SDK failed, trying direct Google SDK fallback...');
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(userApiKey);
        const directModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const directResult = await directModel.generateContent(combinedPrompt);
        const directText = directResult.response.text();
        
        if (directText && directText.length > 0) {
          console.log(`Using direct Google SDK result: ${directText.length} characters`);
          
          // Simulate natural streaming by writing text word by word (same as primary method)
          const words = directText.split(/(\s+)/); // Split by whitespace but keep the whitespace
          let currentChunk = '';
          const targetChunkSize = 3; // Send 3 words at a time for more natural flow
          let wordCount = 0;
          
          for (let i = 0; i < words.length; i++) {
            currentChunk += words[i];
            
            // Only count actual words, not whitespace
            if (words[i].trim().length > 0) {
              wordCount++;
            }
            
            // Send chunk when we have enough words or reach the end
            if (wordCount >= targetChunkSize || i === words.length - 1) {
              if (currentChunk.trim().length > 0) {
                res.write(currentChunk);
                chunkCount++;
                totalCharsStreamed += currentChunk.length;
                console.log(`Direct SDK chunk #${chunkCount} (${currentChunk.length} chars, ${wordCount} words)`);
                
                // Natural delay between chunks (varies between 150-300ms for human-like typing)
                const delay = Math.random() * 150 + 150; // Random delay between 150-300ms
                await new Promise(resolve => setTimeout(resolve, delay));
              }
              
              currentChunk = '';
              wordCount = 0;
            }
          }
          
          console.log(`Direct SDK fallback successful: ${totalCharsStreamed} characters streamed`);
          res.end();
        } else {
          throw new Error('Direct Google SDK also returned empty result');
        }
      } catch (fallbackError) {
        console.error('Fallback to Google SDK also failed:', fallbackError);
        
        // Clean up files on error
        if (uploadedFileIds.length > 0) {
          console.log(`Cleaning up ${uploadedFileIds.length} files due to error`);
          for (const fileId of uploadedFileIds) {
            await cleanupFile(fileId, userApiKey).catch(err => 
              console.log(`Non-critical error during file cleanup: ${err.message}`)
            );
          }
        }

        if (!res.headersSent) {
          res.status(500).write(`ERROR: AI streaming failed - ${streamError.message}`);
          res.end();
        }
      }
    }

  } catch (error) {
    console.error('Unexpected error in getSummary controller:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      type: error.type
    });
    
    if (!res.headersSent) {
      res.write(`ERROR: ${error.message || 'Error interno del servidor'}`);
      res.end();
    }
  }
};

// Add the missing condenseSummary endpoint
export const condenseSummary = async (req, res) => {
  const userApiKey = req.headers['x-user-api-key'];
  console.log('Condense summary controller received request');

  // Validate API key
  if (!userApiKey) {
    return res.status(401).json({ 
      error: 'API Key no proporcionada', 
      errorType: ERROR_TYPES.INVALID_API_KEY 
    });
  }

  const { markdownContent, condensationType = 'shorter' } = req.body;

  if (!markdownContent) {
    return res.status(400).json({
      error: 'No markdown content provided',
      errorType: ERROR_TYPES.VALIDATION_ERROR
    });
  }

  console.log(`Condensing summary with type: ${condensationType}, content length: ${markdownContent.length}`);

  try {
    // Create the AI SDK model
    const model = google('gemini-1.5-pro-latest', {
      apiKey: userApiKey
    });

    // Create condensation prompt based on type
    let condensationPrompt = '';
    switch (condensationType) {
      case 'shorter':
        condensationPrompt = 'Condensa este resumen manteniendo solo los puntos más importantes. Reduce el contenido a aproximadamente la mitad del tamaño original mientras conservas la estructura y formato Markdown.';
        break;
      case 'clarity':
        condensationPrompt = 'Mejora la claridad de este resumen reorganizando y simplificando el contenido. Mantén toda la información importante pero hazla más fácil de entender.';
        break;
      case 'examples':
        condensationPrompt = 'Condensa este resumen enfocándote en ejemplos prácticos y casos de uso. Elimina teoría excesiva y mantén solo conceptos con ejemplos concretos.';
        break;
      default:
        condensationPrompt = 'Condensa este resumen manteniendo los puntos más importantes.';
    }

    const systemInstruction = "Eres un asistente académico experto que condensa y mejora resúmenes educativos manteniendo el formato Markdown compatible con Notion.";

    console.log('Starting AI SDK generation for condensed summary...');
    const startTime = Date.now();

    // Use generateText for non-streaming response (condensation is usually faster)
    const { generateText } = await import('ai');
    
    const result = await generateText({
      model: model,
      system: systemInstruction,
      messages: [
        {
          role: 'user',
          content: `${condensationPrompt}\n\nResumen original:\n\n${markdownContent}`
        }
      ],
      temperature: 0.3,
      maxTokens: 3000
    });

    const generationTime = Date.now() - startTime;
    console.log(`Condensed summary generation time: ${generationTime}ms`);

    // Return the condensed summary in the expected format
    return res.json({
      notionMarkdown: result.text,
      stats: {
        generationTimeMs: generationTime,
        inputTokens: result.usage?.promptTokens || 0,
        outputTokens: result.usage?.completionTokens || 0,
        totalTokens: result.usage?.totalTokens || 0
      }
    });

  } catch (error) {
    console.error('Error in condenseSummary controller:', error);
    return res.status(500).json({
      error: error.message || 'Error interno del servidor',
      errorType: ERROR_TYPES.UNKNOWN_ERROR
    });
  }
};

// Export the controller functions
export const summaryController = {
  getSummary,
  condenseSummary
};