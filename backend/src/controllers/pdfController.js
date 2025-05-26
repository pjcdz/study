import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';
import sessionManager from '../services/sessionManager.js';

// Import the Gemini PDF client
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import('../services/gemini-pdf-client.js').then(module => {
  geminiPdfClient = module.default;
}).catch(err => {
  console.error('Failed to load gemini-pdf-client:', err);
});

let geminiPdfClient;

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * PDF Processing controller
 * Handles processing of PDF files using the Gemini API
 */
const pdfController = {
  /**
   * Process a PDF file using Gemini's document understanding capabilities
   * Receives a PDF file, processes it with Gemini API, and returns structured content
   */
  processPdf: [
    // Use multer middleware to handle file upload
    upload.single('pdfFile'),
    
    // Process the PDF file
    async (req, res) => {
      try {
        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({ 
            success: false, 
            error: 'No PDF file provided' 
          });
        }
        
        // Get API key from headers
        const apiKey = req.headers['x-user-api-key'];
        if (!apiKey) {
          return res.status(401).json({ 
            success: false, 
            error: 'API key is required',
            errorType: 'INVALID_API_KEY'
          });
        }
        
        // Make sure geminiPdfClient is loaded
        if (!geminiPdfClient) {
          try {
            const module = await import('../services/gemini-pdf-client.js');
            geminiPdfClient = module.default;
          } catch (error) {
            console.error('Failed to load gemini-pdf-client on demand:', error);
            return res.status(500).json({
              success: false,
              error: 'PDF processing service unavailable',
              errorType: 'SERVICE_UNAVAILABLE'
            });
          }
        }
        
        console.log(`Processing PDF: ${req.file.originalname}, size: ${req.file.size} bytes`);
        
        // Process the PDF using Gemini
        const result = await geminiPdfClient.processPdf(req.file.buffer, apiKey, {
          prompt: "Extract and structure all text content from this document. Maintain the original formatting, headings, paragraphs, and bullet points. Format the output as markdown."
        });
        
        // Return the extracted content
        res.json({
          success: true,
          extractedContent: result.extractedContent,
          name: req.file.originalname
        });
        
      } catch (error) {
        console.error('PDF processing error:', error);
        
        // Determine error type for better frontend handling
        let errorType = 'UNKNOWN_ERROR';
        if (error.message.includes('API key')) {
          errorType = 'INVALID_API_KEY';
        } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
          errorType = 'QUOTA_EXCEEDED';
        }
        
        res.status(500).json({
          success: false,
          error: error.message,
          errorType
        });
      }
    }
  ]
};

export const fileController = {
  /**
   * Get the status of files being processed for a user
   * @param {object} req - Request object
   * @param {object} res - Response object
   */
  getFileStatus: (req, res) => {
    try {
      // Get the user's API key from the request headers
      const userApiKey = req.headers['x-user-api-key'];
      if (!userApiKey) {
        return res.status(401).json({ 
          error: "API Key no proporcionada."
        });
      }
      
      // Get the status of files for this user
      const fileStatus = sessionManager.getFileStatus(userApiKey);
      
      // Return the file status
      return res.json({ fileStatus });
    } catch (error) {
      console.error('Error getting file status:', error);
      return res.status(500).json({
        error: `Error retrieving file status: ${error.message}`
      });
    }
  }
};

export default pdfController;