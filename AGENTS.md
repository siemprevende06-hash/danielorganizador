# Project Notes

## Database connection
- The app must connect EXCLUSIVELY to the owner's Supabase project `fuqmrtenzlslkeqgdjwy` (https://fuqmrtenzlslkeqgdjwy.supabase.co). Why: the platform injects its own Lovable Cloud `VITE_SUPABASE_*` env vars that override `.env`, so the real values are pinned as constants at the top of `src/integrations/supabase/env.ts` (FIXED_PROJECT_URL / FIXED_PUBLISHABLE_KEY). Never reintroduce env-only configuration for the DB connection.
