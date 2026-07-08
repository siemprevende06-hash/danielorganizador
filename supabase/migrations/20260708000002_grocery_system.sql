
-- Grocery Products catalog + link to recipe_ingredients

CREATE TABLE IF NOT EXISTS public.grocery_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  storage_type TEXT NOT NULL DEFAULT 'shelf' CHECK (storage_type IN ('shelf','refrigerator','freezer')),
  unit TEXT NOT NULL DEFAULT 'unidad',
  price NUMERIC DEFAULT 0,
  package_quantity NUMERIC DEFAULT 1,
  current_stock NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grocery_products TO anon, authenticated;
GRANT ALL ON public.grocery_products TO service_role;

ALTER TABLE public.grocery_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all grocery_products" ON public.grocery_products;
CREATE POLICY "Allow all grocery_products"
  ON public.grocery_products FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_grocery_products_updated_at ON public.grocery_products;
CREATE TRIGGER update_grocery_products_updated_at
  BEFORE UPDATE ON public.grocery_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add product_id and quantity_for_recipe to recipe_ingredients
ALTER TABLE public.recipe_ingredients
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.grocery_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity_for_recipe NUMERIC;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_products;
