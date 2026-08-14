import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil, Camera, Package, Leaf, DollarSign, Info } from "lucide-react";
import { useGroceryProducts, type GroceryProduct, type GroceryProductInput } from "@/hooks/useGroceryProducts";
import { useImageUpload } from "@/hooks/useImageUpload";
import { toast } from "@/hooks/use-toast";

interface FormState {
  name: string;
  category: string;
  unit: string;
  price: string;
  package_quantity: string;
  is_basic: boolean;
  photo_url: string | null;
}

const emptyForm: FormState = {
  name: "",
  category: "",
  unit: "unidad",
  price: "0",
  package_quantity: "1",
  is_basic: false,
  photo_url: null,
};

export function IngredientsManager() {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useGroceryProducts();
  const { uploadImage, uploading } = useImageUpload();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GroceryProduct | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const set = (patch: Partial<FormState>) => setForm(f => ({ ...f, ...patch }));

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: GroceryProduct) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category || "",
      unit: p.unit || "unidad",
      price: p.price?.toString() || "0",
      package_quantity: p.package_quantity?.toString() || "1",
      is_basic: !!p.is_basic,
      photo_url: p.photo_url || null,
    });
    setOpen(true);
  };

  const handlePhoto = async () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      const url = await uploadImage(f, "ingredients");
      if (url) set({ photo_url: url });
    };
    input.click();
  };

  const save = async () => {
    if (!form.name.trim()) { toast({ title: "Nombre requerido" }); return; }
    const payload: GroceryProductInput = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      unit: form.unit.trim() || "unidad",
      price: parseFloat(form.price) || 0,
      package_quantity: Math.max(1, parseInt(form.package_quantity) || 1),
      is_basic: form.is_basic,
      photo_url: form.photo_url,
    };
    if (editing) await updateProduct(editing.id, payload);
    else await createProduct(payload);
    setOpen(false);
    toast({ title: editing ? "Ingrediente actualizado" : "Ingrediente creado" });
  };

  const basics = products.filter(p => p.is_basic);
  const regulars = products.filter(p => !p.is_basic);

  const renderCard = (p: GroceryProduct) => {
    const unitCost = (p.price || 0) / Math.max(1, p.package_quantity || 1);
    return (
      <Card key={p.id} className="overflow-hidden group relative">
        <div className="h-28 bg-muted flex items-center justify-center overflow-hidden">
          {p.photo_url ? (
            <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-8 w-8 text-muted-foreground/40" />
          )}
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-semibold truncate">{p.name}</p>
            {p.is_basic && <Badge variant="secondary" className="text-[9px] shrink-0"><Leaf className="h-2.5 w-2.5 mr-0.5" />Básico</Badge>}
          </div>
          <div className="text-[10px] text-muted-foreground space-y-0.5 mt-1">
            {p.price > 0 ? (
              <>
                <p className="flex items-center gap-1"><DollarSign className="h-2.5 w-2.5" />${p.price} / {p.package_quantity} {p.unit}</p>
                <p className="font-medium text-foreground/70">= ${unitCost.toFixed(2)} por {p.unit}</p>
              </>
            ) : (
              <p>Sin precio</p>
            )}
            <p>Stock: {p.current_stock} {p.unit}</p>
          </div>
        </div>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => openEdit(p)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => deleteProduct(p.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2"><Package className="h-5 w-5" /> Ingredientes</h3>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Info className="h-3 w-3" />
            Precio y cantidad por empaque: la app calcula el costo por unidad usado en tus recetas.
          </p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nuevo ingrediente</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : regulars.length === 0 && basics.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          Aún no hay ingredientes. Agrega el primero (ej: paquete de salchichas, arroz, pollo...).
        </p>
      ) : (
        <>
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-base font-semibold">Ingredientes</h4>
              <span className="text-xs text-muted-foreground">({regulars.length})</span>
            </div>
            {regulars.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin ingredientes</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {regulars.map(renderCard)}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="h-4 w-4 text-green-600" />
              <h4 className="text-base font-semibold">Básicos (duran mucho)</h4>
              <span className="text-xs text-muted-foreground">({basics.length})</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Sal, aceite, especias... Se excluyen de la lista de compras semanal pero sí cuentan su costo en las recetas.
            </p>
            {basics.length === 0 ? (
              <p className="text-xs text-muted-foreground">Marca un ingrediente como "Básico" si dura mucho y siempre lo tienes.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {basics.map(renderCard)}
              </div>
            )}
          </section>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Editar ingrediente" : "Nuevo ingrediente"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {form.photo_url ? (
                  <img src={form.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-6 w-6 text-muted-foreground/40" />
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handlePhoto} disabled={uploading}>
                <Camera className="h-3 w-3 mr-1" />{form.photo_url ? "Cambiar foto" : "Subir foto"}
              </Button>
            </div>
            <Input placeholder="Nombre (ej: Salchichas)" value={form.name} onChange={e => set({ name: e.target.value })} />
            <Input placeholder="Categoría (ej: carnes, lácteos...)" value={form.category} onChange={e => set({ category: e.target.value })} />
            <Input placeholder="Unidad (ej: perrito, g, ml, pieza)" value={form.unit} onChange={e => set({ unit: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Precio del empaque ($)</label>
                <Input type="number" min={0} value={form.price} onChange={e => set({ price: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Cantidad en el empaque</label>
                <Input type="number" min={1} value={form.package_quantity} onChange={e => set({ package_quantity: e.target.value })} />
              </div>
            </div>
            {parseFloat(form.price) > 0 && parseInt(form.package_quantity) > 0 && (
              <p className="text-[11px] text-muted-foreground bg-muted rounded-md px-2 py-1.5">
                = ${(parseFloat(form.price) / parseInt(form.package_quantity)).toFixed(2)} por {form.unit || "unidad"}
              </p>
            )}
            <Select value={form.is_basic ? "basic" : "normal"} onValueChange={v => set({ is_basic: v === "basic" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (se compra seguido)</SelectItem>
                <SelectItem value="basic">Básico: dura mucho (sal, aceite, especias)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
