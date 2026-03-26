import React from 'react';
import { TerminalLine } from './terminal-line';
import './terminal-history.css';

interface TerminalHistoryProps {
  lines: string[];
}

export const TerminalHistory: React.FC<TerminalHistoryProps> = ({ lines }) => {
  const detectLineType = (line: string): 'input' | 'output' | 'error' | 'success' | 'info' => {
    if (line.startsWith('$ ')) return 'input';
    if (line.includes('✅') || line.includes('success')) return 'success';
    if (line.includes('❌') || line.includes('error') || line.includes('failed')) return 'error';
    if (line.includes('⚠️') || line.includes('warning')) return 'info';
    return 'output';
  };

  const extractTimestamp = (line: string): Date | undefined => {
    const match = line.match(/\[([0-9:]+)\]/);
    if (match) {
      const time = match[1];
      const [hours, minutes, seconds] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
      return date;
    }
    return undefined;
  };

  const extractCommand = (line: string): string => {
    if (line.startsWith('$ ')) {
      return line.slice(2);
    }
    return line;
  };

  return (
    <div className="terminal-history">
      {lines.map((line, index) => {
        const type = detectLineType(line);
        const timestamp = extractTimestamp(line);
        const text = extractCommand(line);
        
        return (
          <TerminalLine
            key={index}
            text={text}
            type={type}
            timestamp={timestamp}
          />
        );
      })}
    </div>
  );
};