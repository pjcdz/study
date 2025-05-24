// Session manager for tracking user-specific resources
// This module tracks file processing status across sessions

// Map to store processing files by user (API key)
// Structure: { apiKey: { fileId: { status, filename, uploadTime } } }
const processingFiles = new Map();

// Constants
const FILE_STATUS = {
  PROCESSING: 'PROCESSING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
};

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
   * @param {string} apiKey - User's API key
   * @param {string} fileId - ID of the file in Gemini's system
   * @param {string} filename - Original filename
   * @returns {void}
   */
  trackFileProcessing: (apiKey, fileId, filename) => {
    if (!processingFiles.has(apiKey)) {
      processingFiles.set(apiKey, {});
    }
    
    processingFiles.get(apiKey)[fileId] = {
      status: FILE_STATUS.PROCESSING,
      filename,
      uploadTime: Date.now()
    };
    
    console.log(`Tracking file processing: ${filename} (${fileId})`);
  },

  /**
   * Add file tracking (alias for trackFileProcessing for backward compatibility)
   * @param {string} apiKey - User's API key
   * @param {string} fileId - ID of the file in Gemini's system
   * @param {string} filename - Original filename (optional)
   * @returns {void}
   */
  addFileTracking: (apiKey, fileId, filename = fileId) => {
    sessionManager.trackFileProcessing(apiKey, fileId, filename);
  },
  
  /**
   * Update the status of a processed file
   * @param {string} apiKey - User's API key
   * @param {string} fileId - ID of the file in Gemini's system
   * @param {string} status - New status (use FILE_STATUS constants)
   * @returns {void}
   */
  updateFileStatus: (apiKey, fileId, status) => {
    if (!processingFiles.has(apiKey) || !processingFiles.get(apiKey)[fileId]) {
      return;
    }
    
    processingFiles.get(apiKey)[fileId].status = status;
    console.log(`Updated file status: ${fileId} -> ${status}`);
  },
  
  /**
   * Get the status of all files for a user
   * @param {string} apiKey - User's API key
   * @returns {Object} - Map of fileId to status information
   */
  getFileStatus: (apiKey) => {
    if (!processingFiles.has(apiKey)) {
      return {};
    }
    
    const userFiles = processingFiles.get(apiKey);
    const result = {};
    
    for (const [fileId, fileData] of Object.entries(userFiles)) {
      result[fileData.filename] = fileData.status;
    }
    
    return result;
  },
  
  /**
   * Remove a file from tracking (e.g., after cleanup)
   * @param {string} apiKey - User's API key
   * @param {string} fileId - ID of the file in Gemini's system
   * @returns {void}
   */
  removeFileTracking: (apiKey, fileId) => {
    if (!processingFiles.has(apiKey) || !processingFiles.get(apiKey)[fileId]) {
      return;
    }
    
    const filename = processingFiles.get(apiKey)[fileId].filename;
    delete processingFiles.get(apiKey)[fileId];
    console.log(`Removed file tracking for ${filename} (${fileId})`);
    
    // If no more files for this API key, remove the entry
    if (Object.keys(processingFiles.get(apiKey)).length === 0) {
      processingFiles.delete(apiKey);
    }
  },
  
  // Constants export
  FILE_STATUS
};

export default sessionManager;