import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TerminalLine } from './terminal-line';
import { TerminalInput } from './terminal-input';
import { TerminalHistory } from './terminal-history';
import { X, Minimize2, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';
import './terminal.css';

export interface TerminalProps {
  /** Массив строк вывода терминала */
  output: string[];
  /** Коллбэк очистки терминала */
  onClear: () => void;
  /** Коллбэк выполнения команды */
  onCommand: (command: string) => void;
  /** Заголовок терминала */
  title?: string;
  /** Начальное состояние (развернут/свернут) */
  initiallyExpanded?: boolean;
  /** Максимальная высота в свернутом состоянии */
  collapsedHeight?: number;
  /** Показывать ли кнопку очистки */
  showClearButton?: boolean;
  /** Показывать ли кнопку сворачивания */
  showCollapseButton?: boolean;
  /** Дополнительные команды для автодополнения */
  customCommands?: string[];
}

export const Terminal: React.FC<TerminalProps> = ({
  output,
  onClear,
  onCommand,
  title = 'Terminal',
  initiallyExpanded = true,
  collapsedHeight = 40,
  showClearButton = true,
  showCollapseButton = true,
  customCommands = []
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Базовые команды
  const baseCommands = ['help', 'clear', 'ls', 'pwd', 'cd', 'cat', 'echo', 'date'];
  
  // Все доступные команды
  const allCommands = [...baseCommands, ...customCommands];

  // Автоматическая прокрутка вниз при новом выводе
  useEffect(() => {
    if (contentRef.current && isExpanded) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [output, isExpanded]);

  // Фокус на input при разворачивании
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Обновление подсказок
  useEffect(() => {
    if (inputValue.trim()) {
      const matches = allCommands.filter(cmd => 
        cmd.startsWith(inputValue.trim().toLowerCase())
      );
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, allCommands]);

  // Обработка команды
  const handleSubmit = useCallback((command: string) => {
    if (command.trim()) {
      onCommand(command.trim());
      setCommandHistory(prev => [command.trim(), ...prev].slice(0, 50));
      setHistoryIndex(-1);
      setInputValue('');
      setShowSuggestions(false);
    }
  }, [onCommand]);

  // Навигация по истории
  const handleHistoryNavigate = useCallback((direction: 'up' | 'down') => {
    if (direction === 'up') {
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
      }
    } else {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }
  }, [historyIndex, commandHistory]);

  // Автодополнение
  const handleTabComplete = useCallback(() => {
    if (suggestions.length === 1) {
      setInputValue(suggestions[0]);
      setShowSuggestions(false);
    }
  }, [suggestions]);

  // Сворачивание/разворачивание
  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Очистка терминала
  const handleClear = useCallback(() => {
    onClear();
  }, [onClear]);

  // Получение приветственного сообщения
  const getWelcomeMessage = () => {
    const date = new Date().toLocaleString();
    return [
      `Ximer IDE Terminal v1.0.0`,
      `Type 'help' for available commands`,
      `Session started: ${date}`,
      ``
    ];
  };

  const welcomeMessage = getWelcomeMessage();
  const terminalHeight = isExpanded ? 'auto' : collapsedHeight;

  return (
    <div 
      className={`terminal ${isExpanded ? 'expanded' : 'collapsed'}`}
      style={{ maxHeight: terminalHeight }}
    >
      {/* Заголовок терминала */}
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">$</span>
          <span className="terminal-name">{title}</span>
        </div>
        
        <div className="terminal-controls">
          {showClearButton && (
            <button
              onClick={handleClear}
              className="terminal-control-btn"
              title="Clear terminal"
            >
              <X size={14} />
            </button>
          )}
          {showCollapseButton && (
            <button
              onClick={toggleExpand}
              className="terminal-control-btn"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Содержимое терминала */}
      <div 
        ref={contentRef}
        className="terminal-content"
      >
        {/* Приветственное сообщение */}
        {output.length === 0 && (
          <div className="terminal-welcome">
            {welcomeMessage.map((line, i) => (
              <div key={i} className="terminal-line welcome-line">
                {line}
              </div>
            ))}
          </div>
        )}

        {/* История команд */}
        <TerminalHistory lines={output} />

        {/* Промпт и ввод */}
        {isExpanded && (
          <TerminalInput
            ref={inputRef}
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onHistoryNavigate={handleHistoryNavigate}
            onTabComplete={handleTabComplete}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
          />
        )}
      </div>
    </div>
  );
};

export default Terminal;