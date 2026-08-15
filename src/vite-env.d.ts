/// <reference types="vite/client" />

/**
 * Build-time configuration. Both are optional: with neither set the app simply
 * offers no report channel, which is the safe default — see src/data/credits.ts
 * for why a contact must never be hardcoded into the bundle.
 */
interface ImportMetaEnv {
  /** A report form/page URL. `{subject}` is replaced by the reported item. */
  readonly VITE_REPORT_URL?: string;
  /** Fallback: a WhatsApp number, international form. Published to every visitor. */
  readonly VITE_REPORT_WHATSAPP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
