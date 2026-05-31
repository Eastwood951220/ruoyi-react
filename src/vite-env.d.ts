/// <reference types="vite/client" />

declare module '*.css'

interface ImportMetaEnv {
  readonly VITE_APP_BASE_API: string
  readonly VITE_APP_CLIENT_ID: string
  readonly VITE_APP_ENCRYPT: string
  readonly VITE_APP_RSA_PUBLIC_KEY: string
  readonly VITE_APP_RSA_PRIVATE_KEY: string
  readonly VITE_APP_REPEAT_SUBMIT_INTERVAL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
