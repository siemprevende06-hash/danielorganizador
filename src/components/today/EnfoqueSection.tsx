import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap, Briefcase, FolderKanban, ListTodo,
  Focus, Clock, Target, ArrowRight, Save, CalendarDays, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyPlanData } from "@/hooks/useDailyPlanData";
import { useCombinedFocusTime } from "@/hooks/useCombinedFocusTime";
import { useActiveSelection } from "@/hooks/useActiveSelection";
import { useUniversity } from "@/hooks/useUniversity";
import { WeekStreakBar } from "@/components/systems/WeekStreakBar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const priorityColors: Record<string, string> = {
  high: 'border-l-red-400 bg-red-50/30',
  medium: 'border-l-amber-300 bg-amber-50/20',
  low: 'border-l-gray-200'
};

const priorityLabel: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja'
};

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  universidad: { label: 'Universidad', icon: <GraduationCap className="h-3.5 w-3.5" />, color: 'text-blue-500' },
  emprendimiento: { label: 'Emprendimiento', icon: <Briefcase className="h-3.5 w-3.5" />, color: 'text-purple-500' },
  proyectos: { label: 'Proyecto', icon: <FolderKanban className="h-3.5 w-3.5" />, color: 'text-amber-500' },
  general: { label: 'General', icon: <ListTodo className="h-3.5 w-3.5" />, color: 'text-muted-foreground' },
};

const AREA_CARD_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; gradient: string; color: string; bg: string; route: string }> = {
  universidad: { icon: GraduationCap, gradient: "from-purple-600 to-purple-400", color: "text-purple-500", bg: "bg-purple-500/10", route: "/university" },
  emprendimiento: { icon: Briefcase, gradient: "from-amber-600 to-amber-400", color: "text-amber-500", bg: "bg-amber-500/10", route: "/entrepreneurship" },
  proyectos: { icon: FolderKanban, gradient: "from-cyan-600 to-cyan-400", color: "text-cyan-500", bg: "bg-cyan-500/10", route: "/projects" },
};

const progressSemaphore = (pct: number) => {
  if (pct >= 80) return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Completado" };
  if (pct >= 50) return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "En progreso" };
  if (pct > 0) return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Pendiente" };
  return { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Sin empezar" };
};

// ============================================================
//  ENFOQUE SECTION — Tareas del día + Tarjetas de enfoque
// ============================================================
export function EnfoqueSection() {
  const navigate = useNavigate();
  const { tasks } = useDailyPlanData(new Date());
  const { areas, loading, setManualTime } = useCombinedFocusTime();
  const { subjects } = useUniversity();
  const { value: activeSubjectId } = useActiveSelection("activeSubjectId");
  const { value: activeEntId } = useActiveSelection("activeEntrepreneurshipId");
  const { value: activeProjectId } = useActiveSelection("selectedProjectId");

  const [entInfo, setEntInfo] = useState<ActiveInfo | null>(null);
  const [projectInfo, setProjectInfo] = useState<ActiveInfo | null>(null);

  // Group tasks by source (only pending)
  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      if (task.completed) continue;
      const key = task.source === 'university' ? 'universidad'
        : task.source === 'entrepreneurship' ? 'emprendimiento'
          : task.source === 'projects' ? 'proyectos'
            : 'general';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    }
    return groups;
  }, [tasks]);

  // Universidad — active subject info
  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || null;
  const subjectInfo: ActiveInfo | null = activeSubject
    ? {
      name: activeSubject.name,
      done: activeSubject.tasks.filter((t) => t.completed).length,
      total: activeSubject.tasks.length,
      route: "/university",
    }
    : null;

  // Emprendimiento — fetch active
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

  // Proyectos — from app_settings
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

  const infoByArea: Record<string, ActiveInfo | null> = {
    universidad: subjectInfo,
    emprendimiento: entInfo,
    proyectos: projectInfo,
  };

  const taskCount = Object.values(groupedTasks).reduce((sum, t) => sum + t.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-wide">ENFOQUE · HOY</h2>
      </div>

      {/* ===== TAREAS DEL DÍA AGRUPADAS ===== */}
      {taskCount > 0 && (
        <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-400" />
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Focus className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-semibold">Tareas del Día</h3>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">
                {taskCount} pendientes
              </Badge>
            </div>
            <div className="space-y-2.5">
              {(['universidad', 'emprendimiento', 'proyectos', 'general'] as const).map(source => {
                const sourceTasks = groupedTasks[source];
                if (!sourceTasks?.length) return null;
                const cfg = SOURCE_CONFIG[source];
                return (
                  <div key={source} className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span className={cfg.color}>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                      <span className="text-[9px] text-muted-foreground/60">({sourceTasks.length})</span>
                    </div>
                    <div className="space-y-0.5">
                      {sourceTasks.map(task => (
                        <div key={task.id} className={cn("flex items-center gap-2 py-1 px-2 rounded-lg border-l-2 text-xs", priorityColors[task.priority || 'medium'])}>
                          <span className="flex-1 truncate">{task.title}</span>
                          {task.priority && task.priority !== 'low' && (
                            <span className={cn("text-[9px] font-medium shrink-0", task.priority === 'high' ? 'text-red-500' : 'text-amber-500')}>
                              {priorityLabel[task.priority]}
                            </span>
                          )}
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

      {/* ===== TARJETAS DE ENFOQUE (como Mejora) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {areas.map((area) => {
          const config = AREA_CARD_CONFIG[area.id];
          if (!config) return null;
          const Icon = config.icon;
          const sem = progressSemaphore(area.progress);
          const info = infoByArea[area.id];
          const taskPct = info && info.total > 0 ? Math.round((info.done / info.total) * 100) : 0;

          return (
            <FocusCard
              key={area.id}
              areaId={area.id}
              areaName={area.name}
              icon={Icon}
              gradient={config.gradient}
              color={config.color}
              bg={config.bg}
              route={config.route}
              sem={sem}
              info={info}
              taskPct={taskPct}
              manualMinutes={area.manualMinutes}
              focusMinutes={area.focusMinutes}
              totalMinutes={area.totalMinutes}
              goalMinutes={area.goalMinutes}
              progress={area.progress}
              onManualTimeChange={(v) => setManualTime(area.id, v)}
              onNavigate={navigate}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
//  FOCUS CARD — Tarjeta tipo Mejora para tiempo de enfoque
// ============================================================
function FocusCard({
  areaId,
  areaName,
  icon: Icon,
  gradient,
  color,
  bg,
  route,
  sem,
  info,
  taskPct,
  manualMinutes,
  focusMinutes,
  totalMinutes,
  goalMinutes,
  progress,
  onManualTimeChange,
  onNavigate,
}: {
  areaId: string;
  areaName: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  color: string;
  bg: string;
  route: string;
  sem: { ring: string; bg: string; text: string; label: string };
  info: ActiveInfo | null;
  taskPct: number;
  manualMinutes: number;
  focusMinutes: number;
  totalMinutes: number;
  goalMinutes: number;
  progress: number;
  onManualTimeChange: (v: number) => void;
  onNavigate: (url: string) => void;
}) {
  const MIN_GOAL = Math.round(goalMinutes * 0.5);
  const [draft, setDraft] = useState(manualMinutes);

  useEffect(() => setDraft(manualMinutes), [manualMinutes]);

  const handleSave = () => {
    onManualTimeChange(draft);
    toast.success(`${areaName}: ${draft} min guardados`);
  };

  return (
    <Card className={cn("overflow-hidden p-0 ring-2 transition-all", sem.ring)}>
      <div
        className={cn("ios-grad-header p-4 flex items-center justify-between cursor-pointer", `bg-gradient-to-r ${gradient}`)}
        onClick={() => onNavigate(route)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/20">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">{areaName}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-white/80" />
      </div>

      <div className={cn("p-4 space-y-3", sem.bg)}>
        {/* Active item info (subject/project name) */}
        <button
          type="button"
          onClick={() => info && onNavigate(info.route)}
          className="w-full text-left rounded-md border border-border/50 bg-background/50 px-2 py-1.5 hover:bg-background transition-colors"
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
              Selecciona {areaId === "universidad" ? "una asignatura" : areaId === "emprendimiento" ? "una iniciativa" : "un proyecto"} activa
            </span>
          )}
        </button>

        <Separator />

        {/* Time input */}
        <div className="bg-card/80 backdrop-blur rounded-lg p-2 border space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tiempo manual (min)</span>
            <span className={cn("text-[10px] font-bold", sem.text)}>{sem.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={draft || ""}
              onChange={(e) => setDraft(parseInt(e.target.value) || 0)}
              className="h-8 text-sm font-bold text-center"
              placeholder="0"
            />
            <Button size="sm" className="h-8 px-2" onClick={handleSave}>
              <Save className="h-3 w-3" />
            </Button>
          </div>
          <Progress value={Math.min(100, progress)} className="h-1.5" />
          <p className="text-[9px] text-muted-foreground text-center">
            {totalMinutes} / {goalMinutes} min ({progress}%)
          </p>
        </div>

        {/* Week streak */}
        <WeekStreakBar
          habitId={`focus-${areaId}`}
          todayValue={totalMinutes}
          minThreshold={MIN_GOAL}
          maxThreshold={goalMinutes}
          compact
        />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t">
          <Stat label="Manual" value={`${manualMinutes}m`} />
          <Stat label="Focus" value={`${focusMinutes}m`} />
          <Stat label="Total" value={`${totalMinutes}m`} />
        </div>
      </div>
    </Card>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <p className="font-semibold text-xs">{value}</p>
    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
  </div>
);
