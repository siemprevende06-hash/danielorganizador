import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, ChefHat } from "lucide-react";
import { useRecipes, type Recipe, type RecipeIngredient } from "@/hooks/useRecipes";
import { useImageUpload } from "@/hooks/useImageUpload";
import { toast } from "@/hooks/use-toast";

export function RecipeManager() {
  const { recipes, loading, createRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { uploadImage } = useImageUpload();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [name, setName] = useState("");
  const [servings, setServings] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const reset = () => {
    setEditing(null); setName(""); setServings(1); setInstructions("");
    setPhotoUrl(null); setIngredients([]);
  };

  const openNew = () => { reset(); setOpen(true); };
  const openEdit = (r: Recipe) => {
    setEditing(r); setName(r.name); setServings(r.servings || 1);
    setInstructions(r.instructions || ""); setPhotoUrl(r.photo_url || null);
    setIngredients(r.ingredients || []);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) { toast({ title: "Nombre requerido" }); return; }
    const payload = { name: name.trim(), servings, instructions, photo_url: photoUrl, ingredients };
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2"><ChefHat className="h-4 w-4" /> Recetario</h3>
        <Button size="sm" onClick={openNew}><Plus className="h-3 w-3 mr-1" />Nueva</Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : recipes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Aún no hay recetas. Crea la primera.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {recipes.map(r => (
            <Card key={r.id} className="p-2 group relative">
              {r.photo_url && <img src={r.photo_url} alt={r.name} className="h-20 w-full rounded object-cover mb-1" />}
              <p className="text-xs font-medium truncate">{r.name}</p>
              <p className="text-[10px] text-muted-foreground">{r.ingredients?.length || 0} ingredientes</p>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <Button size="icon" variant="secondary" className="h-6 w-6" onClick={() => openEdit(r)}><Edit2 className="h-3 w-3" /></Button>
                <Button size="icon" variant="destructive" className="h-6 w-6" onClick={() => deleteRecipe(r.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </Card>
          ))}
        </div>
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
