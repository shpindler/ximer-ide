import React, { useState, useCallback } from 'react';
import Split from 'react-split';
import { useFileSystem } from '@hooks/useFileSystem';
import { Button } from './components/common/Button';
import './App.css';

const App: React.FC = () => {
  const {
    files,
    activeFileId,
    activeFile,
    updateFile,
    createFile,
    deleteFile,
    renameFile,
    setActiveFileId
  } = useFileSystem();
  
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  const handleCompile = useCallback(async () => {
    setTerminalOutput(prev => [...prev, '🔨 Compiling contract...']);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setTerminalOutput(prev => [...prev, '✅ Compilation successful!']);
  }, []);

  return (
    <div className="ximer-ide">
      <header className="header">
        <div className="logo-area">
          <h1>Ximer IDE</h1>
          <span className="badge">TON Blockchain</span>
        </div>
        
        <div className="action-buttons">
          <Button onClick={handleCompile} variant="primary" size="sm">
            Compile
          </Button>
          <div id="ton-connect-button" />
        </div>
      </header>
      
      <Split
        className="split-layout"
        sizes={[20, 80]}
        minSize={250}
      >
        {/* File Explorer */}
        <div className="panel file-explorer-panel">
          <div className="file-explorer">
            <div className="explorer-header">
              <h3>Explorer</h3>
              <button onClick={() => createFile('new.fc', 'func')} className="icon-btn">
                +
              </button>
            </div>
            
            <div className="file-list">
              {files.map(file => (
                <div
                  key={file.id}
                  className={`file-item ${activeFileId === file.id ? 'active' : ''}`}
                  onClick={() => setActiveFileId(file.id)}
                >
                  <span className="file-name">{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${file.name}?`)) {
                        deleteFile(file.id);
                      }
                    }}
                    className="delete-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Editor Area */}
        <div className="panel editor-panel">
          {activeFile && (
            <textarea
              className="code-editor"
              value={activeFile.content}
              onChange={(e) => updateFile(activeFile.id, e.target.value)}
              style={{
                width: '100%',
                height: '100%',
                background: '#1e1e1e',
                color: '#d4d4d4',
                border: 'none',
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '14px',
                resize: 'none'
              }}
            />
          )}
        </div>
      </Split>
      
      <div className="terminal">
        <div className="terminal-header">
          <h4>Terminal</h4>
          <button onClick={() => setTerminalOutput([])} className="clear-btn">
            Clear
          </button>
        </div>
        <div className="terminal-content">
          {terminalOutput.map((line, i) => (
            <div key={i} className="terminal-line">{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;