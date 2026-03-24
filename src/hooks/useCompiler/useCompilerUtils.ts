import { useCallback } from 'react';
import { compilerFormatter } from '../../services/compiler/compiler.formatter';

export const useCompilerUtils = () => {
  const formatCompilationResult = useCallback((result: any): string => {
    return compilerFormatter.formatResult(result);
  }, []);

  const getContractSize = useCallback((boc: string): number => {
    return compilerFormatter.getSize(boc);
  }, []);

  const getCompilationStats = useCallback(() => {
    const history = localStorage.getItem('compilation_history');
    if (!history) return null;

    try {
      const compilations = JSON.parse(history);
      const successful = compilations.filter((c: any) => c.success).length;
      const failed = compilations.length - successful;

      return {
        total: compilations.length,
        successful,
        failed,
        lastCompilation: compilations[compilations.length - 1]?.timestamp
      };
    } catch {
      return null;
    }
  }, []);

  return {
    formatCompilationResult,
    getContractSize,
    getCompilationStats
  };
};