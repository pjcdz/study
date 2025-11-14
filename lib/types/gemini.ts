// Gemini Service Types

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
  fileData?: {
    mimeType: string;
    fileUri: string;
  };
  type?: 'file';
  data?: Buffer | string;
  mimeType?: string;
}

export interface FileProcessingResult {
  fileId?: string;
  part: GeminiPart;
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
