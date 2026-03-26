import React from 'react';
import { Network } from './deployment-panel';
import './network-selector.css';

interface NetworkSelectorProps {
  networks: Network[];
  selected: Network;
  onSelect: (network: Network) => void;
  disabled?: boolean;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  networks,
  selected,
  onSelect,
  disabled = false
}) => {
  return (
    <div className="network-selector">
      {networks.map((network) => (
        <button
          key={network.id}
          className={`network-option ${selected.id === network.id ? 'selected' : ''}`}
          onClick={() => onSelect(network)}
          disabled={disabled}
        >
          <span className="network-indicator" data-network={network.id} />
          <span className="network-name">{network.name}</span>
          {network.id === 'testnet' && (
            <span className="network-badge">test</span>
          )}
        </button>
      ))}
    </div>
  );
};