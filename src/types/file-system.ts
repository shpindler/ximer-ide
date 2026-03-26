export type FileType = 'func' | 'tact' | 'typescript' | 'javascript' | 'json' | 'md' | 'txt';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  parentId: string | null;
  path: string;
  content?: string;
  language?: FileType;
  children?: FileNode[];
  lastModified: Date;
  size?: number;
}

export interface FileSystemState {
  root: FileNode;
  currentPath: string;
  selectedNodeId: string | null;
  expandedFolders: Set<string>;
}

export interface FileSystemActions {
  createFile: (name: string, type: FileType, parentId?: string) => Promise<FileNode>;
  createDirectory: (name: string, parentId?: string) => Promise<FileNode>;
  deleteNode: (nodeId: string) => Promise<void>;
  renameNode: (nodeId: string, newName: string) => Promise<void>;
  updateFileContent: (nodeId: string, content: string) => Promise<void>;
  moveNode: (nodeId: string, targetParentId: string) => Promise<void>;
  copyNode: (nodeId: string, targetParentId: string) => Promise<FileNode>;
  getNode: (nodeId: string) => FileNode | null;
  getNodeByPath: (path: string) => FileNode | null;
  getCurrentDirectory: () => FileNode | null;
  getDirectoryContents: (nodeId: string) => FileNode[];
  toggleFolder: (nodeId: string) => void;
  setCurrentPath: (path: string) => void;
  selectNode: (nodeId: string | null) => void;
}