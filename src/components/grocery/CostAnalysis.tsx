import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpDown, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import type { Recipe } from "@/hooks/useRecipes";
import type { GroceryProduct } from "@/hooks/useGroceryProducts";

interface Props {
  recipes: Recipe[];
  products: GroceryProduct[];
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
        };
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
