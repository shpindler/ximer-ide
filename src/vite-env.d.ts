/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TON_CENTER_API_KEY: string;
  readonly VITE_MANIFEST_URL: string;
  // Добавьте другие переменные окружения по мере необходимости
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}