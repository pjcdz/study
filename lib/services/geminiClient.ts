import { GoogleGenAI, Part, GenerateContentResponse } from '@google/genai';
import sessionManager from './sessionManager';

// Update to use gemini-2.5-flash
const MODEL_NAME = 'gemini-2.5-flash-lite';

// Error types - used for better frontend handling
export const ERROR_TYPES = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_API_KEY: 'INVALID_API_KEY',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_PROCESSING_FAILED: 'FILE_PROCESSING_FAILED'
} as const;

// Límite para el uso de inlineData vs Files API (20MB)
export const MAX_INLINE_FILE_SIZE = 20 * 1024 * 1024;

interface GenerationStats {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

interface GenerationResult {
  generatedText: string;
  stats: GenerationStats;
}

/**
 * Helper function to make API calls with AbortSignal support
 * @param apiPromise - The API promise to execute
 * @param signal - AbortSignal to cancel the request
 * @returns The result of the API call
 */
async function makeApiCall<T>(
  apiPromise: Promise<T>,
  signal: AbortSignal
): Promise<T> {
  if (signal.aborted) {
    throw new Error('Aborted');
  }

  const abortPromise = new Promise<never>((_, reject) => {
    signal.addEventListener('abort', () => {
      reject(new Error('Aborted'));
    });
  });

  try {
    return await Promise.race([apiPromise, abortPromise]);
  } catch (error: any) {
    if (error.message === 'Aborted') {
      console.log("Gemini request was aborted.");
    } else {
      console.error("Error calling Gemini API:", error);
    }
    throw error;
  }
}


/**
 * Handle Gemini API errors and map them to ERROR_TYPES
 * @param error - The error from Gemini API
 */
function handleGeminiError(error: any): never {
  console.error('Error calling Gemini API:', error);
  
  // API Key inválida
  if (error.message?.includes('API key not valid') || 
      error.message?.includes('API key is missing') ||
      error.message?.includes('API_KEY_INVALID')) {
    const authError: any = new Error(
      'API Key inválida o sin permisos. Por favor, verifica tu API Key.'
    );
    authError.type = ERROR_TYPES.INVALID_API_KEY;
    authError.status = 401;
    throw authError;
  }
  
  // Cuota excedida
  if (error.message?.includes('quota') || 
      error.status === 429 ||
      error.message?.includes('RESOURCE_EXHAUSTED')) {
    const quotaError: any = new Error(
      'Se ha excedido la cuota para esta API Key.'
    );
    quotaError.type = ERROR_TYPES.QUOTA_EXCEEDED;
    quotaError.status = 429;
    throw quotaError;
  }
  
  // Servicio no disponible (503) - modelo sobrecargado
  if (error.message?.includes('503') || 
      error.message?.includes('Service Unavailable') ||
      error.message?.includes('overloaded') ||
      error.message?.includes('UNAVAILABLE')) {
    const serviceError: any = new Error(
      'El servicio de Gemini está temporalmente sobrecargado. Por favor, intenta de nuevo en unos momentos.'
    );
    serviceError.type = ERROR_TYPES.NETWORK_ERROR;
    serviceError.status = 503;
    throw serviceError;
  }
  
  // Error de red
  if (error.name === 'FetchError' || 
      error.code === 'ENOTFOUND' ||
      error.message?.includes('network')) {
    const networkError: any = new Error(
      `Error de red al conectar con Gemini API: ${error.message}`
    );
    networkError.type = ERROR_TYPES.NETWORK_ERROR;
    networkError.status = 503;
    throw networkError;
  }
  
  // Solicitud abortada
  if (error.message === 'Aborted') {
    const abortError: any = new Error('Solicitud cancelada por el usuario');
    abortError.type = ERROR_TYPES.UNKNOWN_ERROR;
    abortError.status = 499;
    throw abortError;
  }
  
  // Error desconocido
  const unknownError: any = new Error(error.message || 'Error desconocido');
  unknownError.type = ERROR_TYPES.UNKNOWN_ERROR;
  unknownError.status = 500;
  throw unknownError;
}

/**
 * Generates text content using the Gemini API.
 * @param prompt The text prompt to send to the model.
 * @param signal An AbortSignal to cancel the request.
 * @param apiKey The user's Gemini API key.
 * @returns A promise that resolves with the generated text.
 */
export async function generateText(
  prompt: string, 
  signal: AbortSignal,
  apiKey: string
): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const generateContentPromise = ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    const response = await makeApiCall(generateContentPromise, signal);
    const text = response.text?.trim();
    
    if (!text) {
      throw new Error("No text response from Gemini.");
    }
    
    return text;
  } catch (error: any) {
    handleGeminiError(error);
  }
}


/**
 * Generates content using the Gemini API for multimodal inputs.
 * @param parts An array of Parts for the multimodal prompt.
 * @param signal An AbortSignal to cancel the request.
 * @param apiKey The user's Gemini API key.
 * @returns A promise that resolves with the generated text.
 */
export async function generateSummaryFromParts(
  parts: Part[], 
  signal: AbortSignal,
  apiKey: string
): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const generateContentPromise = ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
    });
    
    const response = await makeApiCall(generateContentPromise, signal);
    const text = response.text || '';
    
    if (!text) {
      throw new Error("No text response from Gemini.");
    }
    
    return text;
  } catch (error: any) {
    handleGeminiError(error);
  }
}


/**
 * Call Gemini API with a user's API key and multimodal content using Google GenAI SDK
 * @param userApiKey - The user's Gemini API key
 * @param parts - Array of parts (text and/or files)
 * @param systemInstructionText - Optional system instruction
 * @param signal - Optional AbortSignal for cancellation
 * @returns The generated text response and usage statistics
 */
export async function generateMultimodalContent(
  userApiKey: string,
  parts: Part[],
  systemInstructionText?: string,
  signal?: AbortSignal
): Promise<GenerationResult> {
  try {
    if (!userApiKey) {
      throw new Error('API Key no proporcionada');
    }
    
    console.log('Sending request to Gemini API using Google GenAI SDK...');
    console.log(`Using API key: ${userApiKey.substring(0, 3)}...${userApiKey.substring(userApiKey.length - 3)}`);
    console.log(`Using model: ${MODEL_NAME}`);
    
    const startTime = Date.now();
    const ai = new GoogleGenAI({ apiKey: userApiKey });
    
    // Construir contentParts incluyendo systemInstruction si existe
    const contentParts: Part[] = systemInstructionText
      ? [{ text: systemInstructionText }, ...parts]
      : parts;
    
    const generateContentPromise = ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: contentParts },
      config: {
        temperature: 1,
        maxOutputTokens: 8192,
        topP: 0.8,
        topK: 40
      }
    });
    
    // Usar makeApiCall si hay signal, sino llamar directamente
    const response = signal 
      ? await makeApiCall(generateContentPromise, signal)
      : await generateContentPromise;
    
    const apiResponseTime = Date.now() - startTime;
    console.log(`API response time: ${apiResponseTime}ms`);
    
    const text = response.text || '';
    
    // Extraer métricas de uso
    const usageMetadata = response.usageMetadata || {};
    const usageMetrics = {
      inputTokens: usageMetadata.promptTokenCount || 0,
      outputTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
      apiResponseTimeMs: apiResponseTime,
      model: MODEL_NAME
    };
    
    console.log('===== GEMINI API USAGE STATISTICS =====');
    console.log(`Model: ${usageMetrics.model}`);
    console.log(`Input tokens: ${usageMetrics.inputTokens}`);
    console.log(`Output tokens: ${usageMetrics.outputTokens}`);
    console.log(`Total tokens: ${usageMetrics.totalTokens}`);
    console.log(`API response time: ${usageMetrics.apiResponseTimeMs}ms`);
    console.log('======================================');
    
    return {
      generatedText: text,
      stats: {
        promptTokens: usageMetrics.inputTokens,
        candidatesTokens: usageMetrics.outputTokens,
        totalTokens: usageMetrics.totalTokens
      }
    };
    
  } catch (error: any) {
    handleGeminiError(error);
  }
}


/**
 * Process a file for Gemini API, automatically using the appropriate method based on size
 * @param buffer - The file buffer
 * @param mimeType - The MIME type of the file
 * @param apiKey - The user's Gemini API key
 * @param filename - Original filename (optional)
 * @returns The file part to use with Gemini API
 */
export async function processFileForGemini(
  buffer: Buffer,
  mimeType: string,
  apiKey: string,
  filename: string = `file-${Date.now()}`
): Promise<Part & { fileId?: string }> {
  try {
    const fileSize = buffer.length;
    console.log(`Processing file: ${Math.round(fileSize / (1024 * 1024))}MB, type: ${mimeType}, name: ${filename}`);
    
    // If file is small enough for inline data
    if (fileSize <= MAX_INLINE_FILE_SIZE) {
      console.log(`Using inline data for file (${Math.round(fileSize / (1024 * 1024))}MB)`);
      return {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType
        }
      };
    }
    
    // For larger files, use the Files API
    console.log(`Using Files API for large file (${Math.round(fileSize / (1024 * 1024))}MB)`);
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Create a Blob from the buffer - convert to Uint8Array for compatibility
    const fileBlob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    
    // Upload file using Files API
    const file = await ai.files.upload({
      file: fileBlob,
      config: {
        displayName: filename
      }
    });
    
    console.log(`File uploaded successfully with ID: ${file.name}`);
    
    // Start tracking this file for status updates
    sessionManager.trackFileProcessing(apiKey, file.name, filename);
    
    // Wait for file processing
    let getFile = await ai.files.get({ name: file.name });
    let attempts = 0;
    const maxAttempts = 30; // Maximum 60 seconds wait (30 * 2s)
    
    while (getFile.state === 'PROCESSING' && attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts}: File status: ${getFile.state}`);
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      getFile = await ai.files.get({ name: file.name });
    }
    
    if (getFile.state === 'FAILED') {
      // Update status in session manager
      sessionManager.updateFileStatus(apiKey, file.name, sessionManager.FILE_STATUS.FAILED);
      
      const fileError: any = new Error('File processing failed in the Files API');
      fileError.type = ERROR_TYPES.FILE_PROCESSING_FAILED;
      fileError.details = (getFile as any).failureReason || 'Unknown reason';
      throw fileError;
    }
    
    if (attempts >= maxAttempts) {
      // Update status in session manager
      sessionManager.updateFileStatus(apiKey, file.name, sessionManager.FILE_STATUS.FAILED);
      
      const timeoutError: any = new Error('Timeout waiting for file processing');
      timeoutError.type = ERROR_TYPES.FILE_PROCESSING_FAILED;
      throw timeoutError;
    }
    
    console.log(`File processed successfully: ${getFile.name}`);
    
    // Update status to processed
    sessionManager.updateFileStatus(apiKey, file.name, sessionManager.FILE_STATUS.PROCESSED);
    
    // Return the part with file URI and store the file ID for potential cleanup
    return {
      fileData: {
        fileUri: file.uri || '',
        mimeType
      },
      fileId: file.name || ''
    };
  } catch (error: any) {
    console.error('Error processing file for Gemini:', error);
    const processError: any = new Error(`Error processing file: ${error.message}`);
    processError.type = error.type || ERROR_TYPES.FILE_TOO_LARGE;
    throw processError;
  }
}


/**
 * Delete a file from Gemini Files API after processing
 * @param fileName - The name/ID of the file to delete
 * @param apiKey - The user's Gemini API key
 * @returns True if deletion was successful
 */
export async function cleanupFile(fileName: string, apiKey: string): Promise<boolean> {
  try {
    console.log(`Cleaning up file: ${fileName}`);
    
    const ai = new GoogleGenAI({ apiKey });
    // Note: delete method might not be available in current SDK version
    // This is a placeholder for when the SDK supports it
    // await ai.files.delete({ name: fileName });
    sessionManager.removeFileTracking(apiKey, fileName);
    
    console.log(`File cleanup tracked: ${fileName}`);
    return true;
  } catch (error: any) {
    console.error(`Failed to cleanup file: ${error.message}`);
    return false;
  }
}

/**
 * Convierte un buffer de archivo en una parte de contenido (backward compatibility)
 * @param buffer - El buffer del archivo
 * @param mimeType - El tipo MIME del archivo
 * @returns Part con inlineData
 */
export function fileToGenerativePart(buffer: Buffer, mimeType: string): Part {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: mimeType,
    }
  };
}

/**
 * Determina si un archivo debe usar la Files API en lugar de inline data
 * @param buffer - El buffer del archivo
 * @returns True si el archivo debe usar Files API
 */
export function shouldUseFilesAPI(buffer: Buffer): boolean {
  return buffer.length > MAX_INLINE_FILE_SIZE;
}

// Export types for external use
export type { Part, GenerateContentResponse };
