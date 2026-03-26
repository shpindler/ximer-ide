import React, { useState, useMemo, useCallback } from 'react';
import { validateFunC, ValidationError } from '@utils/func-validator';
import { ValidationErrors } from './validation-errors';
import { AlertCircle, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import './func-validator.css';

interface FunCValidatorProps {
  /** Код для валидации */
  code: string;
  /** Автоматическая валидация при изменении кода */
  autoValidate?: boolean;
  /** Показывать детали ошибок */
  showDetails?: boolean;
  /** Заголовок */
  title?: string;
  /** Коллбэк при изменении статуса валидации */
  onValidationChange?: (errors: ValidationError[]) => void;
}

export const FunCValidator: React.FC<FunCValidatorProps> = ({
  code,
  autoValidate = true,
  showDetails = true,
  title = 'FunC Validator',
  onValidationChange
}) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedError, setSelectedError] = useState<ValidationError | null>(null);
  const [showAllErrors, setShowAllErrors] = useState(true);

  // Валидация кода
  const validate = useCallback(() => {
    setIsValidating(true);
    
    // Используем setTimeout для неблокирующей валидации
    setTimeout(() => {
      const validationErrors = validateFunC(code);
      setErrors(validationErrors);
      onValidationChange?.(validationErrors);
      setIsValidating(false);
    }, 0);
  }, [code, onValidationChange]);

  // Автоматическая валидация
  useMemo(() => {
    if (autoValidate) {
      validate();
    }
  }, [code, autoValidate, validate]);

  // Статистика ошибок
  const stats = useMemo(() => {
    const errorsCount = errors.filter(e => e.severity === 'error').length;
    const warningsCount = errors.filter(e => e.severity === 'warning').length;
    const hasErrors = errorsCount > 0;
    const hasWarnings = warningsCount > 0;
    
    return {
      errorsCount,
      warningsCount,
      total: errors.length,
      hasErrors,
      hasWarnings,
      isValid: !hasErrors
    };
  }, [errors]);

  // Получение статуса
  const getStatus = () => {
    if (stats.hasErrors) return 'error';
    if (stats.hasWarnings) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    switch (getStatus()) {
      case 'error':
        return <XCircle size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      default:
        return <CheckCircle size={18} />;
    }
  };

  const getStatusText = () => {
    if (stats.hasErrors) {
      return `${stats.errorsCount} error${stats.errorsCount !== 1 ? 's' : ''} found`;
    }
    if (stats.hasWarnings) {
      return `${stats.warningsCount} warning${stats.warningsCount !== 1 ? 's' : ''} found`;
    }
    return 'Code is valid';
  };

  const getStatusColor = () => {
    switch (getStatus()) {
      case 'error': return 'var(--error)';
      case 'warning': return 'var(--warning)';
      default: return 'var(--success)';
    }
  };

  // Фильтрация ошибок
  const filteredErrors = useMemo(() => {
    if (showAllErrors) return errors;
    return errors.filter(e => e.severity === 'error');
  }, [errors, showAllErrors]);

  // Обработка клика по ошибке
  const handleErrorClick = (error: ValidationError) => {
    setSelectedError(error);
  };

  // Прокрутка к строке с ошибкой
  const scrollToError = useCallback((line: number) => {
    const editorElement = document.querySelector('.editor-textarea');
    if (editorElement) {
      // Рассчитываем позицию прокрутки
      const lineHeight = 21; // Примерная высота строки
      const scrollPosition = (line - 1) * lineHeight;
      editorElement.scrollTop = scrollPosition;
      
      // Подсвечиваем строку
      const lineElement = document.querySelector(`[data-line-number="${line}"]`);
      if (lineElement) {
        lineElement.classList.add('highlight-error');
        setTimeout(() => {
          lineElement.classList.remove('highlight-error');
        }, 2000);
      }
    }
  }, []);

  return (
    <div className={`func-validator validator-${getStatus()}`}>
      {/* Заголовок */}
      <div className="validator-header">
        <div className="validator-title">
          <AlertCircle size={16} />
          <h3>{title}</h3>
        </div>
        
        <div className="validator-actions">
          <button
            onClick={validate}
            className="validator-refresh"
            title="Revalidate"
            disabled={isValidating}
          >
            <RefreshCw size={14} className={isValidating ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Статус */}
      <div className="validator-status" style={{ borderColor: getStatusColor() }}>
        <div className="status-icon" style={{ color: getStatusColor() }}>
          {getStatusIcon()}
        </div>
        <div className="status-info">
          <span className="status-text" style={{ color: getStatusColor() }}>
            {getStatusText()}
          </span>
          {stats.total > 0 && (
            <div className="status-stats">
              {stats.errorsCount > 0 && (
                <span className="stat-error">❌ {stats.errorsCount}</span>
              )}
              {stats.warningsCount > 0 && (
                <span className="stat-warning">⚠️ {stats.warningsCount}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Фильтры */}
      {stats.total > 0 && showDetails && (
        <div className="validator-filters">
          <label className="filter-label">
            <input
              type="checkbox"
              checked={showAllErrors}
              onChange={(e) => setShowAllErrors(e.target.checked)}
            />
            <span>Show all</span>
          </label>
          <label className="filter-label">
            <input
              type="checkbox"
              checked={!showAllErrors}
              onChange={(e) => setShowAllErrors(!e.target.checked)}
            />
            <span>Errors only</span>
          </label>
        </div>
      )}

      {/* Список ошибок */}
      {filteredErrors.length > 0 && showDetails && (
        <ValidationErrors
          errors={filteredErrors}
          selectedError={selectedError}
          onErrorClick={handleErrorClick}
          onScrollToLine={scrollToError}
        />
      )}

      {/* Сообщение об отсутствии ошибок */}
      {stats.total === 0 && showDetails && (
        <div className="validator-success">
          <CheckCircle size={20} />
          <p>No issues found in the code</p>
        </div>
      )}

      {/* Индикатор валидации */}
      {isValidating && (
        <div className="validator-loading">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span>Validating...</span>
        </div>
      )}

      {/* Советы по исправлению */}
      {stats.hasErrors && showDetails && (
        <div className="validator-tips">
          <div className="tips-header">
            <AlertCircle size={12} />
            <span>Tips</span>
          </div>
          <ul className="tips-list">
            <li>Use <code>;;</code> for comments, not <code>//</code></li>
            <li>Every statement must end with a semicolon <code>;</code></li>
            <li>Functions that modify state must be marked <code>impure</code></li>
            <li>Get methods should be prefixed with <code>get_</code></li>
            <li>Check that all braces <code>{}</code> and parentheses <code>()</code> are balanced</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default FunCValidator;