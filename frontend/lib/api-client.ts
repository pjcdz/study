class ApiClient {
  private baseUrl: string
  
  constructor() {
    const isClient = typeof window !== 'undefined';
    
    if (isClient) {
      // In browser context, the API must be accessed through the same host
      // but on port 4000, which is mapped in docker-compose
      const hostname = window.location.hostname;
      
      // When accessing via browser, we need to use the port that's exposed to the host
      // not the internal Docker network
      this.baseUrl = `http://${hostname}:4000`;
      
      console.log('API Client initialized with baseUrl:', this.baseUrl);
    } else {
      // Server-side context - inside Docker network
      this.baseUrl = 'http://backend:4000';
    }
  }
  
  async postSummary(content: string) {
    try {
      console.log(`Sending POST request to ${this.baseUrl}/summary`);
      
      const response = await fetch(`${this.baseUrl}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Change 'content' to 'filesText' to match backend expectation
        body: JSON.stringify({ filesText: content }),
        mode: 'cors' // Use CORS mode but don't include credentials
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP Error ${response.status}` }));
        throw new Error(errorData.message || `Error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in postSummary:', error);
      throw error;
    }
  }
  
  async postFlashcards(markdown: string) {
    try {
      console.log(`Sending POST request to ${this.baseUrl}/flashcards`);
      
      const response = await fetch(`${this.baseUrl}/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ notionMarkdown: markdown }),
        mode: 'cors' // Use CORS mode but don't include credentials
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP Error ${response.status}` }));
        throw new Error(errorData.message || `Error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in postFlashcards:', error);
      throw error;
    }
  }
}

const apiClient = new ApiClient();
export default apiClient;