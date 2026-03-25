import React, { useMemo } from 'react';
import { SyntaxHighlighter, HighlightLine } from '../../utils/syntax-highlighter';
import './syntax-highlighted-code.css';

interface SyntaxHighlightedCodeProps {
  code: string;
  language?: 'func' | 'tact';
  showLineNumbers?: boolean;
  startLineNumber?: number;
  className?: string;
}

export const SyntaxHighlightedCode: React.FC<SyntaxHighlightedCodeProps> = ({
  code,
  language = 'func',
  showLineNumbers = true,
  startLineNumber = 1,
  className = ''
}) => {
  const highlighter = useMemo(() => new SyntaxHighlighter(language), [language]);
  const highlightedLines = useMemo(() => highlighter.highlight(code), [highlighter, code]);

  const renderLine = (line: HighlightLine, index: number) => {
    const lineNumber = startLineNumber + index;
    let lastEnd = 0;
    const elements: React.ReactNode[] = [];

    for (const token of line.tokens) {
      if (token.start > lastEnd) {
        elements.push(
          <span key={`text-${lastEnd}`} className="hljs-text">
            {line.text.slice(lastEnd, token.start)}
          </span>
        );
      }

      const className = highlighter.getTokenClass(token.type);
      elements.push(
        <span key={`token-${token.start}`} className={`hljs-${className}`}>
          {token.value}
        </span>
      );

      lastEnd = token.end;
    }

    if (lastEnd < line.text.length) {
      elements.push(
        <span key={`text-last`} className="hljs-text">
          {line.text.slice(lastEnd)}
        </span>
      );
    }

    return (
      <div key={index} className="code-line">
        {showLineNumbers && (
          <span className="line-number">{lineNumber}</span>
        )}
        <span className="line-content">{elements}</span>
      </div>
    );
  };

  return (
    <div className={`syntax-highlighted-code ${className}`}>
      {highlightedLines.map((line, index) => renderLine(line, index))}
    </div>
  );
};