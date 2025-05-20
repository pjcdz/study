import fetch from 'node-fetch';
import axios from 'axios';
import sessionManager from './sessionManager.js';

// Update to use the correct model name according to Google's documentation
const MODEL_NAME = 'gemini-1.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent`;

// Error types - used for better frontend handling
export const ERROR_TYPES = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_API_KEY: 'INVALID_API_KEY',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_PROCESSING_FAILED: 'FILE_PROCESSING_FAILED'
};

// Límite para el uso de inlineData vs Files API (20MB)
export const MAX_INLINE_FILE_SIZE = 20 * 1024 * 1024;

// Estimated input tokens - this variable was missing
const estimatedInputTokens = 100; // Default estimate

/**
 * Convierte un buffer de archivo (PDF, JPG, PNG, etc.) en una parte de contenido
 * para la API de Gemini.
 * @param {Buffer} buffer El buffer del archivo.
 * @param {string} mimeType El tipo MIME del archivo (ej. "application/pdf", "image/jpeg").
 * @returns {object} Objeto de parte de contenido para la API.
 */
export function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

/**
 * Convierte un buffer de archivo grande en una parte de contenido usando Files API
 * @param {Buffer} buffer - El buffer del archivo
 * @param {string} mimeType - El tipo MIME del archivo
 * @param {string} apiKey - La API key de Gemini
 * @returns {Promise<object>} - Objeto con URI para usar con la API de Gemini
 */
export async function largeFileToGenerativePart(buffer, mimeType, apiKey) {
  try {
    console.log(`Procesando archivo grande (${Math.round(buffer.length / (1024 * 1024))}MB) usando Files API`);
    
    // Importar GoogleGenerativeAI de la biblioteca oficial
    const { GoogleGenerativeAI, createPartFromUri } = await import('@google/generative-ai');
    
    // Crear cliente de la API de Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Crear un Blob del buffer
    const fileBlob = new Blob([buffer], { type: mimeType });
    
    // Subir archivo usando Files API
    const file = await genAI.files.upload({
      file: fileBlob,
      config: {
        displayName: `upload-${Date.now()}`
      }
    });
    
    console.log(`Archivo subido exitosamente con ID: ${file.name}`);
    
    // Esperar a que se procese el archivo
    let getFile = await genAI.files.get({ name: file.name });
    let attempts = 0;
    const maxAttempts = 30; // Máximo 60 segundos de espera (30 * 2s)
    
    while (getFile.state === 'PROCESSING' && attempts < maxAttempts) {
      attempts++;
      console.log(`Intento ${attempts}: Estado del archivo: ${getFile.state}`);
      
      // Esperar 2 segundos antes de comprobar de nuevo
      await new Promise(resolve => setTimeout(resolve, 2000));
      getFile = await genAI.files.get({ name: file.name });
    }
    
    if (getFile.state === 'FAILED') {
      throw new Error('El procesamiento del archivo falló en la Files API');
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Tiempo de espera agotado para el procesamiento del archivo');
    }
    
    console.log(`Archivo procesado correctamente: ${getFile.name}`);
    
    // Devolver un objeto de parte compatible con la API de Gemini
    return createPartFromUri(file.uri, mimeType);
  } catch (error) {
    console.error('Error en largeFileToGenerativePart:', error);
    const fileApiError = new Error(`Error procesando archivo grande: ${error.message}`);
    fileApiError.type = ERROR_TYPES.FILE_TOO_LARGE;
    throw fileApiError;
  }
}

/**
 * Process a file for Gemini API, automatically using the appropriate method based on size
 * @param {Buffer} buffer - The file buffer
 * @param {string} mimeType - The MIME type of the file
 * @param {string} apiKey - The user's Gemini API key
 * @param {string} filename - Original filename (optional)
 * @returns {Promise<object>} - The file part to use with Gemini API
 */
export async function processFileForGemini(buffer, mimeType, apiKey, filename = `file-${Date.now()}`) {
  try {
    const fileSize = buffer.length;
    console.log(`Processing file: ${Math.round(fileSize / (1024 * 1024))}MB, type: ${mimeType}, name: ${filename}`);
    
    // If file is small enough for inline data
    if (fileSize <= MAX_INLINE_FILE_SIZE) {
      console.log(`Using inline data for file (${Math.round(fileSize / (1024 * 1024))}MB)`);
      return {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType,
        }
      };
    }
    
    // For larger files, use the Files API
    console.log(`Using Files API for large file (${Math.round(fileSize / (1024 * 1024))}MB)`);
    
    // Import required modules from Gemini
    const { GoogleGenerativeAI, createPartFromUri } = await import('@google/generative-ai');
    
    // Create client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Create a Blob from the buffer
    const fileBlob = new Blob([buffer], { type: mimeType });
    
    // Upload file using Files API
    const file = await genAI.files.upload({
      file: fileBlob,
      config: {
        displayName: filename
      }
    });
    
    console.log(`File uploaded successfully with ID: ${file.name}`);
    
    // Start tracking this file for status updates
    sessionManager.trackFileProcessing(apiKey, file.name, filename);
    
    // Wait for file processing
    let getFile = await genAI.files.get({ name: file.name });
    let attempts = 0;
    const maxAttempts = 30; // Maximum 60 seconds wait (30 * 2s)
    
    while (getFile.state === 'PROCESSING' && attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts}: File status: ${getFile.state}`);
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      getFile = await genAI.files.get({ name: file.name });
    }
    
    if (getFile.state === 'FAILED') {
      // Update status in session manager
      sessionManager.updateFileStatus(apiKey, file.name, sessionManager.FILE_STATUS.FAILED);
      
      const fileError = new Error('File processing failed in the Files API');
      fileError.type = ERROR_TYPES.FILE_PROCESSING_FAILED;
      fileError.details = getFile.failureReason || 'Unknown reason';
      throw fileError;
    }
    
    if (attempts >= maxAttempts) {
      // Update status in session manager
      sessionManager.updateFileStatus(apiKey, file.name, sessionManager.FILE_STATUS.FAILED);
      
      const timeoutError = new Error('Timeout waiting for file processing');
      timeoutError.type = ERROR_TYPES.FILE_PROCESSING_FAILED;
      throw timeoutError;
    }
    
    console.log(`File processed successfully: ${getFile.name}`);
    
    // Update status to processed
    sessionManager.updateFileStatus(apiKey, file.name, sessionManager.FILE_STATUS.PROCESSED);
    
    // Return the part with file URI and store the file ID for potential cleanup
    const result = createPartFromUri(file.uri, mimeType);
    result.fileId = file.name; // Store file ID for later cleanup
    return result;
  } catch (error) {
    console.error('Error processing file for Gemini:', error);
    const processError = new Error(`Error processing file: ${error.message}`);
    processError.type = error.type || ERROR_TYPES.FILE_TOO_LARGE;
    throw processError;
  }
}

/**
 * Delete a file from Gemini Files API after processing
 * @param {string} fileName - The name/ID of the file to delete
 * @param {string} apiKey - The user's Gemini API key
 * @returns {Promise<boolean>} - True if deletion was successful
 */
export async function cleanupFile(fileName, apiKey) {
  try {
    console.log(`Cleaning up file: ${fileName}`);
    
    // Import GoogleGenerativeAI from the library
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    // Create client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Delete the file
    await genAI.files.delete({ name: fileName });
    
    // Remove from tracking
    sessionManager.removeFileTracking(apiKey, fileName);
    
    console.log(`Successfully deleted file: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete file: ${error.message}`);
    return false;
  }
}

/**
 * Determina si un archivo debe usar la Files API en lugar de inline data
 * @param {Buffer} buffer - El buffer del archivo
 * @returns {boolean} - True si el archivo debe usar Files API
 */
export function shouldUseFilesAPI(buffer) {
  return buffer.length > MAX_INLINE_FILE_SIZE;
}

/**
 * Call Gemini API with a user's API key and multimodal content
 * @param {string} userApiKey - The user's Gemini API key
 * @param {Array<object>} parts - Array of parts (text and/or files)
 * @param {string} systemInstructionText - Optional system instruction
 * @returns {Promise<object>} - The generated text response and usage statistics
 */
export async function generateMultimodalContent(userApiKey, parts, systemInstructionText) {
  try {
    if (!userApiKey) {
      throw new Error('API Key no proporcionada');
    }
    
    console.log('Sending request to Gemini API...');
    console.log(`Using API key: ${userApiKey.substring(0, 3)}...${userApiKey.substring(userApiKey.length - 3)}`); // Log partial key for debugging
    console.log(`Using model: ${MODEL_NAME}`);
    
    const startTime = Date.now();
    
    // Merge system instruction into the user parts
    const userParts = systemInstructionText
      ? [{ text: systemInstructionText }, ...parts]
      : parts;
    
    // Create contents array for the request
    const contents = [{
      role: 'user',
      parts: userParts
    }];

    // Create request body
    const body = {
      contents,
      generationConfig: {
        temperature: 1,        // Lower temperature for more focused output
        maxOutputTokens: 8192,  // Large token limit to allow detailed responses
        topP: 0.8,               // Sample from top 80% probability mass
        topK: 40                 // Sample from top 40 tokens
      }
    };

    // Log the endpoint being used
    console.log(`Using API endpoint: ${API_URL}`);
    
    const response = await fetch(`${API_URL}?key=${userApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // Calculate API response time
    const apiResponseTime = Date.now() - startTime;
    console.log(`API response time: ${apiResponseTime}ms`);

    // Log response status and headers
    console.log(`Gemini API response status: ${response.status} ${response.statusText}`);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

    // Get the response text first
    const responseText = await response.text();
    console.log('Raw response text length:', responseText.length);
    console.log('Response preview:', responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''));
    
    if (!response.ok) {
      // Try to parse as JSON, but handle case where it's not valid JSON
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.error?.message || 'Unknown Gemini API error';
        const errorCode = errorData.error?.code || response.status;
        
        // Detect quota exceeded errors
        if (
          (errorCode === 429 && errorMessage.includes('quota')) || 
          errorMessage.toLowerCase().includes('quota exceeded') ||
          errorMessage.toLowerCase().includes('resource exhausted') ||
          errorMessage.toLowerCase().includes('rate limit')
        ) {
          const quotaError = new Error(`Gemini API quota exceeded: ${errorMessage}`);
          quotaError.type = ERROR_TYPES.QUOTA_EXCEEDED;
          throw quotaError;
        }
        
        // Detect invalid API key
        if (errorCode === 401 || (errorCode === 400 && errorMessage.toLowerCase().includes('api key'))) {
          const authError = new Error(`Gemini API authentication error: ${errorMessage}`);
          authError.type = ERROR_TYPES.INVALID_API_KEY;
          throw authError;
        }
        
        // General error
        const generalError = new Error(`Gemini API error (${errorCode}): ${errorMessage}`);
        generalError.type = ERROR_TYPES.UNKNOWN_ERROR;
        throw generalError;
      } catch (parseError) {
        // If parsing failed, but the original error had error type property, preserve it
        if (parseError.type) {
          throw parseError;
        }
        
        // If we can't parse as JSON, return the response text
        console.error('Error parsing error response:', parseError);
        const responseError = new Error(`Gemini API error: ${responseText || response.statusText}`);
        responseError.type = ERROR_TYPES.UNKNOWN_ERROR;
        throw responseError;
      }
    }

    // Total time including parsing
    const totalTime = Date.now() - startTime;

    // Try to parse the successful response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing successful response:', parseError);
      console.error('Raw response:', responseText);
      const parseResponseError = new Error('Failed to parse Gemini API response');
      parseResponseError.type = ERROR_TYPES.UNKNOWN_ERROR;
      throw parseResponseError;
    }
    
    // Extract usage statistics if available
    let usageMetrics = {
      inputTokens: estimatedInputTokens,
      outputTokens: 0,
      totalTokens: estimatedInputTokens,
      apiResponseTimeMs: apiResponseTime,
      totalProcessingTimeMs: totalTime,
      model: MODEL_NAME
    };
    
    // If response includes usage data, use it instead of estimates
    if (data.usageMetadata) {
      usageMetrics.inputTokens = data.usageMetadata.promptTokenCount || usageMetrics.inputTokens;
      usageMetrics.outputTokens = data.usageMetadata.candidatesTokenCount || 0;
      usageMetrics.totalTokens = usageMetrics.inputTokens + usageMetrics.outputTokens;
    } else {
      // If no usage data, estimate output tokens
      const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      usageMetrics.outputTokens = Math.ceil(outputText.length / 4);
      usageMetrics.totalTokens = usageMetrics.inputTokens + usageMetrics.outputTokens;
    }
    
    // Log all usage statistics
    console.log('===== GEMINI API USAGE STATISTICS =====');
    console.log(`Model: ${usageMetrics.model}`);
    console.log(`Input tokens: ${usageMetrics.inputTokens}`);
    console.log(`Output tokens: ${usageMetrics.outputTokens}`);
    console.log(`Total tokens: ${usageMetrics.totalTokens}`);
    console.log(`API response time: ${usageMetrics.apiResponseTimeMs}ms`);
    console.log(`Total processing time: ${usageMetrics.totalProcessingTimeMs}ms`);
    console.log('======================================');
      // Extract the text from the response
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const generatedText = data.candidates[0].content.parts[0].text;
      // Return both the text and the usage metrics
      return {
        generatedText,
        stats: {
          promptTokens: usageMetrics.inputTokens,
          candidatesTokens: usageMetrics.outputTokens, 
          totalTokens: usageMetrics.totalTokens
        }
      };
    }
    
    console.error('Unexpected response format:', JSON.stringify(data, null, 2));
    const formatError = new Error('Unexpected response format from Gemini API');
    formatError.type = ERROR_TYPES.UNKNOWN_ERROR;
    throw formatError;
  } catch (error) {
    // Log the full error details
    console.error('Error calling Gemini API:', error);
    
    // Handle specific errors based on response
    if (error.message && error.message.includes('API key not valid')) {
      const authError = new Error('API Key inválida o sin permisos. Por favor, verifica tu API Key de Google AI Studio.');
      authError.type = ERROR_TYPES.INVALID_API_KEY;
      authError.status = 401;
      throw authError;
    } else if (error.message && (error.message.includes('quota') || error.status === 429)) {
      const quotaError = new Error('Se ha excedido la cuota para esta API Key o se ha alcanzado el límite de peticiones.');
      quotaError.type = ERROR_TYPES.QUOTA_EXCEEDED;
      quotaError.status = 429;
      throw quotaError;
    } 
    
    // Preserve error type if already set
    if (error.type) {
      throw error;
    }
    
    // Check if this is a network error
    if (error.name === 'FetchError' || error.code === 'ENOTFOUND') {
      const networkError = new Error(`Network error connecting to Gemini API: ${error.message}`);
      networkError.type = ERROR_TYPES.NETWORK_ERROR;
      throw networkError;
    }
    
    // Default error type
    error.type = ERROR_TYPES.UNKNOWN_ERROR;
    throw error;
  }
}

// Legacy function for backward compatibility
export async function callGemini(prompt) {
  console.warn('DEPRECATED: callGemini() is deprecated. Please use generateMultimodalContent() instead.');
  try {
    const parts = [{ text: prompt }];
    const result = await generateMultimodalContent(process.env.GEMINI_API_KEY, parts);
    return {
      text: result.generatedText,
      usageMetrics: {
        inputTokens: result.stats.promptTokens,
        outputTokens: result.stats.candidatesTokens,
        totalTokens: result.stats.totalTokens
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Service for interacting with Google's Gemini API
 * This includes support for text generation and multimodal (text+image) processing
 */
export class GeminiClient {
  constructor(config = {}) {
    this.apiKey = null;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.defaultModel = config.model || 'gemini-1.5-flash';
    this.temperature = config.temperature || 1;
    this.maxOutputTokens = config.maxOutputTokens || 8192;
  }
  
  /**
   * Set the API key for Gemini API requests
   * @param {string} apiKey - The API key to use
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Get the configured API key
   * @returns {string} The current API key
   */
  getApiKey() {
    return this.apiKey;
  }

  /**
   * Process a PDF document using Gemini's document understanding capabilities
   * @param {Buffer} fileBuffer - The PDF file buffer
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed text content from the PDF
   */
  async processPdfFile(fileBuffer, options = {}) {
    if (!this.apiKey) {
      throw new Error('API key not configured for Gemini client');
    }
    
    try {
      // First upload the file to Gemini's file API
      const uploadResponse = await this._uploadFile(fileBuffer, 'application/pdf');
      
      if (!uploadResponse || !uploadResponse.uri) {
        throw new Error('Failed to upload PDF file');
      }
      
      console.log(`PDF file uploaded successfully with URI: ${uploadResponse.uri}`);
      
      // Extract content using the file URI
      const extractionPrompt = options.prompt || "Extract and structure all text content from this document. Maintain the document's structure and organization. Format the output in markdown.";
      
      const response = await axios.post(
        `${this.baseUrl}/models/${this.defaultModel}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            { 
              parts: [
                { text: extractionPrompt },
                { fileData: { 
                    fileUri: uploadResponse.uri, 
                    mimeType: 'application/pdf' 
                  } 
                }
              ]
            }
          ],
          generationConfig: {
            temperature: this.temperature,
            maxOutputTokens: this.maxOutputTokens,
            topP: 0.95,
            topK: 40
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract the text content from the response
      const result = this._extractTextFromResponse(response.data);
      return { 
        success: true, 
        extractedContent: result
      };
    } catch (error) {
      console.error('Error processing PDF with Gemini:', error);
      
      // Get detailed error information if available
      const errorDetails = error.response?.data || error.message;
      throw new Error(`PDF processing failed: ${JSON.stringify(errorDetails)}`);
    }
  }
  
  /**
   * Upload a file to the Gemini file API
   * @param {Buffer} fileBuffer - The file buffer to upload
   * @param {string} mimeType - The MIME type of the file
   * @returns {Promise<Object>} The upload response
   */
  async _uploadFile(fileBuffer, mimeType) {
    try {
      const base64Data = fileBuffer.toString('base64');
      
      const response = await axios.post(
        `${this.baseUrl}/files?key=${this.apiKey}`,
        {
          file: {
            mimeType: mimeType,
            data: base64Data
          },
          config: {
            displayName: `upload-${Date.now()}.pdf`
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error uploading file to Gemini:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Generate content using text-only prompt
   * @param {string} prompt - The text prompt
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated content
   */
  async generateContent(prompt, options = {}) {
    // ...existing code...
  }
  
  /**
   * Generate content using multimodal input (text + images)
   * @param {Object} data - Request data with text and image parts
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated content
   */
  async generateMultimodalContent(data, options = {}) {
    // ...existing code...
  }
  
  /**
   * Extract text content from Gemini API response
   * @param {Object} response - The API response
   * @returns {string} Extracted text
   */
  _extractTextFromResponse(response) {
    try {
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          return candidate.content.parts[0].text || '';
        }
      }
      return '';
    } catch (error) {
      console.error('Error extracting text from response:', error);
      return '';
    }
  }
}

// Create a default instance of the client
export default new GeminiClient();