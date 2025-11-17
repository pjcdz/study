// Workflow System Types

import type { GenerationStats } from './api';

// Stage types
export type StageType = 'content' | 'summary' | 'flashcards';
export type StageStatus = 'pending' | 'processing' | 'completed' | 'error';

// Stage state for each processing stage
export interface StageState {
  status: StageStatus;
  progress?: number;             // 0-100 for stages with progress tracking
  result?: string;               // Generated content (markdown, TSV, etc.)
  error?: string;                // Error message if stage fails
  startedAt?: number;            // Timestamp when stage started
  completedAt?: number;          // Timestamp when stage completed
  stats?: GenerationStats;       // API usage statistics
  // Streaming fields
  isStreaming?: boolean;         // Whether content is currently streaming
  streamingText?: string;        // Text being streamed in real-time
  charDelay?: number;            // Adaptive delay between characters for typewriter effect
}

// Overall workflow status
export type WorkflowStatus = 'pending' | 'processing' | 'completed' | 'error' | 'paused';

// File info for multiple files in a workflow
export interface FileInfo {
  id: string;                    // Unique file ID
  name: string;                  // File name
  type: string;                  // MIME type
  size: number;                  // Size in bytes
  file: File;                    // Original File object
}

// Complete workflow state
export interface WorkflowState {
  id: string;                    // Unique UUID
  fileName: string;              // Workflow name (first file name or custom)
  files: FileInfo[];             // Array of files in this workflow
  createdAt: number;             // Creation timestamp
  stages: {
    content: StageState;
    summary: StageState;
    flashcards: StageState;
  };
  overallStatus: WorkflowStatus;
}

// Summary of all workflows
export interface WorkflowSummary {
  total: number;
  completed: number;
  processing: number;
  error: number;
  pending: number;
}

// Export options
export interface ExportOptions {
  workflowIds: string[];
  stages: StageType[];
  format: 'json' | 'markdown' | 'csv';
}

// Export result
export interface ExportResult {
  filename: string;
  content: string;
  mimeType: string;
}
