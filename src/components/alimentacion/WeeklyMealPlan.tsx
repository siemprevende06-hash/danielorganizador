import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { ShoppingCart, ChevronLeft, ChevronRight, Snowflake, Thermometer, Archive } from "lucide-react";
import { Link } from "react-router-dom";
import { useRecipes, useMealPlan } from "@/hooks/useRecipes";
import { useGroceryProducts } from "@/hooks/useGroceryProducts";
import { useShoppingGenerator } from "@/hooks/useShoppingGenerator";

const SLOTS = [
  { id: "desayuno", label: "Desayuno" },
  { id: "merienda-1", label: "Merienda 1" },
  { id: "almuerzo", label: "Almuerzo" },
  { id: "merienda-2", label: "Merienda 2" },
  { id: "comida", label: "Comida" },
];

const storageIcons: Record<string, any> = {
  refrigerator: Snowflake,
  freezer: Thermometer,
  shelf: Archive,
};

export function WeeklyMealPlan() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

  const { recipes } = useRecipes();
  const { plan, assign } = useMealPlan(startStr, endStr);
  const { products } = useGroceryProducts();
  const shoppingItems = useShoppingGenerator(plan, products);

  const getRecipeFor = (date: string, slot: string) =>
    plan.find(p => p.plan_date === date && p.meal_slot === slot);

  const totalToBuy = shoppingItems.filter(i => i.toBuy > 0).length;
  const totalCost = shoppingItems.reduce((s, i) => s + i.estimatedCost, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-semibold">
            Semana del {format(weekStart, "d MMM", { locale: es })}
          </span>
          <Button size="icon" variant="ghost" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <Link to={`/shopping-list`}>
          <Button size="sm" variant="outline"><ShoppingCart className="h-3 w-3 mr-1" />Lista ({totalToBuy})</Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px] grid grid-cols-[80px_repeat(7,1fr)] gap-1 text-xs">
          <div></div>
          {days.map(d => (
            <div key={d.toISOString()} className="text-center font-semibold capitalize p-1">
              {format(d, "EEE d", { locale: es })}
            </div>
          ))}
          {SLOTS.map(slot => (
            <>
              <div key={slot.id} className="font-medium py-2">{slot.label}</div>
              {days.map(d => {
                const ds = format(d, "yyyy-MM-dd");
                const entry = getRecipeFor(ds, slot.id);
                return (
                  <div key={ds + slot.id}>
                    <Select
                      value={entry?.recipe_id || "__none__"}
                      onValueChange={(v) => assign(ds, slot.id, v === "__none__" ? null : v)}
                    >
                      <SelectTrigger className="h-12 text-[10px]">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {recipes.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {shoppingItems.length > 0 && (
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold">Resumen de compras semanal</p>
            {totalCost > 0 && <p className="text-xs text-muted-foreground">${totalCost.toFixed(2)}</p>}
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {shoppingItems.map((it, i) => {
              const Icon = storageIcons[it.storageType] || Archive;
              return (
                <div key={i} className="flex items-center gap-2 text-xs border-b py-1">
                  <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="flex-1 capitalize truncate font-medium">{it.productName}</span>
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
    </div>
  );
}
