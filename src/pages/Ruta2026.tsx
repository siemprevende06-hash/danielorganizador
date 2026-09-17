import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Home, Map as MapIcon, Gauge, CalendarRange, Layers, Gift, Check, Clock, FolderTree, ChevronRight } from "lucide-react";
import {
  usePersonalLists,
  LIFE_AREAS,
} from "@/hooks/usePersonalLists";
import MotivosBoard from "@/components/motivos/MotivosBoard";
import ObjetivoPrioritario from "./ObjetivoPrioritario";
import DailyRoutine from "./DailyRoutine";
import Systems from "./Systems";

const SECTIONS = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "camino", label: "Camino", icon: Map },
  { id: "control", label: "Control", icon: Gauge },
  { id: "rutina", label: "Rutina", icon: CalendarRange },
  { id: "sistemas", label: "Sistemas", icon: Layers },
  { id: "recompensa", label: "Recompensa", icon: Gift },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function RootTaskNode({
  task,
  areaName,
  areaColor,
  progress,
  done,
}: {
  task: { id: string; title: string; priority: string };
  areaName: string;
  areaColor: string;
  progress: number;
  done: boolean;
}) {
  return (
    <button
      className="group relative flex flex-col items-center gap-1.5 outline-none"
      title={`${areaName} · ${task.title}`}
    >
      <span
        className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-border/70 shadow-sm transition-transform group-hover:scale-105"
        style={{ backgroundColor: areaColor }}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-background/85 text-foreground">
          {done ? <Check className="h-6 w-6 text-green-600" /> : <span className="text-lg font-bold">{task.title.slice(0, 1).toUpperCase()}</span>}
        </span>
      </span>
      <span className="max-w-[6.5rem] truncate text-[11px] leading-tight text-muted-foreground group-hover:text-foreground">
        {task.title}
      </span>
      <span className="text-[10px] font-medium tracking-wide" style={{ color: areaColor }}>
        {done ? "SUPERADO" : `${Math.round(progress * 100)}%`}
      </span>
    </button>
  );
}

export default function Ruta2026() {
  const [section, setSection] = useState<SectionId>("inicio");
  const [activeArea, setActiveArea] = useState<string>("todas");
  const { lists, tasks, isLoading } = usePersonalLists();

  const metrics = useMemo(() => {
    const totalLists = lists.length;
    const totalTasks = tasks.length;
    const pending = tasks.filter((t) => !t.completed);
    const withDeadline = pending.filter((t) => t.due_date);
    const perArea = LIFE_AREAS.map((area) => ({
      ...area,
      listCount: lists.filter((l) => l.area_id === area.id).length,
      pendingTasks: pending.filter((t) => {
        const l = lists.find((ll) => ll.id === t.list_id);
        return l ? l.area_id === area.id : false;
      }).length,
    })).filter((a) => a.listCount > 0 || a.pendingTasks > 0);
    const nextDeadline = withDeadline
      .map((t) => t.due_date)
      .sort()
      .slice(0, 5);
    return { totalLists, totalTasks, pending: pending.length, withDeadline: withDeadline.length, perArea, nextDeadline };
  }, [lists, tasks]);

  const rootTasks = useMemo(() => {
    const roots = tasks.filter((t) => t.parent_id === null);
    const byList = new Map<string, { title: string; areaId: string }>();
    lists.forEach((l) => byList.set(l.id, { title: l.title, areaId: l.area_id }));
    return roots
      .map((t) => {
        const meta = byList.get(t.list_id);
        const area = LIFE_AREAS.find((a) => a.id === (meta?.areaId ?? ""));
        const subtasks = tasks.filter((s) => s.parent_id === t.id);
        const done = subtasks.length > 0 ? subtasks.filter((s) => s.completed).length : t.completed ? 1 : 0;
        const total = subtasks.length > 0 ? subtasks.length : 1;
        return {
          id: t.id,
          title: t.title,
          priority: t.priority,
          area: area ?? LIFE_AREAS[0],
          done: done >= total,
          progress: done / total,
          hidden: activeArea !== "todas" && (meta?.areaId ?? "") !== activeArea,
        };
      })
      .filter((r) => !r.hidden)
      .sort((a, b) => a.area.name.localeCompare(b.area.name));
  }, [tasks, lists, activeArea]);

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ruta 2026</h1>
          <p className="text-sm text-muted-foreground">Tu plan por área de vida: camino, control, rutina, sistemas y recompensa.</p>
        </div>
      </header>

      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              section === s.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {section === "inicio" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Sistemas operativos</p>
                <p className="mt-1 text-3xl font-bold">{isLoading ? "…" : metrics.totalLists}</p>
                <p className="text-xs text-muted-foreground">listas personales activas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Tareas raíz</p>
                <p className="mt-1 text-3xl font-bold">{isLoading ? "…" : metrics.totalTasks}</p>
                <p className="text-xs text-muted-foreground">{metrics.pending} pendientes hoy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Con fecha límite</p>
                <p className="mt-1 text-3xl font-bold">{metrics.withDeadline}</p>
                <p className="text-xs text-muted-foreground">tareas con deadline próximo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Vencen pronto</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {metrics.nextDeadline.length === 0 && <span className="text-3xl font-bold text-muted-foreground">—</span>}
                  {metrics.nextDeadline.slice(0, 3).map((d) => (
                    <Badge key={d} variant="outline" className="font-mono text-[10px]">
                      {d.slice(5).replace("-", "/")}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">próximos 5 vencimientos</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Esfuerzo por área de vida</CardTitle>
              <CardDescription>Distribución de tus sistemas y tareas pendientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.perArea.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aún no hay sistemas en tu lista personal. Ve a "Mi Lista" para crear el primero.
                </p>
              )}
              {metrics.perArea.map((area) => (
                <div key={area.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: area.color }} />
                      {area.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {area.listCount} sistemas · {area.pendingTasks} pend.
                    </span>
                  </div>
                  <Progress
                    value={area.pendingTasks}
                    max={Math.max(1, metrics.pending)}
                    className="h-2"
                    // @ts-expect-error Progress acepta color via style
                    style={{ ["--progress-color" as string]: area.color }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {section === "camino" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base">Tu Camino en panales</CardTitle>
                <CardDescription>Cada panal es un paso importante: tarea raíz dentro de un sistema. Complétala para superarla.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveArea("todas")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    activeArea === "todas" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  Todas
                </button>
                {LIFE_AREAS.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => setActiveArea(area.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      activeArea === area.id ? "text-background" : "text-muted-foreground hover:bg-muted"
                    )}
                    style={activeArea === area.id ? { backgroundColor: area.color } : undefined}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {rootTasks.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {isLoading ? "Cargando tu camino…" : "No hay tareas raíz todavía. Crea una tarea principal en 'Mi Lista' para ver su panal aquí."}
                </p>
              )}
              <div className="flex flex-wrap justify-start gap-5">
                {rootTasks.map((t) => (
                  <RootTaskNode
                    key={t.id}
                    task={t}
                    areaName={t.area.name}
                    areaColor={t.area.color}
                    progress={t.progress}
                    done={t.done}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
              <FolderTree className="h-4 w-4" />
              <span>
                <strong className="text-foreground">Cómo funciona:</strong> cada panal corresponde a una <strong className="text-foreground">tarea raíz</strong> de un sistema.
                Marca sus subtareas como hechas en "Mi Lista" para llenar el panal y llegar al 100%.
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {section === "control" && (
        <ObjetivoPrioritario />
      )}

      {section === "rutina" && (
        <DailyRoutine />
      )}

      {section === "sistemas" && (
        <Systems />
      )}

      {section === "recompensa" && (
        <MotivosBoard
          storageKey="ruta2026-recompensa"
          uploadFolder="ruta2026-recompensa"
          title="Recompensa"
          description="Escenarios y recompensas que valen la pena perseguir. Aún no tienes nada: crea tu primera sección."
          emptyTitle="No hay escenarios aún"
          emptyDescription="Esta es tu recompensa futura. Crea secciones con imágenes y textos de lo que quieres lograr."
          newSectionLabel="Nuevo Escenario"
        />
      )}
    </div>
  );
}
