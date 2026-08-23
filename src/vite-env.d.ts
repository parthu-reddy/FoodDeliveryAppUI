/// <reference types="vite/client" />

interface ImportMetaEnv {

  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENABLE_DEV_OTP: string;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  maplibregl: any;
  webkitAudioContext: typeof AudioContext;
}
