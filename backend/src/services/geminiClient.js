import fetch from 'node-fetch';

// Update to use the correct model name according to Google's documentation
const MODEL_NAME = 'gemini-1.5-pro-latest';
const API_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent`;

// Error types - used for better frontend handling
export const ERROR_TYPES = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_API_KEY: 'INVALID_API_KEY',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

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
    }    console.log('Sending request to Gemini API...');
    console.log(`Using API key: ${userApiKey.substring(0, 3)}...${userApiKey.substring(userApiKey.length - 3)}`); // Log partial key for debugging
    console.log(`Using model: ${MODEL_NAME}`);
    
    const startTime = Date.now();
    
    // Create contents structure for Gemini API - multimodal support
    const contents = [{ 
      role: 'user', 
      parts: parts 
    }];
    
    // Create request body
    const body = {
      contents: contents,
      generationConfig: {
        temperature: 0.3,        // Lower temperature for more focused output
        maxOutputTokens: 16384,  // Large token limit to allow detailed responses
        topP: 0.8,               // Sample from top 80% probability mass
        topK: 40                 // Sample from top 40 tokens
      }
    };
    
    // Add system instruction if provided
    if (systemInstructionText) {
      body.systemInstruction = { text: systemInstructionText };
    }
    
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