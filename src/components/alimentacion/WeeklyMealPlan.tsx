import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useRecipes, useMealPlan } from "@/hooks/useRecipes";

const SLOTS = [
  { id: "desayuno", label: "Desayuno" },
  { id: "merienda-1", label: "Merienda 1" },
  { id: "almuerzo", label: "Almuerzo" },
  { id: "merienda-2", label: "Merienda 2" },
  { id: "comida", label: "Comida" },
];

export function WeeklyMealPlan() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

  const { recipes } = useRecipes();
  const { plan, assign } = useMealPlan(startStr, endStr);

  const getRecipeFor = (date: string, slot: string) =>
    plan.find(p => p.plan_date === date && p.meal_slot === slot);

  // Compute shopping list from week
  const shoppingList = useMemo(() => {
    const agg: Record<string, { qty: number; unit: string }> = {};
    plan.forEach(p => {
      const ing = (p.recipe?.ingredients || []) as any[];
      ing.forEach(i => {
        const key = `${i.name.toLowerCase()}__${i.unit || ""}`;
        if (!agg[key]) agg[key] = { qty: 0, unit: i.unit || "" };
        agg[key].qty += Number(i.quantity) || 0;
      });
    });
    return Object.entries(agg).map(([k, v]) => ({
      name: k.split("__")[0], quantity: v.qty, unit: v.unit
    }));
  }, [plan]);

  const shoppingQuery = encodeURIComponent(JSON.stringify(shoppingList));

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
        <Link to={`/shopping-list?items=${shoppingQuery}`}>
          <Button size="sm" variant="outline"><ShoppingCart className="h-3 w-3 mr-1" />Lista ({shoppingList.length})</Button>
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

      {shoppingList.length > 0 && (
        <Card className="p-3">
          <p className="text-xs font-semibold mb-2">Resumen de compras semanal</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {shoppingList.map((it, i) => (
              <div key={i} className="flex justify-between border-b py-1">
                <span className="capitalize">{it.name}</span>
                <span className="text-muted-foreground">{it.quantity} {it.unit}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
