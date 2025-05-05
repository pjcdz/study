import React, { useState, useEffect } from 'react';
import { FiClipboard, FiCheck, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAccessibility } from '../../../shared/components/accessibility/AccessibilityContext';

const FlashcardPane = ({ flashcardsTSV }) => {
  const { t } = useAccessibility(); // Hook para acceder a traducciones
  const [isCopied, setIsCopied] = useState(false);
  const [cleanTSV, setCleanTSV] = useState('');

  // Process TSV to clean up markdown tags
  useEffect(() => {
    if (flashcardsTSV) {
      try {
        // Remove markdown backticks if present
        let cleaned = flashcardsTSV;
        if (cleaned.startsWith('```markdown')) {
          cleaned = cleaned.substring('```markdown'.length);
        }
        if (cleaned.endsWith('```')) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        
        // Trim extra whitespace
        cleaned = cleaned.trim();
        
        setCleanTSV(cleaned);
      } catch (error) {
        console.error('Error processing TSV:', error);
        setCleanTSV(flashcardsTSV);
      }
    }
  }, [flashcardsTSV]);

  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    if (cleanTSV) {
      navigator.clipboard.writeText(cleanTSV)
        .then(() => {
          setIsCopied(true);
          toast.info(t('flashcardsCopied') || 'Flashcards TSV copied to clipboard');
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          toast.error(t('failedToCopy') || 'Failed to copy to clipboard');
        });
    }
  };

  return (
    <div className="flashcard-pane">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h2 className="text-xl font-bold">{t('generatedFlashcards')}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-secondary flex items-center justify-center"
            onClick={handleCopyToClipboard}
            aria-label={t('copyFlashcardsTooltip')}
            title={t('copyFlashcardsTooltip')}
            disabled={!cleanTSV}
          >
            {isCopied ? <FiCheck size={18} className="mr-1" /> : <FiClipboard size={18} className="mr-1" />}
            {t('copyFlashcards')}
          </button>
          <a
            href="https://quizlet.com/create-set"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary flex items-center justify-center"
            aria-label={t('openInQuizlet')}
            title={t('openInQuizlet')}
          >
            <FiExternalLink size={18} className="mr-1" />
            {t('openQuizlet')}
          </a>
        </div>
      </div>
      
      {/* TSV view */}
      <div className="tsv-container mb-4">
        <div className="mb-2">
          <label htmlFor="tsvContent" className="text-sm font-medium text-neutral-700 block mb-1">
            {t('flashcardsContent')}
          </label>
          <textarea
            id="tsvContent"
            className="form-control font-mono text-sm w-full"
            readOnly
            value={cleanTSV || ''}
            aria-label={t('flashcardsContentForExport')}
            style={{ minHeight: '250px', maxHeight: '40vh', resize: 'vertical' }}
          />
        </div>
        <p className="text-sm text-neutral-600">
          ✓ {t('readyToImport')}
        </p>
      </div>
      
      {/* Export instructions */}
      <div className="export-instructions p-4 bg-neutral-100 rounded-lg mb-4">
        <h3 className="text-md font-medium mb-3">{t('importQuizlet')}:</h3>
        <ol className="list-decimal pl-5 text-sm space-y-2">
          <li>{t('importStep1')}</li>
          <li>{t('importStep2')}</li>
          <li>{t('importStep3')}</li>
          <li>{t('importStep4')}</li>
          <li>{t('importStep5')}</li>
        </ol>
        <p className="mt-3 text-sm">
          <strong>{t('note') || 'Note'}:</strong> {t('importNote')}
        </p>
      </div>
    </div>
  );
};

export default FlashcardPane;