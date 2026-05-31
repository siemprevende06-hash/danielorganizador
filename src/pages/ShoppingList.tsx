import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  name: string;
  checked: boolean;
}

export default function ShoppingList() {
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems([...items, { id: crypto.randomUUID(), name: newItem.trim(), checked: false }]);
    setNewItem("");
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const uncheckedItems = items.filter(i => !i.checked);
  const checkedItems = items.filter(i => i.checked);

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
          <p className="text-sm text-muted-foreground">Gestiona tu lista de compras</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Añadir producto..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
              />
              <Button onClick={addItem} disabled={!newItem.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Añadir
              </Button>
            </div>
          </CardContent>
        </Card>

        {uncheckedItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Pendientes ({uncheckedItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {uncheckedItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <span className="flex-1 text-sm">{item.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {checkedItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Comprados ({checkedItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {checkedItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <span className={cn("flex-1 text-sm line-through text-muted-foreground")}>{item.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeItem(item.id)}
                  >
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
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Tu lista de la compra está vacía</p>
              <p className="text-sm">Añade productos usando el campo de arriba</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
