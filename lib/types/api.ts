// API Request and Response Types

export interface SummaryRequest {
  textPrompt?: string;
  files?: File[];
}

export interface SummaryResponse {
  notionMarkdown: string;
  stats: GenerationStats;
}

export interface CondenseRequest {
  markdownContent: string;
  condensationType: 'shorter' | 'clarity' | 'examples';
}

export interface FlashcardsRequest {
  textPrompt?: string;
  file?: File;
}

export interface FlashcardsResponse {
  flashcards: string;
  stats: GenerationStats;
}

export interface GenerationStats {
  generationTimeMs: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  promptTokens?: number;
  candidatesTokens?: number;
}

export interface ApiError {
  error: string;
  errorType: ErrorType;
  stack?: string;
  details?: string;
}

export type ErrorType = 
  | 'INVALID_API_KEY'
  | 'QUOTA_EXCEEDED'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'FILE_PROCESSING_FAILED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';
