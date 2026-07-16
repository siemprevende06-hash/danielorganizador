import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache } from "@/lib/offlineCache";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subMonths, subWeeks } from "date-fns";
import { Briefcase, FolderKanban, CheckSquare, Target, GraduationCap, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Timeframe } from "@/contexts/TimeframeContext";

interface Props {
  timeframe: Timeframe;
}

interface CategoryStats {
  total: number;
  completed: number;
  pct: number;
  minutes: number;
  label: string;
  hasData: boolean;
  sparkData: number[];
}

const LABELS: Record<string, string> = {
  today: 'Hoy',
  week: 'Semana',
  month: 'Mes',
  quarter: 'Trimestre',
  year: 'Año',
  sprint: 'Sprint',
};

function useDateRange(timeframe: Timeframe) {
  const now = new Date();
  switch (timeframe) {
    case 'today':
      return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd'), daysBack: 0 };
    case 'week':
      return { start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), daysBack: 6 };
    case 'month':
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd'), daysBack: 29 };
    case 'quarter':
      return { start: format(startOfQuarter(now), 'yyyy-MM-dd'), end: format(endOfQuarter(now), 'yyyy-MM-dd'), daysBack: 89 };
    case 'year':
      return { start: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'), end: format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'), daysBack: 364 };
    case 'sprint':
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd'), daysBack: 29 };
    default:
      return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd'), daysBack: 0 };
  }
}

function semaphore(value: number, min: number, max: number, hasData: boolean) {
  if (!hasData) return { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Sin datos" };
  if (value >= max) return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Completado" };
  if (value >= min) return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "En progreso" };
  return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Pendiente" };
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-[1px] h-6 mt-1">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(4, (v / max) * 100)}%`,
            backgroundColor: i === data.length - 1 ? color : `${color}40`,
          }}
        />
      ))}
    </div>
  );
}

export function QuickStatsGrid({ timeframe }: Props) {
  const [university, setUniversity] = useState<CategoryStats | null>(null);
  const [entrepreneurship, setEntrepreneurship] = useState<CategoryStats | null>(null);
  const [projects, setProjects] = useState<CategoryStats | null>(null);
  const [general, setGeneral] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { start, end, daysBack } = useDateRange(timeframe);
      const today = format(new Date(), 'yyyy-MM-dd');
      const sparkStart = format(subDays(new Date(), daysBack || 6), 'yyyy-MM-dd');

      try {
        const [tasksR, entTasksR, uniTasksR, subjectsR, trackingR, weekTrackingR] = await Promise.all([
          supabase.from("tasks").select("*"),
          supabase.from("entrepreneurship_tasks").select("*"),
          supabase.from("tasks").select("*").eq("source", "university"),
          supabase.from("university_subjects").select("id,name").order("created_at"),
          supabase.from("daily_systems_tracking").select("time_data").eq("tracking_date", today).maybeSingle(),
          supabase.from("daily_systems_tracking").select("tracking_date,time_data")
            .gte("tracking_date", sparkStart).lte("tracking_date", today).order("tracking_date", { ascending: true }),
        ]);

        const sparkByKey = (key: string) => {
          const arr: number[] = [];
          for (let i = (daysBack || 6); i >= 0; i--) {
            const d = format(subDays(new Date(), i), "yyyy-MM-dd");
            const row = (weekTrackingR.data || []).find((r: any) => r.tracking_date === d);
            arr.push(Number((row?.time_data as any)?.[key]) || 0);
          }
          return arr;
        };

        // University
        const uniTasks = (uniTasksR.data || []).filter((t: any) => t.due_date >= start && t.due_date <= end);
        const subjList = subjectsR.data || [];
        setUniversity({
          total: uniTasks.length,
          completed: uniTasks.filter((t: any) => t.completed).length,
          pct: uniTasks.length > 0 ? Math.round(uniTasks.filter((t: any) => t.completed).length / uniTasks.length * 100) : 0,
          minutes: (trackingR.data?.time_data as any)?.universidad || 0,
          label: subjList.length > 0 ? subjList[0].name : '—',
          hasData: uniTasks.length > 0,
          sparkData: sparkByKey("universidad"),
        });

        // Entrepreneurship
        const entTasks = (entTasksR.data || []).filter((t: any) => t.due_date >= start && t.due_date <= end);
        setEntrepreneurship({
          total: entTasks.length,
          completed: entTasks.filter((t: any) => t.completed).length,
          pct: entTasks.length > 0 ? Math.round(entTasks.filter((t: any) => t.completed).length / entTasks.length * 100) : 0,
          minutes: (trackingR.data?.time_data as any)?.emprendimiento || 0,
          label: 'Emprendimiento',
          hasData: entTasks.length > 0,
          sparkData: sparkByKey("emprendimiento"),
        });

        // General tasks (non-uni, non-entrepreneurship, non-project)
        const generalTasks = (tasksR.data || []).filter((t: any) => {
          if (t.source === "university" || t.source === "entrepreneurship" || t.source === "project") return false;
          if (t.area_id === "universidad" || t.area_id === "emprendimiento" || t.area_id === "proyectos") return false;
          return t.due_date >= start && t.due_date <= end;
        });
        setGeneral({
          total: generalTasks.length,
          completed: generalTasks.filter((t: any) => t.completed).length,
          pct: generalTasks.length > 0 ? Math.round(generalTasks.filter((t: any) => t.completed).length / generalTasks.length * 100) : 0,
          minutes: 0,
          label: 'Generales',
          hasData: generalTasks.length > 0,
          sparkData: [],
        });

        // Projects
        loadProjects(setProjects);
      } catch {
        setDefaults(setUniversity, setEntrepreneurship, setProjects, setGeneral);
      }
      setLoading(false);
    })();
  }, [timeframe]);

  if (loading || !university || !entrepreneurship || !projects || !general) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const uniSem = semaphore(university.minutes + university.completed, 30, 120, university.hasData);
  const entSem = semaphore(entrepreneurship.minutes + entrepreneurship.completed, 30, 120, entrepreneurship.hasData);
  const projSem = projects.hasData
    ? semaphore(projects.completed, 1, Math.max(1, projects.total), true)
    : { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Inactivo" };
  const genSem = general.hasData
    ? semaphore(general.completed, 1, Math.max(1, general.total), true)
    : { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Sin tareas" };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-2">
        <CalendarDays className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          FOCUS · {LABELS[timeframe] || 'Hoy'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card className={cn("overflow-hidden ring-2 transition-all", uniSem.ring, uniSem.bg)}>
          <CardHeader className="p-2 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground">Universidad</CardTitle>
            <GraduationCap className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            <p className={cn("text-xs font-semibold truncate", university.hasData ? "" : "text-muted-foreground")}>
              {university.label || '—'}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">{university.minutes}</span>
              <span className="text-[9px] text-muted-foreground">min</span>
              {university.hasData && (
                <span className={cn("text-[8px] font-semibold ml-auto", uniSem.text)}>{uniSem.label}</span>
              )}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>{university.completed}/{university.total} tareas</span>
            </div>
            {university.total > 0 && <Progress value={university.pct} className="h-1" />}
            {university.sparkData.length > 0 && <Sparkline data={university.sparkData} color="hsl(var(--primary))" />}
          </CardContent>
        </Card>

        <Card className={cn("overflow-hidden ring-2 transition-all", entSem.ring, entSem.bg)}>
          <CardHeader className="p-2 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground">Emprendimiento</CardTitle>
            <Briefcase className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">{entrepreneurship.minutes}</span>
              <span className="text-[9px] text-muted-foreground">min</span>
              {entrepreneurship.hasData && (
                <span className={cn("text-[8px] font-semibold ml-auto", entSem.text)}>{entSem.label}</span>
              )}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>{entrepreneurship.completed}/{entrepreneurship.total} tareas</span>
            </div>
            {entrepreneurship.total > 0 && <Progress value={entrepreneurship.pct} className="h-1" />}
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Target className="h-2.5 w-2.5" />
              <span>Meta: 120 min/día</span>
            </div>
            {entrepreneurship.sparkData.length > 0 && <Sparkline data={entrepreneurship.sparkData} color="hsl(var(--primary))" />}
          </CardContent>
        </Card>

        <Card className={cn("overflow-hidden ring-2 transition-all", projSem.ring, projSem.bg)}>
          <CardHeader className="p-2 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground">Proyectos</CardTitle>
            <FolderKanban className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {projects.hasData ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold">{projects.total}</span>
                  <span className="text-[9px] text-muted-foreground">tareas</span>
                  <span className={cn("text-[8px] font-semibold ml-auto", projSem.text)}>{projSem.label}</span>
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>{projects.completed} completadas</span>
                </div>
                {projects.total > 0 && <Progress value={projects.pct} className="h-1" />}
              </>
            ) : (
              <div className="flex flex-col items-center py-2 text-muted-foreground">
                <FolderKanban className="h-5 w-5 mb-1 opacity-40" />
                <p className="text-[9px]">Sin proyectos</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={cn("overflow-hidden ring-2 transition-all", genSem.ring, genSem.bg)}>
          <CardHeader className="p-2 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground">Tareas</CardTitle>
            <CheckSquare className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {general.hasData ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold">{general.total - general.completed}</span>
                  <span className="text-[9px] text-muted-foreground">pendientes</span>
                  <span className={cn("text-[8px] font-semibold ml-auto", genSem.text)}>{genSem.label}</span>
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>{general.completed}/{general.total} completadas</span>
                </div>
                {general.total > 0 && <Progress value={general.pct} className="h-1" />}
              </>
            ) : (
              <div className="flex flex-col items-center py-2 text-muted-foreground">
                <CheckSquare className="h-5 w-5 mb-1 opacity-40" />
                <p className="text-[9px]">Sin tareas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function loadProjects(setProjects: React.Dispatch<React.SetStateAction<CategoryStats | null>>) {
  (async () => {
    try {
      const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'user_projects').maybeSingle();
      let parsed: any[] = [];
      if (data?.setting_value && Array.isArray(data.setting_value)) {
        parsed = data.setting_value;
      } else {
        const stored = localStorage.getItem("userProjects");
        if (stored) parsed = JSON.parse(stored);
      }
      const selectedId = localStorage.getItem("selectedProjectId");
      const selected = selectedId ? parsed.find((p: any) => p.id === selectedId) : parsed[0];
      const active = selected || null;
      const taskCompleted = active ? active.tasks.filter((t: any) => t.completed).length : 0;
      const taskTotal = active ? active.tasks.length : 0;
      setProjects({
        total: taskTotal,
        completed: taskCompleted,
        pct: taskTotal > 0 ? Math.round(taskCompleted / taskTotal * 100) : 0,
        minutes: 0,
        label: active?.name || '—',
        hasData: parsed.length > 0,
        sparkData: [],
      });
    } catch {
      try {
        const stored = localStorage.getItem("userProjects");
        const selectedId = localStorage.getItem("selectedProjectId");
        if (stored) {
          const parsed: any[] = JSON.parse(stored);
          const selected = selectedId ? parsed.find((p: any) => p.id === selectedId) : parsed[0];
          const active = selected || null;
          const taskCompleted = active ? active.tasks.filter((t: any) => t.completed).length : 0;
          const taskTotal = active ? active.tasks.length : 0;
          setProjects({
            total: taskTotal,
            completed: taskCompleted,
            pct: taskTotal > 0 ? Math.round(taskCompleted / taskTotal * 100) : 0,
            minutes: 0,
            label: active?.name || '—',
            hasData: parsed.length > 0,
            sparkData: [],
          });
        } else {
          setDefaultsProjects(setProjects);
        }
      } catch {
        setDefaultsProjects(setProjects);
      }
    }
  })();
}

function setDefaultsProjects(setProjects: React.Dispatch<React.SetStateAction<CategoryStats | null>>) {
  setProjects({ total: 0, completed: 0, pct: 0, minutes: 0, label: '', hasData: false, sparkData: [] });
}

function setDefaults(
  setU: React.Dispatch<React.SetStateAction<CategoryStats | null>>,
  setE: React.Dispatch<React.SetStateAction<CategoryStats | null>>,
  setP: React.Dispatch<React.SetStateAction<CategoryStats | null>>,
  setG: React.Dispatch<React.SetStateAction<CategoryStats | null>>,
) {
  setU({ total: 0, completed: 0, pct: 0, minutes: 0, label: '', hasData: false, sparkData: [] });
  setE({ total: 0, completed: 0, pct: 0, minutes: 0, label: '', hasData: false, sparkData: [] });
  setP({ total: 0, completed: 0, pct: 0, minutes: 0, label: '', hasData: false, sparkData: [] });
  setG({ total: 0, completed: 0, pct: 0, minutes: 0, label: '', hasData: false, sparkData: [] });
}
