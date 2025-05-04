import React from 'react';
import apiClient from '../../../shared/services/apiClient';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const MarkdownPane = ({ notionMarkdown, onFlashcardsGenerated, setIsLoading }) => {
  // Show skeleton placeholders before markdown is loaded
  if (!notionMarkdown) {
    return (
      <div className="flex flex-col w-full h-full p-4 bg-gray-900">
        <h2 className="text-xl font-semibold text-blue-400 mb-4">
          <Skeleton width={200} height={24} />
        </h2>
        <div className="flex-1 grid grid-cols-1 gap-4">
          <Skeleton count={3} />
        </div>
      </div>
    );
  }

  // Handle flashcards generation
  const handleGenerateFlashcards = async () => {
    if (!notionMarkdown) {
      toast.warning('No markdown content available');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiClient.postFlashcards(notionMarkdown);
      // handle case where flashcardsTSV is an object with .text
      let tsv = response.flashcardsTSV;
      if (typeof tsv === 'object' && tsv.text) {
        tsv = tsv.text;
      }
      onFlashcardsGenerated(tsv);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast.error(`Error generating flashcards: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Notion Markdown</h2>
      <div className="field">
        <textarea
          id="markdownContent"
          readOnly
          value={notionMarkdown}
        />
        <label htmlFor="markdownContent">Content</label>
      </div>
      <button className="btn btn-primary" onClick={handleGenerateFlashcards}>
        Generate Flashcards
      </button>
    </div>
  );
};

export default MarkdownPane;