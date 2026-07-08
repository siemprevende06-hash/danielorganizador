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
import { useMealPlan } from "@/hooks/useRecipes";
import { useShoppingGenerator } from "@/hooks/useShoppingGenerator";
import { startOfWeek, addDays, format } from "date-fns";
import { toast } from "sonner";

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

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(addDays(weekStart, 6), "yyyy-MM-dd");
  const { plan } = useMealPlan(startStr, endStr);
  const shoppingItems = useShoppingGenerator(plan, products);

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
      toast.success(`Importados ${additions.length} productos del plan semanal`);
    }
  };

  const totalCost = items.filter(i => !i.checked).reduce((s, i) => s + (i.price || 0), 0);

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

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
