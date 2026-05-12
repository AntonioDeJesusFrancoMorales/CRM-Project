/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MSW: 'true' | 'false';
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
