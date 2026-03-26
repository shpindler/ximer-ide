import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FileNode, FileType, FileSystemState, FileSystemActions } from '../types/file-system';
import { getFileTemplate, getFileExtension } from '../utils/file-system-templates';

const createEmptyDirectory = (name: string, parentId: string | null, path: string): FileNode => ({
  id: uuidv4(),
  name,
  type: 'directory',
  parentId,
  path,
  children: [],
  lastModified: new Date()
});

const createFileNode = (
  name: string,
  type: FileType,
  parentId: string | null,
  path: string
): FileNode => ({
  id: uuidv4(),
  name,
  type: 'file',
  parentId,
  path,
  content: getFileTemplate(type, name),
  language: type,
  lastModified: new Date(),
  size: getFileTemplate(type, name).length
});

const initialState: FileSystemState = {
  root: {
    id: 'root',
    name: 'root',
    type: 'directory',
    parentId: null,
    path: '/',
    children: [
      {
        id: uuidv4(),
        name: 'contracts',
        type: 'directory',
        parentId: 'root',
        path: '/contracts',
        children: [
          {
            id: uuidv4(),
            name: 'main.fc',
            type: 'file',
            parentId: 'contracts',
            path: '/contracts/main.fc',
            content: getFileTemplate('func', 'main.fc'),
            language: 'func',
            lastModified: new Date(),
            size: getFileTemplate('func', 'main.fc').length
          }
        ],
        lastModified: new Date()
      },
      {
        id: uuidv4(),
        name: 'tests',
        type: 'directory',
        parentId: 'root',
        path: '/tests',
        children: [],
        lastModified: new Date()
      },
      {
        id: uuidv4(),
        name: 'scripts',
        type: 'directory',
        parentId: 'root',
        path: '/scripts',
        children: [
          {
            id: uuidv4(),
            name: 'deploy.ts',
            type: 'file',
            parentId: 'scripts',
            path: '/scripts/deploy.ts',
            content: getFileTemplate('typescript', 'deploy.ts'),
            language: 'typescript',
            lastModified: new Date(),
            size: getFileTemplate('typescript', 'deploy.ts').length
          }
        ],
        lastModified: new Date()
      },
      {
        id: uuidv4(),
        name: 'readme.md',
        type: 'file',
        parentId: 'root',
        path: '/readme.md',
        content: getFileTemplate('md', 'readme.md'),
        language: 'md',
        lastModified: new Date(),
        size: getFileTemplate('md', 'readme.md').length
      }
    ],
    lastModified: new Date()
  },
  currentPath: '/',
  selectedNodeId: null,
  expandedFolders: new Set(['root', 'contracts', 'scripts'])
};

// Поиск узла по ID
const findNode = (node: FileNode, nodeId: string): FileNode | null => {
  if (node.id === nodeId) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, nodeId);
      if (found) return found;
    }
  }
  return null;
};

// Поиск узла по пути
const findNodeByPath = (node: FileNode, path: string): FileNode | null => {
  if (node.path === path) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeByPath(child, path);
      if (found) return found;
    }
  }
  return null;
};

// Обновление узла
const updateNode = (
  node: FileNode, 
  nodeId: string, 
  updater: (node: FileNode) => FileNode
): FileNode => {
  if (node.id === nodeId) return updater(node);
  if (node.children) {
    return {
      ...node,
      children: node.children.map(child => updateNode(child, nodeId, updater))
    };
  }
  return node;
};

// Рекурсивное обновление путей всех дочерних узлов
const updateChildPaths = (node: FileNode, oldPath: string, newPath: string): FileNode => {
  const updatedPath = node.path.replace(oldPath, newPath);
  
  if (node.children && node.children.length > 0) {
    return {
      ...node,
      path: updatedPath,
      children: node.children.map(child => updateChildPaths(child, oldPath, newPath)),
      lastModified: new Date()
    };
  }
  
  return {
    ...node,
    path: updatedPath,
    lastModified: new Date()
  };
};

export const useFileSystem = (): FileSystemActions & FileSystemState => {
  const [state, setState] = useState<FileSystemState>(() => {
    const saved = localStorage.getItem('fileSystem');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.expandedFolders = new Set(parsed.expandedFolders);
        return parsed;
      } catch {
        return initialState;
      }
    }
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem('fileSystem', JSON.stringify({
      ...state,
      expandedFolders: Array.from(state.expandedFolders)
    }));
  }, [state]);

  const getNode = useCallback((nodeId: string): FileNode | null => {
    return findNode(state.root, nodeId);
  }, [state.root]);

  const getNodeByPath = useCallback((path: string): FileNode | null => {
    return findNodeByPath(state.root, path);
  }, [state.root]);

  const getCurrentDirectory = useCallback((): FileNode | null => {
    return findNodeByPath(state.root, state.currentPath);
  }, [state.root, state.currentPath]);

  const getDirectoryContents = useCallback((nodeId: string): FileNode[] => {
    const node = getNode(nodeId);
    return node?.children || [];
  }, [getNode]);

  const createFile = useCallback(async (
    name: string,
    type: FileType,
    parentId?: string
  ): Promise<FileNode> => {
    const parent = parentId ? getNode(parentId) : getCurrentDirectory();
    if (!parent || parent.type !== 'directory') {
      throw new Error('Invalid parent directory');
    }

    const fullName = name.includes('.') ? name : name + getFileExtension(type);
    const newPath = parent.path === '/' ? `/${fullName}` : `${parent.path}/${fullName}`;
    
    const newFile = createFileNode(fullName, type, parent.id, newPath);
    
    setState(prev => ({
      ...prev,
      root: updateNode(prev.root, parent.id, (node) => ({
        ...node,
        children: [...(node.children || []), newFile],
        lastModified: new Date()
      }))
    }));
    
    return newFile;
  }, [getNode, getCurrentDirectory]);

  const createDirectory = useCallback(async (name: string, parentId?: string): Promise<FileNode> => {
    const parent = parentId ? getNode(parentId) : getCurrentDirectory();
    if (!parent || parent.type !== 'directory') {
      throw new Error('Invalid parent directory');
    }

    const newPath = parent.path === '/' ? `/${name}` : `${parent.path}/${name}`;
    const newDir = createEmptyDirectory(name, parent.id, newPath);
    
    setState(prev => ({
      ...prev,
      root: updateNode(prev.root, parent.id, (node) => ({
        ...node,
        children: [...(node.children || []), newDir],
        lastModified: new Date()
      })),
      expandedFolders: new Set([...prev.expandedFolders, newDir.id])
    }));
    
    return newDir;
  }, [getNode, getCurrentDirectory]);

  const deleteNode = useCallback(async (nodeId: string): Promise<void> => {
    const node = getNode(nodeId);
    if (!node || node.id === 'root') return;

    setState(prev => {
      const removeNode = (currentNode: FileNode, targetId: string): FileNode => {
        if (currentNode.id === targetId) {
          return currentNode;
        }
        
        if (currentNode.children) {
          const filteredChildren = currentNode.children
            .map(child => removeNode(child, targetId))
            .filter(child => child.id !== targetId);
          
          if (filteredChildren.length !== currentNode.children.length) {
            return {
              ...currentNode,
              children: filteredChildren,
              lastModified: new Date()
            };
          }
        }
        
        return currentNode;
      };
      
      const newRoot = removeNode(prev.root, nodeId);
      
      const isCurrentPathDeleted = prev.currentPath === node.path || 
        prev.currentPath.startsWith(node.path + '/');
      
      return {
        ...prev,
        root: newRoot,
        selectedNodeId: prev.selectedNodeId === nodeId ? null : prev.selectedNodeId,
        currentPath: isCurrentPathDeleted ? '/' : prev.currentPath,
        expandedFolders: new Set(
          Array.from(prev.expandedFolders).filter(id => id !== nodeId)
        )
      };
    });
  }, [getNode]);

  // Исправленная функция переименования
  const renameNode = useCallback(async (nodeId: string, newName: string): Promise<void> => {
    const node = getNode(nodeId);
    if (!node) return;

    setState(prev => {
      // Получаем родительский путь
      const parentPath = node.path.substring(0, node.path.lastIndexOf('/'));
      const oldPath = node.path;
      const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;
      
      // Обновляем узел и все его дочерние элементы
      const updateNodeWithChildren = (currentNode: FileNode): FileNode => {
        if (currentNode.id === nodeId) {
          // Обновляем текущий узел
          const updatedNode = {
            ...currentNode,
            name: newName,
            path: newPath,
            lastModified: new Date()
          };
          
          // Обновляем пути всех дочерних элементов
          if (updatedNode.children) {
            updatedNode.children = updatedNode.children.map(child => 
              updateChildPaths(child, oldPath, newPath)
            );
          }
          
          return updatedNode;
        }
        
        // Если это не целевой узел, но путь начинается со старого пути, обновляем
        if (currentNode.path.startsWith(oldPath + '/')) {
          const updatedPath = currentNode.path.replace(oldPath, newPath);
          return {
            ...currentNode,
            path: updatedPath,
            lastModified: new Date(),
            children: currentNode.children?.map(child => 
              updateChildPaths(child, oldPath, newPath)
            )
          };
        }
        
        // Рекурсивно обновляем детей
        if (currentNode.children) {
          return {
            ...currentNode,
            children: currentNode.children.map(child => updateNodeWithChildren(child))
          };
        }
        
        return currentNode;
      };
      
      const newRoot = updateNodeWithChildren(prev.root);
      
      // Обновляем currentPath если он относится к переименованному узлу
      let newCurrentPath = prev.currentPath;
      if (prev.currentPath === oldPath) {
        newCurrentPath = newPath;
      } else if (prev.currentPath.startsWith(oldPath + '/')) {
        newCurrentPath = prev.currentPath.replace(oldPath, newPath);
      }
      
      return {
        ...prev,
        root: newRoot,
        currentPath: newCurrentPath
      };
    });
  }, [getNode]);

  const updateFileContent = useCallback(async (nodeId: string, content: string): Promise<void> => {
    const node = getNode(nodeId);
    if (!node || node.type !== 'file') return;

    setState(prev => ({
      ...prev,
      root: updateNode(prev.root, nodeId, (n) => ({
        ...n,
        content,
        size: content.length,
        lastModified: new Date()
      }))
    }));
  }, [getNode]);

  const moveNode = useCallback(async (nodeId: string, targetParentId: string): Promise<void> => {
    const node = getNode(nodeId);
    const targetParent = getNode(targetParentId);
    
    if (!node || !targetParent || targetParent.type !== 'directory') return;
    if (node.id === targetParentId) return;

    const oldPath = node.path;
    const newPath = targetParent.path === '/' ? `/${node.name}` : `${targetParent.path}/${node.name}`;
    
    // Сохраняем копию узла с обновленными путями
    const updatePaths = (n: FileNode): FileNode => ({
      ...n,
      path: n.path.replace(oldPath, newPath),
      parentId: targetParentId,
      lastModified: new Date(),
      children: n.children?.map(child => updatePaths(child))
    });
    
    const movedNode = updatePaths({ ...node });
    
    // Удаляем из старого места и добавляем в новое
    setState(prev => {
      // Сначала удаляем
      const afterDelete = (() => {
        const removeNode = (currentNode: FileNode, targetId: string): FileNode => {
          if (currentNode.id === targetId) return currentNode;
          if (currentNode.children) {
            const filtered = currentNode.children
              .map(child => removeNode(child, targetId))
              .filter(child => child.id !== targetId);
            return { ...currentNode, children: filtered };
          }
          return currentNode;
        };
        return removeNode(prev.root, nodeId);
      })();
      
      // Затем добавляем в новое место
      const addNode = (currentNode: FileNode): FileNode => {
        if (currentNode.id === targetParentId) {
          return {
            ...currentNode,
            children: [...(currentNode.children || []), movedNode],
            lastModified: new Date()
          };
        }
        if (currentNode.children) {
          return {
            ...currentNode,
            children: currentNode.children.map(child => addNode(child))
          };
        }
        return currentNode;
      };
      
      const newRoot = addNode(afterDelete);
      
      // Обновляем currentPath если перемещаем текущую директорию
      let newCurrentPath = prev.currentPath;
      if (prev.currentPath === oldPath) {
        newCurrentPath = newPath;
      } else if (prev.currentPath.startsWith(oldPath + '/')) {
        newCurrentPath = prev.currentPath.replace(oldPath, newPath);
      }
      
      return {
        ...prev,
        root: newRoot,
        currentPath: newCurrentPath
      };
    });
  }, [getNode]);

  const copyNode = useCallback(async (nodeId: string, targetParentId: string): Promise<FileNode> => {
    const node = getNode(nodeId);
    const targetParent = getNode(targetParentId);
    
    if (!node || !targetParent || targetParent.type !== 'directory') {
      throw new Error('Invalid copy operation');
    }

    const copyName = `${node.name}_copy`;
    const newPath = targetParent.path === '/' ? `/${copyName}` : `${targetParent.path}/${copyName}`;
    
    const copyNodeFn = (n: FileNode): FileNode => ({
      ...n,
      id: uuidv4(),
      name: n.id === node.id ? copyName : n.name,
      parentId: n.id === node.id ? targetParentId : n.parentId,
      path: n.path.replace(node.path, newPath),
      lastModified: new Date(),
      children: n.children?.map(child => copyNodeFn(child))
    });
    
    const copy = copyNodeFn(node);
    
    setState(prev => ({
      ...prev,
      root: updateNode(prev.root, targetParentId, (parent) => ({
        ...parent,
        children: [...(parent.children || []), copy],
        lastModified: new Date()
      }))
    }));
    
    return copy;
  }, [getNode]);

  const toggleFolder = useCallback((nodeId: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedFolders);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return { ...prev, expandedFolders: newExpanded };
    });
  }, []);

  const setCurrentPath = useCallback((path: string) => {
    setState(prev => ({ ...prev, currentPath: path }));
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    setState(prev => ({ ...prev, selectedNodeId: nodeId }));
  }, []);

  return {
    ...state,
    createFile,
    createDirectory,
    deleteNode,
    renameNode,
    updateFileContent,
    moveNode,
    copyNode,
    getNode,
    getNodeByPath,
    getCurrentDirectory,
    getDirectoryContents,
    toggleFolder,
    setCurrentPath,
    selectNode
  };
};