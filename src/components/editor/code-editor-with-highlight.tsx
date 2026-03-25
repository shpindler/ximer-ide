import React, { useState, useCallback, useRef } from 'react';
import { SyntaxHighlightedCode } from './syntax-highlighted-code';
import './code-editor-with-highlight.css';

interface CodeEditorWithHighlightProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'func' | 'tact';
  readOnly?: boolean;
  height?: string | number;
  showLineNumbers?: boolean;
}

export const CodeEditorWithHighlight: React.FC<CodeEditorWithHighlightProps> = ({
  value,
  onChange,
  language = 'func',
  readOnly = false,
  height = '100%',
  showLineNumbers = true
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const container = containerRef.current;
    
    if (textarea && container) {
      const scrollTop = textarea.scrollTop;
      const scrollLeft = textarea.scrollLeft;
      const highlightDiv = container.querySelector('.highlight-layer');
      if (highlightDiv) {
        (highlightDiv as HTMLElement).scrollTop = scrollTop;
        (highlightDiv as HTMLElement).scrollLeft = scrollLeft;
      }
    }
  }, []);

  const insertText = useCallback((before: string, after: string, cursorOffset: number = 0) => {
    const textarea = textareaRef.current;
    if (!textarea || readOnly) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + before + after + value.substring(end);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + before.length + cursorOffset;
      textarea.focus();
    }, 0);
  }, [value, onChange, readOnly]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        insertText('  ', '', 2);
        break;
        
      case '{':
        e.preventDefault();
        insertText('{}', '', 1);
        break;
        
      case '(':
        e.preventDefault();
        insertText('()', '', 1);
        break;
        
      case '[':
        e.preventDefault();
        insertText('[]', '', 1);
        break;
        
      case '"':
        e.preventDefault();
        insertText('""', '', 1);
        break;
        
      case "'":
        e.preventDefault();
        insertText("''", '', 1);
        break;
        
      case 'Enter': {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = value.substring(lineStart, start);
        const indentMatch = currentLine.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';
        
        insertText('\n' + indent, '', indent.length + 1);
        break;
      }
    }
  }, [readOnly, insertText, value]);

  return (
    <div 
      ref={containerRef}
      className={`code-editor-with-highlight ${isFocused ? 'focused' : ''} ${readOnly ? 'readonly' : ''}`}
      style={{ height }}
    >
      <div className="editor-scroll-container">
        <div className="line-numbers-gutter">
          {value.split('\n').map((_, i) => (
            <div key={i} className="line-number">
              {i + 1}
            </div>
          ))}
        </div>
        
        <div className="editor-content">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            spellCheck={false}
            className="editor-textarea"
          />
          <div className="highlight-layer">
            <SyntaxHighlightedCode
              code={value}
              language={language}
              showLineNumbers={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};