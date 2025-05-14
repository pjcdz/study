import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { summaryController } from './controllers/summaryController.js';
import { flashcardsController } from './controllers/flashcardsController.js';

// Load environment variables
dotenv.config();

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
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Simple logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route - fixed to match frontend request path
app.get('/health', (req, res) => {
  console.log('Health check received');
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.post('/summary', summaryController.getSummary);
app.post('/summary/condense', summaryController.condenseExistingSummary);
app.post('/flashcards', flashcardsController.getFlashcards);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
  console.log(`Gemini API Key configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`CORS allowed origins: ${process.env.NODE_ENV === 'production' ? 
    ['https://study.cardozo.com.ar', 'https://study.cardozo.com.ar:4000', 'http://study.cardozo.com.ar', 'http://study.cardozo.com.ar:4000'].join(', ') : 
    'All origins (development mode)'}`);
});