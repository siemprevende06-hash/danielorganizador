// Configuración de Supabase leída del archivo .env (VITE_SUPABASE_*).
// Esta es la única fuente de verdad: no hay URLs ni claves fijas en el código.
const env = import.meta.env as unknown as Record<string, string | undefined>;

const projectUrl = (
  env.VITE_SUPABASE_URL ||
  (env.VITE_SUPABASE_PROJECT_ID ? `https://${env.VITE_SUPABASE_PROJECT_ID}.supabase.co` : "")
).replace(/\/+$/, "");

const publishableKey =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = Boolean(projectUrl && publishableKey);

if (!isSupabaseConfigured) {
  console.error(
    "[supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en el archivo .env",
  );
}

export const SUPABASE_PROJECT_URL = projectUrl;
export const SUPABASE_PUBLISHABLE_KEY = publishableKey;

export const edgeFunctionUrl = (name: string) => `${projectUrl}/functions/v1/${name}`;
