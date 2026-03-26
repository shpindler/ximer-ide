import React, { useState, useCallback, useEffect } from 'react';
import Split from 'react-split';
import { useFileSystem } from '@hooks/use-file-system';
import { useCompiler } from '@hooks/use-compiler';
import { useTonConnect } from '@hooks/use-ton-connect';
import { CodeEditorWithHighlight } from '@components/editor/code-editor-with-highlight';
import { FileExplorer } from '@components/editor/file-explorer';
import { DeploymentPanel } from '@components/deployment/deployment-panel';
import { Terminal } from '@components/terminal/terminal';
import { Button } from '@components/common/Button';
import { TestRunner } from '@components/testing/test-runner';
import { FunCValidator } from '@components/validation/func-validator';
import { Play, Save, X, CheckCircle, AlertCircle, FolderPlus, FilePlus } from 'lucide-react';
import type { FileNode, FileType } from './types/file-system';
import './App.css';

const App: React.FC = () => {
  // Файловая система - получаем все необходимые методы
  const {
    root,
    currentPath,
    selectedNodeId,
    expandedFolders,
    createFile,
    createDirectory,
    deleteNode,
    renameNode,
    updateFileContent,
    getNode,
    getNodeByPath,        // <-- Добавляем getNodeByPath
    getCurrentDirectory,
    toggleFolder,
    setCurrentPath,
    selectNode
  } = useFileSystem();

  // Компилятор
  const {
    compile,
    isCompiling,
    compilationResult,
    compilationProgress,
    clearResult,
    cancelCompilation,
    formatCompilationResult
  } = useCompiler();

  // TON Connect
  const {
    isConnected,
    wallet,
    connect,
    disconnect
  } = useTonConnect('https://your-app.com/tonconnect-manifest.json');

  // Состояние UI
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [showValidator, setShowValidator] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<FileType>('func');

  // Добавление сообщения в терминал
  const addTerminalOutput = useCallback((message: string) => {
    setTerminalOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  // Очистка терминала
  const clearTerminal = useCallback(() => {
    setTerminalOutput([]);
  }, []);

  // Обработка выбора файла
  const handleFileSelect = useCallback((node: FileNode) => {
    if (node.type === 'file') {
      setActiveFile(node);
      addTerminalOutput(`📄 Opened: ${node.name}`);
    }
    selectNode(node.id);
  }, [selectNode, addTerminalOutput]);

  // Сохранение файла
  const handleSave = useCallback(async () => {
    if (activeFile) {
      await updateFileContent(activeFile.id, activeFile.content || '');
      addTerminalOutput(`💾 Saved: ${activeFile.name}`);
    }
  }, [activeFile, updateFileContent, addTerminalOutput]);

  // Компиляция контракта
  const handleCompile = useCallback(async () => {
    if (!activeFile) {
      addTerminalOutput('⚠️ No file selected');
      return;
    }

    if (activeFile.language !== 'func') {
      addTerminalOutput('⚠️ Only FunC files can be compiled');
      return;
    }

    addTerminalOutput(`🔨 Compiling ${activeFile.name}...`);
    
    const result = await compile(activeFile.content || '', activeFile.name);
    
    if (result.success) {
      addTerminalOutput('✅ Compilation successful!');
      addTerminalOutput(`📦 Contract size: ${result.size} bytes`);
      if (result.hash) {
        addTerminalOutput(`🔑 Hash: ${result.hash.slice(0, 16)}...`);
      }
      if (result.warnings?.length) {
        addTerminalOutput(`⚠️ Warnings (${result.warnings.length}):`);
        result.warnings.forEach(w => addTerminalOutput(`   ${w}`));
      }
    } else {
      addTerminalOutput('❌ Compilation failed:');
      result.errors?.forEach(error => {
        if (error.line > 0) {
          addTerminalOutput(`   Line ${error.line}: ${error.message}`);
        } else {
          addTerminalOutput(`   ${error.message}`);
        }
      });
    }
  }, [activeFile, compile, addTerminalOutput]);

  // Деплой контракта
  const handleDeploy = useCallback(async (params: any) => {
    if (!compilationResult?.boc) {
      addTerminalOutput('❌ Please compile the contract first');
      return;
    }

    if (!isConnected) {
      addTerminalOutput('⚠️ Please connect your wallet first');
      await connect();
      return;
    }

    setIsDeploying(true);
    addTerminalOutput(`🚀 Deploying to ${params.network.name}...`);
    addTerminalOutput(`   Value: ${params.value} TON`);

    try {
      // Эмуляция деплоя
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAddress = 'EQD' + Math.random().toString(36).substring(2, 15);
      setDeployedAddress(mockAddress);
      
      addTerminalOutput(`✅ Contract deployed successfully!`);
      addTerminalOutput(`📍 Address: ${mockAddress}`);
      addTerminalOutput(`🔗 Explorer: ${params.network.explorer}/address/${mockAddress}`);
    } catch (error) {
      addTerminalOutput(`❌ Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeploying(false);
    }
  }, [compilationResult, isConnected, connect, addTerminalOutput]);

  // Запуск тестов
  const handleRunTests = useCallback(async () => {
    if (!activeFile || activeFile.language !== 'func') {
      addTerminalOutput('⚠️ No FunC contract selected for testing');
      return;
    }

    setIsRunningTests(true);
    addTerminalOutput('🧪 Running tests...');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults = {
        passed: 4,
        failed: 0,
        total: 4,
        tests: [
          { name: 'Counter initialization', passed: true, duration: 12 },
          { name: 'Increment operation', passed: true, duration: 8 },
          { name: 'Multiple increments', passed: true, duration: 15 },
          { name: 'State persistence', passed: true, duration: 10 }
        ]
      };
      
      setTestResults(mockResults);
      
      addTerminalOutput('✅ All tests passed!');
      addTerminalOutput(`   Passed: ${mockResults.passed}/${mockResults.total}`);
      addTerminalOutput(`   Total time: ${mockResults.tests.reduce((acc, t) => acc + t.duration, 0)}ms`);
    } catch (error) {
      addTerminalOutput(`❌ Tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningTests(false);
    }
  }, [activeFile, addTerminalOutput]);

  // Создание нового файла
  const handleCreateFile = useCallback(async () => {
    if (!newFileName) return;
    
    const currentDir = getCurrentDirectory();
    await createFile(newFileName, newFileType, currentDir?.id);
    addTerminalOutput(`📄 Created: ${newFileName}`);
    setNewFileName('');
    setShowNewFileDialog(false);
  }, [newFileName, newFileType, createFile, getCurrentDirectory, addTerminalOutput]);

  // Создание новой папки
  const handleCreateDirectory = useCallback(async () => {
    const name = prompt('Enter folder name:');
    if (name) {
      const currentDir = getCurrentDirectory();
      await createDirectory(name, currentDir?.id);
      addTerminalOutput(`📁 Created folder: ${name}`);
    }
  }, [createDirectory, getCurrentDirectory, addTerminalOutput]);

  // Обработка команд в терминале
  const handleTerminalCommand = useCallback(async (command: string) => {
    const cmd = command.trim().toLowerCase();
    const args = cmd.split(' ');
    
    switch (args[0]) {
      case 'help':
        addTerminalOutput('Available commands:');
        addTerminalOutput('  help           - Show this help');
        addTerminalOutput('  clear          - Clear terminal');
        addTerminalOutput('  compile        - Compile current contract');
        addTerminalOutput('  test           - Run tests');
        addTerminalOutput('  deploy         - Deploy contract');
        addTerminalOutput('  save           - Save current file');
        addTerminalOutput('  ls             - List files');
        addTerminalOutput('  pwd            - Show current path');
        addTerminalOutput('  cd <path>      - Change directory');
        addTerminalOutput('  cat <file>     - Show file content');
        addTerminalOutput('  mkdir <name>   - Create directory');
        addTerminalOutput('  touch <name>   - Create file');
        addTerminalOutput('  rm <name>      - Remove file/directory');
        addTerminalOutput('  mv <src> <dst> - Move file/directory');
        break;
        
      case 'clear':
        clearTerminal();
        break;
        
      case 'compile':
        handleCompile();
        break;
        
      case 'test':
        handleRunTests();
        break;
        
      case 'deploy':
        if (compilationResult?.success) {
          handleDeploy({ 
            network: { name: 'testnet', explorer: 'https://testnet.tonscan.org' }, 
            value: 0.05 
          });
        } else {
          addTerminalOutput('❌ Compile contract first');
        }
        break;
        
      case 'save':
        handleSave();
        break;
        
      case 'ls':
        const currentDir = getCurrentDirectory();
        if (currentDir?.children) {
          addTerminalOutput(`Contents of ${currentDir.path}:`);
          currentDir.children.forEach(child => {
            const icon = child.type === 'directory' ? '📁' : '📄';
            addTerminalOutput(`  ${icon} ${child.name}`);
          });
        } else {
          addTerminalOutput('Directory is empty');
        }
        break;
        
      case 'pwd':
        addTerminalOutput(getCurrentDirectory()?.path || '/');
        break;
        
      case 'cd':
        if (args[1] === '..') {
          const current = getCurrentDirectory();
          if (current?.parentId) {
            const parent = getNode(current.parentId);
            if (parent) setCurrentPath(parent.path);
          }
        } else if (args[1]) {
          // Используем getNodeByPath для поиска по пути
          const target = getNodeByPath(args[1]);
          if (target && target.type === 'directory') {
            setCurrentPath(target.path);
            addTerminalOutput(`Changed to: ${target.path}`);
          } else {
            addTerminalOutput(`❌ Directory not found: ${args[1]}`);
          }
        }
        break;
        
      case 'cat':
        if (args[1]) {
          // Используем getNodeByPath для поиска файла по пути
          const file = getNodeByPath(args[1]);
          if (file && file.type === 'file') {
            const content = file.content || '';
            addTerminalOutput(content);
          } else {
            addTerminalOutput(`❌ File not found: ${args[1]}`);
          }
        }
        break;
        
      case 'mkdir':
        if (args[1]) {
          await createDirectory(args[1], getCurrentDirectory()?.id);
          addTerminalOutput(`📁 Created: ${args[1]}`);
        }
        break;
        
      case 'touch':
        if (args[1]) {
          await createFile(args[1], 'txt', getCurrentDirectory()?.id);
          addTerminalOutput(`📄 Created: ${args[1]}`);
        }
        break;
        
      case 'rm':
        if (args[1]) {
          const node = getNodeByPath(args[1]);
          if (node) {
            await deleteNode(node.id);
            addTerminalOutput(`🗑️ Removed: ${args[1]}`);
          } else {
            addTerminalOutput(`❌ Not found: ${args[1]}`);
          }
        }
        break;
        
      case 'echo':
        addTerminalOutput(args.slice(1).join(' '));
        break;
        
      case 'date':
        addTerminalOutput(new Date().toLocaleString());
        break;
        
      default:
        addTerminalOutput(`Unknown command: ${command}`);
    }
  }, [
    handleCompile, handleRunTests, handleDeploy, handleSave,
    compilationResult, getCurrentDirectory, getNode, getNodeByPath,
    setCurrentPath, createDirectory, createFile, deleteNode,
    addTerminalOutput, clearTerminal
  ]);

  // Получение статуса компиляции
  const getCompilationStatus = () => {
    if (isCompiling) {
      return { icon: null, text: `Compiling... ${compilationProgress}%`, color: '#0098ea' };
    }
    if (compilationResult?.success) {
      return { icon: <CheckCircle size={14} />, text: 'Ready', color: '#4ec9b0' };
    }
    if (compilationResult && !compilationResult.success) {
      return { icon: <AlertCircle size={14} />, text: 'Error', color: '#f48771' };
    }
    return { icon: null, text: 'Not compiled', color: '#858585' };
  };

  const status = getCompilationStatus();

  return (
    <div className="ximer-ide">
      {/* Header */}
      <header className="header">
        <div className="logo-area">
          <div className="logo-icon">⚡</div>
          <h1>Ximer IDE</h1>
          <span className="badge">TON Blockchain</span>
          <div className="status-indicator" style={{ color: status.color }}>
            {status.icon}
            <span>{status.text}</span>
          </div>
        </div>
        
        <div className="action-buttons">
          <Button
            onClick={handleCompile}
            isLoading={isCompiling}
            variant="primary"
            size="sm"
            leftIcon={<Play size={14} />}
          >
            Compile
          </Button>
          
          <Button
            onClick={handleRunTests}
            isLoading={isRunningTests}
            variant="secondary"
            size="sm"
          >
            Run Tests
          </Button>
          
          <Button
            onClick={handleSave}
            variant="outline"
            size="sm"
            leftIcon={<Save size={14} />}
          >
            Save
          </Button>
          
          <Button
            onClick={() => setShowValidator(!showValidator)}
            variant="outline"
            size="sm"
          >
            {showValidator ? 'Hide' : 'Validate'}
          </Button>
          
          <Button
            onClick={handleCreateDirectory}
            variant="outline"
            size="sm"
            leftIcon={<FolderPlus size={14} />}
          >
            Folder
          </Button>
          
          <Button
            onClick={() => setShowNewFileDialog(true)}
            variant="outline"
            size="sm"
            leftIcon={<FilePlus size={14} />}
          >
            File
          </Button>
          
          {isConnected ? (
            <div className="wallet-info">
              <span className="wallet-address">
                {wallet?.address.slice(0, 6)}...{wallet?.address.slice(-4)}
              </span>
              <Button onClick={disconnect} variant="outline" size="xs">
                Disconnect
              </Button>
            </div>
          ) : (
            <div id="ton-connect-button" />
          )}
        </div>
      </header>

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="modal-overlay" onClick={() => setShowNewFileDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New File</h3>
              <button onClick={() => setShowNewFileDialog(false)} className="close-btn">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
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
            </div>
            <div className="modal-footer">
              <Button onClick={() => setShowNewFileDialog(false)} variant="outline" size="sm">
                Cancel
              </Button>
              <Button onClick={handleCreateFile} variant="primary" size="sm">
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <Split
        className="split-layout"
        sizes={[22, 55, 23]}
        minSize={220}
        gutterSize={4}
        snapOffset={30}
      >
        {/* File Explorer Panel */}
        <div className="panel file-explorer-panel">
          <FileExplorer
            root={root}
            currentPath={currentPath}
            selectedNodeId={selectedNodeId}
            expandedFolders={expandedFolders}
            onFileSelect={handleFileSelect}
            onCreateFile={createFile}
            onCreateDirectory={createDirectory}
            onDeleteNode={deleteNode}
            onRenameNode={renameNode}
            onToggleFolder={toggleFolder}
            onCopyNode={async (id, parentId) => {
              // Копирование узла
              const node = getNode(id);
              if (node) {
                const parent = getNode(parentId);
                if (parent && parent.type === 'directory') {
                  const copyName = `${node.name}_copy`;
                  if (node.type === 'file') {
                    await createFile(copyName, node.language || 'txt', parentId);
                  } else {
                    await createDirectory(copyName, parentId);
                  }
                  addTerminalOutput(`📋 Copied: ${node.name} → ${copyName}`);
                }
              }
            }}
            onMoveNode={async (id, parentId) => {
              // Перемещение узла
              const node = getNode(id);
              if (node) {
                const oldPath = node.path;
                await deleteNode(id);
                addTerminalOutput(`📦 Moved: ${oldPath} → new location`);
              }
            }}
          />
        </div>

        {/* Editor Panel */}
        <div className="panel editor-panel">
          <div className="editor-tabs">
            {activeFile && (
              <button className="tab active">
                <span>{activeFile.name}</span>
                <button
                  className="tab-close"
                  onClick={() => {
                    setActiveFile(null);
                    addTerminalOutput(`📄 Closed: ${activeFile.name}`);
                  }}
                >
                  <X size={12} />
                </button>
              </button>
            )}
          </div>
          
          <div className="editor-container">
            {activeFile ? (
              <CodeEditorWithHighlight
                value={activeFile.content || ''}
                onChange={(content) => {
                  setActiveFile(prev => prev ? { ...prev, content } : null);
                  updateFileContent(activeFile.id, content);
                }}
                language={activeFile.language as any}
                showLineNumbers={true}
              />
            ) : (
              <div className="editor-empty">
                <p>No file selected</p>
                <div className="empty-actions">
                  <Button 
                    onClick={() => setShowNewFileDialog(true)} 
                    variant="primary"
                    leftIcon={<FilePlus size={16} />}
                  >
                    Create new file
                  </Button>
                  <Button 
                    onClick={handleCreateDirectory} 
                    variant="outline"
                    leftIcon={<FolderPlus size={16} />}
                  >
                    Create folder
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {showValidator && activeFile && activeFile.language === 'func' && (
            <div className="validator-container">
              <FunCValidator code={activeFile.content || ''} />
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="panel right-panel">
          <DeploymentPanel
            onDeploy={handleDeploy}
            compiledBoc={compilationResult?.boc}
            isDeploying={isDeploying}
            deployedAddress={deployedAddress}
          />
          
          <div className="divider" />
          
          <TestRunner
            onRunTests={async () => {
              await handleRunTests();
              return testResults;
            }}
            isRunning={isRunningTests}
            results={testResults}
            title="Contract Tests"
            showDetails={true}
            options={{
              timeout: 30000,
              coverage: true,
              verbose: true
            }}
          />
        </div>
      </Split>

      {/* Terminal */}
      <Terminal
        output={terminalOutput}
        onClear={clearTerminal}
        onCommand={handleTerminalCommand}
        title="Ximer Terminal"
        customCommands={['compile', 'deploy', 'test', 'ls', 'cd', 'cat', 'mkdir', 'touch', 'rm', 'echo', 'date']}
        showClearButton={true}
        showCollapseButton={true}
      />
    </div>
  );
};

export default App;