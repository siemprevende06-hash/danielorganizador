import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRoutineBlocks, type RoutineType, ROUTINES } from "@/hooks/useRoutineBlocks";
import {
  Sun, Moon, Clock, Target, ListTodo, Briefcase, GraduationCap,
  Languages, FolderKanban, Save, Dumbbell, Coffee, BookOpen, ChevronDown,
  ChevronRight, Brain, Sparkles, Utensils, Gamepad2, BarChart3, Zap
} from "lucide-react";

interface TaskItem {
  id: string; title: string; source: string; area_id: string | null;
  completed: boolean; routine_block_id: string | null;
}

interface ProjectTask {
  id: string; title: string; completed: boolean;
}

interface Project {
  id: string; name: string; tasks: ProjectTask[];
}

interface EntreTask {
  id: string; title: string; completed: boolean; entrepreneurship_id: string;
}

interface UniTask {
  id: string; title: string; completed: boolean; subject_id: string;
}

const SYSTEM_HABITS = [
  { id: "rutina-activacion", name: "Rutina Activación", icon: Sun, baseMin: 10 },
  { id: "gym", name: "Gym", icon: Dumbbell, baseMin: 45 },
  { id: "alimentacion", name: "Alimentación", icon: Utensils, baseMin: 30 },
  { id: "lectura", name: "Lectura", icon: BookOpen, baseMin: 20 },
  { id: "musica", name: "Música", icon: BookOpen, baseMin: 30 },
  { id: "idiomas", name: "Idiomas", icon: Languages, baseMin: 30 },
  { id: "ajedrez", name: "Ajedrez", icon: Gamepad2, baseMin: 15 },
];

const INTENSITY_MULTIPLIER: Record<string, number> = {
  minimo: 0.5, normal: 1, maximo: 1.5,
};

const AREAS = [
  { id: "general", label: "General", icon: ListTodo, color: "bg-blue-500/15 text-blue-500" },
  { id: "proyectos", label: "Proyectos", icon: FolderKanban, color: "bg-orange-500/15 text-orange-500" },
  { id: "emprendimiento", label: "Emprendimiento", icon: Briefcase, color: "bg-purple-500/15 text-purple-500" },
  { id: "universidad", label: "Universidad", icon: GraduationCap, color: "bg-emerald-500/15 text-emerald-500" },
  { id: "idiomas", label: "Idiomas", icon: Languages, color: "bg-cyan-500/15 text-cyan-500" },
];

const getBlockIcon = (title: string) => {
  const l = title.toLowerCase();
  if (l.includes("gym") || l.includes("ejercicio")) return <Dumbbell className="h-3.5 w-3.5" />;
  if (l.includes("activación") || l.includes("despertar")) return <Sun className="h-3.5 w-3.5" />;
  if (l.includes("desactivación") || l.includes("dormir")) return <Moon className="h-3.5 w-3.5" />;
  if (l.includes("desayuno") || l.includes("almuerzo") || l.includes("comida")) return <Coffee className="h-3.5 w-3.5" />;
  if (l.includes("lectura") || l.includes("idiomas")) return <BookOpen className="h-3.5 w-3.5" />;
  if (l.includes("deep") || l.includes("focus") || l.includes("trabajo")) return <Target className="h-3.5 w-3.5" />;
  return <Clock className="h-3.5 w-3.5" />;
};

const formatTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

export default function PlanManana() {
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStr = format(tomorrow, "yyyy-MM-dd");
  const tomorrowDisplay = format(tomorrow, "EEEE d 'de' MMMM", { locale: es });
  const tomorrowCapitalized = tomorrowDisplay.charAt(0).toUpperCase() + tomorrowDisplay.slice(1);

  const { blocks, routineType, setRoutineType } = useRoutineBlocks();


  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entreTasks, setEntreTasks] = useState<EntreTask[]>([]);
  const [uniTasks, setUniTasks] = useState<UniTask[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [blockAssignments, setBlockAssignments] = useState<Record<string, string[]>>({});

  const [systemIntensity, setSystemIntensity] = useState<Record<string, string>>({});
  const [areaCollapsed, setAreaCollapsed] = useState<Record<string, boolean>>({});

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    const saved = localStorage.getItem(`planManana_intensity`);
    if (saved) setSystemIntensity(JSON.parse(saved));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, entreRes, uniRes] = await Promise.all([
        supabase.from("tasks").select("id, title, source, area_id, completed, routine_block_id").eq("completed", false),
        supabase.from("entrepreneurship_tasks").select("id, title, completed, entrepreneurship_id").eq("completed", false),
        supabase.from("tasks").select("id, title, completed, source_id").eq("completed", false).eq("source", "university"),
      ]);
      if (tasksRes.data) setTasks(tasksRes.data as TaskItem[]);
      if (entreRes.data) setEntreTasks(entreRes.data as EntreTask[]);
      if (uniRes.data) setUniTasks((uniRes.data as any[]).map(t => ({ id: t.id, title: t.title, completed: t.completed, subject_id: t.source_id })));
    } catch { toast.error("Error al cargar datos"); }
    try {
      const raw = localStorage.getItem("userProjects");
      if (raw) {
        const parsed: Project[] = JSON.parse(raw);
        setProjects(parsed.map((p: any) => ({ id: p.id, name: p.name, tasks: (p.tasks || []).filter((t: any) => !t.completed) })));
      }
    } catch {}
    setLoading(false);
  };

  const getAreaTasks = (areaId: string): TaskItem[] => {
    switch (areaId) {
      case "general": return tasks.filter(t => t.source === "general" || (!t.source && !t.area_id));
      case "proyectos": return [];
      case "emprendimiento": return tasks.filter(t => t.source === "entrepreneurship");
      case "universidad": return tasks.filter(t => t.source === "university");
      case "idiomas": return tasks.filter(t => t.area_id === "idiomas" || t.source === "idiomas");
      default: return [];
    }
  };

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const assignTaskToBlock = (taskId: string, blockId: string) => {
    setBlockAssignments(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(bid => { next[bid] = next[bid].filter(id => id !== taskId); });
      next[blockId] = [...(next[blockId] || []), taskId];
      return next;
    });
    setSelectedTasks(prev => { const n = new Set(prev); n.delete(taskId); return n; });
  };

  const removeFromBlock = (taskId: string, blockId: string) => {
    setBlockAssignments(prev => ({
      ...prev,
      [blockId]: (prev[blockId] || []).filter(id => id !== taskId),
    }));
    setSelectedTasks(prev => { const n = new Set(prev); n.add(taskId); return n; });
  };

  const getTaskLabel = (taskId: string): string => {
    const all = [...tasks, ...entreTasks, ...uniTasks, ...projects.flatMap(p => p.tasks)];
    const t = all.find(t => t.id === taskId) || tasks.find(t => t.id === taskId);
    return t?.title || taskId;
  };

  const getTaskSource = (taskId: string): string => {
    const t = tasks.find(t => t.id === taskId);
    return t?.source || "";
  };

  const savePlan = async () => {
    setSaving(true);
    try {
      const assignments = { ...blockAssignments };
      const assignedIds = new Set(Object.values(assignments).flat());
      const unassignedInPlan = [...selectedTasks].filter(id => !assignedIds.has(id));
      if (unassignedInPlan.length > 0) {
        assignments["_unassigned"] = unassignedInPlan;
      }

      const existing = await supabase.from("daily_plans").select("id").eq("plan_date", tomorrowStr).maybeSingle();
      if (existing.data) {
        await supabase.from("daily_plans").update({
          routine_type: routineType,
          block_assignments: JSON.parse(JSON.stringify(assignments)),
          notes: JSON.stringify({ systemIntensity }),
        }).eq("id", existing.data.id);
      } else {
        await supabase.from("daily_plans").insert({
          plan_date: tomorrowStr,
          mode: routineType,
          routine_type: routineType,
          block_assignments: JSON.parse(JSON.stringify(assignments)),
          notes: JSON.stringify({ systemIntensity }),
        });
      }

      localStorage.setItem(`planManana_tasks_${tomorrowStr}`, JSON.stringify({
        selectedTasks: [...selectedTasks],
        blockAssignments: assignments,
        routineType,
      }));
      localStorage.setItem("planManana_intensity", JSON.stringify(systemIntensity));

      toast.success("Plan para mañana guardado");
    } catch { toast.error("Error al guardar"); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 pt-20 pb-24 flex items-center justify-center">
        <div className="animate-pulse space-y-3"><div className="h-8 w-48 bg-muted rounded" /><div className="h-64 w-full bg-muted rounded" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Planificar Mañana</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3.5 w-3.5" /> {tomorrowCapitalized}
            </p>
          </div>
          <Button onClick={savePlan} disabled={saving} size="sm" className="h-8 rounded-full gap-1.5">
            <Save className="h-3.5 w-3.5" /> {saving ? "Guardando..." : "Guardar Plan"}
          </Button>
        </div>

        {/* Routine Type */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-400" />
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-medium text-muted-foreground">Rutina</span>
            </div>
            <div className="flex gap-1.5">
              {ROUTINES.map(r => (
                <button key={r.type} onClick={() => setRoutineType(r.type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                    routineType === r.type
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                      : "bg-white/50 dark:bg-zinc-800/50 border-border/60 hover:border-indigo-300 text-muted-foreground hover:text-foreground"
                  )}>
                  <span className="text-sm">{r.icon}</span>
                  <span>{r.label}</span>
                  <span className="text-[9px] opacity-60">{r.wake}-{r.sleep}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* LEFT: Task Selection */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" /> Tareas del día
            </h2>

            {AREAS.map(area => {
              const Icon = area.icon;
              if (area.id === "proyectos") {
                return (
                  <Card key={area.id} className="border border-border/50 shadow-sm rounded-xl overflow-hidden">
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", area.color)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-semibold">{area.label}</span>
                      </div>
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Seleccionar proyecto..." />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedProject && (
                        <div className="space-y-1 mt-1 max-h-40 overflow-y-auto">
                          {(() => {
                            const proj = projects.find(p => p.id === selectedProject);
                            return proj?.tasks.length ? proj.tasks.map((pt: ProjectTask) => (
                              <label key={pt.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer text-xs">
                                <Checkbox checked={selectedTasks.has(pt.id)} onCheckedChange={() => toggleTask(pt.id)} />
                                <span className={cn("flex-1", pt.completed && "line-through text-muted-foreground")}>{pt.title}</span>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0">Proyecto</Badge>
                              </label>
                            )) : <p className="text-xs text-muted-foreground py-2 text-center">Sin tareas pendientes</p>;
                          })()}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              }

              const areaTasks = getAreaTasks(area.id);
              if (areaTasks.length === 0 && area.id !== "emprendimiento") return null;

              return (
                <Collapsible key={area.id} open={!areaCollapsed[area.id]} onOpenChange={o => setAreaCollapsed(p => ({ ...p, [area.id]: !o }))}>
                  <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden">
                    <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", area.color)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-semibold">{area.label}</span>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{areaTasks.length}</Badge>
                      </div>
                      {areaCollapsed[area.id] ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3 space-y-1 max-h-48 overflow-y-auto">
                        {areaTasks.map(t => (
                          <label key={t.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer text-xs">
                            <Checkbox checked={selectedTasks.has(t.id)} onCheckedChange={() => toggleTask(t.id)} />
                            <span className="flex-1">{t.title}</span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}

            {/* Entrepreneurship tasks */}
            {entreTasks.length > 0 && (
              <Collapsible>
                <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden">
                  <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-purple-500/15 text-purple-500">
                        <Briefcase className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-semibold">Emprendimiento</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{entreTasks.length}</Badge>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-1 max-h-48 overflow-y-auto">
                      {entreTasks.map(t => (
                        <label key={t.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer text-xs">
                          <Checkbox checked={selectedTasks.has(t.id)} onCheckedChange={() => toggleTask(t.id)} />
                          <span className="flex-1">{t.title}</span>
                        </label>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* University tasks */}
            {uniTasks.length > 0 && (
              <Collapsible>
                <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden">
                  <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-500/15 text-emerald-500">
                        <GraduationCap className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-semibold">Universidad</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{uniTasks.length}</Badge>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-1 max-h-48 overflow-y-auto">
                      {uniTasks.map(t => (
                        <label key={t.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer text-xs">
                          <Checkbox checked={selectedTasks.has(t.id)} onCheckedChange={() => toggleTask(t.id)} />
                          <span className="flex-1">{t.title}</span>
                        </label>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}
          </div>

          {/* RIGHT: Timeline + Systems */}
          <div className="space-y-3">
            {/* Time blocks */}
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Línea de tiempo
            </h2>

            <ScrollArea className="h-[400px] pr-2">
              <div className="space-y-1.5">
                {blocks.map(block => {
                  const assigned = blockAssignments[block.id] || [];
                  return (
                    <div key={block.id} className={cn(
                      "rounded-xl border p-2.5 transition-all",
                      block.isFocusBlock ? "border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20" : "border-border/60 bg-white/50 dark:bg-zinc-900/50"
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {getBlockIcon(block.title)}
                          <span className="text-xs font-medium">{block.title}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground tabular-nums">
                          {formatTime(block.startTime)} - {formatTime(block.endTime)}
                        </span>
                      </div>
                      {assigned.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assigned.map(taskId => (
                            <Badge key={taskId} variant="secondary" className="text-[9px] px-1.5 py-0 flex items-center gap-1 max-w-[180px]">
                              <span className="truncate">{getTaskLabel(taskId)}</span>
                              <button onClick={() => removeFromBlock(taskId, block.id)} className="hover:text-destructive ml-0.5 shrink-0">&times;</button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9px] text-muted-foreground italic">Sin tareas</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Assignment: selected tasks to blocks */}
            {selectedTasks.size > 0 && (
              <Card className="border border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-xl">
                <CardContent className="p-3 space-y-2">
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {selectedTasks.size} tarea(s) sin bloque — asigna a un bloque arriba:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[...selectedTasks].map(taskId => (
                      <Badge key={taskId} variant="outline" className="text-[9px] px-1.5 py-0 gap-1">
                        {getTaskLabel(taskId)}
                        <Select onValueChange={(blockId) => assignTaskToBlock(taskId, blockId)}>
                          <SelectTrigger className="h-4 w-4 border-0 p-0 m-0 bg-transparent [&>svg]:hidden">
                            <span className="text-[10px]">+</span>
                          </SelectTrigger>
                          <SelectContent>
                            {blocks.map(b => (
                              <SelectItem key={b.id} value={b.id} className="text-xs">{b.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Systems / Habit intensity */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-amber-500" /> Sistemas Acumulativos
              <span className="text-[9px] text-muted-foreground font-normal">— define la intensidad para mañana</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SYSTEM_HABITS.map(sys => {
                const Icon = sys.icon;
                const level = systemIntensity[sys.id] || "normal";
                const multiplier = INTENSITY_MULTIPLIER[level];
                const estimatedMin = Math.round(sys.baseMin * multiplier);
                return (
                  <div key={sys.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{sys.name}</p>
                        <p className="text-[9px] text-muted-foreground">~{estimatedMin} min</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {["minimo", "normal", "maximo"].map(opt => (
                        <button key={opt} onClick={() => setSystemIntensity(p => ({ ...p, [sys.id]: opt }))}
                          className={cn(
                            "px-2 py-1 rounded-lg text-[9px] font-medium transition-all border",
                            level === opt
                              ? opt === "minimo" ? "bg-blue-500 text-white border-blue-500"
                                : opt === "normal" ? "bg-green-500 text-white border-green-500"
                                : "bg-orange-500 text-white border-orange-500"
                              : "bg-transparent border-border/50 text-muted-foreground hover:border-foreground/30"
                          )}>
                          {opt === "minimo" ? "Mín" : opt === "normal" ? "Nor" : "Máx"}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
