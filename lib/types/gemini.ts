// Gemini Service Types
import type { Part, GenerateContentResponse } from '@google/genai';

// Re-export native types
export type { Part, GenerateContentResponse };

// Custom types that extend native functionality
export interface FileProcessingResult {
  fileId?: string;
  part: Part;
}

export interface GeminiResponse {
  generatedText: string;
  stats: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    promptTokens?: number;
    candidatesTokens?: number;
  };
}

export interface FileStatus {
  status: 'processing' | 'ready' | 'error' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  progress?: number;
  error?: string;
  filename?: string;
  uploadTime?: number;
}
