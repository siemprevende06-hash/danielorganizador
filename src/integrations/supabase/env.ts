// Configuración de Supabase. Valores fijados por el propietario del proyecto:
// la app usa EXCLUSIVAMENTE esta base de datos (los VITE_* del entorno no la sobreescriben).
const FIXED_PROJECT_ID = "fuqmrtenzlslkeqgdjwy";
const FIXED_PROJECT_URL = "https://fuqmrtenzlslkeqgdjwy.supabase.co";
const FIXED_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cW1ydGVuemxzbGtlcWdkand5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTgxMzksImV4cCI6MjEwMDk5NDEzOX0.3Xxk0AiGLuCjnSJvm0sK9C1cIbpeWgkuhrFc3QnnuVc";

const env = import.meta.env as unknown as Record<string, string | undefined>;

const projectUrl = (
  FIXED_PROJECT_URL ||
  env.VITE_SUPABASE_URL ||
  (env.VITE_SUPABASE_PROJECT_ID ? `https://${env.VITE_SUPABASE_PROJECT_ID}.supabase.co` : "")
).replace(/\/+$/, "");

const publishableKey =
  FIXED_PUBLISHABLE_KEY ||
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
