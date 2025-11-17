# Implementation Plan

- [x] 1. Create StreamingText component with adaptive typewriter effect


  - Create `components/streaming/streaming-text.tsx` component
  - Implement requestAnimationFrame-based animation loop
  - Add adaptive char delay calculation based on stream speed
  - Implement text reset logic when new text doesn't match current
  - Add streaming cursor indicator
  - Include aria-live regions for accessibility
  - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3, 4.4, 4.5, 10.1, 10.2, 10.3_

- [x] 2. Create streaming service for Gemini API integration

  - [x] 2.1 Implement core streaming service


    - Create `lib/services/streamingSummaryService.ts`
    - Implement GoogleGenAI chat session initialization
    - Create `generateSummaryStream()` method with streaming support
    - Create `generateFlashcardsStream()` method with streaming support
    - Implement adaptive char delay calculation with exponential smoothing
    - Add usage metadata extraction from stream chunks
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.2, 4.3, 6.1, 6.2_
  
  - [x] 2.2 Add error handling and cancellation

    - Implement AbortController for stream cancellation
    - Add error mapping for common API errors (network, auth, quota)
    - Implement cancellation detection in stream loop
    - Add cleanup logic for aborted streams
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3. Update Zustand store with streaming support


  - Add `isStreaming`, `streamingText`, and `charDelay` fields to StageState interface
  - Implement `setStageStreaming()` action
  - Implement `updateStageStreamingText()` action
  - Implement `cancelStageStreaming()` action
  - Update persistence logic to handle streaming state
  - _Requirements: 1.3, 2.3, 3.4, 3.5, 6.5_

- [x] 4. Enhance WorkflowProcessor with streaming methods

  - [x] 4.1 Add streaming processing methods


    - Create `processStageWithStreaming()` method
    - Implement `processSummaryWithStreaming()` private method
    - Implement `processFlashcardsWithStreaming()` private method
    - Add streaming callbacks (onChunk, onComplete, onError)
    - Integrate with store actions for state updates
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2_
  
  - [x] 4.2 Add cancellation support


    - Implement `cancelStageStreaming()` method
    - Connect to streamingSummaryService.cancel()
    - Handle cleanup after cancellation
    - Update stage status appropriately
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 5. Update StageCard component to display streaming content


  - Import and use StreamingText component
  - Add conditional rendering for streaming vs completed state
  - Display streaming text with typewriter effect
  - Add cancel button during streaming
  - Show usage metrics after completion
  - Update progress indicators for streaming state
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 6.1, 6.2, 6.3, 7.1_

- [x] 6. Add streaming support to simple workflow (upload pages)

  - [x] 6.1 Update summary page

    - Modify `app/[locale]/summary/page.tsx` to use streaming
    - Replace static result display with StreamingText component
    - Add cancel button during generation
    - Display usage metrics after completion
    - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.3, 7.1_
  
  - [x] 6.2 Update flashcards page

    - Modify `app/[locale]/flashcards/page.tsx` to use streaming
    - Replace static result display with StreamingText component
    - Add cancel button during generation
    - Display usage metrics after completion
    - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2, 6.3, 7.1_

- [x] 7. Implement demo mode support for streaming

  - Create mock streaming data generator
  - Simulate realistic chunk delays in demo mode
  - Generate artificial chunks from mock data
  - Display same UI and metrics in demo mode
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 8. Add accessibility features

  - Add aria-live="polite" to streaming text containers
  - Implement aria-label for streaming indicators
  - Add keyboard support for cancel button (Escape key)
  - Announce streaming start/complete to screen readers
  - Test with screen reader software
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 9. Optimize performance

  - Memoize StreamingText component with React.memo
  - Use useCallback for all event handlers
  - Implement throttling for store updates (max 60fps)
  - Add cleanup for animation frames and timers
  - Profile performance with React DevTools
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Add internationalization for streaming UI

  - Add streaming-related translation keys to messages/es/messages.json
  - Add streaming-related translation keys to messages/en/messages.json
  - Include strings for: streaming status, cancel button, error messages
  - Update all streaming components to use translations
  - _Requirements: 1.1, 2.1, 5.1, 5.2, 5.3, 7.1_

- [x] 11. Handle edge cases and error scenarios

  - Implement retry logic with exponential backoff
  - Handle stream interruption gracefully
  - Add timeout for streams that take too long
  - Handle page reload during streaming
  - Test with poor network conditions
  - _Requirements: 3.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 12. Add monitoring and logging


  - Log streaming start/complete events
  - Track streaming duration metrics
  - Monitor cancellation rate
  - Log errors with detailed context
  - Add performance metrics logging
  - _Requirements: 5.5, 6.3, 6.4_
