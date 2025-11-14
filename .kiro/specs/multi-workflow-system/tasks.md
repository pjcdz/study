# Implementation Plan

- [x] 1. Set up core data structures and types


  - Create TypeScript interfaces for WorkflowState, StageState, and WorkflowSummary
  - Define StageType and StageStatus enums
  - Create types file at `lib/types/workflow.ts`
  - _Requirements: 1.1, 1.3, 2.1_

- [-] 2. Create Zustand workflow store

  - [x] 2.1 Implement store structure with state and actions



    - Create `store/use-workflow-store.ts` with initial state
    - Implement workflow management actions (addWorkflow, addMultipleWorkflows, removeWorkflow)
    - Implement processing control actions (startAll, startWorkflow, pauseProcessing, resumeProcessing)
    - Implement stage management actions (updateStageStatus, updateStageProgress, setStageResult, setStageError, retryStage)
    - Implement selector functions (getWorkflow, getSummary, getNextPendingWorkflow)
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 6.1, 12.1, 12.2_
  
  - [x] 2.2 Add persistence with Zustand middleware


    - Configure persist middleware to save to localStorage
    - Implement partialize to exclude non-serializable data (File objects)
    - Add rehydration logic to handle interrupted workflows
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 2.3 Write unit tests for store
    - Test workflow addition and removal
    - Test stage status updates
    - Test processing control flow
    - Test persistence and rehydration
    - _Requirements: 1.1, 2.1, 3.1, 9.1_

- [ ] 3. Create WorkflowProcessor service
  - [x] 3.1 Implement core processing logic


    - Create `lib/services/workflowProcessor.ts`
    - Implement processWorkflow method for individual workflow processing
    - Implement processStage method for stage-specific processing
    - Implement processNext method for sequential batch processing
    - Add AbortController support for cancellation
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 5.3, 12.1, 12.2_
  

  - [ ] 3.2 Integrate with existing API client
    - Use apiClient.processSummary for content extraction and summary generation
    - Use apiClient.processFlashcards for flashcard generation
    - Handle large file processing with Files API
    - Map API errors to workflow error states
    - _Requirements: 2.1, 4.1, 4.2, 4.3, 6.1, 8.1, 8.2, 8.3_

  
  - [ ] 3.3 Implement retry logic
    - Add retryStage method with exponential backoff
    - Clear error state before retry
    - Preserve results from successful stages
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 3.4 Write unit tests for processor
    - Test workflow processing flow
    - Test error handling and retry logic
    - Test cancellation
    - _Requirements: 2.1, 6.1_


- [ ] 4. Create StageCard component
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
  

  - [ ] 4.3 Add action buttons
    - Implement "Ver Detalles" button for content stage
    - Implement "Ver Resumen" and "Copiar" buttons for summary stage
    - Implement "Ver Flashcards" and "Exportar" buttons for flashcards stage
    - Implement "Reintentar" button for error state
    - Implement "Ver Error" button to show error details
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1_
  
  - [ ] 4.4 Write component tests
    - Test rendering for each status
    - Test button interactions
    - Test callback invocations
    - _Requirements: 2.1, 4.1_


- [ ] 5. Create WorkflowCard component
  - [x] 5.1 Implement base WorkflowCard component

    - Create `components/workflows/workflow-card.tsx`
    - Implement props interface (workflow, onRemove, onStart)
    - Render file name, type, and size
    - Display overall workflow status
    - _Requirements: 1.1, 2.1, 7.1, 7.2, 7.3, 7.4_
  

  - [ ] 5.2 Add workflow control buttons
    - Implement "▶ Iniciar" button for individual workflow start
    - Enable/disable button based on workflow status
    - Implement "🗑 Eliminar" button with confirmation dialog
    - Handle button click events and call appropriate store actions
    - _Requirements: 3.1, 5.1, 5.2, 5.3, 5.4, 5.5_

  
  - [ ] 5.3 Integrate StageCards
    - Render three StageCard components for content, summary, and flashcards
    - Pass appropriate props and callbacks to each StageCard
    - Handle stage-specific actions (view, copy, export, retry)
    - _Requirements: 2.1, 4.1, 4.2, 4.3, 6.1_
  
  - [ ] 5.4 Write component tests
    - Test workflow card rendering
    - Test control button interactions
    - Test stage card integration
    - _Requirements: 1.1, 2.1, 3.1_



- [x] 6. Create ResultModal component

  - Create `components/workflows/result-modal.tsx`
  - Implement modal with title, content area, and action buttons
  - Support markdown rendering using existing MarkdownRenderer component
  - Support TSV rendering as table
  - Add copy and export functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Create WorkflowManager container component
  - [x] 7.1 Implement base WorkflowManager component


    - Create `components/workflows/workflow-manager.tsx`
    - Connect to useWorkflowStore
    - Render header with title and description
    - Implement local state for export dialog
    - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4, 10.1_
  

  - [ ] 7.2 Add global control buttons
    - Implement "Añadir Archivos" dropdown with single/multiple options
    - Implement "Iniciar Todo" button to start all pending workflows
    - Implement "Pausar/Reanudar" button with conditional rendering
    - Handle file selection and add workflows to store
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4, 3.5, 12.1, 12.2, 12.3, 12.4_
  

  - [ ] 7.3 Add workflow summary display
    - Display total, completed, processing, error, and pending counts
    - Update counts reactively based on store state
    - Style with appropriate colors for each status
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  

  - [ ] 7.4 Render workflow list
    - Map workflows from store to WorkflowCard components
    - Pass appropriate callbacks for remove and start actions
    - Handle empty state with helpful message
    - _Requirements: 1.1, 2.1, 3.1, 5.1_
  
  - [ ] 7.5 Write component tests
    - Test rendering with different workflow states
    - Test global control interactions
    - Test workflow list rendering
    - _Requirements: 1.1, 3.1, 7.1_



- [ ] 8. Create workflows page and routing
  - [x] 8.1 Create workflows page component

    - Create `app/[locale]/workflows/page.tsx`
    - Import and render WorkflowManager component
    - Add page metadata and SEO tags
    - Implement client-side rendering with "use client" directive
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [x] 8.2 Add navigation menu item

    - Update navigation component to include "Workflows" link
    - Add appropriate icon (e.g., layers or workflow icon)
    - Ensure link works for both locales (es, en)
    - _Requirements: 1.1_
  
  - [x] 8.3 Add internationalization keys



    - Add Spanish translations to `messages/es/common.json`
    - Add English translations to `messages/en/common.json`
    - Include all workflow-related strings (titles, buttons, messages, statuses)
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 11.1, 11.2_

- [ ] 9. Implement export functionality
  - [ ] 9.1 Add export actions to store
    - Implement exportWorkflow method for single workflow export
    - Implement exportMultiple method for batch export
    - Support JSON, Markdown, and CSV formats
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 9.2 Create export dialog component
    - Create `components/workflows/export-dialog.tsx`
    - Allow selection of workflows to export
    - Allow selection of stages to include (summary, flashcards, or both)
    - Allow selection of export format
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 9.3 Implement file download logic
    - Generate consolidated file with selected results
    - Include metadata (filename, date, stage)
    - Trigger browser download
    - _Requirements: 10.3, 10.4, 10.5_

- [ ] 10. Add notification system
  - [ ] 10.1 Integrate with existing toast notifications
    - Use sonner toast for workflow completion notifications
    - Use sonner toast for error notifications
    - Include workflow filename in notifications
    - _Requirements: 11.1, 11.2, 11.5_
  
  - [ ] 10.2 Add browser notifications (optional)
    - Request notification permission on first use
    - Send system notifications for completed workflows
    - Send system notifications for errors
    - Only send if user has granted permission
    - _Requirements: 11.3, 11.4, 11.5_


- [ ] 11. Add animations and polish
  - [ ] 11.1 Add Framer Motion animations
    - Animate workflow card entry (slide in from bottom)
    - Animate workflow card exit (fade out)
    - Animate stage status transitions (fade in/out)
    - Animate progress bar filling
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 11.2 Add loading states and skeletons
    - Show skeleton loaders while workflows are being added
    - Show loading spinner during API calls
    - Add smooth transitions between states
    - _Requirements: 2.1, 2.2_
  
  - [ ] 11.3 Implement responsive design
    - Ensure layout works on mobile, tablet, and desktop
    - Stack stage cards vertically on mobile
    - Adjust button sizes for touch targets
    - Test on different screen sizes
    - _Requirements: 1.1, 2.1, 4.1_

- [ ] 12. Implement error handling and recovery
  - [ ] 12.1 Add error boundaries
    - Create error boundary for WorkflowManager
    - Create error boundary for each WorkflowCard
    - Display user-friendly error messages
    - Provide recovery options
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 12.2 Implement error type mapping
    - Map API errors to user-friendly messages
    - Handle network errors with retry suggestions
    - Handle API key errors with configuration link
    - Handle quota errors with pause suggestion
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 12.3 Add error logging
    - Log errors to console with context
    - Include workflow ID and stage in error logs
    - Track error frequency for monitoring
    - _Requirements: 6.1_

- [ ] 13. Add accessibility features
  - [ ] 13.1 Implement keyboard navigation
    - Ensure all buttons are keyboard accessible
    - Add logical tab order
    - Implement keyboard shortcuts (Space for pause/resume, Delete for remove)
    - _Requirements: 1.1, 3.1, 5.1_
  
  - [ ] 13.2 Add ARIA labels and roles
    - Add aria-label to all interactive elements
    - Add role attributes for semantic structure
    - Add aria-live regions for status updates
    - _Requirements: 2.1, 2.5_
  
  - [ ] 13.3 Ensure screen reader support
    - Test with screen readers (NVDA, JAWS, VoiceOver)
    - Announce workflow status changes
    - Provide descriptive button labels
    - _Requirements: 2.1, 2.5_
  
  - [ ] 13.4 Add focus management
    - Ensure visible focus indicators
    - Trap focus in modals
    - Restore focus after modal close
    - _Requirements: 4.1, 4.4_


- [ ] 14. Optimize performance
  - [ ] 14.1 Implement memoization
    - Memoize WorkflowCard components with React.memo
    - Memoize StageCard components with React.memo
    - Use useMemo for expensive calculations (workflow summary)
    - Use useCallback for event handlers
    - _Requirements: 2.1, 2.5_
  
  - [ ] 14.2 Add debouncing and throttling
    - Debounce progress updates (100ms)
    - Throttle UI updates during processing
    - Prevent excessive re-renders
    - _Requirements: 2.1, 2.5_
  
  - [ ] 14.3 Implement lazy loading
    - Lazy load ResultModal component
    - Lazy load export dialog component
    - Code split workflow page from main bundle
    - _Requirements: 2.1_
  
  - [ ] 14.4 Add virtual scrolling (if needed)
    - Implement virtual scrolling for large workflow lists (>20 items)
    - Render only visible workflows in viewport
    - Test with 50+ workflows
    - _Requirements: 2.1_

- [ ] 15. Add memory management
  - [ ] 15.1 Implement cleanup logic
    - Revoke object URLs when workflows are removed
    - Clean up temporary files from API
    - Clear completed workflows older than 7 days
    - _Requirements: 5.5, 9.5_
  
  - [ ] 15.2 Monitor localStorage usage
    - Track size of persisted data
    - Implement maximum workflow limit (50)
    - Provide option to clear old workflows
    - Show warning when approaching storage limits
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 16. Write integration tests
  - Test complete workflow from file upload to flashcard generation
  - Test error handling and retry flow
  - Test pause and resume functionality
  - Test persistence and rehydration
  - Test individual vs batch processing
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 9.1, 12.1_

- [ ] 17. Write E2E tests
  - Test happy path: upload 3 files, process all, export results
  - Test error recovery: upload file that fails, retry, complete successfully
  - Test pause/resume: start processing, pause midway, resume and complete
  - Test individual processing: upload multiple files, process one individually
  - Test mixed processing: process one individually, then start all
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 12.1_

- [ ] 18. Final integration and testing
  - [ ] 18.1 Integration with existing app
    - Ensure workflows page doesn't break existing functionality
    - Test navigation between workflows and other pages
    - Verify API key handling works correctly
    - Test with demo mode enabled/disabled
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [ ] 18.2 Cross-browser testing
    - Test on Chrome, Firefox, Safari, Edge
    - Verify localStorage works in all browsers
    - Test file upload in all browsers
    - Verify animations work smoothly
    - _Requirements: 1.1, 2.1, 9.1_
  
  - [ ] 18.3 Performance testing
    - Test with 10, 20, 50 workflows
    - Measure memory usage
    - Measure render performance
    - Optimize bottlenecks if found
    - _Requirements: 2.1, 2.5_
  
  - [ ] 18.4 User acceptance testing
    - Test with real users
    - Gather feedback on UX
    - Identify pain points
    - Make adjustments based on feedback
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

