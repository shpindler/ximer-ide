import React from 'react';
import './terminal-line.css';

interface TerminalLineProps {
  text: string;
  type?: 'input' | 'output' | 'error' | 'success' | 'info';
  timestamp?: Date;
}

export const TerminalLine: React.FC<TerminalLineProps> = ({
  text,
  type = 'output',
  timestamp
}) => {
  const getLineClass = () => {
    switch (type) {
      case 'input':
        return 'terminal-line-input';
      case 'error':
        return 'terminal-line-error';
      case 'success':
        return 'terminal-line-success';
      case 'info':
        return 'terminal-line-info';
      default:
        return 'terminal-line-output';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`terminal-line ${getLineClass()}`}>
      {timestamp && (
        <span className="terminal-line-time">
          {formatTime(timestamp)}
        </span>
      )}
      {type === 'input' && (
        <span className="terminal-prompt">$</span>
      )}
      <span className="terminal-line-text">{text}</span>
    </div>
  );
};