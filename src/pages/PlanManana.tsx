import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { lifeAreas } from "@/lib/data";
import { flattenAreas } from "@/lib/utils";
import { useRoutineBlocks, type RoutineType, ROUTINES, legacyModeForRoutine } from "@/hooks/useRoutineBlocks";
import { loadDailyPlan, saveDailyPlan } from "@/lib/dailyPlanStorage";
import { DailyTimelinePlanner } from "@/components/today/DailyTimelinePlanner";
import { DaySpeedSection } from "@/components/today/DaySpeedSection";
import { useDaySpeedPlan } from "@/hooks/useDaySpeedPlan";
import { setDayGoal, getDayGoalEffective, ALL_HIERARCHY_AREAS } from "@/lib/hierarchy";
import {
  Sun, Moon, Clock, CalendarDays, CheckCircle2, CircleDot, Save, PlusCircle, Loader2, Layers,
  Briefcase, Sparkles,
} from "lucide-react";
import { SPEED_PLAN_SYSTEMS, systemSpeedOptions, type DaySystem, type SystemSpeed } from "@/lib/daySystems";
import {
  autoSystemForBlock,
  blockDurationMinutes,
  deriveSystemIntensity,
  isDeepWorkBlock,
  isExtraBlock,
  setWholeBlock,
  summarizeSpeedPlan,
  type SpeedPlan,
} from "@/lib/speedPlan";
import {
  planSystemEmoji,
  planSystemName,
  systemIdForTask,
  type PlannerTask,
} from "@/lib/planMananaTasks";
import { useSystemSpeed } from "@/hooks/useSystemSpeed";
import { useSystemActivityTags } from "@/hooks/useSystemActivityTags";
import { useAreaCovers, coverKey } from "@/hooks/useAreaCovers";
import { PlanSystemCard } from "@/components/planificacion/PlanSystemCard";
import { TaskInboxCard } from "@/components/planificacion/TaskInboxCard";
import { FocusLockCard } from "@/components/planificacion/FocusLockCard";
import { DaySettingsCard } from "@/components/planificacion/DaySettingsCard";

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

interface ProjectRow {
  id: string;
  title: string;
  tasks?: ProjectTask[] | null;
}

interface EntreTask {
  id: string; title: string; completed: boolean; entrepreneurship_id: string;
}

const SYSTEM_GROUP_DOT: Record<string, string> = {
  'prof-acad': 'bg-sky-500',
  desarrollo: 'bg-violet-500',
};

/** Orden de /plan-manana: 6 sistemas de desarrollo en 3 columnas × 2 filas. */
const DEVELOPMENT_SYSTEM_IDS = ['lectura', 'ajedrez', 'game', 'idiomas', 'musica', 'gym'] as const;
/** 4 sistemas de trabajo, uno de ellos Proyectos (sus tareas ya entran en la bandeja). */
const PROFESSIONAL_SYSTEM_IDS = ['universidad', 'emprendimiento', 'proyectos', 'tareas'] as const;

const SYSTEM_BY_ID = new Map(SPEED_PLAN_SYSTEMS.map(system => [system.id, system]));

const DEVELOPMENT_SYSTEMS = DEVELOPMENT_SYSTEM_IDS
  .map(id => SYSTEM_BY_ID.get(id))
  .filter((system): system is DaySystem => Boolean(system));

const PROFESSIONAL_SYSTEMS = PROFESSIONAL_SYSTEM_IDS
  .map(id => SYSTEM_BY_ID.get(id))
  .filter((system): system is DaySystem => Boolean(system));

const CREATE_AREA_OPTIONS = (() => {
  const base = flattenAreas(lifeAreas).map(area => ({ id: area.id, name: area.name }));
  const extra = [
    { id: 'musica', name: 'Música' },
    { id: 'game', name: 'Game' },
    { id: 'tareas', name: 'Tareas generales' },
  ].filter(candidate => !base.some(area => area.id === candidate.id));
  return [...base, ...extra];
})();

type TabMode = 'hoy' | 'manana';

function DateSwitchTabs({
  mode,
  today,
  disabled = false,
  onModeChange,
}: {
  mode: TabMode;
  today: Date;
  disabled?: boolean;
  onModeChange: (mode: TabMode) => void;
}) {
  const tomorrow = addDays(today, 1);
  const todayLabel = format(today, "d MMM", { locale: es });
  const tomorrowLabel = format(tomorrow, "d MMM", { locale: es });

  const tabClass = (active: boolean) => cn(
    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all sm:px-4 sm:py-2 disabled:cursor-not-allowed disabled:opacity-60",
    active
      ? "border border-border/60 bg-white text-foreground shadow-sm dark:bg-zinc-950"
      : "text-muted-foreground hover:text-foreground",
  );

  return (
    <div
      role="tablist"
      aria-label="Día a planificar"
      className="inline-flex shrink-0 self-stretch rounded-xl border border-border/40 bg-muted/80 p-0.5 shadow-sm sm:self-auto"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'hoy'}
        onClick={() => onModeChange('hoy')}
        disabled={disabled}
        className={tabClass(mode === 'hoy')}
      >
        <Sun className="h-3.5 w-3.5" />
        Hoy
        <span className="text-[10px] font-normal text-muted-foreground/70">{todayLabel}</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'manana'}
        onClick={() => onModeChange('manana')}
        disabled={disabled}
        className={tabClass(mode === 'manana')}
      >
        <Moon className="h-3.5 w-3.5" />
        Mañana
        <span className="text-[10px] font-normal text-muted-foreground/70">{tomorrowLabel}</span>
      </button>
    </div>
  );
}

function PlanStatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/70 px-2.5 py-2 shadow-sm">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-base font-bold leading-tight tabular-nums">{value}</p>
      {hint && <p className="truncate text-[9px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PlanContentSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="h-80 animate-pulse rounded-2xl bg-muted/60" />
        <div className="h-80 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    </div>
  );
}

export default function PlanManana() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<TabMode>(() => (searchParams.get('mode') === 'hoy' ? 'hoy' : 'manana'));

  // Fechas estables: antes se recreaban en cada render y provocaban recargas
  // de la jerarquía de metas y de los hooks por fecha.
  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);
  const targetDate = useMemo(() => (mode === 'hoy' ? today : tomorrow), [mode, today, tomorrow]);
  const targetStr = useMemo(() => format(targetDate, "yyyy-MM-dd"), [targetDate]);
  const targetDisplay = useMemo(
    () => format(targetDate, "EEEE d 'de' MMMM", { locale: es }),
    [targetDate],
  );
  const targetCapitalized = targetDisplay.charAt(0).toUpperCase() + targetDisplay.slice(1);
  const dayLabel = mode === 'hoy' ? 'Hoy' : 'Mañana';

  // --- TODOS LOS HOOKS SON INCONDICIONALES (antes de cualquier return) ---
  const {
    blocks,
    isLoaded: routineLoaded,
    routineType,
    setRoutineType,
    updateBlockFocus,
    routineInfo,
  } = useRoutineBlocks();
  const { plan: speedPlan, setPlan: setSpeedPlan, isLoaded: speedPlanLoaded } = useDaySpeedPlan(targetDate, {
    autoSave: false,
    routineType,
    blocks,
  });
  const { covers } = useAreaCovers();
  const { map: speedMap, getSpeed, setSpeed, loadedFromPlan: systemSpeedLoaded } = useSystemSpeed(targetDate);
  const { getTag: getActivityTag, setTag: setActivityTag } = useSystemActivityTags();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entreTasks, setEntreTasks] = useState<EntreTask[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  // `selectedTasks` = tareas elegidas que todavía no están en un bloque.
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [blockAssignments, setBlockAssignments] = useState<Record<string, string[]>>({});

  // Fecha cuyo plan se ha terminado de cargar (null = primera carga en curso).
  const [loadedPlanDate, setLoadedPlanDate] = useState<string | null>(null);
  const [planVersion, setPlanVersion] = useState(0);
  const planRequestRef = useRef(0);

  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [goalsVersion, setGoalsVersion] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAreaId, setNewAreaId] = useState<string>('');
  const [newTaskSystemId, setNewTaskSystemId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [saving, setSaving] = useState(false);
  const [prevPlanSnapshot, setPrevPlanSnapshot] = useState<{ selectedTasks: string[]; blockAssignments: Record<string, string[]> } | null>(null);
  const [languageChoice, setLanguageChoice] = useState<string>("ingles");
  const [musicInstrument, setMusicInstrument] = useState<string>("piano");

  const planLoading = loadedPlanDate !== targetStr || !speedPlanLoaded || !systemSpeedLoaded;
  const booting = !routineLoaded || !tasksLoaded || loadedPlanDate == null;

  // Contador de cambios: permite saber si hubo ediciones mientras se guardaba.
  const changeVersionRef = useRef(0);
  const markDirty = useCallback(() => {
    changeVersionRef.current += 1;
    setDirty(true);
  }, []);

  const applyDayGoal = useCallback((area: string, value: string) => {
    const mins = Math.max(0, parseInt(value, 10) || 0);
    setDayGoal(targetDate, area, mins);
    setGoalsVersion(version => version + 1);
    markDirty();
  }, [targetDate, markDirty]);

  const dayGoals = useMemo(() => {
    const result: Record<string, number> = {};
    ALL_HIERARCHY_AREAS.forEach(area => {
      result[area] = getDayGoalEffective(targetDate, area);
    });
    return result;
    // goalsVersion fuerza a releer las metas tras editarlas.
  }, [targetDate, goalsVersion]);

  const dayGoalSum = useMemo(
    () => ALL_HIERARCHY_AREAS.reduce((sum, area) => sum + (dayGoals[area] || 0), 0),
    [dayGoals],
  );

  /* ------------------------------------------------------------------ */
  /* Tareas normalizadas                                                 */
  /* ------------------------------------------------------------------ */

  const plannerTasks = useMemo(() => {
    const byId = new Map<string, PlannerTask>();
    const add = (task: PlannerTask) => {
      if (!byId.has(task.id)) byId.set(task.id, task);
    };

    tasks.forEach(task => {
      add({
        id: task.id,
        title: task.title,
        source: task.source || 'general',
        systemId: systemIdForTask({ source: task.source, areaId: task.area_id }),
        areaId: task.area_id,
        completed: task.completed,
        routineBlockId: task.routine_block_id,
      });
    });
    entreTasks.forEach(task => {
      add({
        id: task.id,
        title: task.title,
        source: 'entrepreneurship',
        systemId: 'emprendimiento',
        completed: task.completed,
      });
    });
    projects.forEach(project => {
      project.tasks.forEach(task => {
        add({
          id: task.id,
          title: task.title,
          source: 'project',
          systemId: 'proyectos',
          completed: task.completed,
        });
      });
    });

    return [...byId.values()];
  }, [tasks, entreTasks, projects]);

  const taskById = useMemo(() => new Map(plannerTasks.map(task => [task.id, task])), [plannerTasks]);

  const assignedIds = useMemo(
    () => new Set(Object.values(blockAssignments).flat()),
    [blockAssignments],
  );

  const planTaskIds = useMemo(() => {
    const ids = new Set<string>();
    selectedTasks.forEach(id => { if (taskById.has(id)) ids.add(id); });
    assignedIds.forEach(id => { if (taskById.has(id)) ids.add(id); });
    return ids;
  }, [selectedTasks, assignedIds, taskById]);

  const stagedCount = useMemo(
    () => [...selectedTasks].filter(id => !assignedIds.has(id) && taskById.has(id)).length,
    [selectedTasks, assignedIds, taskById],
  );

  const assignedPlannedCount = useMemo(
    () => [...assignedIds].filter(id => taskById.has(id)).length,
    [assignedIds, taskById],
  );

  const speedSummary = useMemo(
    () => summarizeSpeedPlan(speedPlan, blocks),
    [speedPlan, blocks],
  );

  /** Sistemas que tocan un bloque (entero o por fragmentos). */
  const blockSystems = useCallback((blockId: string, plan: SpeedPlan): string[] => {
    const entry = plan.blocks[blockId];
    if (entry?.kind === 'whole' && entry.systemId && entry.systemId !== 'none') {
      return [entry.systemId];
    }
    if (entry?.kind === 'fragments') {
      const ids = new Set<string>();
      entry.fragments.forEach(fragment => {
        if (fragment.systemId && fragment.systemId !== 'none') ids.add(fragment.systemId);
      });
      if (ids.size > 0) return [...ids];
    }
    const block = blocks.find(candidate => candidate.id === blockId);
    const auto = block ? autoSystemForBlock(block) : null;
    return auto ? [auto] : [];
  }, [blocks]);

  /** Sistema principal de un bloque (el primero que lo ocupa). */
  const blockSystem = useCallback(
    (blockId: string, plan: SpeedPlan = speedPlan): string | null =>
      blockSystems(blockId, plan)[0] ?? null,
    [blockSystems, speedPlan],
  );

  /** Sistema visible de un bloque: planificado o, en su defecto, el de sus tareas. */
  const displaySystemForBlock = useCallback((blockId: string): string | null => {
    const planned = blockSystem(blockId);
    if (planned) return planned;
    const ids = blockAssignments[blockId] ?? [];
    for (const id of ids) {
      const task = taskById.get(id);
      if (task) return task.systemId;
    }
    return null;
  }, [blockSystem, blockAssignments, taskById]);

  const systemTasks = useMemo(() => {
    const result: Record<string, PlannerTask[]> = {};
    for (const system of SPEED_PLAN_SYSTEMS) result[system.id] = [];

    for (const [blockId, ids] of Object.entries(blockAssignments)) {
      const systemId = displaySystemForBlock(blockId);
      if (!systemId || !result[systemId]) continue;
      for (const id of ids) {
        const task = taskById.get(id);
        if (task && !result[systemId].some(existing => existing.id === task.id)) {
          result[systemId].push(task);
        }
      }
    }
    return result;
  }, [blockAssignments, displaySystemForBlock, taskById]);

  const systemBlocks = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const system of SPEED_PLAN_SYSTEMS) result[system.id] = [];

    for (const [blockId, ids] of Object.entries(blockAssignments)) {
      if (ids.length === 0) continue;
      const block = blocks.find(candidate => candidate.id === blockId);
      if (!block) continue;
      const systemId = displaySystemForBlock(blockId);
      if (!systemId || !result[systemId]) continue;
      if (!result[systemId].includes(block.title)) result[systemId].push(block.title);
    }
    return result;
  }, [blockAssignments, displaySystemForBlock, blocks]);

  /** Tareas disponibles por sistema, calculadas una sola vez por render. */
  const availableBySystem = useMemo(() => {
    const result: Record<string, PlannerTask[]> = {};
    for (const system of SPEED_PLAN_SYSTEMS) result[system.id] = [];
    for (const task of plannerTasks) {
      if (assignedIds.has(task.id)) continue;
      if (!result[task.systemId]) result[task.systemId] = [];
      result[task.systemId].push(task);
    }
    return result;
  }, [plannerTasks, assignedIds]);

  const plannedTotal = useMemo(
    () => speedSummary.doses.reduce((sum, dose) => sum + dose.plannedMinutes, 0),
    [speedSummary],
  );

  const activeSystemsCount = useMemo(
    () => SPEED_PLAN_SYSTEMS.filter(
      system => (speedSummary.bySystem[system.id]?.plannedMinutes ?? 0) > 0,
    ).length,
    [speedSummary],
  );

  /* ------------------------------------------------------------------ */
  /* Asignación de tareas a Deep Work                                    */
  /* ------------------------------------------------------------------ */

  const handleRemoveTask = useCallback((taskId: string) => {
    setBlockAssignments(prev => {
      const next: Record<string, string[]> = {};
      for (const [blockId, taskIds] of Object.entries(prev)) {
        next[blockId] = taskIds.filter(id => id !== taskId);
      }
      return next;
    });
    setSelectedTasks(prev => { const n = new Set(prev); n.add(taskId); return n; });
    markDirty();
  }, [markDirty]);

  const handleRemoveFromPlan = useCallback((taskId: string) => {
    setBlockAssignments(prev => {
      const next: Record<string, string[]> = {};
      for (const [blockId, taskIds] of Object.entries(prev)) {
        next[blockId] = taskIds.filter(id => id !== taskId);
      }
      return next;
    });
    setSelectedTasks(prev => { const n = new Set(prev); n.delete(taskId); return n; });
    markDirty();
  }, [markDirty]);

  const toggleTask = useCallback((taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
    markDirty();
  }, [markDirty]);

  const clearSelection = useCallback(() => {
    setSelectedTasks(new Set());
    markDirty();
  }, [markDirty]);

  const assignTasks = useCallback((incoming: PlannerTask[], forcedSystemId?: string): boolean => {
    if (incoming.length === 0) return false;

    let nextPlan = speedPlan;
    const nextAssignments: Record<string, string[]> = { ...blockAssignments };
    const candidates = blocks.filter(block => isDeepWorkBlock(block) || isExtraBlock(block));
    const assignedNow: string[] = [];
    const failedTasks: PlannerTask[] = [];

    const resolveSystem = (blockId: string) => {
      const entry = nextPlan.blocks[blockId];
      if (entry?.kind === 'whole' && entry.systemId && entry.systemId !== 'none') return entry.systemId;
      if (entry?.kind === 'fragments') {
        const first = entry.fragments.find(fragment => fragment.systemId && fragment.systemId !== 'none');
        if (first) return first.systemId;
      }
      const block = blocks.find(candidate => candidate.id === blockId);
      return block ? autoSystemForBlock(block) : null;
    };

    for (const task of incoming) {
      const systemId = forcedSystemId ?? task.systemId;
      const system = SPEED_PLAN_SYSTEMS.find(candidate => candidate.id === systemId);
      const selectedSpeed = (speedMap[systemId] ?? 'maximo') as SystemSpeed;
      const speedMinutes = system
        ? systemSpeedOptions(system).find(option => option.id === selectedSpeed)?.minutes ?? 0
        : 0;

      // 0) Un bloque natural del sistema (Lectura, Idiomas, Música...).
      let target = blocks.find(block =>
        !isDeepWorkBlock(block) &&
        !isExtraBlock(block) &&
        autoSystemForBlock(block) === systemId &&
        (!nextPlan.blocks[block.id] || resolveSystem(block.id) === systemId)
      );

      // 1) Un Deep Work que ya esté dedicado a este sistema.
      if (!target) {
        target = candidates.find(block => resolveSystem(block.id) === systemId);
      }

      // 2) Un Deep Work libre (sin tareas ni otro sistema); se prefiere uno
      //    que quepa en la velocidad elegida.
      if (!target) {
        const free = candidates.filter(
          block => !(nextAssignments[block.id]?.length) && resolveSystem(block.id) == null,
        );
        target = free.find(block => blockDurationMinutes(block) >= speedMinutes) ?? free[0];
      }

      if (!target) {
        failedTasks.push(task);
        continue;
      }

      if (resolveSystem(target.id) !== systemId) {
        nextPlan = setWholeBlock(nextPlan, target.id, systemId);
      }
      nextAssignments[target.id] = [...(nextAssignments[target.id] || []), task.id];
      assignedNow.push(task.id);
    }

    if (assignedNow.length > 0) {
      setBlockAssignments(nextAssignments);
      setSpeedPlan(nextPlan);
      setSelectedTasks(prev => {
        const next = new Set(prev);
        assignedNow.forEach(id => next.delete(id));
        return next;
      });
      markDirty();
      toast.success(
        assignedNow.length === 1
          ? 'Tarea colocada en un bloque'
          : `${assignedNow.length} tareas colocadas en bloques`,
      );
    }

    if (failedTasks.length > 0) {
      // Si no hay bloque libre, la tarea no desaparece: queda seleccionada en
      // la bandeja para colocarla a mano.
      setSelectedTasks(prev => {
        const next = new Set(prev);
        failedTasks.forEach(task => next.add(task.id));
        return next;
      });
      markDirty();
      const preview = failedTasks.slice(0, 2).map(task => task.title).join(', ');
      toast.error(
        `No hay bloque libre para: ${preview}${failedTasks.length > 2 ? ` +${failedTasks.length - 2}` : ''}. La dejamos en la bandeja.`,
      );
    }

    return assignedNow.length > 0;
  }, [speedPlan, blockAssignments, blocks, speedMap, setSpeedPlan, markDirty]);

  const assignSelectedTasks = useCallback(() => {
    const pending = plannerTasks.filter(
      task => selectedTasks.has(task.id) && !assignedIds.has(task.id),
    );
    assignTasks(pending);
  }, [plannerTasks, selectedTasks, assignedIds, assignTasks]);

  /** Suelta una tarea en un bloque concreto de la línea de tiempo. */
  const handleDropTask = useCallback((taskId: string, blockId: string) => {
    const task = taskById.get(taskId);
    if (!task) return;
    const block = blocks.find(candidate => candidate.id === blockId);
    if (!block) return;
    const targetSystem = blockSystem(blockId) ?? task.systemId;

    // Solo los bloques de trabajo (Deep Work, extra o con sistema natural)
    // reciben un plan de velocidad; así no se inflan minutos de Gym u ocio.
    const planable = isDeepWorkBlock(block) || isExtraBlock(block) || autoSystemForBlock(block) != null;
    if (planable) {
      setSpeedPlan(prev => {
        if (prev.blocks[blockId]) return prev;
        const auto = autoSystemForBlock(block);
        if (auto === targetSystem) return prev;
        return setWholeBlock(prev, blockId, targetSystem);
      });
    }

    setBlockAssignments(prev => {
      const next: Record<string, string[]> = {};
      for (const [id, ids] of Object.entries(prev)) {
        next[id] = ids.filter(value => value !== taskId);
      }
      next[blockId] = [...(next[blockId] || []), taskId];
      return next;
    });
    setSelectedTasks(prev => { const n = new Set(prev); n.delete(taskId); return n; });
    markDirty();
  }, [taskById, blocks, blockSystem, setSpeedPlan, markDirty]);

  const handlePoolDragStart = (event: React.DragEvent, taskId: string) => {
    event.dataTransfer.setData('text/plain', taskId);
    event.dataTransfer.effectAllowed = 'move';
  };

  /* ------------------------------------------------------------------ */
  /* Carga de tareas y del plan                                          */
  /* ------------------------------------------------------------------ */

  // Las tareas se cargan una sola vez; cambiar Hoy/Mañana ya no vuelve a
  // descargar toda la bandeja ni muestra el esqueleto de página completa.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [tasksRes, entreRes] = await Promise.all([
          supabase.from("tasks").select("id, title, source, area_id, completed, routine_block_id").eq("completed", false),
          supabase.from("entrepreneurship_tasks").select("id, title, completed, entrepreneurship_id").eq("completed", false),
        ]);
        if (cancelled) return;
        let failed = false;
        if (tasksRes.error) {
          failed = true;
        } else if (tasksRes.data) {
          setTasks(tasksRes.data as TaskItem[]);
        }
        if (entreRes.error) {
          failed = true;
        } else if (entreRes.data) {
          setEntreTasks(entreRes.data as EntreTask[]);
        }
        if (failed) toast.error("Algunas tareas no se pudieron cargar");
      } catch {
        if (!cancelled) toast.error("Error al cargar las tareas");
      }

      try {
        const { data, error } = await supabase.from('projects').select('id, title, tasks');
        if (cancelled) return;
        if (!error && data && data.length > 0) {
          const rows = data as unknown as ProjectRow[];
          setProjects(rows.map(project => ({
            id: project.id,
            name: project.title,
            tasks: (project.tasks ?? []).filter(task => !task.completed),
          })));
        }
      } catch {
        // Los proyectos son opcionales para planificar.
      }

      if (!cancelled) setTasksLoaded(true);
    })();

    return () => { cancelled = true; };
  }, []);

  // El plan se recarga por fecha (Hoy / Mañana), con cancelación para evitar
  // que una respuesta antigua pise el plan del día visible.
  useEffect(() => {
    const requestId = ++planRequestRef.current;
    let cancelled = false;

    const storedLanguage =
      localStorage.getItem(`planLanguage_${targetStr}`) ||
      localStorage.getItem('planManana_language') ||
      'ingles';
    const storedInstrument =
      localStorage.getItem(`planInstrument_${targetStr}`) ||
      localStorage.getItem('planManana_instrument') ||
      'piano';
    const defaultLanguage = storedLanguage === 'italiano' ? 'italiano' : 'ingles';
    const defaultInstrument = storedInstrument === 'guitarra' ? 'guitarra' : 'piano';

    const applyEmptyPlan = () => {
      setBlockAssignments({});
      setSelectedTasks(new Set());
      setPrevPlanSnapshot(null);
      setLanguageChoice(defaultLanguage);
      setMusicInstrument(defaultInstrument);
    };

    (async () => {
      try {
        const plan = await loadDailyPlan(targetStr);
        if (cancelled || planRequestRef.current !== requestId) return;

        // La rutina y las preferencias se cargan aunque el plan no tenga
        // bloques guardados: así no se pierden al reeditar un día.
        let language = defaultLanguage;
        let instrument = defaultInstrument;
        if (plan) {
          const validTypes: RoutineType[] = ['disciplina', 'normal', 'descanso'];
          if (plan.routine_type && validTypes.includes(plan.routine_type as RoutineType)) {
            setRoutineType(plan.routine_type as RoutineType);
          }
          if (plan.notes) {
            try {
              const parsed = JSON.parse(plan.notes as string);
              if (parsed?.language === 'ingles' || parsed?.language === 'italiano') {
                language = parsed.language;
              }
              if (parsed?.instrument === 'piano' || parsed?.instrument === 'guitarra') {
                instrument = parsed.instrument;
              }
            } catch {
              // Notas antiguas que no son JSON: se mantienen los valores por defecto.
            }
          }
        }
        setLanguageChoice(language);
        setMusicInstrument(instrument);

        const rawAssignments = plan?.block_assignments;
        if (rawAssignments != null) {
          const assignments: Record<string, string[]> = {};
          const allTaskIds: string[] = [];
          for (const [blockId, ids] of Object.entries(rawAssignments)) {
            if (!Array.isArray(ids)) continue;
            const cleanIds = ids.filter((id): id is string => typeof id === 'string');
            allTaskIds.push(...cleanIds);
            if (blockId !== '_unassigned') assignments[blockId] = cleanIds;
          }

          const assigned = new Set(Object.values(assignments).flat());
          const uniqueTaskIds = [...new Set(allTaskIds)];
          setBlockAssignments(assignments);
          setSelectedTasks(new Set(uniqueTaskIds.filter(id => !assigned.has(id))));
          setPrevPlanSnapshot({ selectedTasks: uniqueTaskIds, blockAssignments: assignments });
        } else {
          setBlockAssignments({});
          setSelectedTasks(new Set());
          setPrevPlanSnapshot(null);
        }
      } catch {
        if (cancelled || planRequestRef.current !== requestId) return;
        applyEmptyPlan();
      } finally {
        if (!cancelled && planRequestRef.current === requestId) {
          setLoadedPlanDate(targetStr);
          setDirty(false);
          setPlanVersion(version => version + 1);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [targetStr, setRoutineType]);

  // Al cambiar de rutina, los bloques de la anterior desaparecen. Se limpian
  // las asignaciones huérfanas para que no queden tareas invisibles en el plan.
  const assignmentsRef = useRef(blockAssignments);
  assignmentsRef.current = blockAssignments;

  useEffect(() => {
    const validBlocks = new Set(blocks.map(block => block.id));
    const current = assignmentsRef.current;
    const next: Record<string, string[]> = {};
    let removed = false;

    for (const [blockId, ids] of Object.entries(current)) {
      if (validBlocks.has(blockId)) next[blockId] = ids;
      else removed = true;
    }

    if (!removed) return;
    setBlockAssignments(next);
    setPrevPlanSnapshot(prev => (prev ? { ...prev, blockAssignments: next } : prev));
    markDirty();
  }, [blocks, planVersion, markDirty]);

  // Aviso al cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const resetCreateForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewDueDate('');
    setNewAreaId('');
    setNewTaskSystemId(null);
  };

  const openCreateForSystem = (systemId: string) => {
    resetCreateForm();
    setNewTaskSystemId(systemId);
    setNewAreaId(systemId);
    setIsCreateOpen(true);
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { data: created, error } = await supabase.from('tasks').insert({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        priority: newPriority,
        due_date: newDueDate || null,
        area_id: newAreaId || null,
        completed: false,
        source: 'general',
        status: 'pendiente',
      }).select('id, title, source, area_id, completed, routine_block_id').single();
      if (error) throw error;

      if (created) {
        const task = created as TaskItem;
        setTasks(prev => prev.some(existing => existing.id === task.id) ? prev : [...prev, task]);
        const plannerTask: PlannerTask = {
          id: task.id,
          title: task.title,
          source: task.source || 'general',
          systemId: systemIdForTask({ source: task.source, areaId: task.area_id }),
          areaId: task.area_id,
          completed: false,
          routineBlockId: task.routine_block_id,
        };
        if (newTaskSystemId) {
          assignTasks([plannerTask], newTaskSystemId);
        } else {
          setSelectedTasks(prev => new Set(prev).add(task.id));
          markDirty();
        }
      }

      toast.success('Tarea creada');
      setIsCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear tarea';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleQuickCreateTask = useCallback(async (title: string, systemId?: string) => {
    const trimmed = title.trim();
    if (!trimmed) return false;

    try {
      const { data: created, error } = await supabase.from('tasks').insert({
        title: trimmed,
        description: null,
        priority: 'medium',
        due_date: null,
        area_id: systemId || null,
        completed: false,
        source: 'general',
        status: 'pendiente',
      }).select('id, title, source, area_id, completed, routine_block_id').single();
      if (error) throw error;
      if (!created) return false;

      const task = created as TaskItem;
      setTasks(prev => (prev.some(existing => existing.id === task.id) ? prev : [...prev, task]));
      setSelectedTasks(prev => new Set(prev).add(task.id));
      markDirty();
      toast.success(`Tarea añadida a ${mode === 'hoy' ? 'Hoy' : 'Mañana'}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear tarea';
      toast.error(message);
      return false;
    }
  }, [markDirty, mode]);

  const syncTaskDueDates = async (taskIds: string[], dateStr: string | null) => {
    if (taskIds.length === 0) return;
    const entreTaskIds = new Set(entreTasks.map(task => task.id));
    const entreIds = taskIds.filter(id => entreTaskIds.has(id));
    const regularIds = taskIds.filter(id => !entreTaskIds.has(id));
    const ops: Promise<unknown>[] = [];
    if (entreIds.length > 0) {
      ops.push(Promise.resolve(supabase.from('entrepreneurship_tasks').update({ due_date: dateStr }).in('id', entreIds)));
    }
    if (regularIds.length > 0) {
      ops.push(Promise.resolve(supabase.from('tasks').update({ due_date: dateStr }).in('id', regularIds)));
    }
    await Promise.all(ops);
  };

  const savePlan = async () => {
    if (saving || planLoading) return;
    const versionAtStart = changeVersionRef.current;
    setSaving(true);
    try {
      const assignments = { ...blockAssignments };
      const assignedIdsInPlan = new Set(Object.values(assignments).flat());
      const unassignedInPlan = [...selectedTasks].filter(id => !assignedIdsInPlan.has(id));
      if (unassignedInPlan.length > 0) {
        assignments["_unassigned"] = unassignedInPlan;
      }

      // Unión: tareas seleccionadas + tareas ya colocadas en bloques.
      const planTaskIds = new Set<string>([...selectedTasks, ...assignedIdsInPlan]);
      const prevIds = prevPlanSnapshot?.selectedTasks || [];
      const previouslyPlannedIds = new Set(prevIds);
      const toAdd = [...planTaskIds].filter(id => !previouslyPlannedIds.has(id));
      const toRemove = prevIds.filter(id => !planTaskIds.has(id));
      await syncTaskDueDates(toAdd, targetStr);
      await syncTaskDueDates(toRemove, null);

      // Se releen las metas al guardar para no depender de un render previo.
      const goalsForSave: Record<string, number> = {};
      ALL_HIERARCHY_AREAS.forEach(area => {
        goalsForSave[area] = getDayGoalEffective(targetDate, area);
      });

      // Guardar el plan de velocidad, la velocidad por sistema y su espejo de intensidad.
      const systemIntensity = deriveSystemIntensity(speedPlan, blocks);
      const notesJSON = JSON.stringify({
        systemIntensity,
        planIntensity: systemIntensity,
        systemSpeed: speedMap,
        speedPlan,
        language: languageChoice,
        instrument: musicInstrument,
        dayGoals: goalsForSave,
      });

      const persistedIn = await saveDailyPlan({
        plan_date: targetStr,
        mode: legacyModeForRoutine(routineType),
        routine_type: routineType,
        block_assignments: JSON.parse(JSON.stringify(assignments)),
        notes: notesJSON,
      });
      if (persistedIn === "app_settings") {
        console.warn("El plan se guardó en app_settings porque daily_plans rechazó la escritura por RLS.");
      }

      const goalRows: { area_id: string; stat_date: string; time_goal_minutes: number }[] = ALL_HIERARCHY_AREAS
        .filter(area => (goalsForSave[area] || 0) > 0)
        .map(area => ({
          area_id: area,
          stat_date: targetStr,
          time_goal_minutes: goalsForSave[area] || 0,
        }));
      if (goalRows.length > 0) {
        const { error } = await supabase.from("daily_area_stats").upsert(goalRows, { onConflict: "area_id,stat_date" });
        if (error) throw error;
      }

      localStorage.setItem(`planTasks_${targetStr}`, JSON.stringify({
        selectedTasks: [...planTaskIds],
        blockAssignments: assignments,
        routineType,
      }));
      localStorage.setItem(`planIntensity_${targetStr}`, JSON.stringify(systemIntensity));
      localStorage.setItem(`planLanguage_${targetStr}`, languageChoice);
      localStorage.setItem(`planInstrument_${targetStr}`, musicInstrument);

      setPrevPlanSnapshot({ selectedTasks: [...planTaskIds], blockAssignments: { ...assignments } });
      setLastSavedAt(Date.now());

      if (changeVersionRef.current === versionAtStart) {
        setDirty(false);
        toast.success(mode === 'hoy' ? "Plan para hoy guardado" : "Plan para mañana guardado");
      } else {
        // Hubo cambios mientras se guardaba: se conserva el aviso para no
        // dar por guardado algo que no entró en esta escritura.
        setDirty(true);
        toast.success('Plan guardado. Quedan cambios nuevos sin guardar.');
      }
    } catch (error) {
      console.error("Error al guardar el plan:", error);
      const detail = error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "";
      toast.error(detail ? `Error al guardar: ${detail}` : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Datos derivados para la línea de tiempo                             */
  /* ------------------------------------------------------------------ */

  const tasksByBlockForPlanner = useMemo(() => {
    const result: Record<string, { id: string; title: string; source: string; completed: boolean }[]> = {};
    for (const [blockId, taskIds] of Object.entries(blockAssignments)) {
      result[blockId] = taskIds.flatMap(id => {
        const task = taskById.get(id);
        return task ? [{ id: task.id, title: task.title, source: task.source, completed: task.completed }] : [];
      });
    }
    return result;
  }, [blockAssignments, taskById]);

  const systemCover = useCallback((systemId: string) => {
    const meta = SPEED_PLAN_SYSTEMS.find(system => system.id === systemId);
    if (!meta) return null;
    return covers[coverKey('sub', meta.cover.id)]
      ?? covers[coverKey('area', meta.cover.id)]
      ?? covers[coverKey('sub', systemId)]
      ?? null;
  }, [covers]);

  const handleSystemSpeedChange = useCallback((systemId: string, speed: SystemSpeed) => {
    setSpeed(systemId, speed);
    markDirty();
  }, [setSpeed, markDirty]);

  const handleSpeedPlanChange = useCallback((next: SpeedPlan) => {
    setSpeedPlan(next);
    markDirty();
  }, [setSpeedPlan, markDirty]);

  const handleUpdateFocus = useCallback((blockId: string, focus: string) => {
    updateBlockFocus(blockId, focus);
    markDirty();
  }, [updateBlockFocus, markDirty]);

  const handleRoutineChange = useCallback((nextRoutine: RoutineType) => {
    if (nextRoutine === routineType) return;
    const hasAssignments = Object.values(blockAssignments).some(ids => ids.length > 0);
    if (hasAssignments && !window.confirm(
      'Al cambiar de rutina se quitarán las tareas colocadas en bloques que ya no existen. ¿Continuar?',
    )) {
      return;
    }
    setRoutineType(nextRoutine);
    markDirty();
  }, [routineType, blockAssignments, setRoutineType, markDirty]);

  const handleLanguageChange = useCallback((value: 'ingles' | 'italiano') => {
    setLanguageChoice(value);
    markDirty();
  }, [markDirty]);

  const handleMusicInstrumentChange = useCallback((value: 'piano' | 'guitarra') => {
    setMusicInstrument(value);
    markDirty();
  }, [markDirty]);

  // Cambiar de día con cambios sin guardar pide confirmación y actualiza la URL.
  const requestModeChange = useCallback((nextMode: TabMode) => {
    if (nextMode === mode || saving) return;
    if (dirty && !window.confirm(
      `Tienes cambios sin guardar en ${dayLabel.toLowerCase()}. ¿Descartarlos y cambiar de día?`,
    )) {
      return;
    }
    setMode(nextMode);
    setDirty(false);
    setLastSavedAt(null);
    setSearchParams(previous => {
      const params = new URLSearchParams(previous);
      params.set('mode', nextMode);
      return params;
    }, { replace: true });
  }, [mode, dirty, saving, dayLabel, setSearchParams]);

  const renderSystemCard = (system: DaySystem) => (
    <PlanSystemCard
      key={system.id}
      system={system}
      cover={systemCover(system.id)}
      emoji={planSystemEmoji(system.id)}
      speed={getSpeed(system.id)}
      onSpeedChange={speed => handleSystemSpeedChange(system.id, speed)}
      activityTag={getActivityTag(system.id)}
      onActivityTagChange={tag => setActivityTag(system.id, tag)}
      plannedMinutes={speedSummary.bySystem[system.id]?.plannedMinutes ?? 0}
      tasks={systemTasks[system.id] ?? []}
      blocks={systemBlocks[system.id] ?? []}
      availableTasks={availableBySystem[system.id] ?? []}
      onAddTask={task => assignTasks([task], system.id)}
      onCreateTask={() => openCreateForSystem(system.id)}
      onRemoveTask={handleRemoveTask}
    />
  );

  if (booting) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24 pt-20">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-32 animate-pulse rounded-2xl bg-muted/60" />
          <div className="h-20 animate-pulse rounded-2xl bg-muted/60" />
          <PlanContentSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-28 pt-20">
      <div className="mx-auto max-w-6xl space-y-5">

        {/* Cabecera: título, día, acciones y resumen */}
        <section className="overflow-hidden rounded-2xl border border-border/50 bg-white/80 shadow-sm dark:bg-zinc-950/80">
          <div className="h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500" />
          <div className="space-y-3.5 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Planificación del día
                </p>
                <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                  {mode === 'hoy'
                    ? <Sun className="h-5 w-5 shrink-0 text-amber-500" />
                    : <Moon className="h-5 w-5 shrink-0 text-indigo-500" />}
                  {mode === 'hoy' ? 'Planificar Hoy' : 'Planificar Mañana'}
                </h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {targetCapitalized}
                  </span>
                  <span aria-hidden className="text-border">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden>{routineInfo.icon}</span>
                    Rutina {routineInfo.label}
                  </span>
                  <span
                    aria-live="polite"
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      saving
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : dirty
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : lastSavedAt
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {saving ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Guardando…</>
                    ) : dirty ? (
                      <><CircleDot className="h-3 w-3" /> Cambios sin guardar</>
                    ) : lastSavedAt ? (
                      <><CheckCircle2 className="h-3 w-3" /> Guardado {format(new Date(lastSavedAt), 'HH:mm')}</>
                    ) : (
                      <><CheckCircle2 className="h-3 w-3" /> Sin cambios pendientes</>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                <DateSwitchTabs mode={mode} today={today} disabled={saving} onModeChange={requestModeChange} />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex-1 gap-1.5 rounded-full sm:flex-none"
                    onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}
                    disabled={planLoading}
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Nueva
                  </Button>
                  <Button
                    onClick={() => void savePlan()}
                    disabled={saving || planLoading}
                    size="sm"
                    className="h-8 flex-1 gap-1.5 rounded-full sm:flex-none"
                  >
                    {saving
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : !dirty && lastSavedAt
                        ? <CheckCircle2 className="h-3.5 w-3.5" />
                        : <Save className="h-3.5 w-3.5" />}
                    {saving ? 'Guardando…' : !dirty && lastSavedAt ? 'Guardado' : 'Guardar plan'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <PlanStatTile label="En el plan" value={planTaskIds.size} hint="tareas del día" />
              <PlanStatTile label="En bloques" value={assignedPlannedCount} hint={`${stagedCount} en bandeja`} />
              <PlanStatTile label="Minutos" value={`${plannedTotal}′`} hint="planificados" />
              <PlanStatTile label="Sistemas" value={`${activeSystemsCount}/${SPEED_PLAN_SYSTEMS.length}`} hint="con minutos" />
            </div>
          </div>
        </section>

        {/* Rutina base */}
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 shadow-sm dark:bg-zinc-950/80">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-400" />
          <CardContent className="space-y-2 p-3.5">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-medium text-muted-foreground">Rutina base</span>
              <Badge variant="secondary" className="ml-auto text-[9px] tabular-nums">
                {blocks.length} bloques · {routineInfo.wakeTime}–{routineInfo.sleepTime}
              </Badge>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="Rutina base">
              {ROUTINES.map(r => (
                <button
                  key={r.type}
                  type="button"
                  onClick={() => handleRoutineChange(r.type)}
                  aria-pressed={routineType === r.type}
                  disabled={planLoading || saving}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition-all disabled:opacity-50",
                    routineType === r.type
                      ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                      : "border-border/60 bg-white/50 text-muted-foreground hover:border-indigo-300 hover:text-foreground dark:bg-zinc-950/50"
                  )}
                >
                  <span className="text-sm">{r.icon}</span>
                  <span>{r.label}</span>
                  <span className="text-[9px] opacity-60">{r.wakeTime}-{r.sleepTime}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {planLoading ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cargando el plan de {dayLabel.toLowerCase()}…
            </div>
            <PlanContentSkeleton />
          </div>
        ) : (
          <>
            {/* Sistemas del día */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="h-4 w-4 text-sky-500" /> Sistemas del día
                </h2>
                <Badge variant="secondary" className="text-[9px] tabular-nums">
                  {plannedTotal} min planificados
                </Badge>
                <Badge variant="outline" className="text-[9px] tabular-nums">
                  {activeSystemsCount} con minutos
                </Badge>
              </div>
              <p className="-mt-1 text-[10px] text-muted-foreground">
                Elige la velocidad de cada sistema y añade sus tareas: cada tarjeta las coloca en un bloque de tiempo.
                Marca cada tarjeta como <span className="font-semibold text-amber-600 dark:text-amber-400">⚡ Activo</span> o{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">🌙 Pasivo</span> y la etiqueta aparecerá sobre su portada.
              </p>

              {/* Profesional / Académico: 4 tarjetas */}
              <div className="rounded-2xl border-2 border-sky-200/70 bg-sky-50/40 p-3 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/20">
                <div className="mb-2 flex items-center gap-2 px-0.5">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', SYSTEM_GROUP_DOT['prof-acad'])} />
                  <Briefcase className="h-3.5 w-3.5 text-sky-500" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Profesional / Académico</h3>
                  <span className="h-px flex-1 bg-sky-200/70 dark:bg-sky-900/60" />
                  <Badge variant="secondary" className="text-[8px] tabular-nums">
                    {PROFESSIONAL_SYSTEMS.length} sistemas
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                  {PROFESSIONAL_SYSTEMS.map(renderSystemCard)}
                </div>
              </div>

              {/* Desarrollo Personal: 3 columnas × 2 filas en escritorio */}
              <div className="rounded-2xl border-2 border-violet-200/70 bg-violet-50/40 p-3 shadow-sm dark:border-violet-900/50 dark:bg-violet-950/20">
                <div className="mb-2 flex items-center gap-2 px-0.5">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', SYSTEM_GROUP_DOT.desarrollo)} />
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Desarrollo Personal</h3>
                  <span className="h-px flex-1 bg-violet-200/70 dark:bg-violet-900/60" />
                  <Badge variant="secondary" className="text-[8px] tabular-nums">
                    3 × 2 en escritorio
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {DEVELOPMENT_SYSTEMS.map(renderSystemCard)}
                </div>
              </div>
            </section>

            {/* Bandeja + bloques de tiempo */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="space-y-4">
                <TaskInboxCard
                  tasks={plannerTasks}
                  assignedIds={assignedIds}
                  selectedIds={selectedTasks}
                  onToggleSelect={toggleTask}
                  onAssign={task => assignTasks([task])}
                  onAssignSelected={assignSelectedTasks}
                  onRemove={handleRemoveFromPlan}
                  onDragStart={handlePoolDragStart}
                  onCreateTask={handleQuickCreateTask}
                  dayMode={mode}
                  onClearSelection={clearSelection}
                />

                <FocusLockCard
                  onComplete={systemId =>
                    toast.success(
                      systemId
                        ? `Enfoque completado: ${planSystemName(systemId)}`
                        : 'Bloqueo de enfoque completado',
                    )
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-indigo-200/70 bg-indigo-50/30 p-2.5 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20">
                  <div className="mb-2 flex items-center gap-2 px-0.5">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Bloques de tiempo</h2>
                    <span className="h-px flex-1 bg-indigo-200/70 dark:bg-indigo-900/60" />
                    <Badge variant="secondary" className="text-[8px] tabular-nums">
                      {blocks.length} bloques
                    </Badge>
                  </div>
                  <DailyTimelinePlanner
                    blocks={blocks}
                    tasksByBlock={tasksByBlockForPlanner}
                    onToggleBlock={() => {}}
                    isBlockCompleted={() => false}
                    onDropTask={handleDropTask}
                    onRemoveTask={handleRemoveTask}
                    onUpdateFocus={handleUpdateFocus}
                    musicInstrument={musicInstrument === "piano" ? "piano" : "guitar"}
                    languageChoice={languageChoice as "ingles" | "italiano"}
                    isFutureView={mode !== 'hoy'}
                    speedPlan={speedPlan}
                    onSpeedPlanChange={handleSpeedPlanChange}
                    hideHeader
                  />
                </div>

                <DaySettingsCard
                  dayGoals={dayGoals}
                  dayGoalSum={dayGoalSum}
                  onGoalChange={applyDayGoal}
                  languageChoice={languageChoice}
                  onLanguageChange={handleLanguageChange}
                  musicInstrument={musicInstrument}
                  onMusicInstrumentChange={handleMusicInstrumentChange}
                />
              </div>
            </div>

            {/* Velocidad calculada desde bloques y fragmentos */}
            <DaySpeedSection speedPlan={speedPlan} blocks={blocks} collapsible defaultOpen={false} />
          </>
        )}

      </div>

      {/* Barra de guardado móvil */}
      {dirty && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <CircleDot className="h-3 w-3" /> Cambios sin guardar
              </p>
              <p className="truncate text-[9px] text-muted-foreground">
                Guarda para conservar el plan de {dayLabel.toLowerCase()}.
              </p>
            </div>
            <Button
              size="sm"
              className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs"
              onClick={() => void savePlan()}
              disabled={saving || planLoading}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      )}

      {/* Crear tarea */}
      <Dialog open={isCreateOpen} onOpenChange={open => { setIsCreateOpen(open); if (!open) resetCreateForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>
              {newTaskSystemId
                ? `Se añadirá a ${planSystemName(newTaskSystemId)} y se colocará en un Deep Work.`
                : mode === 'hoy' ? 'Crea una tarea para planificar hoy.' : 'Crea una tarea para planificar mañana.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Título</Label>
              <Input value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder="¿Qué necesitas hacer?" onKeyDown={event => event.key === 'Enter' && handleCreateTask()} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Descripción</Label>
              <Textarea value={newDescription} onChange={event => setNewDescription(event.target.value)} placeholder="Detalles adicionales..." className="mt-1 resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Prioridad</Label>
                <Select value={newPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewPriority(value)}>
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
                <Input type="date" value={newDueDate} onChange={event => setNewDueDate(event.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Área / Sistema</Label>
              <Select value={newAreaId} onValueChange={setNewAreaId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {CREATE_AREA_OPTIONS.map(area => (
                    <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTask} disabled={creating || !newTitle.trim()} className="w-full">
                {creating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Crear Tarea
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
