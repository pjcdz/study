'use client';

import React, { useState, useRef, useEffect } from 'react';

interface StreamingTextProps {
  textToType: string;
  charDelay: number;
  isStreaming: boolean;
  onComplete?: () => void;
  className?: string;
}

/**
 * StreamingText component with adaptive typewriter effect
 * Uses requestAnimationFrame for smooth 60fps animation
 */
export const StreamingText: React.FC<StreamingTextProps> = ({
  textToType,
  charDelay,
  isStreaming,
  onComplete,
  className = ''
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const textIndexRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const timeAccumulatorRef = useRef<number>(0);
  
  // Reset if the new text doesn't start with the current displayed text
  useEffect(() => {
    if (!textToType.startsWith(displayedText)) {
      setDisplayedText('');
      textIndexRef.current = 0;
    }
  }, [textToType, displayedText]);
  
  // Update text index and animate
  useEffect(() => {
    textIndexRef.current = displayedText.length;
    
    const animate = (currentTime: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = currentTime;
      }
      
      const deltaTime = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;
      timeAccumulatorRef.current += deltaTime;
      
      // Prevent division by zero and ensure animation can progress
      const effectiveDelay = Math.max(0.1, charDelay);
      const charsToRender = Math.floor(timeAccumulatorRef.current / effectiveDelay);
      
      if (charsToRender > 0) {
        const newIndex = Math.min(
          textIndexRef.current + charsToRender,
          textToType.length
        );
        
        if (newIndex > textIndexRef.current) {
          setDisplayedText(textToType.substring(0, newIndex));
          textIndexRef.current = newIndex;
          timeAccumulatorRef.current -= charsToRender * effectiveDelay;
        }
      }
      
      if (textIndexRef.current < textToType.length) {
        frameRef.current = requestAnimationFrame(animate);
      } else if (!isStreaming && onComplete) {
        // Call onComplete only when streaming is done and all text is displayed
        onComplete();
      }
    };
    
    if (displayedText.length < textToType.length) {
      frameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      lastFrameTimeRef.current = 0;
      timeAccumulatorRef.current = 0;
    };
  }, [textToType, charDelay, displayedText, isStreaming, onComplete]);
  
  return (
    <div 
      className={`whitespace-pre-wrap ${className}`}
      aria-live="polite"
      aria-atomic="false"
      role="status"
    >
      {displayedText}
      {isStreaming && (
        <span 
          className="inline-block w-1 h-4 ml-1 bg-primary animate-pulse" 
          aria-label="Generando contenido"
          role="progressbar"
          aria-busy="true"
        />
      )}
    </div>
  );
};

export default StreamingText;
