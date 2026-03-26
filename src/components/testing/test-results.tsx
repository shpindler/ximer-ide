import React from 'react';
import { TestSuite, TestCase } from './test-runner';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import './test-results.css';

interface TestResultsProps {
  results: {
    suites: TestSuite[];
    passed: number;
    failed: number;
    total: number;
    duration: number;
  };
  selectedSuite: string | null;
  onSelectSuite: (suiteName: string | null) => void;
  showCoverage: boolean;
  onToggleCoverage: () => void;
  formatDuration: (ms: number) => string;
}

export const TestResults: React.FC<TestResultsProps> = ({
  results,
  selectedSuite,
  onSelectSuite,
  showCoverage,
  onToggleCoverage,
  formatDuration
}) => {
  const [expandedTests, setExpandedTests] = React.useState<Set<string>>(new Set());

  const toggleTestExpand = (testName: string) => {
    setExpandedTests(prev => {
      const next = new Set(prev);
      if (next.has(testName)) {
        next.delete(testName);
      } else {
        next.add(testName);
      }
      return next;
    });
  };

  const getTestIcon = (passed: boolean) => {
    return passed ? <CheckCircle size={14} /> : <XCircle size={14} />;
  };

  const getTestClass = (passed: boolean) => {
    return passed ? 'test-passed' : 'test-failed';
  };

  const filteredSuites = selectedSuite
    ? results.suites.filter(s => s.name === selectedSuite)
    : results.suites;

  return (
    <div className="test-results">
      {/* Навигация по наборам тестов */}
      {results.suites.length > 1 && (
        <div className="test-suites-nav">
          <button
            className={`suite-nav-btn ${!selectedSuite ? 'active' : ''}`}
            onClick={() => onSelectSuite(null)}
          >
            All Suites
          </button>
          {results.suites.map(suite => (
            <button
              key={suite.name}
              className={`suite-nav-btn ${selectedSuite === suite.name ? 'active' : ''}`}
              onClick={() => onSelectSuite(suite.name)}
            >
              {suite.name}
              <span className={`suite-badge ${suite.failed > 0 ? 'failed' : 'passed'}`}>
                {suite.passed}/{suite.tests.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Список тестов */}
      <div className="test-suites">
        {filteredSuites.map(suite => (
          <div key={suite.name} className="test-suite">
            <div className="test-suite-header">
              <div className="suite-info">
                <span className="suite-name">{suite.name}</span>
                <span className="suite-stats">
                  <span className="suite-passed">✅ {suite.passed}</span>
                  <span className="suite-failed">❌ {suite.failed}</span>
                  <span className="suite-duration">{formatDuration(suite.duration)}</span>
                </span>
              </div>
              {showCoverage && (
                <div className="suite-coverage">
                  <div className="coverage-bar">
                    <div
                      className="coverage-fill"
                      style={{ width: `${(suite.passed / suite.tests.length) * 100}%` }}
                    />
                  </div>
                  <span className="coverage-percent">
                    {((suite.passed / suite.tests.length) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            <div className="test-cases">
              {suite.tests.map(test => (
                <div key={test.name} className={`test-case ${getTestClass(test.passed)}`}>
                  <div
                    className="test-case-header"
                    onClick={() => test.error && toggleTestExpand(test.name)}
                  >
                    <div className="test-case-icon">
                      {getTestIcon(test.passed)}
                    </div>
                    <div className="test-case-name">{test.name}</div>
                    {test.duration && (
                      <div className="test-case-duration">
                        {formatDuration(test.duration)}
                      </div>
                    )}
                    {test.error && (
                      <button className="test-expand-btn">
                        {expandedTests.has(test.name) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                  
                  {test.error && expandedTests.has(test.name) && (
                    <div className="test-case-error">
                      <div className="error-header">
                        <AlertCircle size={14} />
                        <span>Error</span>
                      </div>
                      <pre className="error-message">{test.error}</pre>
                      {test.expected && test.actual && (
                        <div className="error-diff">
                          <div className="diff-expected">
                            <strong>Expected:</strong>
                            <code>{test.expected}</code>
                          </div>
                          <div className="diff-actual">
                            <strong>Actual:</strong>
                            <code>{test.actual}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Сводка */}
      <div className="test-summary">
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-value">{results.passed}</span>
            <span className="stat-label">passed</span>
          </div>
          <div className="stat">
            <span className="stat-value">{results.failed}</span>
            <span className="stat-label">failed</span>
          </div>
          <div className="stat">
            <span className="stat-value">{results.total}</span>
            <span className="stat-label">total</span>
          </div>
          <div className="stat">
            <span className="stat-value">{formatDuration(results.duration)}</span>
            <span className="stat-label">duration</span>
          </div>
        </div>
      </div>
    </div>
  );
};