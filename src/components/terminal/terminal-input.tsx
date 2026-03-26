import React, { forwardRef, useCallback, KeyboardEvent } from 'react';
import './terminal-input.css';

interface TerminalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (command: string) => void;
  onHistoryNavigate: (direction: 'up' | 'down') => void;
  onTabComplete: () => void;
  suggestions: string[];
  showSuggestions: boolean;
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({
    value,
    onChange,
    onSubmit,
    onHistoryNavigate,
    onTabComplete,
    suggestions,
    showSuggestions
  }, ref) => {
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (value.trim()) {
            onSubmit(value);
          }
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          onHistoryNavigate('up');
          break;
          
        case 'ArrowDown':
          e.preventDefault();
          onHistoryNavigate('down');
          break;
          
        case 'Tab':
          e.preventDefault();
          onTabComplete();
          break;
          
        case 'Escape':
          e.preventDefault();
          onChange('');
          break;
      }
    }, [value, onSubmit, onHistoryNavigate, onTabComplete, onChange]);

    const handleSuggestionClick = useCallback((suggestion: string) => {
      onChange(suggestion);
    }, [onChange]);

    return (
      <div className="terminal-input-container">
        <div className="terminal-prompt-line">
          <span className="terminal-prompt">$</span>
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-input-field"
            placeholder="Type a command..."
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="terminal-suggestions">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="terminal-suggestion"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

TerminalInput.displayName = 'TerminalInput';