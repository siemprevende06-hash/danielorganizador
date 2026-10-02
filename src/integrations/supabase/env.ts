// Configuración de Supabase leída del archivo .env (VITE_SUPABASE_*).
// Esta es la única fuente de verdad: no hay URLs ni claves fijas en el código.
const projectUrl = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

if (!projectUrl || !publishableKey) {
  console.error(
    "[supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en el archivo .env",
  );
}

export const SUPABASE_PROJECT_URL = projectUrl;
export const SUPABASE_PUBLISHABLE_KEY = publishableKey;

export const edgeFunctionUrl = (name: string) => `${projectUrl}/functions/v1/${name}`;
