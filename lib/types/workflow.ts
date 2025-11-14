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
}

// Overall workflow status
export type WorkflowStatus = 'pending' | 'processing' | 'completed' | 'error' | 'paused';

// Complete workflow state
export interface WorkflowState {
  id: string;                    // Unique UUID
  fileName: string;              // Original file name
  fileType: string;              // MIME type
  fileSize: number;              // Size in bytes
  file: File;                    // Original File object
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
