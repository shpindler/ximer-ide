import { CHAIN } from '@tonconnect/protocol';

/**
 * Структура WalletInfo из TON Connect 2.0
 * @see https://github.com/ton-connect/sdk/tree/main/packages/ui
 */
export interface TonConnectWalletInfo {
  /**
   * Информация об аккаунте кошелька
   */
  account: {
    /** Адрес кошелька в формате TON */
    address: string;
    /** Сеть: mainnet или testnet */
    chain: CHAIN;
    /** Публичный ключ (опционально) */
    publicKey?: string;
    /** Инициализация кошелька (опционально) */
    walletStateInit?: string;
  };
  /**
   * Информация об устройстве (опционально)
   */
  device?: {
    /** Название приложения кошелька */
    appName: string;
    /** Версия приложения */
    appVersion: string;
    /** Платформа: ios, android, web, etc */
    platform: string;
  };
  /**
   * Провайдер кошелька (опционально)
   */
  provider?: unknown;
}

/**
 * Расширенная информация о кошельке для использования в приложении
 */
export interface WalletInfoExtended {
  /** Адрес кошелька */
  address: string;
  /** Сеть: mainnet или testnet */
  chain: CHAIN;
  /** Публичный ключ */
  publicKey?: string;
  /** Название кошелька */
  walletName?: string;
  /** Версия кошелька */
  walletVersion?: string;
  /** Платформа */
  platform?: string;
  /** Баланс (получается отдельно через API) */
  balance?: string;
}

/**
 * Параметры транзакции
 */
export interface Transaction {
  /** Временная метка до которой действительна транзакция (Unix timestamp) */
  validUntil: number;
  /** Список сообщений для отправки */
  messages: {
    /** Адрес получателя */
    address: string;
    /** Сумма в наноTON (1 TON = 1_000_000_000 nanoTON) */
    amount: string;
    /** Полезная нагрузка (опционально) */
    payload?: string;
    /** Инициализация состояния (опционально) */
    stateInit?: string;
  }[];
}

/**
 * Результат отправки транзакции
 */
export interface SendTransactionResult {
  /** BOC (Bag of Cells) отправленной транзакции */
  boc: string;
}

/**
 * Параметры для получения баланса
 */
export interface GetBalanceParams {
  /** Адрес кошелька */
  address: string;
  /** Сеть */
  chain: CHAIN;
}

/**
 * Ответ TON Center API для баланса
 */
export interface TonCenterBalanceResponse {
  ok: boolean;
  result: string;
  error?: string;
}

/**
 * Ответ TON Center API для отправки BOC
 */
export interface TonCenterSendBocResponse {
  ok: boolean;
  result: {
    hash: string;
    boc: string;
  };
  error?: string;
}