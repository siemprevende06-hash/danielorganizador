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
import { Plus, Minus, Pencil, Trash2, Snowflake, Thermometer, Archive } from "lucide-react";
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
  const [photoUrl, setPhotoUrl] = useState(product.photo_url || null);

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
        {product.photo_url ? (
          <img src={product.photo_url} alt={product.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="p-2 rounded-lg bg-muted">
            <StorageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
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
            <Input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
            <Select value={storageType} onValueChange={v => setStorageType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="shelf">Estante</SelectItem>
                <SelectItem value="refrigerator">Refrigerador</SelectItem>
                <SelectItem value="freezer">Congelador</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Categoría (ej: lácteos, carnes...)" value={category} onChange={e => setCategory(e.target.value)} />
            <div className="flex gap-2">
              <Input placeholder="Unidad" value={unit} onChange={e => setUnit(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Input type="number" placeholder="Precio $" value={price} onChange={e => setPrice(e.target.value)} />
              <Input type="number" placeholder="Cant/empaque" value={packageQty} onChange={e => setPackageQty(e.target.value)} />
            </div>
            <Input placeholder="Notas" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={handleSave}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
