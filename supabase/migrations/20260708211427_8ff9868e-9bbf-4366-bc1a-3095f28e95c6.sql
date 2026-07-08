
-- Add grocery_products table
CREATE TABLE IF NOT EXISTS public.grocery_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  category TEXT,
  storage_type TEXT NOT NULL DEFAULT 'shelf',
  unit TEXT NOT NULL DEFAULT 'unidad',
  price NUMERIC NOT NULL DEFAULT 0,
  package_quantity NUMERIC NOT NULL DEFAULT 1,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grocery_products TO anon, authenticated;
GRANT ALL ON public.grocery_products TO service_role;
ALTER TABLE public.grocery_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all grocery_products" ON public.grocery_products FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_grocery_products_updated BEFORE UPDATE ON public.grocery_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add tipo column to workout_routines
ALTER TABLE public.workout_routines ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'gimnasio';
