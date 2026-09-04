// Cliente Supabase de la aplicación.
// Fija la base de datos correcta (fuqmrtenzlslkeqgdjwy) ignorando cualquier
// variable de entorno del panel de despliegue. El alias definido en
// vite.config.ts hace que "@/integrations/supabase/client" apunte aquí.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

const SUPABASE_URL = 'https://fuqmrtenzlslkeqgdjwy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cW1ydGVuemxzbGtlcWdkand5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTgxMzksImV4cCI6MjEwMDk5NDEzOX0.3Xxk0AiGLuCjnSJvm0sK9C1cIbpeWgkuhrFc3QnnuVc';

export const SUPABASE_PROJECT_URL = SUPABASE_URL;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: brokeredPreviewStorage(),
    persistSession: true,
    autoRefreshToken: true,
  },
});
