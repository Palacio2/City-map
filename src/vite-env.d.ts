/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // додай тут інші змінні оточення, якщо вони є
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}