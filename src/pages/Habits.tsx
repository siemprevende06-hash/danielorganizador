import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache } from "@/lib/offlineCache";
import { cachedMutation } from "@/lib/supabaseCache";
import { Dumbbell, Moon, Zap, Droplet, Target, Shirt, GraduationCap, Code, Briefcase, Book, Music, Gamepad2, Globe, Crown, Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MINI_HABITS_KEY = "miniHabits";

interface MiniHabit {
  id: string;
  label: string;
  emoji: string;
}

const DEFAULT_MINI_HABITS: MiniHabit[] = [
  { id: "mini-nofap", label: "No FAP", emoji: "🚫" },
  { id: "mini-nosocial", label: "No Redes Sociales +30min", emoji: "📵" },
];

const STRUCTURAL_HABITS = [
  { id: "habit-sueno", title: "Horario regular de sueño", icon: Moon, area: "sueno" },
  { id: "habit-rutina-activacion", title: "Rutina de activación", icon: Zap, area: "rutina-activacion" },
  { id: "habit-entrenamiento", title: "Gym", icon: Dumbbell, area: "entrenamiento" },
  { id: "habit-desayuno", title: "Alistamiento y desayuno", icon: Shirt, area: "cuidado-personal" },
  { id: "habit-skincare-am", title: "Skin care (mañana)", icon: Droplet, area: "skincare" },
  { id: "habit-skincare-pm", title: "Skin care (noche)", icon: Droplet, area: "skincare" },
  { id: "habit-rutina-desactivacion", title: "Rutina de desactivación", icon: Moon, area: "rutina-desactivacion" },
  { id: "habit-alimentacion", title: "Alimentación y agua", icon: Target, area: "cuidado-personal" },
  { id: "habit-finanzas", title: "Control financiero diario", icon: Target, area: "finanzas" },
];

const FOCUS_HABITS = [
  { id: "habit-foco", title: "Foco", icon: Target, area: "focus" },
  { id: "habit-universidad", title: "Universidad", icon: GraduationCap, area: "universidad" },
  { id: "habit-emprendimiento", title: "Emprendimiento", icon: Briefcase, area: "emprendimiento" },
  { id: "habit-proyectos", title: "Proyectos y tareas", icon: Code, area: "proyectos-personales" },
];

const HOBBY_HABITS = [
  { id: "habit-lectura", title: "Lectura", icon: Book, area: "lectura" },
  { id: "habit-ajedrez", title: "Ajedrez", icon: Crown, area: "ajedrez" },
  { id: "habit-piano", title: "Piano", icon: Music, area: "musica" },
  { id: "habit-guitarra", title: "Guitarra", icon: Music, area: "musica" },
  { id: "habit-ingles", title: "Inglés", icon: Globe, area: "idiomas" },
  { id: "habit-italiano", title: "Italiano", icon: Globe, area: "idiomas" },
];

const todayKey = () => new Date().toISOString().split("T")[0];

function loadMiniDefs(): MiniHabit[] {
  try {
    const raw = localStorage.getItem(MINI_HABITS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(MINI_HABITS_KEY, JSON.stringify(DEFAULT_MINI_HABITS));
  return DEFAULT_MINI_HABITS;
}

function saveMiniDefs(defs: MiniHabit[]) {
  localStorage.setItem(MINI_HABITS_KEY, JSON.stringify(defs));
}

export default function HabitsPage() {
  const [miniDefs, setMiniDefs] = useState<MiniHabit[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("⭐");

  useEffect(() => {
    setMiniDefs(loadMiniDefs());
    (async () => {
      const today = todayKey();
      try {
        const { data } = await supabase
          .from("daily_systems_tracking")
          .select("id, completions")
          .eq("tracking_date", today)
          .maybeSingle();
        if (data) {
          setRecordId(data.id);
          setCompletions((data.completions as Record<string, boolean>) || {});
        }
      } catch {
        const cached = await getCached<any>("daily_systems_tracking", `mini_${today}`);
        if (cached) setCompletions(cached.completions || {});
      }
    })();
  }, []);

  const toggleMini = async (id: string) => {
    const next = { ...completions, [id]: !completions[id] };
    setCompletions(next);
    const payload = { completions: next, tracking_date: todayKey() };
    if (recordId) {
      await cachedMutation("daily_systems_tracking", "update", payload, { id: recordId });
    } else {
      await cachedMutation("daily_systems_tracking", "upsert", payload, undefined, "tracking_date");
    }
  };

  const addMini = () => {
    if (!newLabel.trim()) return;
    const id = `mini-${Date.now()}`;
    const updated = [...miniDefs, { id, label: newLabel.trim(), emoji: newEmoji }];
    setMiniDefs(updated);
    saveMiniDefs(updated);
    setNewLabel("");
    setIsAddOpen(false);
    toast.success("Mini hábito creado");
  };

  const deleteMini = (id: string) => {
    const updated = miniDefs.filter(d => d.id !== id);
    setMiniDefs(updated);
    saveMiniDefs(updated);
    toast.success("Mini hábito eliminado");
  };

  const doneCount = miniDefs.filter(d => completions[d.id]).length;

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-bold">Hábitos</h1>
        <p className="text-muted-foreground">Administra todos tus hábitos en un solo lugar</p>
      </header>

      <Tabs defaultValue="mini">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="mini">Mini Hábitos</TabsTrigger>
          <TabsTrigger value="categorias">Estructurales</TabsTrigger>
          <TabsTrigger value="hobbys">Hobbies</TabsTrigger>
        </TabsList>

        {/* === MINI HÁBITOS (CRUD) === */}
        <TabsContent value="mini" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Mini Hábitos
                  <Badge variant="outline">{doneCount}/{miniDefs.length}</Badge>
                </CardTitle>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-3 w-3 mr-1" />Añadir</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo Mini Hábito</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div>
                      <label className="text-sm font-medium">Nombre</label>
                      <Input
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                        placeholder="Ej: No FAP"
                        onKeyDown={e => e.key === "Enter" && addMini()}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Emoji</label>
                      <div className="flex gap-2 mt-1">
                        {["🚫", "📵", "⭐", "💪", "🧠", "🎯", "🔥", "⏰", "📚", "🎮"].map(e => (
                          <button
                            key={e}
                            onClick={() => setNewEmoji(e)}
                            className={cn(
                              "text-xl w-9 h-9 rounded flex items-center justify-center transition-all",
                              newEmoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/70"
                            )}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={addMini}>Crear</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {miniDefs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No tienes mini hábitos</p>
                  <p className="text-xs">Crea tu primer mini hábito para empezar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {miniDefs.map(d => {
                    const done = !!completions[d.id];
                    return (
                      <div
                        key={d.id}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg transition-all ring-1",
                          done
                            ? "bg-green-500/10 ring-green-500/50"
                            : "bg-muted/40 ring-muted/30"
                        )}
                      >
                        <button
                          onClick={() => toggleMini(d.id)}
                          className="flex items-center gap-2 flex-1 text-left"
                        >
                          <span className="text-lg">{d.emoji}</span>
                          <span className={cn("text-sm flex-1", done && "text-green-600 font-medium line-through")}>
                            {d.label}
                          </span>
                          {done && <span className="text-green-600 text-sm">✓</span>}
                        </button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMini(d.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ESTRUCTURALES === */}
        <TabsContent value="categorias" className="mt-4 space-y-4">
          <StructuralCard title="🏗️ Estructurales (Base)" habits={STRUCTURAL_HABITS} completions={completions} onToggle={toggleMini} />
          <StructuralCard title="🎯 Áreas de Enfoque" habits={FOCUS_HABITS} completions={completions} onToggle={toggleMini} />
        </TabsContent>

        {/* === HOBBIES === */}
        <TabsContent value="hobbys" className="mt-4 space-y-4">
          <StructuralCard title="🎨 Hobbies" habits={HOBBY_HABITS} completions={completions} onToggle={toggleMini} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StructuralCard({
  title, habits, completions, onToggle,
}: {
  title: string;
  habits: { id: string; title: string; icon: any; area: string }[];
  completions: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const done = habits.filter(h => completions[h.id]).length;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          {title}
          <Badge variant={done === habits.length ? "default" : "secondary"}>{done}/{habits.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {habits.map(habit => {
            const completed = !!completions[habit.id];
            const Icon = habit.icon;
            return (
              <button
                key={habit.id}
                onClick={() => onToggle(habit.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left",
                  completed ? "bg-primary/10" : "bg-muted/30 hover:bg-muted/50"
                )}
              >
                <Icon className={cn("w-4 h-4", completed ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm flex-1", completed ? "text-foreground font-medium" : "text-muted-foreground")}>
                  {habit.title}
                </span>
                {completed && <Badge variant="default" className="text-xs">✓</Badge>}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
