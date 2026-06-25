import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  GraduationCap, Rocket, FolderKanban, Dumbbell, Languages, 
  Piano, Guitar, BookOpen, Plus, Target, Calendar, TrendingUp, 
  ChevronRight, Flame, Trophy, Trash2, Edit3, ChevronDown, ChevronUp,
  Zap, BarChart3, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TwelveWeekGoal {
  id: string;
  quarter: number;
  year: number;
  title: string;
  description: string | null;
  category: string;
  target_value: string | null;
  current_value: string | null;
  progress_percentage: number;
  weekly_actions: unknown;
  connected_blocks: string[] | null;
  status: string;
}

const CATEGORIES = [
  { id: "universidad", name: "Universidad", icon: GraduationCap, color: "hsl(217, 91%, 60%)" },
  { id: "emprendimiento", name: "Emprendimiento", icon: Rocket, color: "hsl(271, 91%, 65%)" },
  { id: "proyectos", name: "Proyectos", icon: FolderKanban, color: "hsl(142, 71%, 45%)" },
  { id: "gym", name: "Gym", icon: Dumbbell, color: "hsl(0, 84%, 60%)" },
  { id: "idiomas", name: "Idiomas", icon: Languages, color: "hsl(48, 96%, 53%)" },
  { id: "piano", name: "Piano", icon: Piano, color: "hsl(330, 81%, 60%)" },
  { id: "guitarra", name: "Guitarra", icon: Guitar, color: "hsl(25, 95%, 53%)" },
  { id: "lectura", name: "Lectura", icon: BookOpen, color: "hsl(174, 72%, 40%)" },
];

const QUARTERS = [
  { id: 1, name: "Q1", dates: "Ene – Mar", startMonth: 0 },
  { id: 2, name: "Q2", dates: "Abr – Jun", startMonth: 3 },
  { id: 3, name: "Q3", dates: "Jul – Sep", startMonth: 6 },
  { id: 4, name: "Q4", dates: "Oct – Dic", startMonth: 9 },
];

const DEFAULT_GOALS = [
  { category: "universidad", title: "Aprobar exámenes con nota 4+", target_value: "Nota 4", description: "Aprobar todos los exámenes con calificación mínima de 4" },
  { category: "emprendimiento", title: "Lanzar SiempreVende", target_value: "App pública", description: "Sacar la app SiempreVende al público" },
  { category: "proyectos", title: "Arreglar cuarto", target_value: "Completado", description: "Organizar y arreglar mi cuarto completamente" },
  { category: "proyectos", title: "Sacar licencia de moto", target_value: "Licencia obtenida", description: "Obtener la licencia de conducir moto" },
  { category: "proyectos", title: "Sacar pasaporte", target_value: "Pasaporte obtenido", description: "Obtener el pasaporte" },
  { category: "gym", title: "Subir 8kg de músculo", target_value: "8kg", description: "Ganar 8 kilogramos de masa muscular" },
  { category: "idiomas", title: "Mejorar inglés e italiano", target_value: "Nivel avanzado", description: "Mejorar significativamente mi nivel de inglés e italiano" },
  { category: "piano", title: "Canciones Gibraltar Alcocer", target_value: "Idea 10, 9, 22", description: "Aprender Idea 10, Idea 9, Idea 22" },
  { category: "guitarra", title: "Aprender canciones", target_value: "3 canciones", description: "Dandelions, Bleed, You Belong with Me" },
  { category: "lectura", title: "La Universidad del Éxito", target_value: "Libro completo", description: "Leer el libro completo" },
];

export default function TwelveWeekYear() {
  const [goals, setGoals] = useState<TwelveWeekGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TwelveWeekGoal | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({ title: "", description: "", category: "", target_value: "", quarter: 1 });

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("twelve_week_goals").select("*").eq("year", 2026).order("quarter");
      if (error) throw error;
      setGoals(data || []);
    } catch { toast.error("Error al cargar metas"); }
    finally { setLoading(false); }
  };

  const initializeDefaultGoals = async () => {
    try {
      const goalsToInsert = DEFAULT_GOALS.map(g => ({
        ...g, quarter: 1, year: 2026, progress_percentage: 0,
        weekly_actions: [], connected_blocks: [], status: "active",
      }));
      const { error } = await supabase.from("twelve_week_goals").insert(goalsToInsert);
      if (error) throw error;
      toast.success("Metas inicializadas");
      fetchGoals();
    } catch { toast.error("Error al inicializar"); }
  };

  const addGoal = async () => {
    if (!newGoal.title || !newGoal.category) { toast.error("Completa los campos"); return; }
    try {
      const { error } = await supabase.from("twelve_week_goals").insert({
        title: newGoal.title, description: newGoal.description, category: newGoal.category,
        target_value: newGoal.target_value, quarter: newGoal.quarter, year: 2026,
        progress_percentage: 0, weekly_actions: [], connected_blocks: [], status: "active",
      });
      if (error) throw error;
      toast.success("Meta agregada");
      setIsAddDialogOpen(false);
      setNewGoal({ title: "", description: "", category: "", target_value: "", quarter: 1 });
      fetchGoals();
    } catch { toast.error("Error al agregar"); }
  };

  const updateProgress = async (goalId: string, progress: number) => {
    try {
      const status = progress >= 100 ? "completed" : "active";
      const { error } = await supabase.from("twelve_week_goals")
        .update({ progress_percentage: progress, status }).eq("id", goalId);
      if (error) throw error;
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress_percentage: progress, status } : g));
    } catch { toast.error("Error al actualizar"); }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase.from("twelve_week_goals").delete().eq("id", goalId);
      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== goalId));
      toast.success("Meta eliminada");
    } catch { toast.error("Error al eliminar"); }
  };

  const saveEdit = async () => {
    if (!editingGoal) return;
    try {
      const { error } = await supabase.from("twelve_week_goals")
        .update({ title: editingGoal.title, description: editingGoal.description, target_value: editingGoal.target_value })
        .eq("id", editingGoal.id);
      if (error) throw error;
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...editingGoal } : g));
      setEditingGoal(null);
      toast.success("Meta actualizada");
    } catch { toast.error("Error al actualizar"); }
  };

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

  const quarterGoals = goals.filter(g => g.quarter === selectedQuarter);
  const mainGoals = quarterGoals.filter(g => ["universidad", "emprendimiento", "proyectos", "gym", "idiomas"].includes(g.category));
  const additionalGoals = quarterGoals.filter(g => ["piano", "guitarra", "lectura"].includes(g.category));

  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(2026, 0, 1);
    return Math.min(Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)), 52);
  };
  const getWeekInQuarter = () => ((getCurrentWeek() - 1) % 12) + 1;
  const weekInQ = getWeekInQuarter();
  const weekProgress = (weekInQ / 12) * 100;

  const avgProgress = quarterGoals.length > 0
    ? Math.round(quarterGoals.reduce((s, g) => s + g.progress_percentage, 0) / quarterGoals.length)
    : 0;
  const completedCount = quarterGoals.filter(g => g.progress_percentage >= 100).length;
  const activeCount = quarterGoals.filter(g => g.progress_percentage > 0 && g.progress_percentage < 100).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="h-4 w-28 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">3 Meses</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Semana {weekInQ}/12 · {12 - weekInQ} semanas restantes
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/weeks">
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-full gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Semanas
              </Button>
            </Link>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs rounded-full gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Meta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva Meta</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-3">
                  <Input placeholder="Título" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} />
                  <Textarea placeholder="Descripción" value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} rows={2} />
                  <Select value={newGoal.category} onValueChange={v => setNewGoal({ ...newGoal, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2"><cat.icon className="h-4 w-4" />{cat.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Meta objetivo" value={newGoal.target_value} onChange={e => setNewGoal({ ...newGoal, target_value: e.target.value })} />
                  <Select value={String(newGoal.quarter)} onValueChange={v => setNewGoal({ ...newGoal, quarter: parseInt(v) })}>
                    <SelectTrigger><SelectValue placeholder="Trimestre" /></SelectTrigger>
                    <SelectContent>
                      {QUARTERS.map(q => <SelectItem key={q.id} value={String(q.id)}>{q.name} – {q.dates}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={addGoal} className="w-full">Agregar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quarter Selector — glass cards */}
        <div className="grid grid-cols-4 gap-2.5">
          {QUARTERS.map(q => {
            const isActive = selectedQuarter === q.id;
            const qGoals = goals.filter(g => g.quarter === q.id);
            const qAvg = qGoals.length > 0 ? Math.round(qGoals.reduce((s, g) => s + g.progress_percentage, 0) / qGoals.length) : 0;
            return (
              <button key={q.id} onClick={() => setSelectedQuarter(q.id)}
                className={cn(
                  "relative rounded-2xl p-3.5 text-left transition-all border-0 backdrop-blur-xl",
                  isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" : "bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:shadow-md"
                )}>
                <div className="text-lg font-bold">{q.name}</div>
                <div className={cn("text-[10px] mt-0.5", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>{q.dates}</div>
                <div className={cn("text-xs mt-2 font-semibold", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>{qAvg}%</div>
                <div className={cn("absolute bottom-0 left-0 h-1 rounded-full transition-all", isActive ? "bg-primary-foreground/30" : "bg-primary/20")} style={{ width: `${qAvg}%` }} />
              </button>
            );
          })}
        </div>

        {/* Glass stats row */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { icon: <Zap className="h-4 w-4 text-blue-500" />, label: "Semana", value: weekInQ, gradient: "from-blue-500 to-cyan-400" },
            { icon: <BarChart3 className="h-4 w-4 text-purple-500" />, label: "Promedio", value: `${avgProgress}%`, gradient: "from-purple-500 to-pink-400" },
            { icon: <Trophy className="h-4 w-4 text-yellow-500" />, label: "Logradas", value: completedCount, gradient: "from-amber-500 to-orange-400" },
            { icon: <Flame className="h-4 w-4 text-red-500" />, label: "En progreso", value: activeCount, gradient: "from-red-500 to-rose-400" },
          ].map((s, i) => (
            <Card key={i} className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className={cn("h-1 bg-gradient-to-r", s.gradient)} />
              <CardContent className="p-3.5 text-center space-y-1">
                <div className="flex justify-center">{s.icon}</div>
                <div className="text-xl font-bold tabular-nums">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Time Progress */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Tiempo del trimestre</span>
              <span className="text-sm font-bold tabular-nums">{Math.round(weekProgress)}%</span>
            </div>
            <Progress value={weekProgress} className="h-1.5" />
            <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground/60">
              <span>Sem 1</span><span>Sem 6</span><span>Sem 12</span>
            </div>
          </CardContent>
        </Card>

        {goals.length === 0 && (
          <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Sin metas configuradas</p>
              <p className="text-xs text-muted-foreground text-center mb-4">Inicializa tus metas del 2026</p>
              <Button onClick={initializeDefaultGoals} className="rounded-full">Inicializar Metas</Button>
            </CardContent>
          </Card>
        )}

        {/* Main Goals */}
        {mainGoals.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <TrendingUp className="h-3.5 w-3.5" /> Metas Principales ({mainGoals.length})
            </div>
            <div className="space-y-2">
              {mainGoals.map(goal => {
                const cat = getCategoryInfo(goal.category);
                const Icon = cat.icon;
                const isExpanded = expandedGoal === goal.id;
                const isCompleted = goal.progress_percentage >= 100;
                return (
                  <Card key={goal.id} className={cn("border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden transition-all", isCompleted && "opacity-70")}>
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                          <Icon className="h-5 w-5" style={{ color: cat.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-medium text-sm truncate", isCompleted && "line-through text-muted-foreground")}>{goal.title}</span>
                            {isCompleted && <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={goal.progress_percentage} className="flex-1 h-1" />
                            <span className="text-[11px] font-semibold text-muted-foreground w-8 text-right tabular-nums">{goal.progress_percentage}%</span>
                          </div>
                        </div>
                        {goal.target_value && <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:flex rounded-full">{goal.target_value}</Badge>}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 border-t pt-3">
                          {goal.description && <p className="text-xs text-muted-foreground">{goal.description}</p>}
                          {goal.target_value && (
                            <div className="flex items-center gap-2">
                              <Target className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">Meta:</span>
                              <Badge variant="outline" className="text-[10px] rounded-full">{goal.target_value}</Badge>
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">Progreso</span>
                              <span className="text-xs font-bold">{goal.progress_percentage}%</span>
                            </div>
                            <Slider value={[goal.progress_percentage]} max={100} step={5} onValueCommit={(v) => updateProgress(goal.id, v[0])} />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-full gap-1 flex-1" onClick={() => setEditingGoal(goal)}>
                              <Edit3 className="h-3 w-3" /> Editar
                            </Button>
                            <Button variant="destructive" size="sm" className="h-7 text-[10px] rounded-full gap-1" onClick={() => deleteGoal(goal.id)}>
                              <Trash2 className="h-3 w-3" /> Eliminar
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional Goals */}
        {additionalGoals.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Metas Adicionales ({additionalGoals.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {additionalGoals.map(goal => {
                const cat = getCategoryInfo(goal.category);
                const Icon = cat.icon;
                const isCompleted = goal.progress_percentage >= 100;
                return (
                  <Card key={goal.id} className={cn("border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", isCompleted && "opacity-70")}>
                    <CardContent className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                            <Icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
                          </div>
                          <span className="text-xs font-medium">{cat.name}</span>
                        </div>
                        {isCompleted && <Trophy className="h-3 w-3 text-yellow-500" />}
                      </div>
                      <p className={cn("text-xs", isCompleted ? "line-through text-muted-foreground" : "text-muted-foreground")}>{goal.title}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={goal.progress_percentage} className="flex-1 h-1" />
                        <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{goal.progress_percentage}%</span>
                      </div>
                      <Slider value={[goal.progress_percentage]} max={100} step={5} onValueCommit={(v) => updateProgress(goal.id, v[0])} />
                      <div className="flex gap-1 pt-1">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-full flex-1" onClick={() => setEditingGoal(goal)}>
                          <Edit3 className="h-2.5 w-2.5 mr-1" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-full text-destructive" onClick={() => deleteGoal(goal.id)}>
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Meta</DialogTitle></DialogHeader>
            {editingGoal && (
              <div className="space-y-3 mt-3">
                <Input value={editingGoal.title} onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })} />
                <Textarea value={editingGoal.description || ""} onChange={e => setEditingGoal({ ...editingGoal, description: e.target.value })} rows={2} />
                <Input value={editingGoal.target_value || ""} onChange={e => setEditingGoal({ ...editingGoal, target_value: e.target.value })} placeholder="Meta objetivo" />
                <Button onClick={saveEdit} className="w-full">Guardar</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}