import { useCompilerState } from './useCompilerState';
import { useCompilerActions } from './useCompilerActions';
import { useCompilerUtils } from './useCompilerUtils';

export interface UseCompilerReturn {
  compile: (code: string, fileName?: string) => Promise<any>;
  validate: (code: string) => Promise<any[]>;
  isCompiling: boolean;
  compilationResult: any;
  compilationProgress: number;
  clearResult: () => void;
  cancelCompilation: () => void;
  formatCompilationResult: (result: any) => string;
  getContractSize: (boc: string) => number;
  getCompilationStats: () => any;
}

export const useCompiler = (): UseCompilerReturn => {
  const state = useCompilerState();
  const actions = useCompilerActions(state);
  const utils = useCompilerUtils();

  return {
    ...state,
    ...actions,
    ...utils
  };
};