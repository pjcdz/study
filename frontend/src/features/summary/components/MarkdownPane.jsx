import React from 'react';
import apiClient from '../../../shared/services/apiClient';

const MarkdownPane = ({ notionMarkdown, onFlashcardsGenerated, setIsLoading }) => {
  // Handle flashcards generation
  const handleGenerateFlashcards = async () => {
    if (!notionMarkdown) {
      alert('No markdown content available');
      return;
    }
    
    try {
      setIsLoading(true);
      const { flashcardsTSV } = await apiClient.postFlashcards(notionMarkdown);
      onFlashcardsGenerated(flashcardsTSV);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert(`Error generating flashcards: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-4 bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-blue-400">Notion Markdown</h2>
        <button
          onClick={handleGenerateFlashcards}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors duration-200"
        >
          Generate Flashcards
        </button>
      </div>
      
      <div className="flex-1 mb-4">
        <div
          className="w-full h-full p-3 bg-gray-800 text-white rounded-md border border-gray-700 overflow-auto"
        >
          <textarea
            className="w-full h-full bg-gray-800 text-white font-mono resize-none outline-none"
            value={notionMarkdown || ''}
            readOnly
          />
        </div>
      </div>
      
      <div className="flex justify-between">
        <div className="text-sm text-gray-400">
          ✅ Ready to copy and paste into Notion
        </div>
        <button
          onClick={() => {
            if (notionMarkdown) {
              navigator.clipboard.writeText(notionMarkdown);
              alert('Markdown copied to clipboard!');
            }
          }}
          className="px-4 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
        >
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
};

export default MarkdownPane;