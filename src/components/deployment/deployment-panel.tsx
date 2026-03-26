import React, { useState, useCallback, useEffect } from 'react';
import { useTonConnect } from '@hooks/use-ton-connect';
import { Button } from '@components/common/Button';
import { NetworkSelector } from './network-selector';
import { DeploymentHistory } from './deployment-history';
import { Rocket, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react';
import './deployment-panel.css';

export interface Network {
  id: 'mainnet' | 'testnet';
  name: string;
  endpoint: string;
  explorer: string;
  chainId: number;
}

export interface DeploymentParams {
  network: Network;
  value: number;
  boc: string;
  initData?: string;
  initCode?: string;
}

export interface DeploymentResult {
  address: string;
  transactionHash: string;
  network: Network;
  timestamp: Date;
  value: number;
}

interface DeploymentPanelProps {
  onDeploy: (params: DeploymentParams) => Promise<DeploymentResult | void>;
  compiledBoc?: string;
  isDeploying?: boolean;
  deployedAddress?: string | null;
  className?: string;
}

const NETWORKS: Network[] = [
  {
    id: 'mainnet',
    name: 'Mainnet',
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    explorer: 'https://tonscan.org',
    chainId: -3
  },
  {
    id: 'testnet',
    name: 'Testnet',
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    explorer: 'https://testnet.tonscan.org',
    chainId: -239
  }
];

export const DeploymentPanel: React.FC<DeploymentPanelProps> = ({
  onDeploy,
  compiledBoc,
  isDeploying = false,
  deployedAddress = null,
  className = ''
}) => {
  const { isConnected, connect, formatAddress } = useTonConnect();
  
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(NETWORKS[1]);
  const [value, setValue] = useState<string>('0.05');
  const [isLoading, setIsLoading] = useState(false);
  const [localDeployedAddress, setLocalDeployedAddress] = useState<string | null>(deployedAddress);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentResult[]>([]);

  // Загрузка истории деплоев из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('deployment_history');
      if (saved) {
        const history = JSON.parse(saved);
        setDeploymentHistory(history.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        })));
      }
    } catch (err) {
      console.error('Failed to load deployment history:', err);
    }
  }, []);

  // Сохранение истории деплоев
  const saveToHistory = useCallback((result: DeploymentResult) => {
    const newHistory = [result, ...deploymentHistory].slice(0, 20);
    setDeploymentHistory(newHistory);
    localStorage.setItem('deployment_history', JSON.stringify(newHistory));
  }, [deploymentHistory]);

  // Обработка деплоя
  const handleDeploy = useCallback(async () => {
    if (!compiledBoc) {
      setError('Please compile the contract first');
      return;
    }

    if (!isConnected) {
      setError('Please connect your wallet first');
      await connect();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onDeploy({
        network: selectedNetwork,
        value: parseFloat(value),
        boc: compiledBoc
      });
      
      setLocalDeployedAddress(result.address);
      saveToHistory(result);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Deployment failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [compiledBoc, isConnected, connect, onDeploy, selectedNetwork, value, saveToHistory]);

  // Копирование адреса в буфер обмена
  const handleCopyAddress = useCallback(() => {
    if (localDeployedAddress) {
      navigator.clipboard.writeText(localDeployedAddress);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [localDeployedAddress]);

  // Открытие в эксплорере
  const handleOpenExplorer = useCallback(() => {
    if (localDeployedAddress) {
      window.open(`${selectedNetwork.explorer}/address/${localDeployedAddress}`, '_blank');
    }
  }, [localDeployedAddress, selectedNetwork]);

  // Очистка ошибки
  const handleClearError = useCallback(() => {
    setError(null);
  }, []);

  const isLoadingState = isLoading || isDeploying;
  const hasCompiledContract = !!compiledBoc;
  const displayAddress = localDeployedAddress || deployedAddress;

  return (
    <div className={`deployment-panel ${className}`}>
      <div className="deployment-header">
        <Rocket size={18} />
        <h3>Deployment</h3>
      </div>

      {/* Сеть */}
      <div className="deployment-section">
        <label className="deployment-label">Network</label>
        <NetworkSelector
          networks={NETWORKS}
          selected={selectedNetwork}
          onSelect={setSelectedNetwork}
        />
      </div>

      {/* Значение */}
      <div className="deployment-section">
        <label className="deployment-label">
          Value (TON)
          <span className="deployment-hint">Minimum 0.01 TON</span>
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min="0.01"
          step="0.01"
          placeholder="0.05"
          className="deployment-input"
          disabled={isLoadingState}
        />
      </div>

      {/* Состояние компиляции */}
      <div className={`deployment-status ${hasCompiledContract ? 'ready' : 'not-ready'}`}>
        {hasCompiledContract ? (
          <span className="status-ready">
            ✅ Contract compiled
          </span>
        ) : (
          <span className="status-not-ready">
            ⚠️ No compiled contract
          </span>
        )}
      </div>

      {/* Ошибка */}
      {error && (
        <div className="deployment-error">
          <AlertCircle size={14} />
          <span>{error}</span>
          <button onClick={handleClearError} className="error-close">
            ×
          </button>
        </div>
      )}

      {/* Кнопка деплоя */}
      <Button
        onClick={handleDeploy}
        isLoading={isLoadingState}
        disabled={!hasCompiledContract}
        variant="primary"
        fullWidth
        className="deploy-button"
      >
        {!isConnected ? 'Connect Wallet' : 'Deploy Contract'}
      </Button>

      {/* Результат деплоя */}
      {displayAddress && (
        <div className="deployment-result">
          <div className="result-header">
            <Check size={14} className="result-icon" />
            <span>Contract deployed!</span>
          </div>
          
          <div className="result-address">
            <code className="address-code">
              {displayAddress}
            </code>
            <div className="address-actions">
              <button
                onClick={handleCopyAddress}
                className="action-btn"
                title="Copy address"
              >
                {copySuccess ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                onClick={handleOpenExplorer}
                className="action-btn"
                title="Open in explorer"
              >
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
          
          <div className="result-details">
            <span className="detail-label">Network:</span>
            <span className="detail-value">{selectedNetwork.name}</span>
            <span className="detail-label">Value:</span>
            <span className="detail-value">{value} TON</span>
          </div>
        </div>
      )}

      {/* История деплоев */}
      {deploymentHistory.length > 0 && (
        <>
          <div className="deployment-divider" />
          <DeploymentHistory
            history={deploymentHistory}
            onSelectAddress={(address) => {
              setLocalDeployedAddress(address);
              window.open(`${selectedNetwork.explorer}/address/${address}`, '_blank');
            }}
          />
        </>
      )}

      {/* Информация о сети */}
      <div className="deployment-info">
        <p className="info-text">
          <strong>Note:</strong> Make sure you have enough TON for gas fees.
          {selectedNetwork.id === 'testnet' && ' Testnet TON can be obtained from faucet.'}
        </p>
      </div>
    </div>
  );
};

export default DeploymentPanel;