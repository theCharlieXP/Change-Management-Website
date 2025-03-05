import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Highlighter, Pencil, Save, X, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HighlightTextProps {
  text: string;
  insightId: string;
  onHighlightsChange: (insightId: string, highlights: string[]) => void;
  existingHighlights?: string[];
  preserveFormatting?: boolean;
}

export function HighlightText({ 
  text, 
  insightId, 
  onHighlightsChange,
  existingHighlights = [],
  preserveFormatting = false
}: HighlightTextProps) {
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [highlights, setHighlights] = useState<string[]>(existingHighlights);
  const textRef = useRef<HTMLDivElement>(null);

  // Update highlights when existingHighlights changes
  useEffect(() => {
    setHighlights(existingHighlights);
  }, [existingHighlights]);

  // Function to handle text selection and highlighting
  const handleHighlightSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') return;
    
    const selectedText = selection.toString().trim();
    
    // Add to highlights if not already included
    if (!highlights.includes(selectedText)) {
      const newHighlights = [...highlights, selectedText];
      setHighlights(newHighlights);
      onHighlightsChange(insightId, newHighlights);
    }
    
    // Clear the selection
    selection.removeAllRanges();
  };

  // Function to remove a highlight
  const removeHighlight = (highlightToRemove: string) => {
    const newHighlights = highlights.filter(h => h !== highlightToRemove);
    setHighlights(newHighlights);
    onHighlightsChange(insightId, newHighlights);
  };

  // Function to clear all highlights
  const clearAllHighlights = () => {
    setHighlights([]);
    onHighlightsChange(insightId, []);
  };

  // Helper function to safely escape regex special characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Render the text with highlights
  const renderTextWithHighlights = () => {
    if (!preserveFormatting) {
      let highlightedText = text;
      
      // Sort highlights by length (longest first) to avoid nested highlighting issues
      const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);
      
      for (const highlight of sortedHighlights) {
        // Escape special characters for regex
        const escapedHighlight = escapeRegExp(highlight);
        const regex = new RegExp(`(${escapedHighlight})`, 'gi');
        highlightedText = highlightedText.replace(
          regex, 
          '<span class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">$1</span>'
        );
      }
      
      return <div className="break-words" dangerouslySetInnerHTML={{ __html: highlightedText }} />;
    } else {
      // Preserve formatting with bullet points and headings
      const lines = text.split('\n');
      
      return (
        <div className="break-words">
          {lines.map((line, index) => {
            const cleanLine = line.trim();
            if (!cleanLine) return <div key={index} className="h-2"></div>;
            
            // Check if this is likely a heading (ends with a colon or is short)
            const isHeading = cleanLine.endsWith(':') || (cleanLine.length < 30 && !cleanLine.includes(' and ') && !cleanLine.includes(','));
            
            // Check if this is a bullet point
            const isBullet = cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*');
            const bulletText = isBullet ? cleanLine.replace(/^[•\-*]\s*/, '') : cleanLine;
            
            // Apply highlighting to this line
            let highlightedLine = bulletText;
            
            // Sort highlights by length (longest first) to avoid nested highlighting issues
            const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);
            
            for (const highlight of sortedHighlights) {
              // Only try to highlight if the text contains this highlight
              if (bulletText.includes(highlight)) {
                // Escape special characters for regex
                const escapedHighlight = escapeRegExp(highlight);
                const regex = new RegExp(`(${escapedHighlight})`, 'gi');
                highlightedLine = highlightedLine.replace(
                  regex, 
                  '<span class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">$1</span>'
                );
              }
            }
            
            if (isHeading) {
              return (
                <h5 key={index} className="text-sm font-semibold mt-3 text-foreground break-words">
                  <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />
                </h5>
              );
            }
            
            if (isBullet) {
              return (
                <div key={index} className="flex items-start gap-2 w-full mt-1">
                  <span className="text-muted-foreground leading-tight flex-shrink-0">•</span>
                  <p className="text-sm text-foreground flex-1 break-words">
                    <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />
                  </p>
                </div>
              );
            }
            
            return (
              <p key={index} className="text-sm text-foreground break-words mt-1">
                <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />
              </p>
            );
          })}
        </div>
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isHighlighting ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsHighlighting(!isHighlighting)}
                  className="gap-1.5"
                >
                  {isHighlighting ? <X className="h-4 w-4" /> : <Highlighter className="h-4 w-4" />}
                  {isHighlighting ? "Cancel" : "Highlight Key Points"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px]">
                <p>Highlight specific text in this insight that you want to prioritize in your communication.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isHighlighting && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Select text to highlight important points
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[300px]">
                    <p>Highlighted text will be prioritized when generating your communication.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          )}
        </div>
        
        {highlights.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {highlights.length} highlight{highlights.length !== 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllHighlights}
              className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>
      
      <div 
        ref={textRef}
        className={cn(
          "text-sm p-3 border rounded-md overflow-auto max-h-[400px]",
          isHighlighting ? "bg-gray-50 dark:bg-gray-900 cursor-text" : "",
          highlights.length > 0 ? "highlight-container" : ""
        )}
        onClick={isHighlighting ? handleHighlightSelection : undefined}
        style={{ overflowX: 'hidden', wordBreak: 'break-word' }}
      >
        {highlights.length > 0 || preserveFormatting ? renderTextWithHighlights() : text}
      </div>
      
      {highlights.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Highlighter className="h-4 w-4 text-yellow-600" />
              Selected Highlights
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllHighlights}
              className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1" style={{ overflowX: 'hidden' }}>
            {highlights.map((highlight, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-yellow-50 border-l-2 border-yellow-300 p-2 rounded">
                <p className="text-sm break-words flex-1">{highlight}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-yellow-700 hover:bg-yellow-100 rounded-full flex-shrink-0"
                  onClick={() => removeHighlight(highlight)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 