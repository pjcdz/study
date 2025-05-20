import axios from 'axios';

/**
 * Gemini PDF processing client
 * Dedicated service for PDF document processing using Gemini API
 */
class GeminiPdfClient {
  constructor() {
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1';
  }

  async processPdf(pdfBuffer, apiKey, options = {}) {
    try {
      // Convert buffer to base64
      const base64Data = pdfBuffer.toString('base64');
      
      // Create prompt for PDF processing
      const prompt = options.prompt || 
        "Extract and structure all text content from this document. Preserve formatting and organization. Format as markdown.";
      
      console.log('Processing PDF with Gemini API, prompt:', prompt.substring(0, 50) + '...');
      
      // Call Gemini API with PDF data
      const response = await axios.post(
        `${this.baseUrl}/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
        {
          contents: [
            { 
              parts: [
                { text: prompt },
                { 
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000
          }
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // Extract text from response
      const content = response.data.candidates?.[0]?.content;
      const extractedText = content?.parts?.[0]?.text || '';
      
      console.log('Successfully processed PDF, extracted text length:', extractedText.length);
      
      return {
        success: true,
        extractedContent: extractedText
      };
    } catch (error) {
      console.error('Error processing PDF with Gemini:', error.response?.data || error.message);
      
      // Check for specific error types
      const errorData = error.response?.data;
      if (errorData && errorData.error) {
        const { code, message } = errorData.error;
        if (code === 401 || message?.includes('API key')) {
          throw new Error('Invalid API key provided');
        } else if (code === 429 || message?.includes('quota') || message?.includes('rate limit')) {
          throw new Error('API quota exceeded. Please try again later.');
        }
      }
      
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }
}

// Export as ES module
export default new GeminiPdfClient();