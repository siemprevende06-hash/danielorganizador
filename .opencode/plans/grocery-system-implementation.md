# Grocery System Implementation Plan

## Files to Create

### 1. `supabase/migrations/20260708000002_grocery_system.sql`

```sql
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
```

---

### 2. `src/hooks/useGroceryProducts.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GroceryProduct {
  id: string;
  name: string;
  category: string | null;
  storage_type: "shelf" | "refrigerator" | "freezer";
  unit: string;
  price: number;
  package_quantity: number;
  current_stock: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroceryProductInput {
  name: string;
  category?: string;
  storage_type: "shelf" | "refrigerator" | "freezer";
  unit: string;
  price?: number;
  package_quantity?: number;
  current_stock?: number;
  notes?: string;
}

export function useGroceryProducts() {
  const [products, setProducts] = useState<GroceryProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("grocery_products")
      .select("*")
      .order("name");
    setProducts((data as GroceryProduct[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createProduct = async (input: GroceryProductInput) => {
    const { data, error } = await supabase
      .from("grocery_products")
      .insert(input)
      .select()
      .single();
    if (!error && data) {
      await load();
      return data.id;
    }
    return null;
  };

  const updateProduct = async (id: string, input: Partial<GroceryProductInput>) => {
    await supabase.from("grocery_products").update(input).eq("id", id);
    await load();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("grocery_products").delete().eq("id", id);
    await load();
  };

  const adjustStock = async (id: string, delta: number) => {
    const p = products.find(p => p.id === id);
    if (!p) return;
    const newStock = Math.max(0, (p.current_stock || 0) + delta);
    await supabase.from("grocery_products").update({ current_stock: newStock }).eq("id", id);
    await load();
  };

  const unitCost = (p: GroceryProduct) =>
    (p.price || 0) / Math.max(1, p.package_quantity || 1);

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    unitCost,
    reload: load,
  };
}
```

---

### 3. Update `src/hooks/useRecipes.ts`

Replace the entire file with:

```typescript
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RecipeIngredient {
  id?: string;
  recipe_id?: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  sort_order?: number;
  product_id?: string | null;
  quantity_for_recipe?: number | null;
}

export interface Recipe {
  id: string;
  name: string;
  photo_url?: string | null;
  instructions?: string | null;
  servings?: number | null;
  category?: string | null;
  ingredients?: RecipeIngredient[];
}

export interface MealPlanRow {
  id: string;
  plan_date: string;
  meal_slot: string;
  recipe_id: string | null;
  recipe?: Recipe | null;
}

export interface RecipeCost {
  recipeId: string;
  recipeName: string;
  servings: number;
  totalCost: number;
  costPerServing: number;
  ingredientCount: number;
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [rRes, iRes] = await Promise.all([
      supabase.from("recipes").select("*").order("name"),
      supabase.from("recipe_ingredients").select("*").order("sort_order"),
    ]);
    const ingredientsByRecipe: Record<string, RecipeIngredient[]> = {};
    (iRes.data || []).forEach((ing: any) => {
      (ingredientsByRecipe[ing.recipe_id] ||= []).push(ing);
    });
    setRecipes(
      (rRes.data || []).map((r: any) => ({ ...r, ingredients: ingredientsByRecipe[r.id] || [] }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createRecipe = async (data: Partial<Recipe> & { name: string; ingredients?: RecipeIngredient[] }) => {
    const { ingredients = [], ...rest } = data;
    const { data: rec, error } = await supabase.from("recipes").insert(rest).select().single();
    if (error || !rec) return null;
    if (ingredients.length) {
      await supabase.from("recipe_ingredients").insert(
        ingredients.map((ing, i) => ({
          recipe_id: rec.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          sort_order: i,
          product_id: ing.product_id || null,
          quantity_for_recipe: ing.quantity_for_recipe || ing.quantity || null,
        }))
      );
    }
    await load();
    return rec.id;
  };

  const updateRecipe = async (id: string, data: Partial<Recipe> & { ingredients?: RecipeIngredient[] }) => {
    const { ingredients, ...rest } = data;
    await supabase.from("recipes").update(rest).eq("id", id);
    if (ingredients) {
      await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
      if (ingredients.length) {
        await supabase.from("recipe_ingredients").insert(
          ingredients.map((ing, i) => ({
            recipe_id: id,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            sort_order: i,
            product_id: ing.product_id || null,
            quantity_for_recipe: ing.quantity_for_recipe || ing.quantity || null,
          }))
        );
      }
    }
    await load();
  };

  const deleteRecipe = async (id: string) => {
    await supabase.from("recipes").delete().eq("id", id);
    await load();
  };

  return { recipes, loading, createRecipe, updateRecipe, deleteRecipe, reload: load };
}

export function useMealPlan(startDate: string, endDate: string) {
  const [plan, setPlan] = useState<MealPlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("meal_plan")
      .select("*, recipe:recipes(*, ingredients:recipe_ingredients(*))")
      .gte("plan_date", startDate)
      .lte("plan_date", endDate);
    setPlan((data as any) || []);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const assign = async (plan_date: string, meal_slot: string, recipe_id: string | null) => {
    if (recipe_id === null) {
      await supabase.from("meal_plan").delete().eq("plan_date", plan_date).eq("meal_slot", meal_slot);
    } else {
      await supabase
        .from("meal_plan")
        .upsert({ plan_date, meal_slot, recipe_id }, { onConflict: "plan_date,meal_slot" });
    }
    await load();
  };

  return { plan, loading, assign, reload: load };
}
```

---

### 4. `src/hooks/useShoppingGenerator.ts`

```typescript
import { useMemo } from "react";
import type { MealPlanRow } from "./useRecipes";
import type { GroceryProduct } from "./useGroceryProducts";

export interface ShoppingItem {
  productId: string | null;
  productName: string;
  storageType: string;
  category: string | null;
  unit: string;
  totalNeeded: number;
  inStock: number;
  toBuy: number;
  price: number;
  packageQuantity: number;
  unitCost: number;
  estimatedCost: number;
  ingredients: string[];
}

export function useShoppingGenerator(
  plan: MealPlanRow[],
  products: GroceryProduct[]
): ShoppingItem[] {
  return useMemo(() => {
    // Group plan ingredients by product
    const needed: Record<string, {
      productId: string | null;
      productName: string;
      storageType: string;
      category: string | null;
      unit: string;
      totalNeeded: number;
      price: number;
      packageQuantity: number;
      ingredients: string[];
    }> = {};

    plan.forEach(p => {
      const ings = (p.recipe?.ingredients || []) as any[];
      ings.forEach((ing: any) => {
        const pid = ing.product_id;
        // Use product info if linked, else fallback to free-text ingredient
        const product = pid ? products.find(pr => pr.id === pid) : null;
        const key = pid || `__raw__${ing.name.toLowerCase()}`;
        const qty = Number(ing.quantity_for_recipe ?? ing.quantity ?? 0);

        if (!needed[key]) {
          needed[key] = {
            productId: pid || null,
            productName: product?.name || ing.name || "?",
            storageType: product?.storage_type || "shelf",
            category: product?.category || null,
            unit: product?.unit || ing.unit || "unidad",
            totalNeeded: 0,
            price: product?.price || 0,
            packageQuantity: product?.package_quantity || 1,
            ingredients: [],
          };
        }
        needed[key].totalNeeded += qty;
        needed[key].ingredients.push(`${p.recipe?.name || "?"}: ${qty} ${ing.unit || ""}`);
      });
    });

    return Object.values(needed).map(item => {
      const inStock = item.productId
        ? (products.find(p => p.id === item.productId)?.current_stock || 0)
        : 0;
      const unitCost = (item.price || 0) / Math.max(1, item.packageQuantity || 1);
      const toBuy = Math.max(0, item.totalNeeded - inStock);
      return {
        productId: item.productId,
        productName: item.productName,
        storageType: item.storageType,
        category: item.category,
        unit: item.unit,
        totalNeeded: item.totalNeeded,
        inStock,
        toBuy,
        price: item.price,
        packageQuantity: item.packageQuantity,
        unitCost,
        estimatedCost: toBuy * unitCost,
        ingredients: item.ingredients,
      };
    }).sort((a, b) => {
      const order = { refrigerator: 0, freezer: 1, shelf: 2 };
      return (order[a.storageType as keyof typeof order] || 0) - (order[b.storageType as keyof typeof order] || 0);
    });
  }, [plan, products]);
}
```

---

### 5. `src/components/grocery/ProductCard.tsx`

```tsx
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, Pencil, Trash2, DollarSign, Package, Snowflake, Thermometer, Archive } from "lucide-react";
import type { GroceryProduct, GroceryProductInput } from "@/hooks/useGroceryProducts";

interface Props {
  product: GroceryProduct;
  onUpdate: (id: string, input: Partial<GroceryProductInput>) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (id: string, delta: number) => void;
}

const storageIcons: Record<string, any> = {
  refrigerator: Snowflake,
  freezer: Thermometer,
  shelf: Archive,
};

export function ProductCard({ product, onUpdate, onDelete, onAdjustStock }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [storageType, setStorageType] = useState(product.storage_type);
  const [category, setCategory] = useState(product.category || "");
  const [unit, setUnit] = useState(product.unit);
  const [price, setPrice] = useState(product.price.toString());
  const [packageQty, setPackageQty] = useState(product.package_quantity.toString());
  const [notes, setNotes] = useState(product.notes || "");

  const StorageIcon = storageIcons[product.storage_type] || Archive;
  const unitCost = (product.price || 0) / Math.max(1, product.package_quantity || 1);

  const handleSave = () => {
    onUpdate(product.id, {
      name: name.trim(),
      storage_type: storageType as any,
      category: category || null,
      unit: unit.trim(),
      price: parseFloat(price) || 0,
      package_quantity: parseInt(packageQty) || 1,
      notes: notes.trim() || null,
    });
    setEditOpen(false);
  };

  return (
    <>
      <Card className="p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
        <div className="p-2 rounded-lg bg-muted">
          <StorageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{product.name}</p>
          <p className="text-[10px] text-muted-foreground">
            Stock: <span className="font-medium">{product.current_stock}</span> {product.unit}
            {product.price > 0 && (
              <> · ${product.price} / {product.package_quantity}{product.unit} · ${unitCost.toFixed(2)}/{product.unit}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7"
            onClick={() => onAdjustStock(product.id, -1)}
            disabled={product.current_stock <= 0}>
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-bold w-8 text-center">{product.current_stock}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7"
            onClick={() => onAdjustStock(product.id, 1)}>
            <Plus className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(product.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editar producto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} />
            <Select value={storageType} onValueChange={v => setStorageType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="shelf">Estante</SelectItem>
                <SelectItem value="refrigerator">Refrigerador</SelectItem>
                <SelectItem value="freezer">Congelador</SelectItem>
              </SelectContent>
            </Select>
            <Input label="Categoría" value={category} onChange={e => setCategory(e.target.value)} placeholder="ej: lácteos, carnes..." />
            <div className="flex gap-2">
              <Input label="Unidad" value={unit} onChange={e => setUnit(e.target.value)} placeholder="g, kg, ml, unidad" />
            </div>
            <div className="flex gap-2">
              <Input label="Precio ($)" type="number" value={price} onChange={e => setPrice(e.target.value)} />
              <Input label="Cant. empaque" type="number" value={packageQty} onChange={e => setPackageQty(e.target.value)} />
            </div>
            <Input label="Notas" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={handleSave}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### 6. `src/components/grocery/ShelfView.tsx`

```tsx
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Archive } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { GroceryProduct, GroceryProductInput } from "@/hooks/useGroceryProducts";

interface Props {
  products: GroceryProduct[];
  onCreate: (input: GroceryProductInput) => void;
  onUpdate: (id: string, input: Partial<GroceryProductInput>) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (id: string, delta: number) => void;
}

export function ShelfView({ products, onCreate, onUpdate, onDelete, onAdjustStock }: Props) {
  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState("");
  const [storageType, setStorageType] = useState<"shelf" | "refrigerator" | "freezer">("shelf");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("unidad");
  const [price, setPrice] = useState("0");
  const [packageQty, setPackageQty] = useState("1");

  const filtered = products.filter(p => p.storage_type === "shelf");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      storage_type: storageType,
      category: category || null,
      unit: unit.trim(),
      price: parseFloat(price) || 0,
      package_quantity: parseInt(packageQty) || 1,
      current_stock: 0,
    });
    setName(""); setCategory(""); setUnit("unidad"); setPrice("0"); setPackageQty("1");
    setNewOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-amber-600" />
          <h3 className="text-base font-bold">Estante</h3>
          <span className="text-xs text-muted-foreground">({filtered.length})</span>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}><Plus className="h-3 w-3 mr-1" />Añadir</Button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No hay productos en el estante</p>
        ) : (
          filtered.map(p => (
            <ProductCard key={p.id} product={p} onUpdate={onUpdate} onDelete={onDelete} onAdjustStock={onAdjustStock} />
          ))
        )}
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nuevo producto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
            <Select value={storageType} onValueChange={v => setStorageType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="shelf">Estante</SelectItem>
                <SelectItem value="refrigerator">Refrigerador</SelectItem>
                <SelectItem value="freezer">Congelador</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Categoría (ej: granos, enlatados)" value={category} onChange={e => setCategory(e.target.value)} />
            <div className="flex gap-2">
              <Input placeholder="Unidad" value={unit} onChange={e => setUnit(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Input type="number" placeholder="Precio $" value={price} onChange={e => setPrice(e.target.value)} />
              <Input type="number" placeholder="Cant/empaque" value={packageQty} onChange={e => setPackageQty(e.target.value)} />
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

### 7. `src/components/grocery/FridgeView.tsx`

```tsx
import { Snowflake, Thermometer } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { GroceryProduct, GroceryProductInput } from "@/hooks/useGroceryProducts";

interface Props {
  products: GroceryProduct[];
  onCreate: (input: GroceryProductInput) => void;
  onUpdate: (id: string, input: Partial<GroceryProductInput>) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (id: string, delta: number) => void;
}

export function FridgeView({ products, onCreate, onUpdate, onDelete, onAdjustStock }: Props) {
  const refrigerated = products.filter(p => p.storage_type === "refrigerator");
  const frozen = products.filter(p => p.storage_type === "freezer");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Snowflake className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-bold">Refrigerador</h3>
          <span className="text-xs text-muted-foreground">({refrigerated.length})</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {refrigerated.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No hay productos en el refrigerador</p>
          ) : (
            refrigerated.map(p => (
              <ProductCard key={p.id} product={p} onUpdate={onUpdate} onDelete={onDelete} onAdjustStock={onAdjustStock} />
            ))
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Thermometer className="h-5 w-5 text-cyan-500" />
          <h3 className="text-base font-bold">Congelador</h3>
          <span className="text-xs text-muted-foreground">({frozen.length})</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {frozen.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No hay productos en el congelador</p>
          ) : (
            frozen.map(p => (
              <ProductCard key={p.id} product={p} onUpdate={onUpdate} onDelete={onDelete} onAdjustStock={onAdjustStock} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 8. `src/components/grocery/CostAnalysis.tsx`

```tsx
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpDown, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import type { Recipe } from "@/hooks/useRecipes";
import type { GroceryProduct } from "@/hooks/useGroceryProducts";

interface Props {
  recipes: Recipe[];
  products: GroceryProduct[];
}

interface RecipeCost {
  id: string;
  name: string;
  servings: number;
  totalCost: number;
  costPerServing: number;
}

export function CostAnalysis({ recipes, products }: Props) {
  const costs = useMemo(() => {
    return recipes
      .map(r => {
        const ings = r.ingredients || [];
        let totalCost = 0;
        ings.forEach(ing => {
          if (!ing.product_id) return;
          const product = products.find(p => p.id === ing.product_id);
          if (!product || !product.price) return;
          const unitCost = product.price / Math.max(1, product.package_quantity || 1);
          const qty = Number(ing.quantity_for_recipe ?? ing.quantity ?? 0);
          totalCost += qty * unitCost;
        });
        return {
          id: r.id,
          name: r.name,
          servings: r.servings || 1,
          totalCost,
          costPerServing: (r.servings || 1) > 0 ? totalCost / (r.servings || 1) : totalCost,
        } satisfies RecipeCost;
      })
      .filter(c => c.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [recipes, products]);

  const cheapest = [...costs].reverse().slice(0, 5);

  if (costs.length === 0) {
    return (
      <Card className="p-4 text-center text-sm text-muted-foreground">
        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>Vincula productos a tus recetas para ver costos</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Most expensive */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-red-500" />
          <h4 className="text-sm font-bold">Recetas más caras</h4>
        </div>
        <div className="space-y-1">
          {costs.slice(0, 5).map(c => (
            <div key={c.id} className="flex justify-between text-xs border-b py-1">
              <span className="font-medium truncate">{c.name}</span>
              <span className="text-muted-foreground shrink-0 ml-2">
                ${c.totalCost.toFixed(2)} · ${c.costPerServing.toFixed(2)}/porc
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Cheapest */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="h-4 w-4 text-green-500" />
          <h4 className="text-sm font-bold">Recetas más baratas</h4>
        </div>
        <div className="space-y-1">
          {cheapest.map(c => (
            <div key={c.id} className="flex justify-between text-xs border-b py-1">
              <span className="font-medium truncate">{c.name}</span>
              <span className="text-muted-foreground shrink-0 ml-2">
                ${c.totalCost.toFixed(2)} · ${c.costPerServing.toFixed(2)}/porc
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Full list sorted */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-bold">Todas las recetas</h4>
        </div>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {costs.map(c => (
            <div key={c.id} className="flex justify-between text-xs border-b py-1">
              <span className="font-medium truncate">{c.name}</span>
              <span className="text-muted-foreground shrink-0 ml-2">
                ${c.totalCost.toFixed(2)} · ${c.costPerServing.toFixed(2)}/porc · {c.servings} porc
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

---

### 9. `src/pages/Grocery.tsx`

```tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroceryProducts, type GroceryProductInput } from "@/hooks/useGroceryProducts";
import { ShelfView } from "@/components/grocery/ShelfView";
import { FridgeView } from "@/components/grocery/FridgeView";
import { CostAnalysis } from "@/components/grocery/CostAnalysis";
import { useRecipes } from "@/hooks/useRecipes";
import { Package, BarChart3, ShoppingCart } from "lucide-react";

export default function Grocery() {
  const { products, loading, createProduct, updateProduct, deleteProduct, adjustStock } = useGroceryProducts();
  const { recipes } = useRecipes();
  const [tab, setTab] = useState("products");

  if (loading) return <div className="p-8 text-center text-sm">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10">
              <Package className="h-7 w-7 text-amber-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Despensa
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {products.length} productos · Stock total: {products.reduce((s, p) => s + (p.current_stock || 0), 0)} uds
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="products" className="flex-1">
              <Package className="h-4 w-4 mr-1" />Productos
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex-1">
              <BarChart3 className="h-4 w-4 mr-1" />Costos
            </TabsTrigger>
            <TabsTrigger value="shopping" className="flex-1">
              <ShoppingCart className="h-4 w-4 mr-1" />Lista
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <ShelfView
              products={products}
              onCreate={createProduct}
              onUpdate={updateProduct}
              onDelete={deleteProduct}
              onAdjustStock={adjustStock}
            />
            <FridgeView
              products={products}
              onCreate={createProduct}
              onUpdate={updateProduct}
              onDelete={deleteProduct}
              onAdjustStock={adjustStock}
            />
          </TabsContent>

          <TabsContent value="costs">
            <CostAnalysis recipes={recipes} products={products} />
          </TabsContent>

          <TabsContent value="shopping">
            <p className="text-sm text-muted-foreground text-center py-8">
              Genera tu lista de compra desde Alimentación → Planificar
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

---

### 10. Update `src/pages/ShoppingList.tsx`

Replace the entire file with:

```tsx
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, Trash2, Sparkles, Snowflake, Thermometer, Archive, DollarSign } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useGroceryProducts } from "@/hooks/useGroceryProducts";
import { useRecipes } from "@/hooks/useRecipes";
import { useMealPlan } from "@/hooks/useRecipes";
import { useShoppingGenerator } from "@/hooks/useShoppingGenerator";
import { format, startOfWeek, addDays } from "date-fns";

interface Item { id: string; name: string; checked: boolean; qty?: number; unit?: string; productId?: string; storageType?: string; price?: number; }

const storageIcons: Record<string, any> = { refrigerator: Snowflake, freezer: Thermometer, shelf: Archive };
const storageLabels: Record<string, string> = { refrigerator: "Refri", freezer: "Congelador", shelf: "Estante" };

export default function ShoppingList() {
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState("");
  const [params, setParams] = useSearchParams();
  const today = new Date().toISOString().split("T")[0];
  const [importMode, setImportMode] = useState<"manual" | "plan">("manual");

  const { products } = useGroceryProducts();
  const { recipes } = useRecipes();

  // Current week for plan import
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(addDays(weekStart, 6), "yyyy-MM-dd");
  const { plan } = useMealPlan(startStr, endStr);
  const shoppingItems = useShoppingGenerator(plan, products);

  // Load from DB
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("daily_systems_tracking")
        .select("completions").eq("tracking_date", today).maybeSingle();
      const stored = ((data?.completions as any) || {})['shopping_list'];
      if (Array.isArray(stored)) setItems(stored);
    })();
  }, [today]);

  const persist = async (next: Item[]) => {
    setItems(next);
    const { data: row } = await supabase.from("daily_systems_tracking")
      .select("id, completions").eq("tracking_date", today).maybeSingle();
    const comp = { ...((row?.completions as any) || {}), shopping_list: next };
    if (row?.id) await supabase.from("daily_systems_tracking").update({ completions: comp }).eq("id", row.id);
    else await supabase.from("daily_systems_tracking").upsert({ tracking_date: today, completions: comp }, { onConflict: "tracking_date" });
  };

  // Import from URL (meal plan handoff)
  useEffect(() => {
    const raw = params.get("items");
    if (!raw) return;
    try {
      const incoming: any[] = JSON.parse(decodeURIComponent(raw));
      if (Array.isArray(incoming) && incoming.length > 0) {
        const additions: Item[] = incoming.map(i => ({
          id: crypto.randomUUID(),
          name: `${i.name}${i.quantity ? ` — ${i.quantity}${i.unit || ""}` : ""}`,
          checked: false, qty: i.quantity, unit: i.unit,
        }));
        persist([...items, ...additions]);
        params.delete("items"); setParams(params, { replace: true });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const addItem = () => {
    if (!newItem.trim()) return;
    persist([...items, { id: crypto.randomUUID(), name: newItem.trim(), checked: false }]);
    setNewItem("");
  };
  const toggleItem = (id: string) => persist(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const removeItem = (id: string) => persist(items.filter(i => i.id !== id));
  const clearChecked = () => persist(items.filter(i => !i.checked));

  const importFromPlan = () => {
    const additions: Item[] = shoppingItems
      .filter(i => i.toBuy > 0)
      .map(i => ({
        id: crypto.randomUUID(),
        name: `${i.productName}${i.toBuy ? ` — ${i.toBuy.toFixed(2)} ${i.unit}` : ""}`,
        checked: false,
        qty: i.toBuy,
        unit: i.unit,
        productId: i.productId || undefined,
        storageType: i.storageType,
        price: i.estimatedCost,
      }));
    if (additions.length > 0) {
      persist([...items, ...additions]);
      toast({ title: `Importados ${additions.length} productos del plan semanal` });
    }
  };

  const importFromPlanSimple = () => {
    // Original simple import from WeeklyMealPlan
    const raw = params.get("items");
    if (!raw) return;
    try {
      const incoming: any[] = JSON.parse(decodeURIComponent(raw));
      if (Array.isArray(incoming) && incoming.length > 0) {
        const additions: Item[] = incoming.map(i => ({
          id: crypto.randomUUID(),
          name: `${i.name}${i.quantity ? ` — ${i.quantity}${i.unit || ""}` : ""}`,
          checked: false, qty: i.quantity, unit: i.unit,
        }));
        persist([...items, ...additions]);
        params.delete("items"); setParams(params, { replace: true });
      }
    } catch {}
  };

  const totalCost = items.filter(i => !i.checked).reduce((s, i) => s + (i.price || 0), 0);

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  // Group unchecked by storage type
  const grouped = useMemo(() => {
    const groups: Record<string, Item[]> = { shelf: [], refrigerator: [], freezer: [], other: [] };
    unchecked.forEach(i => {
      const st = i.storageType || "other";
      if (!groups[st]) groups[st] = [];
      groups[st].push(i);
    });
    return groups;
  }, [unchecked]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10">
              <ShoppingCart className="h-7 w-7 text-green-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              Lista de la Compra
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" variant={importMode === "manual" ? "default" : "outline"} onClick={() => setImportMode("manual")}>
              Manual
            </Button>
            <Button size="sm" variant={importMode === "plan" ? "default" : "outline"} onClick={() => setImportMode("plan")}>
              Plan semanal ({shoppingItems.filter(i => i.toBuy > 0).length})
            </Button>
          </div>
        </div>

        {importMode === "plan" && shoppingItems.filter(i => i.toBuy > 0).length > 0 && (
          <Card className="border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Del plan semanal — descuento stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {shoppingItems.filter(i => i.toBuy > 0).map((item, idx) => {
                const Icon = storageIcons[item.storageType] || Archive;
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs border-b py-1">
                    <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate font-medium">{item.productName}</span>
                    <span className="text-muted-foreground shrink-0">
                      {item.totalNeeded.toFixed(1)} {item.unit}
                    </span>
                    {item.inStock > 0 && (
                      <span className="text-green-600 shrink-0">(stock: {item.inStock})</span>
                    )}
                    <span className="font-bold shrink-0">
                      {item.toBuy.toFixed(1)} {item.unit}
                    </span>
                    {item.estimatedCost > 0 && (
                      <span className="text-muted-foreground shrink-0">${item.estimatedCost.toFixed(2)}</span>
                    )}
                  </div>
                );
              })}
              <Button size="sm" className="w-full mt-2" onClick={importFromPlan}>
                <ShoppingCart className="h-3 w-3 mr-1" />Añadir a la lista
              </Button>
            </CardContent>
          </Card>
        )}

        {importMode === "manual" && (
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input placeholder="Añadir producto..." value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem()} />
                <Button onClick={addItem} disabled={!newItem.trim()}><Plus className="h-4 w-4 mr-1" />Añadir</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {unchecked.length > 0 && (
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-lg">Pendientes ({unchecked.length})</CardTitle>
              {totalCost > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />${totalCost.toFixed(2)}
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Grouped by storage */}
              {Object.entries(grouped).map(([st, stItems]) => {
                if (stItems.length === 0) return null;
                const Icon = storageIcons[st] || Archive;
                const label = storageLabels[st] || st;
                return (
                  <div key={st}>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                      <Icon className="h-3 w-3" />
                      <span>{label}</span>
                      <span>({stItems.length})</span>
                    </div>
                    {stItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
                        <Checkbox checked={item.checked} onCheckedChange={() => toggleItem(item.id)} />
                        <span className="flex-1 text-sm">{item.name}</span>
                        {item.price ? <span className="text-[10px] text-muted-foreground">${item.price.toFixed(2)}</span> : null}
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {checked.length > 0 && (
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-lg">Comprados ({checked.length})</CardTitle>
              <Button size="sm" variant="ghost" onClick={clearChecked}>Limpiar</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {checked.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
                  <Checkbox checked={item.checked} onCheckedChange={() => toggleItem(item.id)} />
                  <span className={cn("flex-1 text-sm line-through text-muted-foreground")}>{item.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {items.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Tu lista está vacía</p>
              <p className="text-sm">Ve a la pestaña "Plan semanal" o añade manualmente</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link to="/alimentacion">Ir a Alimentación</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Need to import toast
import { toast } from "sonner";
```

---

### 11. Update `src/components/alimentacion/RecipeManager.tsx`

Replace the ingredient editing section (around lines 171-193) to add product selector. Also add cost display.

The key changes are in the ingredient row and the recipe card display:

```tsx
// In the imports, add:
import { useGroceryProducts } from "@/hooks/useGroceryProducts";

// Inside RecipeManager function, add:
const { products } = useGroceryProducts();

// Add cost computation:
const recipeCost = useMemo(() => {
  return ingredients.reduce((sum, ing) => {
    if (!ing.product_id) return sum;
    const p = products.find(pr => pr.id === ing.product_id);
    if (!p || !p.price) return sum;
    const unitCost = p.price / Math.max(1, p.package_quantity || 1);
    const qty = Number(ing.quantity_for_recipe ?? ing.quantity ?? 0);
    return sum + qty * unitCost;
  }, 0);
}, [ingredients, products]);

// In the dialog, after the Ingredient rows, add cost display:
{recipeCost > 0 && (
  <div className="text-xs text-muted-foreground text-right">
    Costo estimado: <span className="font-semibold">${recipeCost.toFixed(2)}</span>
    {servings > 0 && <> · ${(recipeCost / servings).toFixed(2)}/porción</>}
  </div>
)}

// In the ingredient row rendering, replace the Input for name with a Select that searches products:
<Select
  value={ing.product_id || ""}
  onValueChange={v => {
    const p = v ? products.find(pr => pr.id === v) : null;
    setIngredients(ingredients.map((x, j) => j === i ? {
      ...x,
      product_id: v || null,
      name: p?.name || x.name,
      unit: p?.unit || x.unit,
      quantity_for_recipe: x.quantity_for_recipe || x.quantity || null,
    } : x));
  }}
>
  <SelectTrigger className="flex-1 h-8 text-xs">
    <SelectValue placeholder="Buscar producto..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="__none__">Sin producto</SelectItem>
    {products.filter(p => !ingredients.some((x, j) => j !== i && x.product_id === p.id)).map(p => (
      <SelectItem key={p.id} value={p.id}>
        {p.name} {p.current_stock > 0 ? `(stock: ${p.current_stock})` : ""}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

### 12. Update `src/components/alimentacion/WeeklyMealPlan.tsx`

Replace the shopping list section (lines 31-47) and the import link (lines 59-61):

```tsx
// Replace imports to add:
import { useGroceryProducts } from "@/hooks/useGroceryProducts";
import { useShoppingGenerator } from "@/hooks/useShoppingGenerator";
import { ShoppingCart, ChevronLeft, ChevronRight, Snowflake, Thermometer, Archive } from "lucide-react"; // add icons

// Inside WeeklyMealPlan, add:
const { products } = useGroceryProducts();
const shoppingItems = useShoppingGenerator(plan, products);

// Replace the shopping list computation and button:
const totalToBuy = shoppingItems.filter(i => i.toBuy > 0).length;
const totalCost = shoppingItems.reduce((s, i) => s + i.estimatedCost, 0);

// Replace the button in the header:
<Link to={`/shopping-list`}>
  <Button size="sm" variant="outline">
    <ShoppingCart className="h-3 w-3 mr-1" />Lista ({totalToBuy})
  </Button>
</Link>

// Replace the shopping list card section (lines 102-114):
{shoppingItems.length > 0 && (
  <Card className="p-3">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-semibold">Resumen de compras semanal</p>
      {totalCost > 0 && <p className="text-xs text-muted-foreground">${totalCost.toFixed(2)}</p>}
    </div>
    <div className="space-y-1 max-h-60 overflow-y-auto">
      {shoppingItems.map((it, i) => {
        const Icon = it.storageType === "refrigerator" ? Snowflake
          : it.storageType === "freezer" ? Thermometer : Archive;
        return (
          <div key={i} className="flex items-center gap-2 text-xs border-b py-1">
            <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="flex-1 capitalize truncate">{it.productName}</span>
            <span className="text-muted-foreground shrink-0">
              {it.totalNeeded.toFixed(1)} {it.unit}
            </span>
            {it.inStock > 0 && (
              <span className="text-green-600 shrink-0">(stock: {it.inStock})</span>
            )}
            <span className="font-bold shrink-0">
              {it.toBuy.toFixed(1)} {it.unit}
            </span>
            {it.estimatedCost > 0 && (
              <span className="text-muted-foreground shrink-0">${it.estimatedCost.toFixed(2)}</span>
            )}
          </div>
        );
      })}
    </div>
    <Link to={`/shopping-list`} className="block mt-2">
      <Button size="sm" variant="outline" className="w-full">
        <ShoppingCart className="h-3 w-3 mr-1" />Ir a la lista de compra
      </Button>
    </Link>
  </Card>
)}
```

---

### 13. Update `src/App.tsx`

Add import and route:

```tsx
// In imports section, add:
import Grocery from "./pages/Grocery";

// After shopping-list route, add:
<Route path="/grocery" element={<Grocery />} />
```

---

### 14. Update `src/components/Navigation.tsx`

Replace the shopping-list nav item:

```tsx
// Change from:
{ path: '/shopping-list', label: 'Lista Compra', icon: ShoppingCart },

// To:
{ path: '/grocery', label: 'Despensa', icon: Package },
{ path: '/shopping-list', label: 'Lista Compra', icon: ShoppingCart },
```

Add Package to the lucide imports at the top of the file.
