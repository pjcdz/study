// Session manager for tracking user-specific resources
// This module tracks file processing status across sessions

interface FileData {
  status: string;
  filename: string;
  uploadTime: number;
}

interface UserFiles {
  [fileId: string]: FileData;
}

// Map to store processing files by user (API key)
// Structure: { apiKey: { fileId: { status, filename, uploadTime } } }
const processingFiles = new Map<string, UserFiles>();

// Constants
export const FILE_STATUS = {
  PROCESSING: 'PROCESSING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
} as const;

// File expiration time (clear after 10 minutes)
const FILE_EXPIRATION_MS = 10 * 60 * 1000;

// Periodically clean up old file entries (every 2 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [apiKey, files] of processingFiles.entries()) {
    for (const [fileId, fileData] of Object.entries(files)) {
      if (now - fileData.uploadTime > FILE_EXPIRATION_MS) {
        delete files[fileId];
        console.log(`Removed expired file tracking for ${fileId}`);
      }
    }
    
    // If no more files for this API key, remove the entry
    if (Object.keys(files).length === 0) {
      processingFiles.delete(apiKey);
    }
  }
}, 2 * 60 * 1000);

const sessionManager = {
  /**
   * Track a new file being processed
   * @param apiKey - User's API key
   * @param fileId - ID of the file in Gemini's system
   * @param filename - Original filename
   * @returns void
   */
  trackFileProcessing: (apiKey: string, fileId: string, filename: string): void => {
    if (!processingFiles.has(apiKey)) {
      processingFiles.set(apiKey, {});
    }
    
    const userFiles = processingFiles.get(apiKey)!;
    userFiles[fileId] = {
      status: FILE_STATUS.PROCESSING,
      filename,
      uploadTime: Date.now()
    };
    
    console.log(`Tracking file processing: ${filename} (${fileId})`);
  },

  /**
   * Add file tracking (alias for trackFileProcessing for backward compatibility)
   * @param apiKey - User's API key
   * @param fileId - ID of the file in Gemini's system
   * @param filename - Original filename (optional)
   * @returns void
   */
  addFileTracking: (apiKey: string, fileId: string, filename: string = fileId): void => {
    sessionManager.trackFileProcessing(apiKey, fileId, filename);
  },
  
  /**
   * Update the status of a processed file
   * @param apiKey - User's API key
   * @param fileId - ID of the file in Gemini's system
   * @param status - New status (use FILE_STATUS constants)
   * @returns void
   */
  updateFileStatus: (apiKey: string, fileId: string, status: string): void => {
    if (!processingFiles.has(apiKey)) {
      return;
    }
    
    const userFiles = processingFiles.get(apiKey)!;
    if (!userFiles[fileId]) {
      return;
    }
    
    userFiles[fileId].status = status;
    console.log(`Updated file status: ${fileId} -> ${status}`);
  },
  
  /**
   * Get the status of all files for a user
   * @param apiKey - User's API key
   * @returns Map of fileId to status information
   */
  getFileStatus: (apiKey: string): Record<string, string> => {
    if (!processingFiles.has(apiKey)) {
      return {};
    }
    
    const userFiles = processingFiles.get(apiKey)!;
    const result: Record<string, string> = {};
    
    for (const [fileId, fileData] of Object.entries(userFiles)) {
      result[fileData.filename] = fileData.status;
    }
    
    return result;
  },
  
  /**
   * Remove a file from tracking (e.g., after cleanup)
   * @param apiKey - User's API key
   * @param fileId - ID of the file in Gemini's system
   * @returns void
   */
  removeFileTracking: (apiKey: string, fileId: string): void => {
    if (!processingFiles.has(apiKey)) {
      return;
    }
    
    const userFiles = processingFiles.get(apiKey)!;
    if (!userFiles[fileId]) {
      return;
    }
    
    const filename = userFiles[fileId].filename;
    delete userFiles[fileId];
    console.log(`Removed file tracking for ${filename} (${fileId})`);
    
    // If no more files for this API key, remove the entry
    if (Object.keys(userFiles).length === 0) {
      processingFiles.delete(apiKey);
    }
  },
  
  // Constants export
  FILE_STATUS
};

export default sessionManager;
