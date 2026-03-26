import React from 'react';
import { DeploymentResult } from './deployment-panel';
import { History, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import './deployment-history.css';

interface DeploymentHistoryProps {
  history: DeploymentResult[];
  onSelectAddress: (address: string) => void;
}

export const DeploymentHistory: React.FC<DeploymentHistoryProps> = ({
  history,
  onSelectAddress
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (history.length === 0) return null;

  return (
    <div className="deployment-history">
      <div className="history-header">
        <History size={14} />
        <span>Recent deployments</span>
      </div>
      
      <div className="history-list">
        {history.map((item, index) => (
          <div key={index} className="history-item">
            <div className="history-info">
              <div className="history-network">
                <span className={`network-dot ${item.network.id}`} />
                <span className="network-name">{item.network.name}</span>
              </div>
              <div className="history-address">
                <button
                  onClick={() => onSelectAddress(item.address)}
                  className="address-link"
                  title={item.address}
                >
                  {formatAddress(item.address)}
                </button>
              </div>
              <div className="history-meta">
                <span className="history-value">{item.value} TON</span>
                <span className="history-time">{formatDate(item.timestamp)}</span>
              </div>
            </div>
            <button
              onClick={() => window.open(`${item.network.explorer}/address/${item.address}`, '_blank')}
              className="history-explorer"
              title="Open in explorer"
            >
              <ExternalLink size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};