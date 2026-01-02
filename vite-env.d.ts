/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_KEY?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_APPSCRIPT_URL?: string;
  readonly VITE_USE_REAL_SCANNER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

