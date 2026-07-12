import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getCached } from "@/lib/offlineCache";
import { cachedMutation } from "@/lib/supabaseCache";
import { Dumbbell, Moon, Zap, Droplet, Target, Shirt, GraduationCap, Code, Briefcase, Book, Music, Globe, Crown, Plus, Trash2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MINI_HABITS_SETTING = "mini_habits_defs";

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

async function loadMiniDefs(): Promise<MiniHabit[]> {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", MINI_HABITS_SETTING)
      .maybeSingle();
    const v: any = data?.setting_value;
    const arr = (v?.value ?? v) as MiniHabit[] | undefined;
    if (Array.isArray(arr) && arr.length > 0) return arr;
  } catch {}
  await saveMiniDefs(DEFAULT_MINI_HABITS);
  return DEFAULT_MINI_HABITS;
}

async function saveMiniDefs(defs: MiniHabit[]) {
  try {
    await supabase
      .from("app_settings")
      .upsert(
        { setting_key: MINI_HABITS_SETTING, setting_value: { value: defs } as any },
        { onConflict: "user_id,setting_key" }
      );
  } catch (e) {
    console.warn("saveMiniDefs failed", e);
  }
}

export default function HabitsPage() {
  const [miniDefs, setMiniDefs] = useState<MiniHabit[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("⭐");
  const [todayScore, setTodayScore] = useState(0);

  useEffect(() => {
    loadMiniDefs().then(setMiniDefs);
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

  const allHabits = [...STRUCTURAL_HABITS, ...FOCUS_HABITS, ...HOBBY_HABITS];
  useEffect(() => {
    const miniDone = miniDefs.filter(d => completions[d.id]).length;
    const structDone = allHabits.filter(h => completions[h.id]).length;
    const total = miniDefs.length + allHabits.length;
    setTodayScore(total > 0 ? Math.round(((miniDone + structDone) / total) * 100) : 0);
  }, [completions, miniDefs]);

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hábitos</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs rounded-full gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Mini Hábito
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo Mini Hábito</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Ej: No FAP" onKeyDown={e => e.key === "Enter" && addMini()} />
                </div>
                <div>
                  <label className="text-sm font-medium">Emoji</label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {["🚫", "📵", "⭐", "💪", "🧠", "🎯", "🔥", "⏰", "📚", "🎮", "🎵", "💧", "🌙", "☀️"].map(e => (
                      <button key={e} onClick={() => setNewEmoji(e)}
                        className={cn("text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                          newEmoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/70"
                        )}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={addMini} className="w-full rounded-full">Crear</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Today's Score */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Progreso de hoy</span>
              <span className="text-sm font-bold">{todayScore}%</span>
            </div>
            <Progress value={todayScore} className="h-1.5" indicatorClassName="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Mini Hábitos", value: `${doneCount}/${miniDefs.length}`, color: "from-purple-500 to-pink-400" },
            { label: "Estructurales", value: `${STRUCTURAL_HABITS.filter(h => completions[h.id]).length}/${STRUCTURAL_HABITS.length}`, color: "from-blue-500 to-cyan-400" },
            { label: "Hobbies", value: `${HOBBY_HABITS.filter(h => completions[h.id]).length}/${HOBBY_HABITS.length}`, color: "from-amber-500 to-orange-400" },
          ].map((s, i) => (
            <Card key={i} className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className={cn("h-1 bg-gradient-to-r", s.color)} />
              <CardContent className="p-3.5 text-center space-y-1">
                <div className="text-lg font-bold tabular-nums">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="mini" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-1 h-auto">
            <TabsTrigger value="mini" className="rounded-full text-xs py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Mini Hábitos</TabsTrigger>
            <TabsTrigger value="categorias" className="rounded-full text-xs py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Estructurales</TabsTrigger>
            <TabsTrigger value="hobbys" className="rounded-full text-xs py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Hobbies</TabsTrigger>
          </TabsList>

          <TabsContent value="mini" className="space-y-2 mt-0">
            {miniDefs.length === 0 ? (
              <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium mb-1">Sin mini hábitos</p>
                  <p className="text-xs text-muted-foreground text-center">Crea tu primer mini hábito para empezar</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {miniDefs.map(d => {
                  const done = !!completions[d.id];
                  return (
                    <Card key={d.id} className={cn(
                      "border-0 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden transition-all",
                      done ? "bg-white/80 dark:bg-zinc-900/80" : "bg-white/50 dark:bg-zinc-900/50"
                    )}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleMini(d.id)}
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                              done ? "bg-green-500/15 text-green-500" : "bg-muted/50 text-muted-foreground"
                            )}>
                            <span className="text-lg">{d.emoji}</span>
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className={cn("text-sm font-medium block truncate", done && "text-green-600 dark:text-green-400")}>
                              {d.label}
                            </span>
                            {done && <span className="text-[10px] text-green-500 font-medium">Completado ✓</span>}
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full" onClick={() => deleteMini(d.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categorias" className="space-y-3 mt-0">
            <StructuralCard title="Estructurales (Base)" habits={STRUCTURAL_HABITS} completions={completions} onToggle={toggleMini} />
            <StructuralCard title="Áreas de Enfoque" habits={FOCUS_HABITS} completions={completions} onToggle={toggleMini} />
          </TabsContent>

          <TabsContent value="hobbys" className="space-y-3 mt-0">
            <StructuralCard title="Hobbies" habits={HOBBY_HABITS} completions={completions} onToggle={toggleMini} />
          </TabsContent>
        </Tabs>
      </div>
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
    <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
          <Badge variant="outline" className={cn("text-[10px] rounded-full", done === habits.length && "bg-green-500/10 text-green-500 border-green-500/30")}>
            {done}/{habits.length}
          </Badge>
        </div>
        <div className="space-y-1">
          {habits.map(habit => {
            const completed = !!completions[habit.id];
            const Icon = habit.icon;
            return (
              <button key={habit.id} onClick={() => onToggle(habit.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left",
                  completed ? "bg-green-500/10" : "bg-muted/30 hover:bg-muted/50"
                )}>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                  completed ? "bg-green-500/15 text-green-500" : "bg-muted/50 text-muted-foreground"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={cn("text-sm flex-1", completed && "text-green-600 dark:text-green-400 font-medium")}>
                  {habit.title}
                </span>
                {completed && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}