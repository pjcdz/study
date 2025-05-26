import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import { summaryController } from './controllers/summaryController.js';
import { flashcardsController } from './controllers/flashcardsController.js';
import { fileController } from './controllers/pdfController.js';

// Load environment variables
dotenv.config();

// Convert ES module paths to directory names
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all network interfaces

// Middlewares
app.use(cors({
  // Allow more origins in development mode for Docker networking to work properly
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://study.cardozo.com.ar', 'https://study.cardozo.com.ar:4000', 'http://study.cardozo.com.ar', 'http://study.cardozo.com.ar:4000'] 
    : true, // Allow any origin in development
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-User-API-Key', 'X-API-Key'] // Added X-API-Key header
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory as Buffer objects
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 20 * 1024 * 1024 // 20MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedMimeTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image.heic',
      'image.heif'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true); // Accept file
    } else {
      cb(new Error(`Tipo de archivo no soportado: ${file.mimetype}`), false); // Reject file
    }
  }
});

// Security middleware with reduced restrictions for development
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for development
    crossOriginEmbedderPolicy: false // Allow embedding in iframes for development
  })
);

// Simple logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  console.log('Health check received');
  res.json({ status: 'ok', message: 'Server is running' });
});

// API Key middleware - validate presence of user API key
const validateApiKey = (req, res, next) => {
  const userApiKey = req.headers['x-user-api-key'];
  if (!userApiKey) {
    return res.status(401).json({ 
      error: "API Key no proporcionada. Por favor, configura tu API Key de Google AI Studio."
    });
  }
  next();
};

// Routes
// Actualizado: soporte para múltiples archivos (any) en lugar de solo uno (single)
app.post('/summary', validateApiKey, upload.any(), summaryController.getSummary);
app.post('/summary/condense', validateApiKey, summaryController.condenseSummary);
app.post('/flashcards', validateApiKey, upload.single('file'), flashcardsController.getFlashcards);
app.get('/files/status', validateApiKey, fileController.getFileStatus);

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
  console.log(`Gemini API Key configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`CORS allowed origins: ${process.env.NODE_ENV === 'production' ? 
    ['https://study.cardozo.com.ar', 'https://study.cardozo.com.ar:4000', 'http://study.cardozo.com.ar', 'http://study.cardozo.com.ar:4000'].join(', ') : 
    'All origins (development mode)'}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});