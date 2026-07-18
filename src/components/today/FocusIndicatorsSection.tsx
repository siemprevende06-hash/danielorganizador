import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, GraduationCap, Briefcase, Code2, Clock, Target, Shield, ListChecks, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCombinedFocusTime } from "@/hooks/useCombinedFocusTime";
import { useSystemsTracking } from "@/hooks/useSystemsTracking";
import { useActiveSelection } from "@/hooks/useActiveSelection";
import { useUniversity } from "@/hooks/useUniversity";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { DailyTaskSelector } from "@/components/routine/DailyTaskSelector";
import { isOnline } from "@/lib/isOnline";
import { getCached, setCache } from "@/lib/offlineCache";

function semaphore(progress: number) {
  if (progress >= 80) return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Completado" };
  if (progress >= 50) return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "En progreso" };
  if (progress > 0) return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Pendiente" };
  return { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Sin empezar" };
}

interface ActiveInfo {
  name: string;
  done: number;
  total: number;
  route: string;
}

interface ProjectStored {
  id: string;
  name: string;
  tasks?: { completed?: boolean }[];
}

export function FocusIndicatorsSection() {
  const navigate = useNavigate();
  const { areas, loading, setManualTime } = useCombinedFocusTime();
  const { data: systemsData, loading: systemsLoading } = useSystemsTracking();
  const { subjects } = useUniversity();

  const { value: activeSubjectId } = useActiveSelection("activeSubjectId");
  const { value: activeEntId } = useActiveSelection("activeEntrepreneurshipId");
  const { value: activeProjectId } = useActiveSelection("selectedProjectId");

  const [entInfo, setEntInfo] = useState<ActiveInfo | null>(null);
  const [projectInfo, setProjectInfo] = useState<ActiveInfo | null>(null);
  const [generalTasks, setGeneralTasks] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  // Plan del Día state (shared via localStorage with DailyRoutine)
  interface TaskItem {
    id: string;
    title: string;
    description?: string;
    source: "tasks" | "entrepreneurship" | "project" | "university";
    sourceId?: string;
    sourceName?: string;
    dueDate?: string;
    completed?: boolean;
  }
  const DAILY_PLAN_KEY = "dailyPlanTasks";
  const [dailyTasks, setDailyTasks] = useState<TaskItem[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [planDate, setPlanDate] = useState<"today" | "tomorrow">("today");

  const getDateKey = (date: "today" | "tomorrow") => {
    const d = date === "today" ? new Date() : new Date(Date.now() + 86400000);
    return `${DAILY_PLAN_KEY}_${d.toISOString().split('T')[0]}`;
  };

  useEffect(() => {
    const stored = localStorage.getItem(getDateKey(planDate));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDailyTasks(parsed.tasks || []);
        setCompletedTaskIds(new Set(parsed.completedIds || []));
      } catch {
        setDailyTasks([]);
        setCompletedTaskIds(new Set());
      }
    } else {
      setDailyTasks([]);
      setCompletedTaskIds(new Set());
    }
  }, [planDate]);

  useEffect(() => {
    if (dailyTasks.length > 0 || completedTaskIds.size > 0) {
      localStorage.setItem(getDateKey(planDate), JSON.stringify({
        tasks: dailyTasks,
        completedIds: Array.from(completedTaskIds),
      }));
      setCache("daily_plan", `checklist_${getDateKey(planDate)}`, { tasks: dailyTasks, completedIds: [...completedTaskIds] }, 300000);
    }
  }, [dailyTasks, completedTaskIds, planDate]);

  const handleTasksChange = (tasks: TaskItem[]) => {
    setDailyTasks(tasks);
  };

  const handleToggleComplete = (taskId: string) => {
    setCompletedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleRemoveTask = (taskId: string) => {
    setDailyTasks(prev => prev.filter(t => t.id !== taskId));
    setCompletedTaskIds(prev => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  };

  useEffect(() => {
    if (!isOnline()) {
      getCached<{ tasks: TaskItem[]; completedIds: string[] }>("daily_plan", `checklist_${getDateKey(planDate)}`)
        .then(cached => {
          if (cached) {
            setDailyTasks(cached.tasks || []);
            setCompletedTaskIds(new Set(cached.completedIds || []));
          }
        });
    }
  }, [planDate]);

  // Universidad — from active subject
  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || null;
  const subjectInfo: ActiveInfo | null = activeSubject
    ? {
        name: activeSubject.name,
        done: activeSubject.tasks.filter((t) => t.completed).length,
        total: activeSubject.tasks.length,
        route: "/university",
      }
    : null;

  // Emprendimiento — fetch active from Supabase
  useEffect(() => {
    if (!activeEntId) { setEntInfo(null); return; }
    (async () => {
      const [{ data: ent }, { count: total }, { count: done }] = await Promise.all([
        supabase.from("entrepreneurships").select("name").eq("id", activeEntId).maybeSingle(),
        supabase.from("entrepreneurship_tasks").select("*", { count: "exact", head: true }).eq("entrepreneurship_id", activeEntId),
        supabase.from("entrepreneurship_tasks").select("*", { count: "exact", head: true }).eq("entrepreneurship_id", activeEntId).eq("completed", true),
      ]);
      if (ent) setEntInfo({ name: ent.name, done: done || 0, total: total || 0, route: `/entrepreneurship/${activeEntId}` });
      else setEntInfo(null);
    })();
  }, [activeEntId]);

  // Proyectos — from app_settings (Supabase) with localStorage fallback
  useEffect(() => {
    if (!activeProjectId) { setProjectInfo(null); return; }
    (async () => {
      try {
        const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'user_projects').maybeSingle();
        let list: ProjectStored[] = [];
        if (data?.setting_value && Array.isArray(data.setting_value)) {
          list = data.setting_value as unknown as ProjectStored[];
        } else {
          const stored = localStorage.getItem("userProjects");
          if (stored) list = JSON.parse(stored);
        }
        const p = list.find((x) => x.id === activeProjectId);
        if (!p) { setProjectInfo(null); return; }
        const total = p.tasks?.length || 0;
        const done = p.tasks?.filter((t) => t.completed).length || 0;
        setProjectInfo({ name: p.name, done, total, route: "/projects" });
      } catch {
        try {
          const stored = localStorage.getItem("userProjects");
          if (stored) {
            const list = JSON.parse(stored) as ProjectStored[];
            const p = list.find((x) => x.id === activeProjectId);
            if (!p) { setProjectInfo(null); return; }
            const total = p.tasks?.length || 0;
            const done = p.tasks?.filter((t) => t.completed).length || 0;
            setProjectInfo({ name: p.name, done, total, route: "/projects" });
          } else { setProjectInfo(null); }
        } catch { setProjectInfo(null); }
      }
    })();
  }, [activeProjectId]);

  // Tareas Generales — from tasks table for today with source='general'
  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("tasks")
        .select("id, completed, source")
        .gte("due_date", `${today}T00:00:00`)
        .lte("due_date", `${today}T23:59:59`);
      const gen = (data || []).filter((t: any) => !t.source || t.source === "general");
      setGeneralTasks({ done: gen.filter((t: any) => t.completed).length, total: gen.length });
    })();
  }, []);

  if (loading || systemsLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  const SOSTEN_IDS = [
    "rutina-activacion", "alistamiento-desayuno", "horario-regular", "rutina-desactivacion",
    "skincare-manana", "skincare-noche", "banarme-vestirme",
    "pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir",
  ];
  const sostenCount = SOSTEN_IDS.filter((id) => systemsData.completions[id]).length;
  const sostenTotal = SOSTEN_IDS.length;
  const sostenPct = Math.round((sostenCount / sostenTotal) * 100);

  const infoByArea: Record<string, ActiveInfo | null> = {
    universidad: subjectInfo,
    emprendimiento: entInfo,
    proyectos: projectInfo,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-wide">FOCUS · HOY</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {areas.map((area) => {
          const sem = semaphore(area.progress);
          const Icon = area.id === "universidad" ? GraduationCap : area.id === "emprendimiento" ? Briefcase : Code2;
          const colorMap: Record<string, string> = {
            universidad: "text-purple-500 bg-purple-500/10 ring-purple-500/20",
            emprendimiento: "text-amber-500 bg-amber-500/10 ring-amber-500/20",
            proyectos: "text-cyan-500 bg-cyan-500/10 ring-cyan-500/20",
          };
          const routeMap: Record<string, string> = {
            universidad: "/university",
            emprendimiento: "/entrepreneurship",
            proyectos: "/projects",
          };
          const info = infoByArea[area.id];
          const taskPct = info && info.total > 0 ? Math.round((info.done / info.total) * 100) : 0;

          return (
            <Card key={area.id} className={cn("p-3 ring-2 transition-all", sem.ring, sem.bg, "flex flex-col gap-2")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg", colorMap[area.id])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-sm">{area.name}</span>
                </div>
                <span className={cn("text-[10px] font-semibold", sem.text)}>{sem.label}</span>
              </div>

              {/* Active selection */}
              <button
                type="button"
                onClick={() => navigate(info?.route || routeMap[area.id])}
                className="text-left rounded-md border border-border/50 bg-background/50 px-2 py-1.5 hover:bg-background transition-colors"
              >
                {info ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium truncate">{info.name}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                        {info.done}/{info.total}
                      </Badge>
                    </div>
                    <Progress value={taskPct} className="h-1 mt-1" />
                  </>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    Selecciona una {area.id === "universidad" ? "asignatura" : area.id === "emprendimiento" ? "iniciativa" : "proyecto"} activa
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground shrink-0">Manual:</span>
                <Input
                  type="number"
                  min={0}
                  value={area.manualMinutes || ""}
                  onChange={(e) => setManualTime(area.id, parseInt(e.target.value) || 0)}
                  placeholder="min"
                  className="w-16 h-7 text-xs text-center"
                />
                <span className="text-[11px] text-muted-foreground">min</span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Target className="h-3 w-3 text-primary" />
                <span>Focus: <strong>{area.focusMinutes}</strong> min</span>
                <span className="mx-1">·</span>
                <span>Total: <strong className="text-foreground">{area.totalMinutes}</strong> / {area.goalMinutes} min</span>
              </div>

              <Progress value={area.progress} className="h-1.5" />
            </Card>
          );
        })}
      </div>

      {/* Tareas Generales */}
      <Card
        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/10 transition-colors"
        onClick={() => navigate("/tasks")}
      >
        <div className="p-1.5 rounded-lg bg-foreground/10 text-foreground">
          <ListChecks className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Tareas Generales · Hoy</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {generalTasks.done}/{generalTasks.total}
            </span>
          </div>
          <Progress
            value={generalTasks.total > 0 ? Math.round((generalTasks.done / generalTasks.total) * 100) : 0}
            className="h-1 mt-1"
          />
        </div>
      </Card>

      <Card className="p-3 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[10px] font-semibold text-muted-foreground">Sostén</span>
            <span className={cn("text-xs font-bold", sostenPct >= 70 ? "text-green-500" : sostenPct >= 40 ? "text-amber-500" : "text-red-500")}>
              {sostenCount}/{sostenTotal}
            </span>
          </div>
          <Progress value={sostenPct} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground tabular-nums">{sostenPct}%</span>
        </div>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Plan del Día
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={planDate === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setPlanDate("today")}
              >
                Hoy
              </Button>
              <Button
                variant={planDate === "tomorrow" ? "default" : "outline"}
                size="sm"
                onClick={() => setPlanDate("tomorrow")}
              >
                Mañana
              </Button>
            </div>
          </div>
          {dailyTasks.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-medium">{completedTaskIds.size}/{dailyTasks.length}</span>
              </div>
              <Progress value={dailyTasks.length > 0 ? (completedTaskIds.size / dailyTasks.length) * 100 : 0} className="h-2" />
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {dailyTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No hay tareas planificadas para {planDate === "today" ? "hoy" : "mañana"}</p>
              <DailyTaskSelector
                selectedTasks={dailyTasks}
                onTasksChange={handleTasksChange}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {dailyTasks.map(task => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-all",
                      completedTaskIds.has(task.id)
                        ? "bg-green-500/10 border-green-500/30"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={completedTaskIds.has(task.id)}
                      onChange={() => handleToggleComplete(task.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm",
                        completedTaskIds.has(task.id) && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                      {task.sourceName && (
                        <Badge variant="outline" className="mt-1 text-xs">{task.sourceName}</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <DailyTaskSelector
                  selectedTasks={dailyTasks}
                  onTasksChange={handleTasksChange}
                />
              </div>
            </>
          )}
          {dailyTasks.length > 0 && completedTaskIds.size === dailyTasks.length && (
            <div className="text-center py-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-green-600 dark:text-green-400">
                ¡Todas las tareas completadas!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
