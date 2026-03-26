import { useState, useCallback, useRef } from 'react';
import type { CompilationResult, CompilationError } from '../types/editor';

// Интерфейсы для компилятора
interface CompilerOptions {
  signal?: AbortSignal;
  onProgress?: (progress: number, stage?: string) => void;
  optimize?: boolean;
  debug?: boolean;
}

interface CompiledContract {
  boc: string;
  hash: string;
  fift?: string;
  asm?: string;
  size: number;
  warnings: string[];
}

// Интерфейс возвращаемого значения хука
export interface UseCompilerReturn {
  compile: (code: string, fileName?: string, options?: CompilerOptions) => Promise<CompilationResult>;
  validate: (code: string) => Promise<CompilationError[]>;
  isCompiling: boolean;
  compilationResult: CompilationResult | null;
  compilationProgress: number;
  clearResult: () => void;
  cancelCompilation: () => void;
  formatCompilationResult: (result: CompilationResult) => string;
  getContractSize: (boc: string) => number;
  getCompilationStats: () => { total: number; successful: number; failed: number } | null;
}

/**
 * Хук для компиляции FunC контрактов TON
 */
export const useCompiler = (): UseCompilerReturn => {
  // Состояния
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [compilationProgress, setCompilationProgress] = useState(0);
  
  // Ref для отмены компиляции
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Валидация FunC кода
   */
  const validate = useCallback(async (code: string): Promise<CompilationError[]> => {
    const errors: CompilationError[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith(';;')) return;
      
      // Проверка точки с запятой
      if (!line.endsWith(';') && 
          !line.endsWith('{') && 
          !line.endsWith('}') &&
          !line.startsWith('#pragma') &&
          !line.includes('method_id') &&
          trimmed !== '') {
        errors.push({
          line: lineNumber,
          column: line.length,
          message: 'Missing semicolon at end of statement',
          severity: 'error'
        });
      }
      
      // Проверка комментариев
      if (line.includes('//') && !line.includes(';;')) {
        errors.push({
          line: lineNumber,
          column: line.indexOf('//') + 1,
          message: 'Use ;; for comments in FunC, not //',
          severity: 'warning'
        });
      }
      
      // Проверка функции recv_internal
      if (line.includes('recv_internal') && !line.includes('impure')) {
        errors.push({
          line: lineNumber,
          column: line.indexOf('recv_internal') + 1,
          message: 'recv_internal function should be marked as impure',
          severity: 'warning'
        });
      }
    });
    
    // Проверка баланса фигурных скобок
    let braceCount = 0;
    lines.forEach((line) => {
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
    });
    
    if (braceCount !== 0) {
      errors.push({
        line: 1,
        column: 1,
        message: `Unbalanced braces: ${Math.abs(braceCount)} unclosed ${braceCount > 0 ? 'opening' : 'closing'} brace(s)`,
        severity: 'error'
      });
    }
    
    return errors;
  }, []);

  /**
   * Предварительная обработка кода
   */
  const preprocessCode = useCallback((code: string): string => {
    let processed = code;
    
    // Удаляем BOM
    if (processed.charCodeAt(0) === 0xFEFF) {
      processed = processed.slice(1);
    }
    
    // Нормализуем концы строк
    processed = processed.replace(/\r\n/g, '\n');
    
    // Удаляем trailing whitespace
    processed = processed.replace(/[ \t]+$/gm, '');
    
    // Добавляем pragma version если отсутствует
    if (!processed.includes('#pragma version')) {
      processed = '#pragma version >=0.4.0;\n\n' + processed;
    }
    
    return processed;
  }, []);

  /**
   * Генерация мокового BOC (для эмуляции)
   */
  const generateMockBoc = useCallback((code: string): string => {
    const prefix = 'te6cckEBAQEAGgAAwP8AcqR0vOvyR+U=';
    const suffix = btoa(code.slice(0, 100)).slice(0, 50);
    return prefix + suffix;
  }, []);

  /**
   * Генерация мокового хеша
   */
  const generateMockHash = useCallback((): string => {
    let hash = '0x';
    const chars = '0123456789abcdef';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * 16)];
    }
    return hash;
  }, []);

  /**
   * Генерация предупреждений
   */
  const generateWarnings = useCallback((code: string): string[] => {
    const warnings: string[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes(';;') && line.includes('TODO')) {
        warnings.push(`Line ${index + 1}: TODO comment found`);
      }
      
      if (line.includes('method_id') && !line.includes('get_')) {
        warnings.push(`Line ${index + 1}: Get methods should be prefixed with "get_"`);
      }
    });
    
    return warnings;
  }, []);

  /**
   * Эмуляция компиляции (для разработки)
   */
  const emulateCompilation = useCallback(async (
    code: string,
    signal?: AbortSignal
  ): Promise<CompiledContract> => {
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      if (signal?.aborted) {
        throw new Error('Compilation cancelled');
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return {
      boc: generateMockBoc(code),
      hash: generateMockHash(),
      size: code.length * 2,
      warnings: generateWarnings(code)
    };
  }, [generateMockBoc, generateMockHash, generateWarnings]);

  /**
   * Реальная компиляция (если есть TonCompiler)
   */
  const compileWithTon = useCallback(async (
    code: string,
    options: CompilerOptions = {}
  ): Promise<CompiledContract> => {
    const tonCompiler = (window as any).TonCompiler;
    
    if (tonCompiler?.compile) {
      try {
        const result = await tonCompiler.compile(code, {
          version: 'latest',
          optimize: options.optimize !== false,
          debug: options.debug || false
        });
        
        return {
          boc: result.boc,
          hash: result.hash,
          size: result.boc.length,
          warnings: result.warnings || []
        };
      } catch (error: any) {
        throw new Error(`Compilation failed: ${error.message}`);
      }
    }
    
    // Если нет TonCompiler, используем эмуляцию
    return emulateCompilation(code, options.signal);
  }, [emulateCompilation]);

  /**
   * Основная функция компиляции
   */
  const compile = useCallback(async (
    code: string,
    fileName: string = 'contract.fc',
    options: CompilerOptions = {}
  ): Promise<CompilationResult> => {
    // Отменяем предыдущую компиляцию
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Создаем новый AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const { onProgress, optimize = true, debug = false } = options;

    setIsCompiling(true);
    setCompilationProgress(0);
    
    try {
      // Шаг 1: Валидация (20%)
      onProgress?.(20, 'validating');
      const validationErrors = await validate(code);
      
      const hasErrors = validationErrors.some(e => e.severity === 'error');
      if (hasErrors) {
        const result: CompilationResult = {
          success: false,
          errors: validationErrors,
          warnings: validationErrors.filter(e => e.severity === 'warning').map(e => e.message)
        };
        setCompilationResult(result);
        return result;
      }
      
      if (signal.aborted) throw new Error('Compilation cancelled');

      // Шаг 2: Препроцессинг (40%)
      onProgress?.(40, 'preprocessing');
      const preprocessed = preprocessCode(code);
      
      if (signal.aborted) throw new Error('Compilation cancelled');

      // Шаг 3: Компиляция (60%)
      onProgress?.(60, 'compiling');
      const compiled = await compileWithTon(preprocessed, { signal, optimize, debug });
      
      if (signal.aborted) throw new Error('Compilation cancelled');

      // Шаг 4: Формирование результата (80%)
      onProgress?.(80, 'finalizing');
      const result: CompilationResult = {
        success: true,
        boc: compiled.boc,
        hash: compiled.hash,
        size: compiled.size,
        warnings: compiled.warnings,
        timestamp: new Date().toISOString()
      };
      
      // Шаг 5: Сохранение (100%)
      onProgress?.(100, 'saving');
      
      // Сохраняем результат в localStorage
      try {
        localStorage.setItem('last_compilation', JSON.stringify({
          boc: result.boc,
          hash: result.hash,
          timestamp: result.timestamp,
          size: result.size
        }));
        
        const history = localStorage.getItem('compilation_history');
        const compilations = history ? JSON.parse(history) : [];
        compilations.unshift({
          id: Date.now(),
          timestamp: result.timestamp,
          success: result.success,
          size: result.size
        });
        localStorage.setItem('compilation_history', JSON.stringify(compilations.slice(0, 50)));
      } catch (error) {
        console.error('Failed to save compilation result:', error);
      }
      
      setCompilationResult(result);
      return result;
      
    } catch (error: any) {
      if (error.message === 'Compilation cancelled') {
        const result: CompilationResult = {
          success: false,
          errors: [{
            line: 0,
            column: 0,
            message: 'Compilation cancelled',
            severity: 'error'
          }]
        };
        setCompilationResult(result);
        return result;
      }
      
      const result: CompilationResult = {
        success: false,
        errors: [{
          line: 0,
          column: 0,
          message: error.message || 'Compilation failed',
          severity: 'error'
        }]
      };
      setCompilationResult(result);
      return result;
      
    } finally {
      setIsCompiling(false);
      setCompilationProgress(0);
      abortControllerRef.current = null;
    }
  }, [validate, preprocessCode, compileWithTon]);

  /**
   * Очистка результата компиляции
   */
  const clearResult = useCallback(() => {
    setCompilationResult(null);
    setCompilationProgress(0);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Отмена текущей компиляции
   */
  const cancelCompilation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsCompiling(false);
      setCompilationProgress(0);
    }
  }, []);

  /**
   * Форматирование результата компиляции для отображения
   */
  const formatCompilationResult = useCallback((result: CompilationResult): string => {
    if (!result) return '';
    
    const lines: string[] = [];
    
    if (result.success) {
      lines.push('✅ Compilation successful!');
      if (result.size) {
        const size = result.size;
        if (size < 1024) {
          lines.push(`📦 Contract size: ${size} bytes`);
        } else {
          lines.push(`📦 Contract size: ${(size / 1024).toFixed(2)} KB`);
        }
      }
      if (result.hash) {
        lines.push(`🔑 Hash: ${result.hash.slice(0, 16)}...`);
      }
      if (result.warnings?.length) {
        lines.push(`⚠️ Warnings (${result.warnings.length}):`);
        result.warnings.forEach(w => lines.push(`   ${w}`));
      }
    } else {
      lines.push('❌ Compilation failed:');
      result.errors?.forEach(error => {
        if (error.line > 0) {
          lines.push(`   Line ${error.line}: ${error.message}`);
        } else {
          lines.push(`   ${error.message}`);
        }
      });
    }
    
    return lines.join('\n');
  }, []);

  /**
   * Получение размера контракта
   */
  const getContractSize = useCallback((boc: string): number => {
    return boc?.length || 0;
  }, []);

  /**
   * Получение статистики компиляций
   */
  const getCompilationStats = useCallback(() => {
    try {
      const history = localStorage.getItem('compilation_history');
      if (!history) return null;
      
      const compilations = JSON.parse(history);
      const successful = compilations.filter((c: any) => c.success).length;
      const failed = compilations.length - successful;
      
      return {
        total: compilations.length,
        successful,
        failed
      };
    } catch {
      return null;
    }
  }, []);

  return {
    compile,
    validate,
    isCompiling,
    compilationResult,
    compilationProgress,
    clearResult,
    cancelCompilation,
    formatCompilationResult,
    getContractSize,
    getCompilationStats
  };
};

export default useCompiler;