import { useState, useRef } from 'react';

export interface CompilerState {
  isCompiling: boolean;
  compilationResult: any;
  compilationProgress: number;
}

export const useCompilerState = () => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationResult, setCompilationResult] = useState<any>(null);
  const [compilationProgress, setCompilationProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  return {
    isCompiling,
    setIsCompiling,
    compilationResult,
    setCompilationResult,
    compilationProgress,
    setCompilationProgress,
    abortControllerRef
  };
};