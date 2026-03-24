export interface File {
  id: string;
  name: string;
  content: string;
  language: 'func' | 'typescript' | 'javascript' | 'json';
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
}

export interface CompilationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}