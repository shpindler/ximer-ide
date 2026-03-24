import { CHAIN } from '@tonconnect/protocol';

export interface Network {
  id: CHAIN;
  name: 'mainnet' | 'testnet';
  endpoint: string;
  explorer: string;
}

export interface DeploymentParams {
  network: Network;
  value: number;
  body?: string;
  initData?: string;
}

export interface Deployment {
  id: string;
  contractAddress: string;
  network: Network;
  timestamp: Date;
  transactionHash: string;
  value: number;
  status: 'pending' | 'success' | 'failed';
}

export interface WalletInfo {
  address: string;
  chain: CHAIN;
  publicKey?: string;
  balance?: string;
}