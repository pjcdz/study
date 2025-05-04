import { callGemini } from '../services/geminiClient.js';
import { prompts } from '../config/prompts.js';

export const flashcardsController = {
  /**
   * Generate flashcards in Quizlet-compatible TSV format from Notion markdown
   * @param {object} req - Request object with notionMarkdown in body
   * @param {object} res - Response object
   */
  getFlashcards: async (req, res) => {
    try {
      // Extract the Notion markdown from the request body
      const { notionMarkdown } = req.body;
      
      if (!notionMarkdown) {
        return res.status(400).json({ error: 'No markdown content provided' });
      }
      
      const contentSizeKB = Math.round(notionMarkdown.length / 1024);
      console.log(`Processing markdown content (size: ${contentSizeKB}KB) for flashcard generation`);
      
      // Combine the flashcard prompt with the Notion markdown
      const prompt = `${prompts.flashcardPrompt}${notionMarkdown}`;
      
      try {
        // Call Gemini API to convert markdown to flashcards
        console.log('Calling Gemini API for flashcard generation...');
        const flashcardsTSV = await callGemini(prompt);
        console.log('Successfully received flashcards from Gemini API');
        
        // Return the generated TSV data for Quizlet
        return res.json({ flashcardsTSV });
      } catch (geminiError) {
        console.error('Gemini API error during flashcard generation:', geminiError);
        
        // Return a detailed error message
        return res.status(500).json({ 
          error: `Error generating flashcards: ${geminiError.message}`,
          contentSizeKB: contentSizeKB
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