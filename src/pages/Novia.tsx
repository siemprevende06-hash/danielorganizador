import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useTextSection } from "@/hooks/useTextSection";
import { Plus, Trash2, Heart, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoviaItem {
  id: string;
  text: string;
  checked: boolean;
}

interface NoviaList {
  id: string;
  name: string;
  items: NoviaItem[];
}

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export default function Novia() {
  const { data: lists, setData: setLists, loading } = useTextSection<NoviaList[]>("novia-lists", []);
  const [newListName, setNewListName] = useState("");
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});

  const addList = () => {
    if (!newListName.trim()) return;
    setLists([...lists, { id: uid(), name: newListName.trim(), items: [] }]);
    setNewListName("");
  };

  const deleteList = (id: string) => {
    setLists(lists.filter(l => l.id !== id));
  };

  const addItem = (listId: string) => {
    const text = newItemText[listId]?.trim();
    if (!text) return;
    setLists(lists.map(l =>
      l.id === listId ? { ...l, items: [...l.items, { id: uid(), text, checked: false }] } : l
    ));
    setNewItemText(prev => ({ ...prev, [listId]: "" }));
  };

  const toggleItem = (listId: string, itemId: string) => {
    setLists(lists.map(l =>
      l.id === listId
        ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) }
        : l
    ));
  };

  const deleteItem = (listId: string, itemId: string) => {
    setLists(lists.map(l =>
      l.id === listId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Novia</h1>
            <p className="text-sm text-muted-foreground">Listas de cosas pendientes</p>
          </div>
        </div>

        {/* Create new list */}
        <div className="flex gap-2">
          <Input
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            placeholder="Nombre de la lista..."
            className="h-9"
            onKeyDown={e => { if (e.key === 'Enter') addList(); }}
          />
          <Button onClick={addList} disabled={!newListName.trim()} className="h-9 shrink-0 gap-1.5">
            <Plus className="h-4 w-4" /> Crear lista
          </Button>
        </div>

        {lists.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <ListChecks className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">No hay listas todavía. Crea una para empezar.</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {lists.map(list => {
            const checkedCount = list.items.filter(i => i.checked).length;
            return (
              <Card key={list.id} className="overflow-hidden">
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold truncate">{list.name}</CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      {checkedCount}/{list.items.length} completados
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => deleteList(list.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {/* Add item */}
                  <div className="flex gap-2">
                    <Input
                      value={newItemText[list.id] || ""}
                      onChange={e => setNewItemText(prev => ({ ...prev, [list.id]: e.target.value }))}
                      placeholder="Agregar elemento..."
                      className="h-8 text-sm"
                      onKeyDown={e => { if (e.key === 'Enter') addItem(list.id); }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => addItem(list.id)}
                      disabled={!newItemText[list.id]?.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Items */}
                  {list.items.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4 italic">Sin elementos</p>
                  )}
                  <div className="space-y-1">
                    {list.items.map(item => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-2.5 p-2 rounded-lg border border-border/40 text-sm transition-colors group",
                          item.checked && "bg-muted/30 border-muted"
                        )}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(list.id, item.id)}
                          className="h-4 w-4"
                        />
                        <span className={cn("flex-1 min-w-0 truncate", item.checked && "line-through text-muted-foreground")}>
                          {item.text}
                        </span>
                        <button
                          onClick={() => deleteItem(list.id, item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
