import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { BookOpen, Briefcase, FolderKanban, CheckSquare, Clock, TrendingUp, Target, Zap, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeneralTasks {
  total: number;
  pending: number;
  completedToday: number;
  overdue: number;
  highPriority: number;
  weekCompleted: number;
  weekTotal: number;
  hasData: boolean;
}

interface EntrepreneurshipData {
  tasksTotal: number;
  tasksCompleted: number;
  todayMinutes: number;
  hasTasks: boolean;
  hasTime: boolean;
}

interface UniversityData {
  tasksTotal: number;
  tasksCompleted: number;
  todayMinutes: number;
  subjectCount: number;
  mainSubject: string;
  hasTasks: boolean;
  hasTime: boolean;
}

interface ProjectsData {
  projectCount: number;
  activeProject: { id: string; name: string; tasks: any[] } | null;
  taskCompleted: number;
  taskTotal: number;
  hasData: boolean;
}

const semaphore = (value: number, min: number, max: number, hasData: boolean) => {
  if (!hasData) return { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Sin datos" };
  if (value >= max) return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Completado" };
  if (value >= min) return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "En progreso" };
  return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Pendiente" };
};

const todayKey = () => new Date().toISOString().split("T")[0];

export function QuickStatsGrid() {
  const [generalTasks, setGeneralTasks] = useState<GeneralTasks | null>(null);
  const [entrepreneurship, setEntrepreneurship] = useState<EntrepreneurshipData | null>(null);
  const [university, setUniversity] = useState<UniversityData | null>(null);
  const [projects, setProjects] = useState<ProjectsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = todayKey();
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

      const [tasksR, entTasksR, uniTasksR, subjectsR, trackingR] = await Promise.all([
        supabase.from("tasks").select("*"),
        supabase.from("entrepreneurship_tasks").select("*"),
        supabase.from("tasks").select("*").eq("source", "university"),
        supabase.from("university_subjects").select("id,name").order("created_at"),
        supabase.from("daily_systems_tracking").select("time_data").eq("tracking_date", today).maybeSingle(),
      ]);

      const timeData = (trackingR.data?.time_data as Record<string, number>) || {};

      // --- General Tasks ---
      const allRawTasks = tasksR.data || [];
      const allTasks = allRawTasks.filter((t: any) => {
        if (t.source === "university" || t.source === "entrepreneurship" || t.source === "project") return false;
        if (t.area_id === "universidad" || t.area_id === "emprendimiento" || t.area_id === "proyectos") return false;
        return true;
      });
      const todayStr = today;
      const completedToday = allTasks.filter((t: any) => t.completed && t.updated_at?.startsWith(todayStr)).length;
      const overdue = allTasks.filter((t: any) => !t.completed && t.due_date && t.due_date < todayStr).length;
      const highPriority = allTasks.filter((t: any) => !t.completed && t.priority === "high").length;
      const weekTasks = allTasks.filter((t: any) => t.created_at?.startsWith(weekStart) || t.updated_at?.startsWith(weekStart));
      const weekCompleted = weekTasks.filter((t: any) => t.completed).length;

      setGeneralTasks({
        total: allTasks.length,
        pending: allTasks.filter(t => !t.completed).length,
        completedToday,
        overdue,
        highPriority,
        weekCompleted,
        weekTotal: weekTasks.length || allTasks.length,
        hasData: allTasks.length > 0,
      });

      // --- Entrepreneurship ---
      const entTasks = entTasksR.data || [];
      setEntrepreneurship({
        tasksTotal: entTasks.length,
        tasksCompleted: entTasks.filter(t => t.completed).length,
        todayMinutes: timeData["emprendimiento"] || 0,
        hasTasks: entTasks.length > 0,
        hasTime: (timeData["emprendimiento"] || 0) > 0,
      });

      // --- University ---
      const uniTasks = uniTasksR.data || [];
      const subjects = subjectsR.data || [];
      const mainSubject = subjects.length > 0 ? subjects[0].name : "";
      setUniversity({
        tasksTotal: uniTasks.length,
        tasksCompleted: uniTasks.filter(t => t.completed).length,
        todayMinutes: timeData["universidad"] || 0,
        subjectCount: subjects.length,
        mainSubject,
        hasTasks: uniTasks.length > 0,
        hasTime: (timeData["universidad"] || 0) > 0,
      });

      // --- Projects ---
      try {
        const stored = localStorage.getItem("userProjects");
        if (stored) {
          const parsed: any[] = JSON.parse(stored);
          const active = parsed.length > 0 ? parsed[0] : null;
          const taskCompleted = active ? active.tasks.filter((t: any) => t.completed).length : 0;
          const taskTotal = active ? active.tasks.length : 0;
          setProjects({
            projectCount: parsed.length,
            activeProject: active ? { id: active.id, name: active.name, tasks: active.tasks } : null,
            taskCompleted,
            taskTotal,
            hasData: parsed.length > 0,
          });
        } else {
          setProjects({ projectCount: 0, activeProject: null, taskCompleted: 0, taskTotal: 0, hasData: false });
        }
      } catch {
        setProjects({ projectCount: 0, activeProject: null, taskCompleted: 0, taskTotal: 0, hasData: false });
      }

      setLoading(false);
    })();
  }, []);

  if (loading || !generalTasks || !entrepreneurship || !university || !projects) {
    return null;
  }

  const uniTaskPct = university.tasksTotal > 0 ? Math.round((university.tasksCompleted / university.tasksTotal) * 100) : 0;
  const entTaskPct = entrepreneurship.tasksTotal > 0 ? Math.round((entrepreneurship.tasksCompleted / entrepreneurship.tasksTotal) * 100) : 0;
  const projTaskPct = projects.taskTotal > 0 ? Math.round((projects.taskCompleted / projects.taskTotal) * 100) : 0;
  const weekPct = generalTasks.weekTotal > 0 ? Math.round((generalTasks.weekCompleted / generalTasks.weekTotal) * 100) : 0;

  const uniSem = semaphore(university.todayMinutes + university.tasksCompleted, 30, 120, university.hasTasks || university.hasTime);
  const entSem = semaphore(entrepreneurship.todayMinutes + entrepreneurship.tasksCompleted, 30, 120, entrepreneurship.hasTasks || entrepreneurship.hasTime);
  const projSem = projects.hasData
    ? semaphore(projects.taskCompleted, 1, projects.taskTotal, projects.taskTotal > 0)
    : { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Inactivo" };
  const tasksSem = generalTasks.hasData
    ? semaphore(generalTasks.completedToday, 1, Math.max(1, generalTasks.pending), true)
    : { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Sin tareas" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* UNIVERSITY CARD */}
        <Card className={cn("overflow-hidden ring-2 transition-all", uniSem.ring, uniSem.bg)}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Universidad</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Materia del día</p>
              <p className={cn("text-base font-bold truncate", university.hasTasks ? "" : "text-muted-foreground")}>
                {university.mainSubject || "—"}
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{university.todayMinutes}</span>
              <span className="text-sm text-muted-foreground">min hoy</span>
              {university.hasData && (
                <span className={cn("text-xs font-semibold ml-auto", uniSem.text)}>{uniSem.label}</span>
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tareas: {university.tasksCompleted}/{university.tasksTotal}</span>
              <span>{university.subjectCount} materias</span>
            </div>
            {university.tasksTotal > 0 && <Progress value={uniTaskPct} className="h-1.5" />}
          </CardContent>
        </Card>

        {/* ENTREPRENEURSHIP CARD */}
        <Card className={cn("overflow-hidden ring-2 transition-all", entSem.ring, entSem.bg)}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Emprendimiento</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{entrepreneurship.todayMinutes}</span>
              <span className="text-sm text-muted-foreground">min hoy</span>
              {entrepreneurship.hasTasks && (
                <span className={cn("text-xs font-semibold ml-auto", entSem.text)}>{entSem.label}</span>
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tareas: {entrepreneurship.tasksCompleted}/{entrepreneurship.tasksTotal}</span>
              <span>completadas</span>
            </div>
            {entrepreneurship.tasksTotal > 0 && <Progress value={entTaskPct} className="h-1.5" />}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Meta: 120 min/día</span>
            </div>
          </CardContent>
        </Card>

        {/* PROJECTS CARD */}
        <Card className={cn("overflow-hidden ring-2 transition-all", projSem.ring, projSem.bg)}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proyectos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {projects.hasData ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{projects.projectCount}</span>
                  <span className="text-sm text-muted-foreground">proyectos</span>
                  {projects.taskTotal > 0 && (
                    <span className={cn("text-xs font-semibold ml-auto", projSem.text)}>{projSem.label}</span>
                  )}
                </div>
                {projects.activeProject && (
                  <p className="text-xs text-muted-foreground truncate">Activo: {projects.activeProject.name}</p>
                )}
                {projects.taskTotal > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tareas: {projects.taskCompleted}/{projects.taskTotal}</span>
                    </div>
                    <Progress value={projTaskPct} className="h-1.5" />
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                <FolderKanban className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">Selecciona un proyecto</p>
                <p className="text-[10px]">en la página Proyectos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TASKS CARD (full width) */}
      <Card className={cn("overflow-hidden ring-2 transition-all", tasksSem.ring, tasksSem.bg)}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tareas Generales</CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {generalTasks.hasData ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">{generalTasks.pending}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completadas hoy</p>
                  <p className="text-2xl font-bold text-green-500">{generalTasks.completedToday}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencidas</p>
                  <p className={cn("text-2xl font-bold", generalTasks.overdue > 0 ? "text-red-500" : "text-muted-foreground")}>
                    {generalTasks.overdue}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alta prioridad</p>
                  <p className={cn("text-2xl font-bold", generalTasks.highPriority > 0 ? "text-yellow-500" : "text-muted-foreground")}>
                    {generalTasks.highPriority}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Completadas esta semana</span>
                  <span className="font-medium">{generalTasks.weekCompleted}/{generalTasks.weekTotal}</span>
                </div>
                <Progress value={weekPct} className="h-2" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <CheckSquare className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Sin tareas generales</p>
              <p className="text-xs">Agrega tareas en la página Tareas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
