ALTER TABLE public.recipes ADD COLUMN category TEXT;
GRANT ALL ON public.recipes TO anon, authenticated;
GRANT ALL ON public.recipes TO service_role;
