import { useState, useEffect, useCallback, useRef } from 'react';
import { TonConnectUI, TonConnectUiOptions, ConnectedWallet } from '@tonconnect/ui';
import { CHAIN } from '@tonconnect/protocol';

// Типы для кошелька
export interface WalletInfoExtended {
  address: string;
  chain: CHAIN;
  publicKey?: string;
  walletName?: string;
  walletVersion?: string;
  platform?: string;
}

export interface Transaction {
  validUntil: number;
  messages: {
    address: string;
    amount: string;
    payload?: string;
    stateInit?: string;
  }[];
}

export interface SendTransactionResult {
  boc: string;
}

export interface UseTonConnectReturn {
  // Состояния
  tonConnectUI: TonConnectUI | null;
  wallet: WalletInfoExtended | null;
  isConnected: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  
  // Методы
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (transaction: Transaction) => Promise<SendTransactionResult>;
  getWallets: () => Promise<any[]>;
  fetchBalance: () => Promise<string | null>;
  
  // Утилиты
  formatAddress: (address: string) => string;
  formatBalance: (balance: string) => string;
  isTestnet: () => boolean;
  isMainnet: () => boolean;
}

// Манифест по умолчанию
const DEFAULT_MANIFEST_URL = 'https://your-app.com/tonconnect-manifest.json';

// TON Center API endpoints
const TON_CENTER_API = {
  mainnet: 'https://toncenter.com/api/v2',
  testnet: 'https://testnet.toncenter.com/api/v2'
};

// API ключ (в реальном приложении храните в .env)
const API_KEY = import.meta.env.VITE_TON_CENTER_API_KEY || '';

/**
 * Преобразование строки в CHAIN
 */
const stringToChain = (chain: string): CHAIN => {
  if (chain === '-239') {
    return CHAIN.TESTNET;
  }
  return CHAIN.MAINNET;
};

/**
 * Хук для работы с TON Connect 2.0
 */
export const useTonConnect = (
  manifestUrl: string = DEFAULT_MANIFEST_URL,
  options?: Partial<TonConnectUiOptions>
): UseTonConnectReturn => {
  // Состояния
  const [tonConnectUI, setTonConnectUI] = useState<TonConnectUI | null>(null);
  const [wallet, setWallet] = useState<WalletInfoExtended | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Форматирование адреса для отображения
   */
  const formatAddress = useCallback((address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  /**
   * Форматирование баланса из наноTON в TON
   */
  const formatBalance = useCallback((balance: string): string => {
    if (!balance) return '0';
    const tonAmount = (parseInt(balance) / 1_000_000_000).toFixed(4);
    return tonAmount;
  }, []);

  /**
   * Проверка, находится ли кошелек в testnet
   */
  const isTestnet = useCallback((): boolean => {
    return wallet?.chain === CHAIN.TESTNET;
  }, [wallet]);

  /**
   * Проверка, находится ли кошелек в mainnet
   */
  const isMainnet = useCallback((): boolean => {
    return wallet?.chain === CHAIN.MAINNET;
  }, [wallet]);

  /**
   * Получение списка доступных кошельков
   */
  const getWallets = useCallback(async (): Promise<any[]> => {
    if (!tonConnectUI) {
      return [];
    }
    
    try {
      const wallets = await tonConnectUI.getWallets();
      return wallets || [];
    } catch (err) {
      console.error('Failed to get wallets:', err);
      return [];
    }
  }, [tonConnectUI]);

  /**
   * Получение баланса через TON Center API
   */
  const fetchBalance = useCallback(async (): Promise<string | null> => {
    if (!wallet?.address) {
      return null;
    }

    const baseUrl = isTestnet() ? TON_CENTER_API.testnet : TON_CENTER_API.mainnet;
    
    try {
      const response = await fetch(
        `${baseUrl}/getAddressBalance?address=${wallet.address}`,
        {
          headers: API_KEY ? {
            'X-API-Key': API_KEY
          } : {}
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      
      const data = await response.json();
      return data.result || null;
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      return null;
    }
  }, [wallet, isTestnet]);

  /**
   * Подключение кошелька
   */
  const connect = useCallback(async (): Promise<void> => {
    if (!tonConnectUI) {
      setError('TON Connect UI not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await tonConnectUI.connectWallet();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Connection error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tonConnectUI]);

  /**
   * Отключение кошелька
   */
  const disconnect = useCallback(async (): Promise<void> => {
    if (!tonConnectUI) return;

    setIsLoading(true);
    setError(null);

    try {
      await tonConnectUI.disconnect();
      setWallet(null);
      setIsConnected(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      setError(errorMessage);
      console.error('Disconnect error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tonConnectUI]);

  /**
   * Отправка транзакции
   */
  const sendTransaction = useCallback(async (
    transaction: Transaction
  ): Promise<SendTransactionResult> => {
    if (!tonConnectUI) {
      throw new Error('TON Connect UI not initialized');
    }

    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await tonConnectUI.sendTransaction(transaction);
      return {
        boc: result.boc
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tonConnectUI, isConnected]);

  /**
   * Обновление состояния кошелька из ConnectedWallet
   * ConnectedWallet.account.chain возвращает строку, преобразуем в CHAIN
   */
  const updateWalletState = useCallback((connectedWallet: ConnectedWallet | null) => {
    if (connectedWallet) {
      setWallet({
        address: connectedWallet.account.address,
        chain: stringToChain(connectedWallet.account.chain),
        publicKey: connectedWallet.account.publicKey,
        walletName: connectedWallet.device?.appName,
        walletVersion: connectedWallet.device?.appVersion,
        platform: connectedWallet.device?.platform
      });
      setIsConnected(true);
    } else {
      setWallet(null);
      setIsConnected(false);
    }
  }, []);

  // Инициализация TON Connect UI
  useEffect(() => {
    const initTonConnect = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        // Создаем экземпляр TonConnectUI
        const ui = new TonConnectUI({
          manifestUrl,
          buttonRootId: 'ton-connect-button',
          ...options
        });

        setTonConnectUI(ui);

        // Подписываемся на изменения статуса
        // onStatusChange возвращает ConnectedWallet | null
        const unsubscribe = ui.onStatusChange((connectedWallet) => {
          updateWalletState(connectedWallet);
        });

        unsubscribeRef.current = unsubscribe;

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize TON Connect';
        setError(errorMessage);
        console.error('Initialization error:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initTonConnect();

    // Очистка при размонтировании
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (tonConnectUI) {
        tonConnectUI.disconnect();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifestUrl]);

  return {
    // Состояния
    tonConnectUI,
    wallet,
    isConnected,
    isLoading,
    isInitializing,
    error,
    
    // Методы
    connect,
    disconnect,
    sendTransaction,
    getWallets,
    fetchBalance,
    
    // Утилиты
    formatAddress,
    formatBalance,
    isTestnet,
    isMainnet
  };
};

export default useTonConnect;