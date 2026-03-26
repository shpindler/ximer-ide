import React, { useState, useCallback } from 'react';
import { Button } from '@components/common/Button';
import { TestResults } from './test-results';
import { Play, RotateCcw, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import './test-runner.css';

export interface TestCase {
  name: string;
  passed: boolean;
  duration?: number;
  error?: string;
  expected?: string;
  actual?: string;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  passed: number;
  failed: number;
  duration: number;
}

export interface TestResultsType {
  passed: number;
  failed: number;
  total: number;
  duration: number;
  suites: TestSuite[];
  timestamp: Date;
}

export interface TestRunnerProps {
  /** Функция запуска тестов */
  onRunTests: () => Promise<TestResultsType>;
  /** Результаты тестов */
  results?: TestResultsType | null;
  /** Флаг выполнения тестов */
  isRunning?: boolean;
  /** Заголовок */
  title?: string;
  /** Показывать ли детали */
  showDetails?: boolean;
  /** Дополнительные настройки */
  options?: {
    timeout?: number;
    coverage?: boolean;
    verbose?: boolean;
  };
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  onRunTests,
  results,
  isRunning = false,
  title = 'Test Runner',
  showDetails = true,
  options = { timeout: 30000, coverage: false, verbose: false }
}) => {
  const [localResults, setLocalResults] = useState<TestResultsType | null>(results || null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [showCoverage, setShowCoverage] = useState(false);

  const handleRunTests = useCallback(async () => {
    try {
      const newResults = await onRunTests();
      setLocalResults(newResults);
    } catch (error) {
      console.error('Test execution failed:', error);
    }
  }, [onRunTests]);

  const handleClearResults = useCallback(() => {
    setLocalResults(null);
    setSelectedSuite(null);
  }, []);

  const getStatusClass = () => {
    if (!localResults) return 'idle';
    if (localResults.failed === 0) return 'passed';
    return 'failed';
  };

  const getStatusIcon = () => {
    if (!localResults) return null;
    if (localResults.failed === 0) return '✅';
    return '❌';
  };

  const getStatusText = () => {
    if (!localResults) return 'No tests run';
    if (localResults.failed === 0) return 'All tests passed';
    return `${localResults.failed} tests failed`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getSuccessRate = (): number => {
    if (!localResults || localResults.total === 0) return 0;
    return (localResults.passed / localResults.total) * 100;
  };

  const successRate = getSuccessRate();

  return (
    <div className={`test-runner ${getStatusClass()}`}>
      {/* Заголовок */}
      <div className="test-runner-header">
        <div className="test-runner-title">
          <Play size={16} />
          <h3>{title}</h3>
        </div>
        
        <div className="test-runner-actions">
          <Button
            onClick={handleRunTests}
            isLoading={isRunning}
            variant="primary"
            size="sm"
            leftIcon={<Play size={12} />}
          >
            {isRunning ? 'Running...' : 'Run Tests'}
          </Button>
          
          {localResults && (
            <Button
              onClick={handleClearResults}
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw size={12} />}
            >
              Clear
            </Button>
          )}
          
          {showDetails && localResults && (
            <button
              className="expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Статус */}
      <div className="test-runner-status">
        <div className="status-icon">{getStatusIcon()}</div>
        <div className="status-info">
          <span className="status-text">{getStatusText()}</span>
          {localResults && (
            <span className="status-duration">
              {formatDuration(localResults.duration)}
            </span>
          )}
        </div>
      </div>

      {/* Прогресс */}
      {localResults && (
        <div className="test-runner-progress">
          <div className="progress-bar">
            <div
              className={`progress-fill ${getStatusClass()}`}
              style={{ width: `${successRate}%` }}
            />
          </div>
          <div className="progress-stats">
            <span className="stats-passed">✅ {localResults.passed} passed</span>
            <span className="stats-failed">❌ {localResults.failed} failed</span>
            <span className="stats-total">📊 {localResults.total} total</span>
            {options.coverage && (
              <span className="stats-coverage">📈 {successRate.toFixed(1)}%</span>
            )}
          </div>
        </div>
      )}

      {/* Индикатор загрузки */}
      {isRunning && (
        <div className="test-runner-loading">
          <Loader className="loading-spinner" size={20} />
          <span>Running tests...</span>
          {options.timeout && (
            <span className="timeout-hint">
              (timeout: {options.timeout / 1000}s)
            </span>
          )}
        </div>
      )}

      {/* Результаты тестов */}
      {localResults && isExpanded && (
        <TestResults
          results={localResults}
          selectedSuite={selectedSuite}
          onSelectSuite={setSelectedSuite}
          showCoverage={showCoverage}
          onToggleCoverage={() => setShowCoverage(!showCoverage)}
          formatDuration={formatDuration}
        />
      )}

      {/* Пустое состояние */}
      {!localResults && !isRunning && (
        <div className="test-runner-empty">
          <p>No tests have been run yet</p>
          <Button onClick={handleRunTests} variant="outline" size="sm">
            Run first test
          </Button>
        </div>
      )}

      {/* Настройки */}
      {showDetails && localResults && (
        <div className="test-runner-settings">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={options.verbose}
              onChange={() => {}}
              disabled
            />
            <span>Verbose output</span>
          </label>
          <label className="setting-label">
            <input
              type="checkbox"
              checked={options.coverage}
              onChange={() => {}}
              disabled
            />
            <span>Show coverage</span>
          </label>
        </div>
      )}
    </div>
  );
};

export default TestRunner;