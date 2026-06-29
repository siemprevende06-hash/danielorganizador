import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  GraduationCap, Rocket, FolderKanban, Dumbbell, Languages,
  Piano, Guitar, BookOpen, Plus, Target, Calendar, TrendingUp,
  Flame, Trophy, Trash2, Edit3, Zap, BarChart3, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AreaEffortResultsPanel } from "@/components/areas/AreaEffortResultsPanel";
import { LifeAreaScoresPanel } from "@/components/areas/LifeAreaScoresPanel";
import { useOverallSystemStreak } from "@/hooks/useOverallSystemStreak";

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
  month: number | null;
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

const MONTHS = [
  { id: 1, label: "Mes 1", subtitle: "Sem 1-4" },
  { id: 2, label: "Mes 2", subtitle: "Sem 5-8" },
  { id: 3, label: "Mes 3", subtitle: "Sem 9-12" },
];

const MAIN_AREA_IDS = ["universidad", "emprendimiento", "proyectos", "gym", "idiomas"];
const EXTRA_AREA_IDS = ["piano", "guitarra", "lectura"];

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
  const { streak: overallStreak } = useOverallSystemStreak();
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
  });
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<TwelveWeekGoal | null>(null);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addCategory, setAddCategory] = useState("");
  const [addMonth, setAddMonth] = useState<number | null>(null);
  const [addTitle, setAddTitle] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addTarget, setAddTarget] = useState("");

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("twelve_week_goals")
        .select("*")
        .eq("year", 2026)
        .order("category")
        .order("month");
      if (error) throw error;
      setGoals(data || []);
    } catch { toast.error("Error al cargar metas"); }
    finally { setLoading(false); }
  };

  const assignMonth = async (goalId: string, month: number) => {
    try {
      const { error } = await supabase
        .from("twelve_week_goals")
        .update({ month })
        .eq("id", goalId);
      if (error) throw error;
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, month } : g));
    } catch { toast.error("Error al asignar mes"); }
  };

  const initializeDefaultGoals = async () => {
    try {
      const goalsToInsert = DEFAULT_GOALS.map(g => ({
        ...g, quarter: 1, year: 2026, progress_percentage: 0,
        weekly_actions: [], connected_blocks: [], status: "active", month: null,
      }));
      const { error } = await supabase.from("twelve_week_goals").insert(goalsToInsert);
      if (error) throw error;
      toast.success("Metas inicializadas");
      fetchGoals();
    } catch { toast.error("Error al inicializar"); }
  };

  const openAddDialog = (category: string, month: number | null) => {
    setAddCategory(category);
    setAddMonth(month);
    setAddTitle("");
    setAddDescription("");
    setAddTarget("");
    setAddDialogOpen(true);
  };

  const addGoal = async () => {
    if (!addTitle || !addCategory) { toast.error("Completa los campos"); return; }
    try {
      const { error } = await supabase.from("twelve_week_goals").insert({
        title: addTitle, description: addDescription, category: addCategory,
        target_value: addTarget, quarter: selectedQuarter, year: 2026,
        month: addMonth, progress_percentage: 0,
        weekly_actions: [], connected_blocks: [], status: "active",
      });
      if (error) throw error;
      toast.success("Meta agregada");
      setAddDialogOpen(false);
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

  const getCategoryInfo = (categoryId: string) =>
    CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(2026, 0, 1);
    return Math.min(Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)), 52);
  };
  const getWeekInQuarter = () => ((getCurrentWeek() - 1) % 12) + 1;
  const weekInQ = getWeekInQuarter();
  const weekProgress = (weekInQ / 12) * 100;

  const quarterGoals = goals.filter(g => g.quarter === selectedQuarter);
  const avgProgress = quarterGoals.length > 0
    ? Math.round(quarterGoals.reduce((s, g) => s + g.progress_percentage, 0) / quarterGoals.length)
    : 0;
  const completedCount = quarterGoals.filter(g => g.progress_percentage >= 100).length;
  const activeCount = quarterGoals.filter(g => g.progress_percentage > 0 && g.progress_percentage < 100).length;

  const getGoalsForCell = (areaId: string, monthId: number | null) =>
    quarterGoals.filter(g => g.category === areaId && g.month === monthId);

  const hasGoalsInSinMes = (areaIds: string[]) =>
    areaIds.some(aid => getGoalsForCell(aid, null).length > 0);

  const renderGoalCard = (goal: TwelveWeekGoal, showMonthAssign: boolean) => {
    const cat = getCategoryInfo(goal.category);
    const Icon = cat.icon;
    const isExpanded = expandedGoal === goal.id;
    const isCompleted = goal.progress_percentage >= 100;

    return (
      <div
        key={goal.id}
        className={cn(
          "rounded-xl border bg-card/50 p-2.5 space-y-1.5 cursor-pointer transition-all hover:shadow-sm",
          isExpanded && "ring-1 ring-primary/20",
          isCompleted && "opacity-60"
        )}
        onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
              <Icon className="h-3 w-3" style={{ color: cat.color }} />
            </div>
            <span className={cn("text-xs font-medium truncate", isCompleted && "line-through text-muted-foreground")}>
              {goal.title}
            </span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {showMonthAssign && MONTHS.map(m => (
              <button
                key={m.id}
                onClick={e => { e.stopPropagation(); assignMonth(goal.id, m.id); }}
                className="h-5 w-5 rounded text-[9px] font-bold bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                title={`Mover a ${m.label}`}
              >
                {m.id}
              </button>
            ))}
            <button
              onClick={e => { e.stopPropagation(); setEditingGoal(goal); }}
              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Edit3 className="h-2.5 w-2.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); deleteGoal(goal.id); }}
              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Progress value={goal.progress_percentage} className="h-1 flex-1" />
          <span className="text-[10px] font-semibold text-muted-foreground tabular-nums w-7 text-right">{goal.progress_percentage}%</span>
        </div>

        {isExpanded && (
          <div className="space-y-2 pt-1.5 border-t mt-1">
            {goal.description && <p className="text-[10px] text-muted-foreground">{goal.description}</p>}
            {goal.target_value && (
              <div className="flex items-center gap-1.5">
                <Target className="h-2.5 w-2.5 text-muted-foreground" />
                <Badge variant="outline" className="text-[9px] rounded-full px-2 py-0">{goal.target_value}</Badge>
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Progreso</span>
                <span className="text-[10px] font-bold">{goal.progress_percentage}%</span>
              </div>
              <Slider
                value={[goal.progress_percentage]} max={100} step={5}
                onValueCommit={(v) => updateProgress(goal.id, v[0])}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAreaGrid = (areaIds: string[], title: string, icon: React.ReactNode) => {
    const showSinMes = hasGoalsInSinMes(areaIds);
    const columns = showSinMes ? "160px repeat(3,1fr) 140px" : "160px repeat(3,1fr)";

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {icon} {title}
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[650px] space-y-1.5">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: columns }}>
              <div />
              {MONTHS.map(m => (
                <div key={m.id} className="text-center py-1">
                  <div className="text-xs font-bold">{m.label}</div>
                  <div className="text-[9px] text-muted-foreground">{m.subtitle}</div>
                </div>
              ))}
              {showSinMes && (
                <div className="text-center py-1">
                  <div className="text-xs font-bold text-muted-foreground">Sin mes</div>
                </div>
              )}
            </div>

            {areaIds.map(aid => {
              const cat = getCategoryInfo(aid);
              const Icon = cat.icon;
              return (
                <div key={aid} className="grid gap-1.5" style={{ gridTemplateColumns: columns }}>
                  <div className="flex items-center gap-1.5 py-1 min-w-0">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
                    </div>
                    <span className="text-xs font-medium truncate">{cat.name}</span>
                  </div>

                  {MONTHS.map(m => {
                    const cellGoals = getGoalsForCell(aid, m.id);
                    return (
                      <div key={m.id} className="space-y-1 min-h-[60px]">
                        {cellGoals.map(g => renderGoalCard(g, false))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-6 text-[10px] rounded-full gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => openAddDialog(aid, m.id)}
                        >
                          <Plus className="h-3 w-3" /> Agregar
                        </Button>
                      </div>
                    );
                  })}

                  {showSinMes && (
                    <div className="space-y-1 min-h-[60px]">
                      {getGoalsForCell(aid, null).map(g => renderGoalCard(g, true))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-6 text-[10px] rounded-full gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => openAddDialog(aid, null)}
                      >
                        <Plus className="h-3 w-3" /> Agregar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

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
      <div className="max-w-5xl mx-auto space-y-5">
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
            <Button size="sm" className="h-8 text-xs rounded-full gap-1.5" onClick={() => openAddDialog("", null)}>
              <Plus className="h-3.5 w-3.5" /> Meta
            </Button>
          </div>
        </div>

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

        <div className="grid grid-cols-5 gap-2.5">
          {[
            { icon: <Zap className="h-4 w-4 text-blue-500" />, label: "Semana", value: weekInQ, gradient: "from-blue-500 to-cyan-400" },
            { icon: <BarChart3 className="h-4 w-4 text-purple-500" />, label: "Promedio", value: `${avgProgress}%`, gradient: "from-purple-500 to-pink-400" },
            { icon: <Trophy className="h-4 w-4 text-yellow-500" />, label: "Logradas", value: completedCount, gradient: "from-amber-500 to-orange-400" },
            { icon: <Flame className="h-4 w-4 text-red-500" />, label: "En progreso", value: activeCount, gradient: "from-red-500 to-rose-400" },
            { icon: <Flame className="h-4 w-4 text-orange-500" />, label: `Racha ${overallStreak.current}d`, value: overallStreak.longest > 0 ? `🏆${overallStreak.longest}` : `${overallStreak.current}d`, gradient: "from-orange-500 to-amber-400" },
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

        {quarterGoals.length === 0 && (
          <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Sin metas configuradas</p>
              <p className="text-xs text-muted-foreground text-center mb-4">Inicializa tus metas del 2026</p>
              <Button onClick={initializeDefaultGoals} className="rounded-full">Inicializar Metas</Button>
            </CardContent>
          </Card>
        )}

        {quarterGoals.length > 0 && renderAreaGrid(MAIN_AREA_IDS, "Metas Principales", <TrendingUp className="h-3.5 w-3.5" />)}

        {quarterGoals.filter(g => EXTRA_AREA_IDS.includes(g.category)).length > 0 &&
          renderAreaGrid(EXTRA_AREA_IDS, "Metas Adicionales", <Sparkles className="h-3.5 w-3.5" />)
        }

        {/* Esfuerzo y Resultados */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
          <CardContent className="p-4 space-y-5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Esfuerzo y Resultados — {QUARTERS.find(q => q.id === selectedQuarter)?.name}
            </h2>

            <LifeAreaScoresPanel periodType="quarter" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-white/80 dark:bg-zinc-900/80 px-3 text-muted-foreground/60">Métricas detalladas</span>
              </div>
            </div>

            <AreaEffortResultsPanel
              periodType="quarter"
              periodStart={new Date(2026, (selectedQuarter - 1) * 3, 1)}
            />
          </CardContent>
        </Card>

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

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Meta</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-3">
              <Input placeholder="Título" value={addTitle} onChange={e => setAddTitle(e.target.value)} />
              <Textarea placeholder="Descripción" value={addDescription} onChange={e => setAddDescription(e.target.value)} rows={2} />
              <Select value={addCategory} onValueChange={setAddCategory}>
                <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2"><cat.icon className="h-4 w-4" />{cat.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Meta objetivo" value={addTarget} onChange={e => setAddTarget(e.target.value)} />
              <Select value={addMonth !== null ? String(addMonth) : "null"} onValueChange={v => setAddMonth(v === "null" ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Sin mes</SelectItem>
                  {MONTHS.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.label} – {m.subtitle}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={addGoal} className="w-full">Agregar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
