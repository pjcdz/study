/**
 * API client for interacting with the study tool backend
 */
class ApiClient {
  constructor() {
    // Base URL for all API requests
    this.baseUrl = '/api';
  }

  /**
   * Send document text to generate Notion-formatted markdown summary
   * @param {string} filesText - Text content from uploaded files
   * @returns {Promise<Object>} - Response containing notionMarkdown
   */
  async postSummary(filesText) {
    try {
      console.log("ApiClient: Sending summary request...");
      
      // Log the request payload size
      const payloadSizeKB = Math.round(JSON.stringify({ filesText }).length / 1024);
      console.log(`ApiClient: Request payload size: ${payloadSizeKB}KB`);
      
      // Make the actual request
      const response = await fetch(`${this.baseUrl}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filesText })
      });
      
      // Log response status and headers
      console.log(`ApiClient: Response status: ${response.status} ${response.statusText}`);
      
      // Get response as text first for better error handling and logging
      const responseText = await response.text();
      console.log(`ApiClient: Response text length: ${responseText.length} chars`);
      
      // Preview response for debugging (safely truncated)
      if (responseText.length < 1000) {
        console.log(`ApiClient: Full response: ${responseText}`);
      } else {
        console.log(`ApiClient: Response preview: ${responseText.substring(0, 200)}...`);
      }
      
      if (!response.ok) {
        // Try to parse as JSON if possible
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } catch (parseError) {
          // If parsing fails, return the raw text or a generic message
          throw new Error(responseText || `Error generating summary: Server responded with status ${response.status}`);
        }
      }
      
      // Try to parse the successful response
      try {
        const data = JSON.parse(responseText);
        
        // Verify the notionMarkdown field exists
        if (!data.notionMarkdown) {
          console.error('ApiClient: Response is missing notionMarkdown field:', data);
          throw new Error('Server response is missing required data');
        }
        
        console.log(`ApiClient: Successfully received markdown (${data.notionMarkdown.length} chars)`);
        return data;
      } catch (parseError) {
        console.error('ApiClient: Error parsing response:', parseError);
        throw new Error('Received invalid JSON response from server');
      }
    } catch (error) {
      console.error('ApiClient Error in postSummary:', error);
      throw error;
    }
  }
  
  /**
   * Generate flashcards in TSV format from Notion markdown
   * @param {string} notionMarkdown - Notion-formatted markdown content
   * @returns {Promise<Object>} - Response containing flashcardsTSV
   */
  async postFlashcards(notionMarkdown) {
    try {
      console.log("ApiClient: Sending flashcards request...");
      console.log(`ApiClient: Markdown length: ${notionMarkdown ? notionMarkdown.length : 0} chars`);
      
      const response = await fetch(`${this.baseUrl}/flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notionMarkdown })
      });
      
      // Store text for error handling
      const responseText = await response.text();
      console.log(`ApiClient: Flashcards response length: ${responseText.length} chars`);
      
      if (!response.ok) {
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } catch (parseError) {
          // If parsing fails, return the raw text or a generic message
          throw new Error(responseText || `Error generating flashcards: Server responded with status ${response.status}`);
        }
      }
      
      // Try to parse the successful response
      try {
        const data = JSON.parse(responseText);
        
        // Verify the flashcardsTSV field exists
        if (!data.flashcardsTSV) {
          console.error('ApiClient: Response is missing flashcardsTSV field:', data);
          throw new Error('Server response is missing required data');
        }
        
        console.log(`ApiClient: Successfully received flashcards TSV (${typeof data.flashcardsTSV === 'string' ? data.flashcardsTSV.length : 'object'} chars/size)`);
        return data;
      } catch (parseError) {
        console.error('ApiClient: Error parsing response:', parseError);
        throw new Error('Received invalid JSON response from server');
      }
    } catch (error) {
      console.error('ApiClient Error in postFlashcards:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const apiClient = new ApiClient();
export default apiClient;