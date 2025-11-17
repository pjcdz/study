# Implementation Plan

- [x] 1. Enhance Upload Store with streaming support for simple flow


  - Add streaming state fields: `isStreamingSummary`, `isStreamingFlashcards`, `isStreamingCondense`
  - Add streaming text buffers: `streamingSummaryText`, `streamingFlashcardsText`
  - Add `currentCharDelay` field for typewriter effect
  - Add `abortStreamingController` for cancellation support
  - Add `lastUsageMetadata` field for token tracking
  - Implement `setStreamingSummary()`, `setStreamingFlashcards()`, `setStreamingCondense()` actions
  - Implement `updateStreamingSummaryText()` and `updateStreamingFlashcardsText()` actions
  - Implement `completeStreamingSummary()`, `completeStreamingFlashcards()`, `completeStreamingCondense()` actions
  - Implement `cancelStreaming()` action
  - Implement `clearStreamingState()` action
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Add streaming methods to API Client

  - [x] 2.1 Implement core streaming methods


    - Create `processSummaryStream()` method with callbacks (onChunk, onComplete, onError)
    - Create `processFlashcardsStream()` method with callbacks
    - Create `condenseSummaryStream()` method with callbacks
    - Implement `buildPromptFromContent()` helper for content extraction
    - Implement `buildCondensePrompt()` helper for condense prompts
    - Implement `handleStreamingError()` helper for error mapping
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 2.2 Add demo mode simulation for streaming

    - Implement `simulateSummaryStream()` for demo mode
    - Implement `simulateFlashcardsStream()` for demo mode
    - Implement `simulateCondenseStream()` for demo mode
    - Generate realistic chunks from mock data
    - Apply realistic delays between chunks
    - Return mock usage metadata
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 3. Integrate streaming in Summary Page

  - [x] 3.1 Add streaming for flashcards generation


    - Import streaming methods from API Client
    - Replace `handleGenerateFlashcards()` to use `processFlashcardsStream()`
    - Implement onChunk callback to update store with streaming text
    - Implement onComplete callback to save flashcards and navigate
    - Implement onError callback for error handling
    - Show StreamingText component during generation
    - Disable buttons during streaming
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.4_
  
  - [x] 3.2 Add streaming for summary condensation


    - Replace `handleCondenseSummary()` to use `condenseSummaryStream()`
    - Implement onChunk callback to update store with streaming text
    - Implement onComplete callback to add condensed summary
    - Implement onError callback for error handling
    - Replace ScrollArea with StreamingText during condensation
    - Show streaming cursor during generation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3_
  
  - [x] 3.3 Add cancel button and error handling


    - Add cancel button visible during streaming
    - Implement `handleCancelStreaming()` to abort stream
    - Implement `handleStreamingError()` to show appropriate toasts
    - Map ApiErrorType to user-friendly messages
    - Clear streaming state on cancel or error
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 3.4 Update UI to show streaming state


    - Conditionally render StreamingText or ScrollArea based on streaming state
    - Show streaming cursor during generation
    - Display time elapsed during streaming
    - Show usage metrics after completion
    - Update button states based on streaming flags
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 4. Integrate streaming in Upload Page


  - [x] 4.1 Add streaming for initial summary generation


    - Replace `handleSubmit()` to use `processSummaryStream()`
    - Navigate to Summary page immediately after upload
    - Start streaming summary generation
    - Implement onChunk callback to update store
    - Implement onComplete callback to finalize summary
    - Implement onError callback to handle errors and navigate back
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2_
  
  - [x] 4.2 Handle streaming state during navigation

    - Show "Generating..." indicator during streaming
    - Handle page reload during streaming
    - Restore streaming state from localStorage if interrupted
    - Clear streaming state on successful completion
    - _Requirements: 8.3, 8.4, 8.5, 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 5. Add accessibility features for streaming

  - Verify StreamingText component has aria-live="polite"
  - Add aria-label for streaming indicators
  - Add aria-label for cancel button
  - Ensure keyboard navigation works during streaming
  - Test with screen reader to verify announcements
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 4.4_

- [x] 6. Optimize performance for streaming

  - Verify StreamingText component uses React.memo
  - Use useCallback for all streaming event handlers
  - Implement throttling for store updates (max 60fps)
  - Add cleanup for timers and listeners in useEffect
  - Profile performance with React DevTools
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 7. Add internationalization for streaming UI


  - Add streaming-related keys to messages/es/messages.json
  - Add streaming-related keys to messages/en/messages.json
  - Include translations for: "Generating...", "Cancel", error messages
  - Update Summary Page to use translation keys
  - Update Upload Page to use translation keys
  - _Requirements: 7.5, 8.5, 9.3, 10.1, 10.2, 10.3_

- [x] 8. Handle edge cases and persistence

  - Implement retry logic for failed streams
  - Handle stream interruption gracefully
  - Add timeout for streams that take too long
  - Persist partial streaming text to localStorage
  - Restore streaming state on page reload
  - Clear streaming state from localStorage on completion
  - _Requirements: 10.4, 10.5, 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 9. Add monitoring and logging

  - Log streaming start events with timestamp
  - Log streaming complete events with duration
  - Log streaming errors with detailed context
  - Track usage metadata (tokens) in console
  - Add performance metrics logging (time to first chunk, total duration)
  - _Requirements: 11.4, 11.5_
