import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import sessionManager from './sessionManager.js';

// Update to use the correct model name according to Google's documentation
const MODEL_NAME = 'gemini-1.5-flash';

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

/**
 * Convierte un buffer de archivo (PDF, JPG, PNG, etc.) en una parte de contenido
 * @param {Buffer} buffer - El buffer del archivo
 * @param {string} mimeType - El tipo MIME del archivo
 * @returns {object} - Objeto con data base64 y mimeType para usar con AI SDK
 */
export function fileToGenerativePart(buffer, mimeType) {
  return {
    type: 'file',
    data: buffer,
    mimeType: mimeType,
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
    
    // For large files, we'll still need to use the Google Generative AI library directly
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const fileBlob = new Blob([buffer], { type: mimeType });
    
    const uploadResult = await genAI.files.upload({
      file: fileBlob,
      displayName: `upload-${Date.now()}`,
    });
    
    console.log(`Archivo subido con URI: ${uploadResult.file.uri}`);
    
    // Track the file for cleanup
    sessionManager.addFileTracking(apiKey, uploadResult.file.name);
    
    return {
      type: 'file',
      data: uploadResult.file.uri,
      mimeType: mimeType,
    };
  } catch (error) {
    console.error('Error uploading large file:', error);
    throw new Error(`Failed to upload large file: ${error.message}`);
  }
}

/**
 * Process a file for Gemini API, automatically using the appropriate method based on size
 * @param {Object} file - The multer file object with buffer, mimetype, and originalname
 * @param {string} apiKey - The user's Gemini API key
 * @returns {Promise<object>} - The file part to use with Gemini API
 */
export async function processFileForGemini(file, apiKey) {
  try {
    const buffer = file.buffer;
    const mimeType = file.mimetype;
    const filename = file.originalname || `file-${Date.now()}`;
    const fileSize = buffer.length;
    
    console.log(`Processing file: ${Math.round(fileSize / (1024 * 1024))}MB, type: ${mimeType}, name: ${filename}`);
    
    // If file is small enough for inline data
    if (fileSize <= MAX_INLINE_FILE_SIZE) {
      console.log(`Using inline data for file (${Math.round(fileSize / (1024 * 1024))}MB)`);
      return {
        type: 'file',
        data: buffer,
        mimeType,
      };
    }
    
    // For larger files, use the Files API
    console.log(`Using Files API for large file (${Math.round(fileSize / (1024 * 1024))}MB)`);
    
    // Import required modules from Gemini
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    // Create client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Create a Blob from the buffer
    const fileBlob = new Blob([buffer], { type: mimeType });
    
    // Upload file using Files API
    const uploadResult = await genAI.files.upload({
      file: fileBlob,
      config: {
        displayName: filename
      }
    });
    
    console.log(`File uploaded successfully with ID: ${uploadResult.file.name}`);
    
    // Start tracking this file for status updates
    sessionManager.trackFileProcessing(apiKey, uploadResult.file.name, filename);
    
    // Wait for file processing
    let getFile = await genAI.files.get({ name: uploadResult.file.name });
    let attempts = 0;
    const maxAttempts = 30; // Maximum 60 seconds wait (30 * 2s)
    
    while (getFile.state === 'PROCESSING' && attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts}: File status: ${getFile.state}`);
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      getFile = await genAI.files.get({ name: uploadResult.file.name });
    }
    
    if (getFile.state === 'FAILED') {
      // Update status in session manager
      sessionManager.updateFileStatus(apiKey, uploadResult.file.name, sessionManager.FILE_STATUS.FAILED);
      
      const fileError = new Error('File processing failed in the Files API');
      fileError.type = ERROR_TYPES.FILE_PROCESSING_FAILED;
      fileError.details = getFile.failureReason || 'Unknown reason';
      throw fileError;
    }
    
    if (attempts >= maxAttempts) {
      // Update status in session manager
      sessionManager.updateFileStatus(apiKey, uploadResult.file.name, sessionManager.FILE_STATUS.FAILED);
      
      const timeoutError = new Error('Timeout waiting for file processing');
      timeoutError.type = ERROR_TYPES.FILE_PROCESSING_FAILED;
      throw timeoutError;
    }
    
    console.log(`File processed successfully: ${getFile.name}`);
    
    // Update status to processed
    sessionManager.updateFileStatus(apiKey, uploadResult.file.name, sessionManager.FILE_STATUS.PROCESSED);
    
    // Return the part with file URI and store the file ID for potential cleanup
    const result = {
      type: 'file',
      data: uploadResult.file.uri,
      mimeType: mimeType,
    };
    result.fileId = uploadResult.file.name; // Store file ID for later cleanup
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
    
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    await genAI.files.delete({ name: fileName });
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
 * Call Gemini API with a user's API key and multimodal content using AI SDK
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
    
    console.log('Sending request to Gemini API using AI SDK...');
    console.log(`Using API key: ${userApiKey.substring(0, 3)}...${userApiKey.substring(userApiKey.length - 3)}`);
    console.log(`Using model: ${MODEL_NAME}`);
    
    const startTime = Date.now();
    
    // Check if we have any file URIs that require fallback to original SDK
    const hasFileUris = parts.some(part => 
      (part.fileData && part.fileData.fileUri) || 
      (part.type === 'file' && typeof part.data === 'string' && part.data.startsWith('https://'))
    );
    
    if (hasFileUris) {
      console.log('Detected file URIs, falling back to original Google SDK implementation');
      return await generateMultimodalContentFallback(userApiKey, parts, systemInstructionText);
    }
    
    // For AI SDK, we need to set the API key as an environment variable or pass it directly
    // The AI SDK reads from GOOGLE_GENERATIVE_AI_API_KEY environment variable
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = userApiKey;
    
    // Create the model instance - AI SDK will use the environment variable
    const model = google(MODEL_NAME);
    
    // Prepare the messages array
    const messages = [];
    
    // Add system instruction if provided
    if (systemInstructionText) {
      messages.push({
        role: 'system',
        content: systemInstructionText,
      });
    }
    
    // Convert parts to AI SDK format
    const content = parts.map(part => {
      if (part.text) {
        return {
          type: 'text',
          text: part.text,
        };
      } else if (part.inlineData) {
        // For inline data, convert base64 to buffer for AI SDK
        return {
          type: 'file',
          data: Buffer.from(part.inlineData.data, 'base64'),
          mimeType: part.inlineData.mimeType,
        };
      } else if (part.type === 'file' && part.data instanceof Buffer) {
        // Already in correct AI SDK format with Buffer data
        return part;
      }
      return part;
    });
    
    messages.push({
      role: 'user',
      content: content,
    });
    
    // Generate content using AI SDK
    const result = await generateText({
      model,
      messages,
      maxTokens: 8192,
      temperature: 1,
      topP: 0.8,
      topK: 40,
    });
    
    // Clean up the environment variable for security
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    const apiResponseTime = Date.now() - startTime;
    console.log(`API response time: ${apiResponseTime}ms`);
    
    // Extract usage statistics
    const usageMetrics = {
      inputTokens: result.usage?.promptTokens || 100,
      outputTokens: result.usage?.completionTokens || 0,
      totalTokens: result.usage?.totalTokens || 100,
      apiResponseTimeMs: apiResponseTime,
      totalProcessingTimeMs: apiResponseTime,
      model: MODEL_NAME
    };
    
    console.log('===== GEMINI API USAGE STATISTICS =====');
    console.log(`Model: ${usageMetrics.model}`);
    console.log(`Input tokens: ${usageMetrics.inputTokens}`);
    console.log(`Output tokens: ${usageMetrics.outputTokens}`);
    console.log(`Total tokens: ${usageMetrics.totalTokens}`);
    console.log(`API response time: ${usageMetrics.apiResponseTimeMs}ms`);
    console.log(`Total processing time: ${usageMetrics.totalProcessingTimeMs}ms`);
    console.log('======================================');
    
    return {
      generatedText: result.text,
      stats: {
        promptTokens: usageMetrics.inputTokens,
        candidatesTokens: usageMetrics.outputTokens,
        totalTokens: usageMetrics.totalTokens
      }
    };
    
  } catch (error) {
    // Clean up the environment variable in case of error
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    console.error('Error calling Gemini API:', error);
    
    // Handle AI SDK specific errors
    if (error.name === 'LoadAPIKeyError' || error.message?.includes('API key is missing')) {
      const authError = new Error('API Key inválida o sin permisos. Por favor, verifica tu API Key de Google AI Studio.');
      authError.type = ERROR_TYPES.INVALID_API_KEY;
      authError.status = 401;
      throw authError;
    } else if (error.message && error.message.includes('API key not valid')) {
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

/**
 * Fallback implementation using the original Google SDK for large files with URIs
 * @param {string} userApiKey - The user's Gemini API key
 * @param {Array<object>} parts - Array of parts (text and/or files)
 * @param {string} systemInstructionText - Optional system instruction
 * @returns {Promise<object>} - The generated text response and usage statistics
 */
async function generateMultimodalContentFallback(userApiKey, parts, systemInstructionText) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  
  const genAI = new GoogleGenerativeAI(userApiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  const startTime = Date.now();
  
  // Convert parts to original SDK format
  const convertedParts = parts.map(part => {
    if (part.text) {
      return { text: part.text };
    } else if (part.type === 'file' && part.data instanceof Buffer) {
      // Convert buffer to base64 for original SDK
      return {
        inlineData: {
          data: part.data.toString('base64'),
          mimeType: part.mimeType,
        }
      };
    } else if (part.type === 'file' && typeof part.data === 'string') {
      // File URI case
      return {
        fileData: {
          fileUri: part.data,
          mimeType: part.mimeType,
        }
      };
    }
    return part; // Already in correct format
  });
  
  // Merge system instruction into the user parts
  const userParts = systemInstructionText
    ? [{ text: systemInstructionText }, ...convertedParts]
    : convertedParts;
  
  // Create contents array for the request
  const contents = [{
    role: 'user',
    parts: userParts
  }];
  
  const result = await model.generateContent({
    contents,
    generationConfig: {
      temperature: 1,
      maxOutputTokens: 8192,
      topP: 0.8,
      topK: 40
    }
  });
  
  const apiResponseTime = Date.now() - startTime;
  console.log(`Fallback API response time: ${apiResponseTime}ms`);
  
  const response = await result.response;
  const text = response.text();
  
  // Extract usage statistics
  const usageMetadata = response.usageMetadata || {};
  const usageMetrics = {
    inputTokens: usageMetadata.promptTokenCount || 100,
    outputTokens: usageMetadata.candidatesTokenCount || 0,
    totalTokens: usageMetadata.totalTokenCount || 100,
    apiResponseTimeMs: apiResponseTime,
    totalProcessingTimeMs: apiResponseTime,
    model: MODEL_NAME
  };
  
  console.log('===== GEMINI API USAGE STATISTICS (FALLBACK) =====');
  console.log(`Model: ${usageMetrics.model}`);
  console.log(`Input tokens: ${usageMetrics.inputTokens}`);
  console.log(`Output tokens: ${usageMetrics.outputTokens}`);
  console.log(`Total tokens: ${usageMetrics.totalTokens}`);
  console.log(`API response time: ${usageMetrics.apiResponseTimeMs}ms`);
  console.log(`Total processing time: ${usageMetrics.totalProcessingTimeMs}ms`);
  console.log('==================================================');
  
  return {
    generatedText: text,
    stats: {
      promptTokens: usageMetrics.inputTokens,
      candidatesTokens: usageMetrics.outputTokens,
      totalTokens: usageMetrics.totalTokens
    }
  };
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
 * Service for interacting with Google's Gemini API using AI SDK
 * This includes support for text generation and multimodal (text+image) processing
 */
export class GeminiClient {
  constructor(config = {}) {
    this.apiKey = null;
    this.defaultModel = config.model || MODEL_NAME;
    this.temperature = config.temperature || 1;
    this.maxOutputTokens = config.maxOutputTokens || 8192;
  }
  
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  getApiKey() {
    return this.apiKey;
  }

  async processPdfFile(fileBuffer, options = {}) {
    if (!this.apiKey) {
      throw new Error('API key not configured for Gemini client');
    }
    
    try {
      const extractionPrompt = options.prompt || "Extract and structure all text content from this document. Maintain the document's structure and organization. Format the output in markdown.";
      
      const model = google(this.defaultModel, {
        apiKey: this.apiKey,
      });
      
      const result = await generateText({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: extractionPrompt },
              { type: 'file', data: fileBuffer, mimeType: 'application/pdf' }
            ],
          },
        ],
        maxTokens: this.maxOutputTokens,
        temperature: this.temperature,
      });
      
      return { 
        success: true, 
        extractedContent: result.text
      };
    } catch (error) {
      console.error('Error processing PDF with Gemini:', error);
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  async generateContent(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('API key not configured for Gemini client');
    }
    
    const model = google(this.defaultModel, {
      apiKey: this.apiKey,
    });
    
    const result = await generateText({
      model,
      prompt,
      maxTokens: this.maxOutputTokens,
      temperature: this.temperature,
      ...options,
    });
    
    return result.text;
  }
  
  async generateMultimodalContent(data, options = {}) {
    if (!this.apiKey) {
      throw new Error('API key not configured for Gemini client');
    }
    
    const model = google(this.defaultModel, {
      apiKey: this.apiKey,
    });
    
    const result = await generateText({
      model,
      messages: data.messages || [{ role: 'user', content: data.content }],
      maxTokens: this.maxOutputTokens,
      temperature: this.temperature,
      ...options,
    });
    
    return result.text;
  }
}

// Create a default instance of the client
export default new GeminiClient();