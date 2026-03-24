import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { File, Project } from '../types/editor';
import { getFileLanguage, getTemplateContent } from '../utils/fileUtils';

const DEFAULT_FILES: File[] = [
  {
    id: uuidv4(),
    name: 'main.fc',
    content: `;; Ximer IDE - TON Smart Contract
;; Simple counter contract

#pragma version >=0.4.0;

;; Storage structure
;; slot#0: counter (int)

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    if (in_msg_body.slice_empty?()) { return (); }
    
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);
    
    if (op == 1) { ;; increment
        var ds = get_data().begin_parse();
        int counter = ds~load_uint(32);
        counter += 1;
        set_data(begin_cell().store_uint(counter, 32).end_cell());
    }
}

int get_counter() method_id {
    var ds = get_data().begin_parse();
    return ds~load_uint(32);
}`,
    language: 'func',
    lastModified: new Date()
  }
];

export const useFileSystem = (projectId?: string) => {
  const [files, setFiles] = useState<File[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const savedProject = localStorage.getItem(`project_${projectId || 'default'}`);
        if (savedProject) {
          const parsed = JSON.parse(savedProject);
          setFiles(parsed.files);
          setActiveFileId(parsed.activeFileId);
        } else {
          setFiles(DEFAULT_FILES);
          setActiveFileId(DEFAULT_FILES[0].id);
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        setFiles(DEFAULT_FILES);
        setActiveFileId(DEFAULT_FILES[0].id);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (files.length > 0 && !isLoading) {
      const project = {
        id: projectId || 'default',
        name: 'My TON Project',
        files,
        activeFileId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      localStorage.setItem(`project_${project.id}`, JSON.stringify(project));
    }
  }, [files, activeFileId, projectId, isLoading]);

  const getActiveFile = useCallback((): File | undefined => {
    return files.find(f => f.id === activeFileId);
  }, [files, activeFileId]);

  const updateFile = useCallback((fileId: string, content: string) => {
    setFiles(prev => prev.map(file =>
      file.id === fileId
        ? { ...file, content, lastModified: new Date() }
        : file
    ));
  }, []);

  const createFile = useCallback((name: string, language: File['language'] = 'func') => {
    const newFile: File = {
      id: uuidv4(),
      name,
      content: getTemplateContent(language),
      language,
      lastModified: new Date()
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  }, []);

  const deleteFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      if (activeFileId === fileId && newFiles.length > 0) {
        setActiveFileId(newFiles[0].id);
      }
      return newFiles;
    });
  }, [activeFileId]);

  const renameFile = useCallback((fileId: string, newName: string) => {
    setFiles(prev => prev.map(file =>
      file.id === fileId
        ? { ...file, name: newName, language: getFileLanguage(newName), lastModified: new Date() }
        : file
    ));
  }, []);

  return {
    files,
    activeFileId,
    activeFile: getActiveFile(),
    isLoading,
    updateFile,
    createFile,
    deleteFile,
    renameFile,
    setActiveFileId
  };
};