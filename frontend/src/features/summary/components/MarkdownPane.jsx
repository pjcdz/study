import React, { useState } from 'react';
import apiClient from '../../../shared/services/apiClient';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FiClipboard, FiCheck, FiEdit2, FiZap } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAccessibility } from '../../../shared/components/accessibility/AccessibilityContext';

const MarkdownPane = ({ notionMarkdown, onFlashcardsGenerated, setIsLoading }) => {
  const { t } = useAccessibility(); // Hook para acceder a traducciones
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState(notionMarkdown || '');
  const [isCopied, setIsCopied] = useState(false);

  // Show skeleton placeholders before markdown is loaded
  if (!notionMarkdown && !isEditing) {
    return (
      <div className="markdown-pane">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            <Skeleton width={180} height={28} />
          </h2>
          <div>
            <Skeleton width={100} height={36} />
          </div>
        </div>
        <div className="skeleton-content bg-neutral-100 rounded-lg p-4">
          <Skeleton count={1} height={32} className="mb-4" />
          <Skeleton count={3} height={16} className="mb-2" />
          <Skeleton count={2} height={16} className="mb-4" />
          <Skeleton count={1} height={24} className="mb-3" />
          <Skeleton count={4} height={16} className="mb-2" />
        </div>
      </div>
    );
  }

  // Handle flashcards generation
  const handleGenerateFlashcards = async () => {
    const markdown = isEditing ? editedMarkdown : notionMarkdown;
    
    if (!markdown) {
      toast.warning(t('noMarkdownContent') || 'No markdown content available');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiClient.postFlashcards(markdown);
      // handle case where flashcardsTSV is an object with .text
      let tsv = response.flashcardsTSV;
      if (typeof tsv === 'object' && tsv.text) {
        tsv = tsv.text;
      }
      onFlashcardsGenerated(tsv);
      toast.success(t('flashcardsCreated'));
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast.error(`${t('errorGeneratingFlashcards')}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    const markdown = isEditing ? editedMarkdown : notionMarkdown;
    navigator.clipboard.writeText(markdown)
      .then(() => {
        setIsCopied(true);
        toast.info(t('summaryCopied'));
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast.error(t('failedToCopy'));
      });
  };

  // Toggle between edit and view mode
  const handleToggleEdit = () => {
    if (isEditing) {
      // Save changes
      setIsEditing(false);
    } else {
      // Enter edit mode
      setEditedMarkdown(notionMarkdown);
      setIsEditing(true);
    }
  };

  // Update edited markdown
  const handleMarkdownChange = (e) => {
    setEditedMarkdown(e.target.value);
  };

  // Custom renderers for markdown components
  const renderers = {
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  // Content to display (either raw markdown or the edited version)
  const displayContent = isEditing ? editedMarkdown : notionMarkdown;

  return (
    <div className="markdown-pane">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h2 className="text-xl font-bold">{t('generatedSummary')}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn ${isEditing ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleToggleEdit}
            aria-label={isEditing ? t('saveChanges') : t('editSummary')}
            title={isEditing ? t('saveChanges') : t('editSummary')}
          >
            <FiEdit2 size={18} className="mr-1" />
            {isEditing ? t('save') : t('edit')}
          </button>
          <button
            className="btn btn-secondary flex items-center"
            onClick={handleCopyToClipboard}
            aria-label={t('copySummaryTooltip')}
            title={t('copySummaryTooltip')}
          >
            {isCopied ? <FiCheck size={18} className="mr-1" /> : <FiClipboard size={18} className="mr-1" />}
            {t('copySummary')}
          </button>
        </div>
      </div>ππ
      
      <div className="markdown-content-container mb-6">
        {isEditing ? (
          <div className="edit-container">
            <textarea
              id="markdownEditor"
              className="form-control font-mono text-sm w-full"
              value={editedMarkdown}
              onChange={handleMarkdownChange}
              aria-label={t('editSummaryMarkdown')}
              style={{ minHeight: '200px', maxHeight: '40vh', resize: 'vertical' }}
            />
          </div>
        ) : (
          <div className="source-markdown">
            <pre className="bg-neutral-800 text-neutral-100 p-4 rounded-lg overflow-x-auto text-sm font-mono w-full" style={{ minHeight: '200px', maxHeight: '35vh' }}>
              {notionMarkdown}
            </pre>
          </div>
        )}
      </div>
      
      <div className="flex justify-center">
        <button
          className="btn btn-primary flex items-center justify-center w-auto px-6"
          onClick={handleGenerateFlashcards}
          disabled={!displayContent}
          aria-label={t('generateFlashcardsFromSummary')}
        >
          <FiZap size={18} className="mr-2" /> {/* Aumento el margen de 'mr-2' */}
          {t('generateFlashcards')}
        </button>
      </div>
    </div>
  );
};

export default MarkdownPane;