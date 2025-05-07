class ApiClient {
  private baseUrl: string
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  }
  
  async postSummary(content: string) {
    try {
      const response = await fetch(`${this.baseUrl}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error en postSummary:', error)
      throw error
    }
  }
  
  async postFlashcards(markdown: string) {
    try {
      const response = await fetch(`${this.baseUrl}/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ markdown })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error en postFlashcards:', error)
      throw error
    }
  }
}

const apiClient = new ApiClient()
export default apiClient