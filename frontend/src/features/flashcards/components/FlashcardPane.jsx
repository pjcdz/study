import React, { useState, useEffect } from 'react';

const FlashcardPane = ({ flashcardsTSV }) => {
  const [displayedCards, setDisplayedCards] = useState([]);
  
  // Parse TSV into flashcard objects when flashcardsTSV changes
  useEffect(() => {
    if (!flashcardsTSV) return;
    
    try {
      // Split by newlines and create flashcard objects
      const lines = flashcardsTSV.trim().split('\n');
      const cards = lines.map(line => {
        const [front, back] = line.split('\t');
        return { front, back };
      }).filter(card => card.front && card.back);
      
      setDisplayedCards(cards);
    } catch (error) {
      console.error('Error parsing flashcards:', error);
    }
  }, [flashcardsTSV]);
  
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
      
      {/* TSV display */}
      <div className="flex-1 mb-4 overflow-hidden">
        <textarea
          className="w-full h-1/3 p-3 mb-4 bg-gray-800 text-white font-mono rounded-md border border-gray-700 resize-none"
          readOnly
          value={flashcardsTSV || ''}
        />
        
        {/* Flashcard preview */}
        <h3 className="text-lg font-medium text-blue-300 mb-2">Flashcard Preview</h3>
        
        <div className="h-2/3 overflow-y-auto">
          {displayedCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedCards.map((card, index) => (
                <div key={index} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  <div className="p-4 bg-gray-750 border-b border-gray-700">
                    <h4 className="font-medium text-white">Front</h4>
                    <div className="mt-1 text-gray-300" dangerouslySetInnerHTML={{ __html: card.front }} />
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-white">Back</h4>
                    <div className="mt-1 text-gray-300" dangerouslySetInnerHTML={{ __html: card.back }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No flashcards to display
            </div>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-400">
        ✅ Ready to import into Quizlet. Just copy the TSV and paste it during import.
      </div>
    </div>
  );
};

export default FlashcardPane;