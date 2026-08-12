/// <reference types="vite/client" />

/**
 * Declare the known environment variables used by this project.
 * This lets TypeScript accept direct dot-notation access (import.meta.env.VITE_*)
 * which is REQUIRED for Vite to statically inline values at build time.
 *
 * See: https://vitejs.dev/guide/env-and-mode#intellisense-for-typescript
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DEV_TEST_MODE: string;
  readonly VITE_SITE_URL: string;
  // Add more VITE_* vars here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
