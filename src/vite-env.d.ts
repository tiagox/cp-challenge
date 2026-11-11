/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_CANDIDATE_ID?: string
  readonly VITE_API_BUG_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
