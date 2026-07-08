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
