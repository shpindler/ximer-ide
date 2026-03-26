import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  Move,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { FileNode, FileType } from '../../types/file-system';
import { getFileIcon } from '@utils/file-system-templates';

interface FileExplorerProps {
  root: FileNode;
  currentPath: string;
  selectedNodeId: string | null;
  expandedFolders: Set<string>;
  onFileSelect: (node: FileNode) => void;
  onCreateFile: (name: string, type: FileType, parentId?: string) => Promise<void | FileNode>;
  onCreateDirectory: (name: string, parentId?: string) => Promise<void | FileNode>;
  onDeleteNode: (nodeId: string) => Promise<void>;
  onRenameNode: (nodeId: string, newName: string) => Promise<void>;
  onToggleFolder: (nodeId: string) => void;
  onCopyNode: (nodeId: string, targetParentId: string) => Promise<void>;
  onMoveNode: (nodeId: string, targetParentId: string) => Promise<void>;
}

const FileTreeItem: React.FC<{
  node: FileNode;
  level: number;
  selectedNodeId: string | null;
  expandedFolders: Set<string>;
  onSelect: (node: FileNode) => void;
  onToggle: (nodeId: string) => void;
  onRename: (nodeId: string, newName: string) => Promise<void>;
  onDelete: (nodeId: string) => Promise<void>;
  onCreateFile: (parentId: string) => void;
  onCreateDirectory: (parentId: string) => void;
  onCopy?: (nodeId: string) => void;
  onMove?: (nodeId: string) => void;
}> = ({
  node,
  level,
  selectedNodeId,
  expandedFolders,
  onSelect,
  onToggle,
  onRename,
  onDelete,
  onCreateFile,
  onCreateDirectory,
  onCopy,
  onMove
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const isExpanded = expandedFolders.has(node.id);
  const isSelected = selectedNodeId === node.id;

  const handleRename = async () => {
    if (editName && editName !== node.name) {
      await onRename(node.id, editName);
    }
    setIsEditing(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(true);
    setTimeout(() => setShowContextMenu(false), 3000);
  };

  return (
    <div>
      <div
        className={`file-tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 20}px` }}
        onClick={() => onSelect(node)}
        onContextMenu={handleContextMenu}
      >
        {node.type === 'directory' && (
          <button
            className="expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
        
        <span className="file-icon">
          {node.type === 'directory' 
            ? (isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />)
            : <span>{getFileIcon(node.language || 'txt')}</span>
          }
        </span>
        
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyPress={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
            className="rename-input"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="file-name">{node.name}</span>
        )}
        
        <div className="file-actions">
          {node.type === 'directory' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFile(node.id);
                }}
                title="New file"
              >
                <Plus size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateDirectory(node.id);
                }}
                title="New folder"
              >
                <Folder size={12} />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Rename"
          >
            <Edit2 size={12} />
          </button>
          {onCopy && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy(node.id);
              }}
              title="Copy"
            >
              <Copy size={12} />
            </button>
          )}
          {onMove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMove(node.id);
              }}
              title="Move"
            >
              <Move size={12} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete ${node.name}?`)) {
                onDelete(node.id);
              }
            }}
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      {node.type === 'directory' && isExpanded && node.children && (
        <div className="file-tree-children">
          {node.children.map(child => (
            <FileTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedNodeId={selectedNodeId}
              expandedFolders={expandedFolders}
              onSelect={onSelect}
              onToggle={onToggle}
              onRename={onRename}
              onDelete={onDelete}
              onCreateFile={onCreateFile}
              onCreateDirectory={onCreateDirectory}
              onCopy={onCopy}
              onMove={onMove}
            />
          ))}
        </div>
      )}
      
      {showContextMenu && (
        <div className="context-menu">
          <button onClick={() => onCreateFile(node.id)}>New File</button>
          <button onClick={() => onCreateDirectory(node.id)}>New Folder</button>
          <button onClick={() => setIsEditing(true)}>Rename</button>
          <button onClick={() => onDelete(node.id)}>Delete</button>
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
  root,
  currentPath,
  selectedNodeId,
  expandedFolders,
  onFileSelect,
  onCreateFile,
  onCreateDirectory,
  onDeleteNode,
  onRenameNode,
  onToggleFolder,
  onCopyNode,
  onMoveNode
}) => {
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<FileType>('func');
  const [targetParentId, setTargetParentId] = useState<string | null>(null);

  const handleCreateFile = async () => {
    if (newFileName) {
      await onCreateFile(newFileName, newFileType, targetParentId || undefined);
      setNewFileName('');
      setShowNewFileDialog(false);
    }
  };

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <h3>Explorer</h3>
        <div className="explorer-actions">
          <button onClick={() => {
            setTargetParentId(null);
            setShowNewFileDialog(true);
          }} title="New file">
            <Plus size={16} />
          </button>
          <button onClick={() => onCreateDirectory('new-folder')} title="New folder">
            <Folder size={16} />
          </button>
        </div>
      </div>
      
      {showNewFileDialog && (
        <div className="new-file-dialog">
          <input
            type="text"
            placeholder="filename.fc"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
            autoFocus
          />
          <select
            value={newFileType}
            onChange={(e) => setNewFileType(e.target.value as FileType)}
          >
            <option value="func">FunC (.fc)</option>
            <option value="tact">Tact (.tact)</option>
            <option value="typescript">TypeScript (.ts)</option>
            <option value="javascript">JavaScript (.js)</option>
            <option value="json">JSON (.json)</option>
            <option value="md">Markdown (.md)</option>
            <option value="txt">Text (.txt)</option>
          </select>
          <div className="dialog-actions">
            <button onClick={handleCreateFile}>Create</button>
            <button onClick={() => setShowNewFileDialog(false)}>Cancel</button>
          </div>
        </div>
      )}
      
      <div className="file-tree">
        <FileTreeItem
          node={root}
          level={0}
          selectedNodeId={selectedNodeId}
          expandedFolders={expandedFolders}
          onSelect={onFileSelect}
          onToggle={onToggleFolder}
          onRename={onRenameNode}
          onDelete={onDeleteNode}
          onCreateFile={(parentId) => {
            setTargetParentId(parentId);
            setShowNewFileDialog(true);
          }}
          onCreateDirectory={(parentId) => onCreateDirectory('new-folder', parentId)}
          onCopy={(nodeId) => {
            const targetParent = prompt('Enter target folder path:');
            if (targetParent) {
              // Find parent by path logic
            }
          }}
          onMove={(nodeId) => {
            const targetParent = prompt('Enter target folder path:');
            if (targetParent) {
              // Find parent by path logic
            }
          }}
        />
      </div>
    </div>
  );
};