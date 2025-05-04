import React from 'react';

const FlashcardPane = ({ flashcardsTSV }) => {
  return (
    <div className="flex flex-col w-full h-full p-4 bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-blue-400">Quizlet Flashcards (TSV)</h2>
        
        <button
          onClick={() => {
            if (flashcardsTSV) {
              navigator.clipboard.writeText(flashcardsTSV);
              alert('TSV copied to clipboard!');
            }
          }}
          className="px-4 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors duration-200"
        >
          Copy TSV
        </button>
      </div>
      
      {/* TSV display only */}
      <div className="flex-1 mb-4 overflow-auto">
        <textarea
          className="w-full h-full p-3 bg-gray-800 text-white font-mono rounded-md border border-gray-700 resize-none"
          readOnly
          value={flashcardsTSV || ''}
        />
      </div>
      <div className="text-sm text-gray-400">
        ✅ Ready to import into Quizlet. Copy and use the TSV.
      </div>
    </div>
  );
};

export default FlashcardPane;