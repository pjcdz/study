// File Upload Limits and Configuration

export const FILE_LIMITS = {
  MAX_FILE_SIZE: 20 * 1024 * 1024,        // 20MB
  MAX_INLINE_FILE_SIZE: 4 * 1024 * 1024,  // 4MB (inline vs upload)
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
} as const;
