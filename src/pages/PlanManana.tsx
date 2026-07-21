import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { lifeAreas } from "@/lib/data";
import { flattenAreas } from "@/lib/utils";
import { useRoutineBlocks, type RoutineType, ROUTINES } from "@/hooks/useRoutineBlocks";
import { DailyTimelinePlanner } from "@/components/today/DailyTimelinePlanner";
import HoyDashboard from "@/components/today/HoyDashboard";
import {
  Sun, Moon, Clock, Target, ListTodo, Briefcase, GraduationCap,
  Languages, FolderKanban, Save, Dumbbell, Coffee, BookOpen, ChevronDown,
  ChevronRight, Brain, Sparkles, Utensils, Gamepad2, BarChart3, Zap,
  PlusCircle, Loader2, GripVertical
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
  { id: "lectura", name: "Lectura", icon: BookOpen, baseMin: 20 },
  { id: "ajedrez", name: "Ajedrez", icon: Gamepad2, baseMin: 15 },
  { id: "game", name: "Game (Seducción)", icon: Gamepad2, baseMin: 15 },
  { id: "idiomas", name: "Idiomas", icon: Languages, baseMin: 30 },
  { id: "gym", name: "Gym", icon: Dumbbell, baseMin: 45 },
  { id: "musica", name: "Música", icon: BookOpen, baseMin: 30 },
];

const INTENSITY_MULTIPLIER: Record<string, number> = {
  minimo: 0.5, maximo: 1, extra: 1.5,
};

const AREAS = [
  { id: "general", label: "General", icon: ListTodo, color: "bg-blue-500/15 text-blue-500" },
  { id: "proyectos", label: "Proyectos", icon: FolderKanban, color: "bg-orange-500/15 text-orange-500" },
  { id: "emprendimiento", label: "Emprendimiento", icon: Briefcase, color: "bg-purple-500/15 text-purple-500" },
  { id: "universidad", label: "Universidad", icon: GraduationCap, color: "bg-emerald-500/15 text-emerald-500" },
  { id: "idiomas", label: "Idiomas", icon: Languages, color: "bg-cyan-500/15 text-cyan-500" },
];

const POOL_SOURCE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  general: { label: 'General', icon: <ListTodo className="h-3 w-3" />, color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  university: { label: 'Universidad', icon: <GraduationCap className="h-3 w-3" />, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  entrepreneurship: { label: 'Emprendimiento', icon: <Briefcase className="h-3 w-3" />, color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  project: { label: 'Proyecto', icon: <FolderKanban className="h-3 w-3" />, color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  idiomas: { label: 'Idiomas', icon: <Languages className="h-3 w-3" />, color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
};

const POOL_SOURCE_ORDER = ['university', 'entrepreneurship', 'project', 'idiomas', 'general'];

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

type TabMode = 'hoy' | 'manana';

function DateSwitchTabs({ mode, onModeChange }: { mode: TabMode; onModeChange: (m: TabMode) => void }) {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const todayLabel = format(today, "d MMM", { locale: es });
  const tomorrowLabel = format(tomorrow, "d MMM", { locale: es });
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex bg-muted/80 rounded-xl p-0.5 shadow-sm border border-border/40">
        <button
          onClick={() => onModeChange('hoy')}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            mode === 'hoy'
              ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sun className="h-3.5 w-3.5" />
          Hoy
          <span className="text-[10px] text-muted-foreground/70 font-normal">{todayLabel}</span>
        </button>
        <button
          onClick={() => onModeChange('manana')}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            mode === 'manana'
              ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Moon className="h-3.5 w-3.5" />
          Mañana
          <span className="text-[10px] text-muted-foreground/70 font-normal">{tomorrowLabel}</span>
        </button>
      </div>
    </div>
  );
}

export default function PlanManana() {
  const [mode, setMode] = useState<TabMode>('manana');

  // --- Hoy mode ---
  if (mode === 'hoy') {
    return (
      <HoyDashboard
        headerExtra={
          <div className="pt-2 pb-1">
            <DateSwitchTabs mode={mode} onModeChange={setMode} />
          </div>
        }
      />
    );
  }

  // --- Mañana mode ---
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStr = format(tomorrow, "yyyy-MM-dd");
  const tomorrowDisplay = format(tomorrow, "EEEE d 'de' MMMM", { locale: es });
  const tomorrowCapitalized = tomorrowDisplay.charAt(0).toUpperCase() + tomorrowDisplay.slice(1);

  const { blocks, routineType, setRoutineType, updateBlockFocus } = useRoutineBlocks();

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

  // Create task dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAreaId, setNewAreaId] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const allAreas = useMemo(() => flattenAreas(lifeAreas), []);

  const [saving, setSaving] = useState(false);
  const [languageChoice, setLanguageChoice] = useState<string>("ingles");
  const [musicInstrument, setMusicInstrument] = useState<string>("piano");

  const tasksByBlockForPlanner = useMemo(() => {
    const result: Record<string, { id: string; title: string; source: string; completed: boolean }[]> = {};
    const allTaskItems = [
      ...tasks.map(t => ({ id: t.id, title: t.title, source: t.source, completed: t.completed })),
      ...entreTasks.map(t => ({ id: t.id, title: t.title, source: "entrepreneurship", completed: t.completed })),
      ...uniTasks.map(t => ({ id: t.id, title: t.title, source: "university", completed: t.completed })),
      ...projects.flatMap(p => p.tasks.map(t => ({ id: t.id, title: t.title, source: "project", completed: t.completed }))),
    ];
    for (const [blockId, taskIds] of Object.entries(blockAssignments)) {
      result[blockId] = taskIds.map(id => allTaskItems.find(t => t.id === id)).filter(Boolean) as any;
    }
    return result;
  }, [tasks, entreTasks, uniTasks, projects, blockAssignments]);

  const handleRemoveTask = useCallback((taskId: string) => {
    setBlockAssignments(prev => {
      const next: Record<string, string[]> = {};
      for (const [blockId, taskIds] of Object.entries(prev)) {
        next[blockId] = taskIds.filter(id => id !== taskId);
      }
      return next;
    });
    setSelectedTasks(prev => { const n = new Set(prev); n.add(taskId); return n; });
  }, []);

  useEffect(() => {
    loadData();
    const saved = localStorage.getItem(`planManana_intensity`);
    if (saved) setSystemIntensity(JSON.parse(saved));
    const savedLang = localStorage.getItem(`planManana_language`);
    if (savedLang) setLanguageChoice(savedLang);
    const savedInst = localStorage.getItem(`planManana_instrument`);
    if (savedInst) setMusicInstrument(savedInst);
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
      const { data } = await supabase.from('projects').select('id, title, tasks');
      if (data && data.length > 0) {
        setProjects(data.map((p: any) => ({
          id: p.id,
          name: p.title,
          tasks: ((p.tasks || []) as any[]).filter((t: any) => !t.completed),
        })));
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

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        priority: newPriority,
        due_date: newDueDate || null,
        area_id: newAreaId || null,
        completed: false,
        source: 'general',
        status: 'pendiente',
      });
      if (error) throw error;
      toast.success('Tarea creada');
      setIsCreateOpen(false);
      setNewTitle(''); setNewDescription(''); setNewPriority('medium'); setNewDueDate(''); setNewAreaId('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear tarea');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewTitle(''); setNewDescription(''); setNewPriority('medium'); setNewDueDate(''); setNewAreaId('');
  };

  const handlePoolDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const getTaskLabel = (taskId: string): string => {
    const all = [...tasks, ...entreTasks, ...uniTasks, ...projects.flatMap(p => p.tasks)];
    const t = all.find(t => t.id === taskId) || tasks.find(t => t.id === taskId);
    return t?.title || taskId;
  };

  const selectedPoolTasks = useMemo(() => {
    const assignedIds = new Set(Object.values(blockAssignments).flat());
    const pool: { id: string; title: string; source: string }[] = [];
    tasks.forEach(t => {
      if (selectedTasks.has(t.id) && !assignedIds.has(t.id))
        pool.push({ id: t.id, title: t.title, source: t.area_id === 'idiomas' || t.source === 'idiomas' ? 'idiomas' : t.source || 'general' });
    });
    entreTasks.forEach(t => {
      if (selectedTasks.has(t.id) && !assignedIds.has(t.id))
        pool.push({ id: t.id, title: t.title, source: 'entrepreneurship' });
    });
    uniTasks.forEach(t => {
      if (selectedTasks.has(t.id) && !assignedIds.has(t.id))
        pool.push({ id: t.id, title: t.title, source: 'university' });
    });
    projects.forEach(p => {
      p.tasks.forEach(t => {
        if (selectedTasks.has(t.id) && !assignedIds.has(t.id))
          pool.push({ id: t.id, title: t.title, source: 'project' });
      });
    });
    return pool;
  }, [selectedTasks, blockAssignments, tasks, entreTasks, uniTasks, projects]);

  const getTaskSource = (taskId: string): string => {
    const t = tasks.find(t => t.id === taskId);
    if (t) return t.area_id === 'idiomas' || t.source === 'idiomas' ? 'idiomas' : t.source || 'general';
    if (entreTasks.some(t => t.id === taskId)) return 'entrepreneurship';
    if (uniTasks.some(t => t.id === taskId)) return 'university';
    if (projects.some(p => p.tasks.some(t => t.id === taskId))) return 'project';
    return 'general';
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
          notes: JSON.stringify({ systemIntensity, language: languageChoice, instrument: musicInstrument }),
        }).eq("id", existing.data.id);
      } else {
        await supabase.from("daily_plans").insert({
          plan_date: tomorrowStr,
          mode: routineType,
          routine_type: routineType,
          block_assignments: JSON.parse(JSON.stringify(assignments)),
          notes: JSON.stringify({ systemIntensity, language: languageChoice, instrument: musicInstrument }),
        });
      }

      localStorage.setItem(`planManana_tasks_${tomorrowStr}`, JSON.stringify({
        selectedTasks: [...selectedTasks],
        blockAssignments: assignments,
        routineType,
      }));
      localStorage.setItem("planManana_intensity", JSON.stringify(systemIntensity));
      localStorage.setItem("planManana_language", languageChoice);
      localStorage.setItem("planManana_instrument", musicInstrument);

      toast.success("Plan para mañana guardado");
    } catch { toast.error("Error al guardar"); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 pt-20 pb-24 flex items-center justify-center">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 w-full bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Date Switch Tabs */}
        <DateSwitchTabs mode={mode} onModeChange={setMode} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Planificar Mañana</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3.5 w-3.5" /> {tomorrowCapitalized}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 rounded-full gap-1.5" onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}>
              <PlusCircle className="h-3.5 w-3.5" /> Nueva
            </Button>
            <Button onClick={savePlan} disabled={saving} size="sm" className="h-8 rounded-full gap-1.5">
              <Save className="h-3.5 w-3.5" /> {saving ? "Guardando..." : "Guardar Plan"}
            </Button>
          </div>
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
                  <span className="text-[9px] opacity-60">{r.wakeTime}-{r.sleepTime}</span>
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

          {/* RIGHT: Timeline Planner */}
          <div className="space-y-3">
            <DailyTimelinePlanner
              blocks={blocks as any}
              tasksByBlock={tasksByBlockForPlanner}
              onToggleBlock={() => {}}
              isBlockCompleted={() => false}
              onDropTask={(taskId, blockId) => assignTaskToBlock(taskId, blockId)}
              onRemoveTask={handleRemoveTask}
              onUpdateFocus={(blockId, focus) => updateBlockFocus(blockId, focus)}
              musicInstrument={musicInstrument === "piano" ? "piano" : "guitar"}
              languageChoice={languageChoice as "ingles" | "italiano"}
              isFutureView={true}
            />

            {/* Language & Music preferences */}
            <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 shadow-sm rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-400" />
              <CardContent className="p-4 space-y-3">
                <h3 className="text-xs font-semibold flex items-center gap-2">
                  <Languages className="h-4 w-4 text-pink-500" /> Preferencias
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Idioma a repasar:</p>
                    <div className="flex gap-1.5">
                      {[
                        { value: "italiano", label: "Italiano", flag: "🇮🇹" },
                        { value: "ingles", label: "Inglés", flag: "🇬🇧" },
                      ].map(lang => (
                        <button key={lang.value} onClick={() => setLanguageChoice(lang.value)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all border",
                            languageChoice === lang.value
                              ? "bg-pink-500 text-white border-pink-500"
                              : "bg-muted/50 border-border/60 text-muted-foreground hover:border-pink-300"
                          )}>
                          {lang.flag} {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Instrumento musical:</p>
                    <div className="flex gap-1.5">
                      {[
                        { value: "piano", label: "Piano", icon: "🎹" },
                        { value: "guitarra", label: "Guitarra", icon: "🎸" },
                      ].map(inst => (
                        <button key={inst.value} onClick={() => setMusicInstrument(inst.value)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all border",
                            musicInstrument === inst.value
                              ? "bg-pink-500 text-white border-pink-500"
                              : "bg-muted/50 border-border/60 text-muted-foreground hover:border-pink-300"
                          )}>
                          {inst.icon} {inst.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Tasks Pool — grouped by source, draggable to timeline */}
            {selectedPoolTasks.length > 0 && (
              <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 shadow-sm rounded-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-400" />
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-indigo-500" />
                      Tareas seleccionadas
                    </h3>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      {selectedPoolTasks.length}
                    </Badge>
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    Arrástralas a los bloques de la rutina para asignarlas
                  </p>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {POOL_SOURCE_ORDER.map(source => {
                      const sectionTasks = selectedPoolTasks.filter(t => t.source === source);
                      if (sectionTasks.length === 0) return null;
                      const cfg = POOL_SOURCE_CONFIG[source] || POOL_SOURCE_CONFIG.general;
                      return (
                        <div key={source}>
                          <div className="flex items-center gap-1 px-1 py-0.5">
                            <span className={cfg.color.split(' ')[0] + ' ' + cfg.color.split(' ')[1] + ' p-0.5 rounded'}>{cfg.icon}</span>
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {cfg.label}
                            </span>
                            <Badge variant="outline" className="text-[7px] px-1 py-0 h-3 ml-auto">
                              {sectionTasks.length}
                            </Badge>
                          </div>
                          <div className="space-y-0.5">
                            {sectionTasks.map(task => (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handlePoolDragStart(e, task.id)}
                                className="flex items-center gap-1.5 p-1.5 rounded-md border cursor-grab active:cursor-grabbing transition-all hover:bg-muted/50 group bg-background/40"
                              >
                                <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                                <span className="text-[11px] flex-1 truncate">{task.title}</span>
                                <button
                                  onClick={() => { setSelectedTasks(prev => { const n = new Set(prev); n.delete(task.id); return n; }); }}
                                  className="h-4 w-4 p-0 flex items-center justify-center shrink-0 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                                >
                                  <span className="text-[9px] text-muted-foreground hover:text-destructive">✕</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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
                      {["minimo", "maximo", "extra"].map(opt => (
                        <button key={opt} onClick={() => setSystemIntensity(p => ({ ...p, [sys.id]: opt }))}
                          className={cn(
                            "px-2 py-1 rounded-lg text-[9px] font-medium transition-all border",
                            level === opt
                              ? opt === "minimo" ? "bg-blue-500 text-white border-blue-500"
                                : opt === "maximo" ? "bg-green-500 text-white border-green-500"
                                : "bg-amber-500 text-white border-amber-500"
                              : "bg-transparent border-border/50 text-muted-foreground hover:border-foreground/30"
                          )}>
                          {opt === "minimo" ? "Mín" : opt === "maximo" ? "Máx" : "Extra"}
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

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={o => { if (!o) { resetCreateForm(); } setIsCreateOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>Crea una tarea para planificar mañana.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Título</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="¿Qué necesitas hacer?" onKeyDown={e => e.key === 'Enter' && handleCreateTask()} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Descripción</Label>
              <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Detalles adicionales..." className="mt-1 resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Prioridad</Label>
                <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Baja</SelectItem>
                    <SelectItem value="medium">🟡 Media</SelectItem>
                    <SelectItem value="high">🔴 Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Fecha límite</Label>
                <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Área</Label>
              <Select value={newAreaId} onValueChange={setNewAreaId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {allAreas.map(area => (
                    <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTask} disabled={creating || !newTitle.trim()} className="w-full">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Crear Tarea
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
