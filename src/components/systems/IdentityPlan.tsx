import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  ArrowRight, Edit2, Check, Settings2, Plus, Trash2, GripVertical,
} from "lucide-react";
import { useIdentitySystems } from "@/hooks/useIdentitySystems";
import type { IdentitySystem, IdentitySystemTask } from "@/lib/definitions";

const DEFAULT_AREAS = [
  { area_id: "universidad", area_label: "Universidad", icon: "🎓", color: "#3b82f6" },
  { area_id: "emprendimiento", area_label: "Emprendimiento", icon: "💼", color: "#8b5cf6" },
  { area_id: "proyectos", area_label: "Proyectos", icon: "💻", color: "#06b6d4" },
  { area_id: "piano", area_label: "Piano", icon: "🎹", color: "#ec4899" },
  { area_id: "guitarra", area_label: "Guitarra", icon: "🎸", color: "#f97316" },
  { area_id: "lectura", area_label: "Lectura", icon: "📖", color: "#14b8a6" },
  { area_id: "ajedrez", area_label: "Ajedrez", icon: "♟️", color: "#6366f1" },
  { area_id: "apariencia", area_label: "Apariencia", icon: "✨", color: "#f472b6" },
  { area_id: "gym", area_label: "Gym", icon: "💪", color: "#ef4444" },
  { area_id: "finanzas", area_label: "Finanzas", icon: "💰", color: "#22c55e" },
  { area_id: "idiomas", area_label: "Idiomas", icon: "🌐", color: "#10b981" },
];

interface IdentityItem {
  id: string;
  area_id: string;
  area_label: string;
  point_a: string;
  point_b: string;
  progress_percentage: number;
  icon: string;
  color: string;
}

export function IdentityPlan() {
  const [items, setItems] = useState<IdentityItem[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    dailyStates,
    createSystem,
    updateSystem,
    deleteSystem,
    toggleActive,
    toggleTaskState,
    getSystemsByArea,
    refetch: refetchSystems,
  } = useIdentitySystems();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<IdentitySystem | null>(null);
  const [dialogName, setDialogName] = useState("");
  const [dialogDescription, setDialogDescription] = useState("");
  const [dialogTasks, setDialogTasks] = useState<IdentitySystemTask[]>([]);
  const [dialogAreaId, setDialogAreaId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase.from("identity_plan").select("*").order("created_at");
    if (data && data.length > 0) {
      setItems(data as IdentityItem[]);
    } else {
      const seeds = DEFAULT_AREAS.map(a => ({
        ...a,
        point_a: "",
        point_b: "",
        progress_percentage: 0,
      }));
      const { data: inserted } = await supabase
        .from("identity_plan")
        .upsert(seeds, { onConflict: "area_id" })
        .select("*");
      setItems((inserted as IdentityItem[]) || []);
    }
    setLoading(false);
  };

  const updateItem = async (id: string, updates: Partial<IdentityItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    await supabase.from("identity_plan").update(updates).eq("id", id);
  };

  const openCreateDialog = (areaId: string) => {
    setEditingSystem(null);
    setDialogAreaId(areaId);
    setDialogName("");
    setDialogDescription("");
    setDialogTasks([]);
    setDialogOpen(true);
  };

  const openEditDialog = (system: IdentitySystem) => {
    setEditingSystem(system);
    setDialogAreaId(system.area_id);
    setDialogName(system.name);
    setDialogDescription(system.description);
    setDialogTasks([...system.tasks]);
    setDialogOpen(true);
  };

  const handleSaveSystem = async () => {
    if (!dialogName.trim()) return;

    if (editingSystem) {
      await updateSystem(editingSystem.id, {
        name: dialogName,
        description: dialogDescription,
        tasks: dialogTasks,
      });
    } else {
      await createSystem(dialogAreaId, dialogName);
      await updateSystem(
        (await supabase
          .from("identity_systems")
          .select("id")
          .eq("area_id", dialogAreaId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single())?.data?.id || "",
        {
          description: dialogDescription,
          tasks: dialogTasks,
        } as Partial<IdentitySystem>,
      );
    }

    await refetchSystems();
    setDialogOpen(false);
  };

  const addTaskToDialog = () => {
    setDialogTasks(prev => [
      ...prev,
      { id: crypto.randomUUID(), description: "" },
    ]);
  };

  const updateTaskInDialog = (taskId: string, description: string) => {
    setDialogTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, description } : t)),
    );
  };

  const removeTaskFromDialog = (taskId: string) => {
    setDialogTasks(prev => prev.filter(t => t.id !== taskId));
  };

  if (loading) return null;

  return (
    <>
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-bold mb-1">🪞 Plan Identidad</h3>
        <p className="text-xs text-muted-foreground mb-4">Define tu Punto A → Punto B en cada área de vida</p>

        <div className="space-y-4">
          {items.map(item => {
            const isEditing = editing === item.id;
            const areaSystems = getSystemsByArea(item.area_id);
            return (
              <div key={item.id} className="rounded-xl border p-3 space-y-2" style={{ borderColor: item.color + "40" }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-semibold text-sm flex-1">{item.area_label}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditing(isEditing ? null : item.id)}
                  >
                    {isEditing ? <Check className="h-3 w-3" /> : <Edit2 className="h-3 w-3" />}
                  </Button>
                </div>

                {/* Point A → B */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 p-2 min-h-[2.5rem]">
                    <p className="text-[10px] text-red-500 font-semibold mb-0.5">PUNTO A</p>
                    {isEditing ? (
                      <Input
                        value={item.point_a}
                        onChange={e => updateItem(item.id, { point_a: e.target.value })}
                        className="h-6 text-xs border-0 p-0 bg-transparent"
                        placeholder="¿Dónde estoy?"
                      />
                    ) : (
                      <p className="text-muted-foreground">{item.point_a || "Sin definir"}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 rounded-lg bg-green-500/10 border border-green-500/20 p-2 min-h-[2.5rem]">
                    <p className="text-[10px] text-green-500 font-semibold mb-0.5">PUNTO B</p>
                    {isEditing ? (
                      <Input
                        value={item.point_b}
                        onChange={e => updateItem(item.id, { point_b: e.target.value })}
                        className="h-6 text-xs border-0 p-0 bg-transparent"
                        placeholder="¿A dónde voy?"
                      />
                    ) : (
                      <p className="text-muted-foreground">{item.point_b || "Sin definir"}</p>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-semibold" style={{ color: item.color }}>{item.progress_percentage}%</span>
                  </div>
                  {isEditing ? (
                    <Slider
                      value={[item.progress_percentage]}
                      max={100}
                      step={5}
                      onValueChange={([v]) => updateItem(item.id, { progress_percentage: v })}
                      className="py-1"
                    />
                  ) : (
                    <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all"
                        style={{ width: `${item.progress_percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  )}
                </div>

                {/* Systems */}
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">⚙️ SISTEMAS</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1"
                      onClick={() => openCreateDialog(item.area_id)}
                    >
                      <Plus className="h-3 w-3" /> Agregar
                    </Button>
                  </div>

                  {areaSystems.length === 0 && (
                    <p className="text-[10px] text-muted-foreground italic">
                      Agrega sistemas que te lleven al Punto B
                    </p>
                  )}

                  {areaSystems.map(sys => {
                    const states = dailyStates[sys.id] || {};
                    const allDone = sys.tasks.length > 0 && sys.tasks.every(t => states[t.id]);
                    return (
                      <div
                        key={sys.id}
                        className={cn(
                          "rounded-lg border p-2 space-y-1.5 transition-opacity",
                          !sys.is_active && "opacity-50",
                        )}
                        style={{ borderColor: item.color + "30" }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium flex-1">{sys.name}</span>
                          <Switch
                            checked={sys.is_active}
                            onCheckedChange={v => toggleActive(sys.id, v)}
                            className="scale-75"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => openEditDialog(sys)}
                          >
                            <Settings2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-red-400 hover:text-red-600"
                            onClick={() => deleteSystem(sys.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {sys.description && (
                          <p className="text-[10px] text-muted-foreground">{sys.description}</p>
                        )}

                        {sys.tasks.length > 0 && (
                          <div className="space-y-1 pl-0.5">
                            {sys.tasks.map(task => (
                              <label
                                key={task.id}
                                className={cn(
                                  "flex items-center gap-1.5 cursor-pointer",
                                  allDone && "line-through text-muted-foreground/60",
                                )}
                              >
                                <Checkbox
                                  checked={states[task.id] || false}
                                  onCheckedChange={() => toggleTaskState(sys.id, task.id)}
                                  className="h-3 w-3"
                                />
                                <span className="text-[11px]">{task.description}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Edit / Create System Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSystem ? "Editar sistema" : "Nuevo sistema"}</DialogTitle>
            <DialogDescription>
              Define las acciones diarias que te acercan al Punto B
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Nombre del sistema</Label>
              <Input
                value={dialogName}
                onChange={e => setDialogName(e.target.value)}
                placeholder="Ej: Baja energía, Normal, Motivado..."
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Descripción</Label>
              <Textarea
                value={dialogDescription}
                onChange={e => setDialogDescription(e.target.value)}
                placeholder="Describe qué implica este sistema..."
                className="text-sm min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Subtareas</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={addTaskToDialog}
                >
                  <Plus className="h-3 w-3" /> Agregar subtarea
                </Button>
              </div>

              {dialogTasks.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">
                  No hay subtareas. Agrega acciones específicas.
                </p>
              )}

              {dialogTasks.map((task, idx) => (
                <div key={task.id} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-4">{idx + 1}.</span>
                  <Input
                    value={task.description}
                    onChange={e => updateTaskInDialog(task.id, e.target.value)}
                    placeholder="Ej: Estudiar 2 bloques de 1hr"
                    className="h-7 text-xs flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-red-400 hover:text-red-600"
                    onClick={() => removeTaskFromDialog(task.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveSystem} disabled={!dialogName.trim()}>
              {editingSystem ? "Guardar cambios" : "Crear sistema"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
