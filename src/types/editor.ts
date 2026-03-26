export interface File {
  id: string;
  name: string;
  content: string;
  language: 'func' | 'typescript' | 'javascript' | 'json' | 'md' | 'txt' | 'tact';
  lastModified: Date;
}

export interface Project {
  id: string;
  name: string;
  files: File[];
  activeFileId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompilationResult {
  success: boolean;
  boc?: string;
  hash?: string;
  size?: number;
  errors?: CompilationError[];
  warnings?: string[];
  timestamp?: string;
}

export interface CompilationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface CompilerOptions {
  version?: string;
  optimize?: boolean;
  debug?: boolean;
  outputFormat?: 'boc' | 'fift' | 'asm';
}