import React from 'react';
import { ValidationError } from '@utils/func-validator';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import './validation-errors.css';

interface ValidationErrorsProps {
  errors: ValidationError[];
  selectedError: ValidationError | null;
  onErrorClick: (error: ValidationError) => void;
  onScrollToLine: (line: number) => void;
}

export const ValidationErrors: React.FC<ValidationErrorsProps> = ({
  errors,
  selectedError,
  onErrorClick,
  onScrollToLine
}) => {
  const getErrorIcon = (severity: 'error' | 'warning') => {
    if (severity === 'error') {
      return <AlertCircle size={14} />;
    }
    return <AlertTriangle size={14} />;
  };

  const getErrorClass = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 'error-item' : 'warning-item';
  };

  const handleClick = (error: ValidationError) => {
    onErrorClick(error);
    if (error.line > 0) {
      onScrollToLine(error.line);
    }
  };

  const groupByLine = (errors: ValidationError[]): Map<number, ValidationError[]> => {
    const grouped = new Map<number, ValidationError[]>();
    errors.forEach(error => {
      const line = error.line;
      if (!grouped.has(line)) {
        grouped.set(line, []);
      }
      grouped.get(line)!.push(error);
    });
    return grouped;
  };

  const groupedErrors = groupByLine(errors);

  return (
    <div className="validation-errors">
      <div className="errors-header">
        <span>Issues</span>
        <span className="errors-count">{errors.length}</span>
      </div>
      
      <div className="errors-list">
        {Array.from(groupedErrors.entries()).map(([line, lineErrors]) => (
          <div key={line} className="error-group">
            <div className="error-group-header">
              <span className="error-line">Line {line}</span>
              <span className="error-count">
                {lineErrors.length} issue{lineErrors.length !== 1 ? 's' : ''}
              </span>
            </div>
            {lineErrors.map((error, index) => (
              <div
                key={index}
                className={`error-item ${getErrorClass(error.severity)} ${
                  selectedError === error ? 'selected' : ''
                }`}
                onClick={() => handleClick(error)}
              >
                <div className="error-icon">
                  {getErrorIcon(error.severity)}
                </div>
                <div className="error-content">
                  <div className="error-message">{error.message}</div>
                  {error.column > 0 && (
                    <div className="error-position">
                      Column {error.column}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};