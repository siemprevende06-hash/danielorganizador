import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, Trash2, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Item { id: string; name: string; checked: boolean; qty?: number; unit?: string; }

export default function ShoppingList() {
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState("");
  const [params, setParams] = useSearchParams();
  const today = new Date().toISOString().split("T")[0];

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

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

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
          <p className="text-sm text-muted-foreground">Importa desde tu plan semanal o añade manual</p>
        </div>

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

        {unchecked.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Pendientes ({unchecked.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {unchecked.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
                  <Checkbox checked={item.checked} onCheckedChange={() => toggleItem(item.id)} />
                  <span className="flex-1 text-sm">{item.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
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
              <p className="text-sm">Genera una desde Alimentación → Semana</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
