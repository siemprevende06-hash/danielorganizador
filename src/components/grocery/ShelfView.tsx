import { useState } from "react";
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
            <Input placeholder="Unidad" value={unit} onChange={e => setUnit(e.target.value)} />
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
