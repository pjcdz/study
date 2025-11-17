# Implementation Plan

- [x] 1. Set up core data structures and types
  - Create TypeScript interfaces for WorkflowState, StageState, and WorkflowSummary
  - Define StageType and StageStatus enums
  - Create types file at `lib/types/workflow.ts`
  - _Requirements: 1.1, 1.3, 2.1_

- [x] 2. Create Zustand workflow store
  - [x] 2.1 Implement store structure with state and actions
    - Create `store/use-workflow-store.ts` with initial state
    - Implement workflow management actions (addWorkflow, addMultipleWorkflows, removeWorkflow)
    - Implement processing control actions (startAll, startWorkflow, pauseProcessing, resumeProcessing)
    - Implement stage management actions (updateStageStatus, updateStageProgress, setStageResult, setStageError)
    - Implement selector functions (getWorkflow, getSummary, getNextPendingWorkflow)
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 6.1, 12.1, 12.2_
  
  - [x] 2.2 Add persistence with Zustand middleware
    - Configure persist middleware to save to localStorage
    - Implement partialize to exclude non-serializable data (File objects)
    - Add rehydration logic to handle interrupted workflows
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 3. Create WorkflowProcessor service
  - [x] 3.1 Implement core processing logic
    - Create `lib/services/workflowProcessor.ts`
    - Implement processWorkflow method for individual workflow processing
    - Implement processStage method for stage-specific processing
    - Implement processNext method for sequential batch processing
    - Add AbortController support for cancellation
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 5.3, 12.1, 12.2_
  
  - [x] 3.2 Integrate with existing API client
    - Use apiClient.processSummary for content extraction and summary generation
    - Use apiClient.processFlashcards for flashcard generation
    - Handle large file processing with Files API
    - Map API errors to workflow error states
    - _Requirements: 2.1, 4.1, 4.2, 4.3, 6.1, 8.1, 8.2, 8.3_

- [x] 4. Create StageCard component
  - [x] 4.1 Implement base StageCard component
    - Create `components/workflows/stage-card.tsx`
    - Implement props interface (stage, stageType, stageNumber, workflowId, callbacks)
    - Render stage number badge and title
    - Add conditional styling based on stage status
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 4.2 Add status-specific UI elements
    - Implement pending state (gray, clock icon, disabled buttons)
    - Implement processing state (blue border, spinner, progress bar)
    - Implement completed state (green border, check icon, enabled buttons)
    - Implement error state (red border, error icon, retry button)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1_

- [x] 5. Create WorkflowCard component
  - [x] 5.1 Implement base WorkflowCard component
    - Create `components/workflows/workflow-card.tsx`
    - Implement props interface (workflow, onRemove, onStart)
    - Render file name, type, and size
    - Display overall workflow status
    - _Requirements: 1.1, 2.1, 7.1, 7.2, 7.3, 7.4_

- [x] 6. Create ResultModal component
  - Create `components/workflows/result-modal.tsx`
  - Implement modal with title, content area, and action buttons
  - Support markdown rendering using existing MarkdownRenderer component
  - Support TSV rendering as table
  - Add copy and export functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Create WorkflowManager container component
  - [x] 7.1 Implement base WorkflowManager component
    - Create `components/workflows/workflow-manager.tsx`
    - Connect to useWorkflowStore
    - Render header with title and description
    - Implement local state for modals
    - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4, 10.1_

- [x] 8. Create workflows page and routing
  - [x] 8.1 Create workflows page component
    - Create `app/[locale]/workflows/page.tsx`
    - Import and render WorkflowManager component
    - Implement client-side rendering with "use client" directive
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [x] 8.2 Add navigation menu item
    - Update navigation component to include "Workflows" link
    - Add appropriate icon (Layers icon)
    - Ensure link works for both locales (es, en)
    - _Requirements: 1.1_

- [x] 9. Add internationalization for workflows


  - Add Spanish translations to `messages/es/messages.json`
  - Add English translations to `messages/en/messages.json`
  - Include all workflow-related strings (titles, buttons, messages, statuses)
  - Update WorkflowManager, WorkflowCard, StageCard, and ResultModal to use translations
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 11.1, 11.2_

- [x] 10. Enhance UI/UX and polish

  - [x] 10.1 Improve visual design


    - Add consistent spacing and padding
    - Improve color scheme for better contrast
    - Add hover effects and transitions
    - Ensure responsive design works on all screen sizes
    - _Requirements: 1.1, 2.1, 4.1_
  
  - [x] 10.2 Add animations


    - Animate workflow card entry and exit
    - Animate stage status transitions
    - Add smooth progress bar animations
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 10.3 Improve empty states

    - Add helpful empty state with instructions
    - Add visual illustration or icon
    - Provide clear call-to-action
    - _Requirements: 1.1, 7.1_

- [x] 11. Add export functionality

  - Implement export actions in store (already exists)
  - Add export buttons to WorkflowManager
  - Support exporting individual workflows
  - Support batch export of multiple workflows
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12. Improve error handling


  - Add retry logic with exponential backoff
  - Improve error messages to be more user-friendly
  - Add error recovery suggestions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 13. Add accessibility features


  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works properly
  - Add focus indicators
  - Test with screen readers
  - _Requirements: 2.1, 2.5_

- [x] 14. Performance optimization


  - Memoize components with React.memo
  - Use useCallback for event handlers
  - Implement virtual scrolling for large lists
  - _Requirements: 2.1, 2.5_

- [x] 15. Final integration and testing



  - Test complete workflow from file upload to flashcard generation
  - Test error handling and recovery
  - Test with multiple files simultaneously
  - Verify persistence works correctly
  - Test on different browsers and devices
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 9.1, 12.1_
