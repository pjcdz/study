// Translations for the Study Assist app
const translations = {
  en: {
    // General
    appName: "Study Assist",
    appDescription: "Turn your notes into effective study materials",
    startOver: "Start Over",
    step: "Step",
    of: "of",
    or: "or",
    remove: "Remove",
    note: "Note",
    
    // Accessibility
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    language: "Language",
    accessibility: "Accessibility",
    accessibilityOptions: 'Accessibility Options',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    switchToDark: 'Switch to dark mode',
    switchToLight: 'Switch to light mode',
    switchToEnglish: 'Switch to English',
    switchToSpanish: 'Switch to Spanish',

    // Navigation
    upload: "Upload",
    summary: "Summary",
    flashcards: "Flashcards",
    
    // Upload Pane
    uploadTitle: "Start Your Study Session",
    uploadInstructions: "Upload documents or paste content to generate summaries and flashcards",
    uploadDragDrop: "Drag and drop files here, or click to select files",
    uploadButtonText: "Browse Files",
    uploadMaxFileSize: "Max file size: 10MB",
    uploadSupportedFormats: "Supported formats: PDF, TXT",
    textPlaceholder: "Paste your document or notes here...",
    generateSummary: "Generate Summary",
    dropFilesHere: "Drag & drop files here",
    uploadedFiles: "Uploaded Files",
    additionalContext: "Additional Context (Optional)",
    pasteContent: "Paste Content",
    additionalContextPlaceholder: "Add any additional context or specific instructions...",
    textInputHelp: "Enter the content you want to summarize and convert to flashcards",
    textInputHelpWithFiles: "This text will be considered alongside your files",

    // Markdown Pane
    generatedSummary: "Generated Summary",
    edit: "Edit",
    editSummary: "Edit summary",
    saveChanges: "Save changes",
    save: "Save",
    copySummary: "Copy Summary",
    copySummaryTooltip: "Copy summary to clipboard",
    generateFlashcards: "Generate Flashcards",
    generateFlashcardsFromSummary: "Generate flashcards from summary",
    createFlashcards: 'Create Flashcards',
    summaryGenerated: 'Summary Generated',
    summaryCopied: "Summary copied to clipboard",
    flashcardsCreated: 'Flashcards Created',
    noFilesUploaded: 'No files have been uploaded',
    processingFile: 'Processing files',
    noMarkdownContent: "No markdown content available",
    errorGeneratingFlashcards: "Error generating flashcards",
    failedToCopy: "Failed to copy to clipboard",
    editSummaryMarkdown: "Edit summary markdown",
    
    // Flashcard Pane
    generatedFlashcards: "Generated Flashcards",
    copyFlashcards: "Copy Flashcards",
    copyFlashcardsTooltip: "Copy flashcards to clipboard",
    flashcardsCopied: "Flashcards TSV copied to clipboard",
    openInQuizlet: "Open in Quizlet",
    openQuizlet: "Open in Quizlet",
    flashcardsContent: "Flashcards Content (Tab-Separated Values)",
    flashcardsContentForExport: "Flashcards content for export",
    readyToImport: "Ready to import into Quizlet or other flashcard applications",
    
    // Import Instructions
    importQuizlet: "How to Import into Quizlet:",
    importStep1: "Click the \"Copy Flashcards\" button above to copy the content",
    importStep2: "Click \"Open in Quizlet\" to go to Quizlet's create page",
    importStep3: "Click on \"Import from Word, Excel, Google Docs, etc.\"",
    importStep4: "Paste the copied content and select \"Tab\" as the delimiter",
    importStep5: "Click \"Import\" to create your flashcard set",
    importNote: "Note: Each line contains a question and answer separated by a tab character.",
    
    // Messages
    noSummaryYet: "No summary content available yet.",
    noFlashcardsYet: "No flashcards available yet.",
    goToUpload: "Go to Upload to generate a summary",
    goToSummary: "Go to Summary to generate flashcards",
    processing: "Processing...",
    apiError: "API connection error:",
    errorOccurred: 'An error occurred',
    tryAgain: 'Please try again',
    fileTypeNotSupported: 'File type not supported',
    
    // Other
    settings: 'Settings',
    help: 'Help',
    feedback: 'Feedback',
  },
  
  es: {
    // General
    appName: "Asistente de Estudio",
    appDescription: "Convierte tus notas en materiales de estudio efectivos",
    startOver: "Comenzar de nuevo",
    step: "Paso",
    of: "de",
    or: "o",
    remove: "Eliminar",
    note: "Nota",
    
    // Accessibility
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    language: "Idioma",
    accessibility: "Accesibilidad",
    accessibilityOptions: 'Opciones de accesibilidad',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    switchToDark: 'Cambiar a modo oscuro',
    switchToLight: 'Cambiar a modo claro',
    switchToEnglish: 'Cambiar a inglés',
    switchToSpanish: 'Cambiar a español',
    
    // Navigation
    upload: "Subir",
    summary: "Resumen",
    flashcards: "Tarjetas",
    
    // Upload Pane
    uploadTitle: "Inicia tu sesión de estudio",
    uploadInstructions: "Sube documentos o pega texto para generar resúmenes y tarjetas de estudio",
    uploadDragDrop: "Arrastra y suelta archivos aquí, o haz clic para seleccionar archivos",
    uploadButtonText: "Seleccionar archivos",
    uploadMaxFileSize: "Tamaño máximo: 10MB",
    uploadSupportedFormats: "Formatos soportados: PDF, TXT",
    textPlaceholder: "Pega tu documento o notas aquí...",
    generateSummary: "Generar resumen",
    dropFilesHere: "Arrastra y suelta archivos aquí",
    uploadedFiles: "Archivos subidos",
    additionalContext: "Contexto adicional (Opcional)",
    pasteContent: "Pegar contenido",
    additionalContextPlaceholder: "Agrega cualquier contexto adicional o instrucciones específicas...",
    textInputHelp: "Ingresa el contenido que deseas resumir y convertir en tarjetas",
    textInputHelpWithFiles: "Este texto se considerará junto con tus archivos",

    // Markdown Pane
    generatedSummary: "Resumen generado",
    edit: "Editar",
    editSummary: "Editar resumen",
    saveChanges: "Guardar cambios",
    save: "Guardar",
    copySummary: "Copiar resumen",
    copySummaryTooltip: "Copiar resumen al portapapeles",
    generateFlashcards: "Generar tarjetas",
    generateFlashcardsFromSummary: "Generar tarjetas desde el resumen",
    createFlashcards: 'Crear tarjetas de estudio',
    summaryGenerated: 'Resumen generado',
    summaryCopied: "Resumen copiado al portapapeles",
    flashcardsCreated: 'Tarjetas de estudio creadas',
    noFilesUploaded: 'No se han subido archivos',
    processingFile: 'Procesando archivos',
    noMarkdownContent: "No hay contenido de markdown disponible",
    errorGeneratingFlashcards: "Error al generar las tarjetas",
    failedToCopy: "Error al copiar al portapapeles",
    editSummaryMarkdown: "Editar markdown del resumen",
    
    // Flashcard Pane
    generatedFlashcards: "Tarjetas generadas",
    copyFlashcards: "Copiar tarjetas",
    copyFlashcardsTooltip: "Copiar tarjetas al portapapeles",
    flashcardsCopied: "TSV de tarjetas copiado al portapapeles",
    openInQuizlet: "Abrir en Quizlet",
    openQuizlet: "Abrir en Quizlet",
    flashcardsContent: "Contenido de tarjetas (valores separados por tabulaciones)",
    flashcardsContentForExport: "Contenido de tarjetas para exportar",
    readyToImport: "Listo para importar a Quizlet u otras aplicaciones de flashcards",
    
    // Import Instructions
    importQuizlet: "Cómo importar a Quizlet:",
    importStep1: "Haz clic en el botón \"Copiar tarjetas\" para copiar el contenido",
    importStep2: "Haz clic en \"Abrir en Quizlet\" para ir a la página de creación de Quizlet",
    importStep3: "Haz clic en \"Importar desde Word, Excel, Google Docs, etc.\"",
    importStep4: "Pega el contenido copiado y selecciona \"Tab\" como delimitador",
    importStep5: "Haz clic en \"Importar\" para crear tu conjunto de tarjetas",
    importNote: "Nota: Cada línea contiene una pregunta y respuesta separadas por un tabulador.",
    
    // Messages
    noSummaryYet: "Aún no hay contenido de resumen disponible.",
    noFlashcardsYet: "Aún no hay tarjetas disponibles.",
    goToUpload: "Ir a Subir para generar un resumen",
    goToSummary: "Ir a Resumen para generar tarjetas",
    processing: "Procesando...",
    apiError: "Error de conexión API:",
    errorOccurred: 'Ha ocurrido un error',
    tryAgain: 'Por favor intenta nuevamente',
    fileTypeNotSupported: 'Tipo de archivo no soportado',
    
    // Other
    settings: 'Configuración',
    help: 'Ayuda',
    feedback: 'Comentarios',
  }
};

export default translations;