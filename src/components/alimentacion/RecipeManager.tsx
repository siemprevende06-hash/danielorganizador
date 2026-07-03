import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, ChefHat, Sun, Cookie, UtensilsCrossed, MoonStar } from "lucide-react";
import { useRecipes, type Recipe, type RecipeIngredient } from "@/hooks/useRecipes";
import { useImageUpload } from "@/hooks/useImageUpload";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "desayuno", label: "Desayuno", icon: Sun },
  { value: "merienda", label: "Meriendas", icon: Cookie },
  { value: "almuerzo", label: "Almuerzo", icon: UtensilsCrossed },
  { value: "comida", label: "Comida", icon: ChefHat },
  { value: "antes-dormir", label: "Antes de Dormir", icon: MoonStar },
];

export function RecipeManager() {
  const { recipes, loading, createRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { uploadImage } = useImageUpload();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [name, setName] = useState("");
  const [servings, setServings] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const reset = () => {
    setEditing(null); setName(""); setServings(1); setInstructions("");
    setPhotoUrl(null); setCategory(""); setIngredients([]);
  };

  const openNew = () => { reset(); setOpen(true); };
  const openEdit = (r: Recipe) => {
    setEditing(r); setName(r.name); setServings(r.servings || 1);
    setInstructions(r.instructions || ""); setPhotoUrl(r.photo_url || null);
    setCategory(r.category || ""); setIngredients(r.ingredients || []);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) { toast({ title: "Nombre requerido" }); return; }
    const payload = { name: name.trim(), servings, instructions, photo_url: photoUrl, category: category || null, ingredients };
    if (editing) await updateRecipe(editing.id, payload);
    else await createRecipe(payload);
    setOpen(false); reset();
    toast({ title: editing ? "Receta actualizada" : "Receta creada" });
  };

  const handlePhoto = async () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      const url = await uploadImage(f);
      if (url) setPhotoUrl(url);
    };
    input.click();
  };

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: recipes.filter(r => r.category === cat.value)
  }));

  const uncategorized = recipes.filter(r => !r.category);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2"><ChefHat className="h-5 w-5" /> Recetario</h3>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nueva receta</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : recipes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Aún no hay recetas. Crea la primera.</p>
      ) : (
        <>
          {grouped.map(cat => {
            if (cat.items.length === 0) return null;
            const Icon = cat.icon;
            return (
              <section key={cat.value}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <h4 className="text-base font-semibold">{cat.label}</h4>
                  <span className="text-xs text-muted-foreground">({cat.items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.items.map(r => (
                    <Card key={r.id} className="p-4 group relative">
                      {r.photo_url && <img src={r.photo_url} alt={r.name} className="h-40 w-full rounded object-cover mb-3" />}
                      <p className="text-sm font-semibold truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.ingredients?.length || 0} ingredientes</p>
                      {r.servings && <p className="text-xs text-muted-foreground">{r.servings} porciones</p>}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEdit(r)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => deleteRecipe(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}

          {uncategorized.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-base font-semibold">Sin categoría</h4>
                <span className="text-xs text-muted-foreground">({uncategorized.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uncategorized.map(r => (
                  <Card key={r.id} className="p-4 group relative">
                    {r.photo_url && <img src={r.photo_url} alt={r.name} className="h-40 w-full rounded object-cover mb-3" />}
                    <p className="text-sm font-semibold truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.ingredients?.length || 0} ingredientes</p>
                    {r.servings && <p className="text-xs text-muted-foreground">{r.servings} porciones</p>}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEdit(r)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => deleteRecipe(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar receta" : "Nueva receta"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
            <div className="flex gap-2">
              <Input type="number" min={1} value={servings} onChange={e => setServings(+e.target.value)} placeholder="Porciones" />
              <Button variant="outline" size="sm" onClick={handlePhoto}>{photoUrl ? "Cambiar foto" : "Subir foto"}</Button>
            </div>
            <Select value={category || "__none__"} onValueChange={v => setCategory(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin categoría</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {photoUrl && <img src={photoUrl} alt="" className="h-24 w-full rounded object-cover" />}
            <Textarea placeholder="Instrucciones..." value={instructions} onChange={e => setInstructions(e.target.value)} rows={3} />

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold">Ingredientes</p>
                <Button size="sm" variant="ghost" onClick={() => setIngredients([...ingredients, { name: "", quantity: 1, unit: "g" }])}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-1">
                    <Input className="flex-1" placeholder="Nombre" value={ing.name}
                      onChange={e => setIngredients(ingredients.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                    <Input className="w-16" type="number" value={ing.quantity ?? ""} placeholder="Cant"
                      onChange={e => setIngredients(ingredients.map((x, j) => j === i ? { ...x, quantity: +e.target.value } : x))} />
                    <Input className="w-16" placeholder="Unidad" value={ing.unit ?? ""}
                      onChange={e => setIngredients(ingredients.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))} />
                    <Button size="icon" variant="ghost" onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
