import { useCallback } from 'react';
import { compilerService } from '../../services/compiler/compiler.service';
import { CompilerState } from './useCompilerState';

export const useCompilerActions = (state: CompilerState) => {
  const {
    setIsCompiling,
    setCompilationResult,
    setCompilationProgress,
    abortControllerRef
  } = state;

  const compile = useCallback(async (
    code: string,
    fileName: string = 'contract.fc'
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsCompiling(true);
    setCompilationProgress(0);

    try {
      const result = await compilerService.compile(
        code,
        fileName,
        { signal, onProgress: setCompilationProgress }
      );
      setCompilationResult(result);
      return result;
    } catch (error: any) {
      const errorResult = {
        success: false,
        errors: [{ message: error.message, severity: 'error' }]
      };
      setCompilationResult(errorResult);
      return errorResult;
    } finally {
      setIsCompiling(false);
      setCompilationProgress(0);
      abortControllerRef.current = null;
    }
  }, [setIsCompiling, setCompilationProgress, setCompilationResult]);

  const validate = useCallback(async (code: string) => {
    return compilerService.validate(code);
  }, []);

  const clearResult = useCallback(() => {
    setCompilationResult(null);
    setCompilationProgress(0);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [setCompilationResult, setCompilationProgress]);

  const cancelCompilation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsCompiling(false);
      setCompilationProgress(0);
    }
  }, [setIsCompiling, setCompilationProgress]);

  return {
    compile,
    validate,
    clearResult,
    cancelCompilation
  };
};