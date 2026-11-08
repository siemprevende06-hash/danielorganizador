import { useState, useEffect, useMemo, useCallback } from "react";
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
import { MinutesGoalInput } from "@/components/hierarchy/MinutesGoalInput";
import {
  setDayGoal,
  getDayGoalEffective,
  getDayGoalSum,
  ALL_HIERARCHY_AREAS,
  AREA_LABELS,
} from "@/lib/hierarchy";
import {
  Sun, Moon, Clock, Target, Languages, Save, PlusCircle, Loader2, Layers,
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
import { useAreaCovers, coverKey } from "@/hooks/useAreaCovers";
import { PlanSystemCard } from "@/components/planificacion/PlanSystemCard";
import { TaskInboxCard } from "@/components/planificacion/TaskInboxCard";
import { FocusLockCard } from "@/components/planificacion/FocusLockCard";

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

const SYSTEM_GROUP_DOT: Record<string, string> = {
  'prof-acad': 'bg-sky-500',
  desarrollo: 'bg-violet-500',
};

/** Orden específico de /plan-manana: dos columnas de 3, de arriba hacia abajo. */
const DEVELOPMENT_SYSTEM_IDS = ['lectura', 'ajedrez', 'game', 'idiomas', 'musica', 'gym'] as const;
const PROFESSIONAL_SYSTEM_IDS = ['universidad', 'emprendimiento', 'tareas'] as const;

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

function DateSwitchTabs({ mode, onModeChange }: { mode: TabMode; onModeChange: (m: TabMode) => void }) {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const todayLabel = format(today, "d MMM", { locale: es });
  const tomorrowLabel = format(tomorrow, "d MMM", { locale: es });
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex rounded-xl border border-border/40 bg-muted/80 p-0.5 shadow-sm">
        <button
          onClick={() => onModeChange('hoy')}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            mode === 'hoy'
              ? "border border-border/60 bg-white text-foreground shadow-sm dark:bg-zinc-950"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sun className="h-3.5 w-3.5" />
          Hoy
          <span className="text-[10px] font-normal text-muted-foreground/70">{todayLabel}</span>
        </button>
        <button
          onClick={() => onModeChange('manana')}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            mode === 'manana'
              ? "border border-border/60 bg-white text-foreground shadow-sm dark:bg-zinc-950"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Moon className="h-3.5 w-3.5" />
          Mañana
          <span className="text-[10px] font-normal text-muted-foreground/70">{tomorrowLabel}</span>
        </button>
      </div>
    </div>
  );
}

export default function PlanManana() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<TabMode>(() => (searchParams.get('mode') === 'hoy' ? 'hoy' : 'manana'));

  // --- TODOS LOS HOOKS SON INCONDICIONALES (antes de cualquier return) ---
  const targetDate = mode === 'hoy' ? new Date() : addDays(new Date(), 1);
  const targetStr = format(targetDate, "yyyy-MM-dd");
  const targetDisplay = format(targetDate, "EEEE d 'de' MMMM", { locale: es });
  const targetCapitalized = targetDisplay.charAt(0).toUpperCase() + targetDisplay.slice(1);

  const { blocks, isLoaded: routineLoaded, routineType, setRoutineType, updateBlockFocus } = useRoutineBlocks();
  const { plan: speedPlan, setPlan: setSpeedPlan, isLoaded: speedPlanLoaded } = useDaySpeedPlan(targetDate, {
    autoSave: false,
    routineType,
    blocks,
  });
  const { covers } = useAreaCovers();
  const { map: speedMap, getSpeed, setSpeed, loadedFromPlan: systemSpeedLoaded } = useSystemSpeed(targetDate);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entreTasks, setEntreTasks] = useState<EntreTask[]>([]);
  const [uniTasks, setUniTasks] = useState<UniTask[]>([]);
  const [loading, setLoading] = useState(true);

  // `selectedTasks` = tareas elegidas que todavía no están en un bloque.
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [blockAssignments, setBlockAssignments] = useState<Record<string, string[]>>({});

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

  const [, forceGoalsUpdate] = useState(0);

  const applyDayGoal = (area: string, value: string) => {
    const mins = Math.max(0, parseInt(value) || 0);
    setDayGoal(targetDate, area, mins);
    forceGoalsUpdate(v => v + 1);
  };

  const dayGoalSum = getDayGoalSum(targetDate);

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
    uniTasks.forEach(task => {
      add({
        id: task.id,
        title: task.title,
        source: 'university',
        systemId: 'universidad',
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
  }, [tasks, entreTasks, uniTasks, projects]);

  const taskById = useMemo(() => new Map(plannerTasks.map(task => [task.id, task])), [plannerTasks]);

  const assignedIds = useMemo(
    () => new Set(Object.values(blockAssignments).flat()),
    [blockAssignments],
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

  const availableTasksForSystem = useCallback(
    (systemId: string) =>
      plannerTasks.filter(task => task.systemId === systemId && !assignedIds.has(task.id)),
    [plannerTasks, assignedIds],
  );

  const plannedTotal = useMemo(
    () => speedSummary.doses.reduce((sum, dose) => sum + dose.plannedMinutes, 0),
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
  }, []);

  const handleRemoveFromPlan = useCallback((taskId: string) => {
    setBlockAssignments(prev => {
      const next: Record<string, string[]> = {};
      for (const [blockId, taskIds] of Object.entries(prev)) {
        next[blockId] = taskIds.filter(id => id !== taskId);
      }
      return next;
    });
    setSelectedTasks(prev => { const n = new Set(prev); n.delete(taskId); return n; });
  }, []);

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const assignTasks = useCallback((incoming: PlannerTask[], forcedSystemId?: string) => {
    if (incoming.length === 0) return;

    let nextPlan = speedPlan;
    const nextAssignments: Record<string, string[]> = { ...blockAssignments };
    const candidates = blocks.filter(block => isDeepWorkBlock(block) || isExtraBlock(block));
    const assignedNow: string[] = [];
    const failed: string[] = [];

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
        failed.push(task.title);
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
      toast.success(
        assignedNow.length === 1
          ? 'Tarea colocada en un bloque'
          : `${assignedNow.length} tareas colocadas en bloques`,
      );
    }

    if (failed.length > 0) {
      const preview = failed.slice(0, 2).join(', ');
      toast.error(
        `No hay Deep Work libre para: ${preview}${failed.length > 2 ? ` +${failed.length - 2}` : ''}`,
      );
    }
  }, [speedPlan, blockAssignments, blocks, speedMap, setSpeedPlan]);

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
  }, [taskById, blocks, blockSystem, setSpeedPlan]);

  const handlePoolDragStart = (event: React.DragEvent, taskId: string) => {
    event.dataTransfer.setData('text/plain', taskId);
    event.dataTransfer.effectAllowed = 'move';
  };

  /* ------------------------------------------------------------------ */
  /* Carga y guardado                                                    */
  /* ------------------------------------------------------------------ */

  const loadSavedPlan = async (dateStr: string) => {
    const validTypes: RoutineType[] = ['disciplina', 'normal', 'descanso'];
    const resetDefaults = () => {
      setBlockAssignments({});
      setSelectedTasks(new Set());
      setLanguageChoice(localStorage.getItem(`planLanguage_${dateStr}`) || localStorage.getItem(`planManana_language`) || "ingles");
      setMusicInstrument(localStorage.getItem(`planInstrument_${dateStr}`) || localStorage.getItem(`planManana_instrument`) || "piano");
    };
    try {
      const plan = await loadDailyPlan(dateStr);
      if (plan && plan.block_assignments) {
        const assignments = plan.block_assignments as Record<string, string[]>;
        const rest = { ...assignments };
        delete rest["_unassigned"];
        const allTaskIds = Object.values(assignments).flat();
        const assigned = new Set(Object.values(rest).flat());
        setBlockAssignments(rest);
        // La bandeja solo conserva las tareas que aún no tienen bloque.
        setSelectedTasks(new Set(allTaskIds.filter(id => !assigned.has(id))));
        setPrevPlanSnapshot({ selectedTasks: allTaskIds, blockAssignments: rest });
        if (plan.routine_type && validTypes.includes(plan.routine_type as RoutineType)) {
          setRoutineType(plan.routine_type as RoutineType);
        }
        if (plan.notes) {
          try {
            const parsed = JSON.parse(plan.notes as string);
            if (parsed.language === 'ingles' || parsed.language === 'italiano') setLanguageChoice(parsed.language);
            if (parsed.instrument === 'piano' || parsed.instrument === 'guitarra') setMusicInstrument(parsed.instrument);
          } catch {}
        }
      } else {
        resetDefaults();
        setPrevPlanSnapshot(null);
      }
    } catch {
      resetDefaults();
      setPrevPlanSnapshot(null);
    }
  };

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
    await loadSavedPlan(targetStr);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [mode]);

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
        }
      }

      toast.success('Tarea creada');
      setIsCreateOpen(false);
      resetCreateForm();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear tarea');
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
      toast.success('Tarea añadida a Mañana');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear tarea';
      toast.error(message);
      return false;
    }
  }, []);

  const syncTaskDueDates = async (taskIds: string[], dateStr: string | null) => {
    if (taskIds.length === 0) return;
    const entreTaskIds = new Set(entreTasks.map(t => t.id));
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

      const dayGoals: Record<string, number> = {};
      ALL_HIERARCHY_AREAS.forEach(area => {
        dayGoals[area] = getDayGoalEffective(targetDate, area);
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
        dayGoals,
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

      const goalRows = ALL_HIERARCHY_AREAS
        .filter(a => (dayGoals[a] || 0) > 0)
        .map(area => ({
          area_id: area,
          stat_date: targetStr,
          time_goal_minutes: dayGoals[area] || 0,
        }));
      if (goalRows.length > 0) {
        const { error } = await supabase.from("daily_area_stats").upsert(goalRows as any, { onConflict: "area_id,stat_date" });
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

      toast.success(mode === 'hoy' ? "Plan para hoy guardado" : "Plan para mañana guardado");
    } catch (error) {
      console.error("Error al guardar el plan:", error);
      const detail = error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "";
      toast.error(detail ? `Error al guardar: ${detail}` : "Error al guardar");
    }
    setSaving(false);
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

  const renderSystemCard = (system: DaySystem) => (
    <PlanSystemCard
      key={system.id}
      system={system}
      cover={systemCover(system.id)}
      emoji={planSystemEmoji(system.id)}
      speed={getSpeed(system.id)}
      onSpeedChange={speed => setSpeed(system.id, speed)}
      plannedMinutes={speedSummary.bySystem[system.id]?.plannedMinutes ?? 0}
      tasks={systemTasks[system.id] ?? []}
      blocks={systemBlocks[system.id] ?? []}
      availableTasks={availableTasksForSystem(system.id)}
      onAddTask={task => assignTasks([task], system.id)}
      onCreateTask={() => openCreateForSystem(system.id)}
      onRemoveTask={handleRemoveTask}
    />
  );

  if (loading || !routineLoaded || !speedPlanLoaded || !systemSpeedLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 pb-24 pt-20">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-64 w-full rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24 pt-20">
      <div className="mx-auto max-w-6xl space-y-5">

        {/* Selector Hoy / Mañana */}
        <DateSwitchTabs mode={mode} onModeChange={setMode} />

        {/* Cabecera */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">{mode === 'hoy' ? 'Planificar Hoy' : 'Planificar Mañana'}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {targetCapitalized}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full" onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}>
              <PlusCircle className="h-3.5 w-3.5" /> Nueva
            </Button>
            <Button onClick={savePlan} disabled={saving} size="sm" className="h-8 gap-1.5 rounded-full">
              <Save className="h-3.5 w-3.5" /> {saving ? "Guardando..." : "Guardar Plan"}
            </Button>
          </div>
        </div>

        {/* Rutina */}
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 shadow-sm dark:bg-zinc-950/80">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-400" />
          <CardContent className="p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-medium text-muted-foreground">Rutina</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {ROUTINES.map(r => (
                <button key={r.type} onClick={() => setRoutineType(r.type)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                    routineType === r.type
                      ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                      : "border-border/60 bg-white/50 text-muted-foreground hover:border-indigo-300 hover:text-foreground dark:bg-zinc-950/50"
                  )}>
                  <span className="text-sm">{r.icon}</span>
                  <span>{r.label}</span>
                  <span className="text-[9px] opacity-60">{r.wakeTime}-{r.sleepTime}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bloqueo de enfoque */}
        <FocusLockCard
          onComplete={systemId =>
            toast.success(
              systemId
                ? `Enfoque completado: ${planSystemName(systemId)}`
                : 'Bloqueo de enfoque completado',
            )
          }
        />

        {/* Sistemas del día */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-sky-500" /> Sistemas del día
            </h2>
            <Badge variant="secondary" className="text-[9px] tabular-nums">
              {plannedTotal} min planificados
            </Badge>
          </div>
          <p className="-mt-1 text-[10px] text-muted-foreground">
            Elige la velocidad de cada sistema y añade sus tareas: cada tarjeta las coloca en un bloque de tiempo.
          </p>

          {/* Profesional / Académico en un cuadro */}
          <div className="rounded-2xl border-2 border-sky-200/70 bg-sky-50/40 p-3 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/20">
            <div className="mb-2 flex items-center gap-2 px-0.5">
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', SYSTEM_GROUP_DOT['prof-acad'])} />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Profesional / Académico</h3>
              <span className="h-px flex-1 bg-sky-200/70 dark:bg-sky-900/60" />
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {PROFESSIONAL_SYSTEMS.map(renderSystemCard)}
            </div>
          </div>

          {/* Desarrollo Personal: dos columnas de 3, en orden fijo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-0.5">
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', SYSTEM_GROUP_DOT.desarrollo)} />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Desarrollo Personal</h3>
              <span className="h-px flex-1 bg-border/60" />
              <Badge variant="secondary" className="text-[8px] tabular-nums">2 columnas · 3 cada una</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-2.5">
                {DEVELOPMENT_SYSTEMS.slice(0, 3).map(renderSystemCard)}
              </div>
              <div className="space-y-2.5">
                {DEVELOPMENT_SYSTEMS.slice(3, 6).map(renderSystemCard)}
              </div>
            </div>
          </div>
        </section>

        {/* Bandeja + línea de tiempo */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-3">
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
            />
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border-2 border-indigo-200/70 bg-indigo-50/30 p-2.5 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20">
              <div className="mb-2 flex items-center gap-2 px-0.5">
                <Clock className="h-4 w-4 text-indigo-500" />
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Bloques de tiempo</h2>
                <span className="h-px flex-1 bg-indigo-200/70 dark:bg-indigo-900/60" />
              </div>
              <DailyTimelinePlanner
                blocks={blocks as any}
                tasksByBlock={tasksByBlockForPlanner}
                onToggleBlock={() => {}}
                isBlockCompleted={() => false}
                onDropTask={handleDropTask}
                onRemoveTask={handleRemoveTask}
                onUpdateFocus={(blockId, focus) => updateBlockFocus(blockId, focus)}
                musicInstrument={musicInstrument === "piano" ? "piano" : "guitar"}
                languageChoice={languageChoice as "ingles" | "italiano"}
                isFutureView={mode !== 'hoy'}
                speedPlan={speedPlan}
                onSpeedPlanChange={setSpeedPlan}
              />
            </div>

            {/* Metas de minutos del día */}
            <Card className="overflow-hidden rounded-2xl border border-indigo-200/60 bg-indigo-50/40 shadow-sm dark:border-indigo-800/40 dark:bg-indigo-950/20">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <CardContent className="p-3">
                <h3 className="mb-1 flex items-center gap-2 text-xs font-semibold">
                  <Target className="h-3.5 w-3.5 text-indigo-500" /> Metas de minutos del día
                </h3>
                <p className="mb-2 text-[10px] text-muted-foreground">
                  Precargadas del mes/semana. Editarlas propaga hacia arriba.
                </p>
                <div className="space-y-1.5">
                  {ALL_HIERARCHY_AREAS.map(area => (
                    <div key={area} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">{AREA_LABELS[area]}</span>
                      <MinutesGoalInput
                        value={getDayGoalEffective(targetDate, area)}
                        onApply={v => applyDayGoal(area, v)}
                        className="h-6 w-20 text-[10px]"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                  Total día: {dayGoalSum} min
                </p>
              </CardContent>
            </Card>

            {/* Idioma e instrumento */}
            <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 shadow-sm dark:bg-zinc-950/80">
              <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-400" />
              <CardContent className="space-y-3 p-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold">
                  <Languages className="h-4 w-4 text-pink-500" /> Preferencias
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[10px] text-muted-foreground">Idioma a repasar:</p>
                    <div className="flex gap-1.5">
                      {[
                        { value: "italiano", label: "Italiano", flag: "🇮🇹" },
                        { value: "ingles", label: "Inglés", flag: "🇬🇧" },
                      ].map(lang => (
                        <button key={lang.value} onClick={() => setLanguageChoice(lang.value)}
                          className={cn(
                            "rounded-xl border px-2.5 py-1.5 text-[10px] font-medium transition-all",
                            languageChoice === lang.value
                              ? "border-pink-500 bg-pink-500 text-white"
                              : "border-border/60 bg-muted/50 text-muted-foreground hover:border-pink-300"
                          )}>
                          {lang.flag} {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] text-muted-foreground">Instrumento musical:</p>
                    <div className="flex gap-1.5">
                      {[
                        { value: "piano", label: "Piano", icon: "🎹" },
                        { value: "guitarra", label: "Guitarra", icon: "🎸" },
                      ].map(inst => (
                        <button key={inst.value} onClick={() => setMusicInstrument(inst.value)}
                          className={cn(
                            "rounded-xl border px-2.5 py-1.5 text-[10px] font-medium transition-all",
                            musicInstrument === inst.value
                              ? "border-pink-500 bg-pink-500 text-white"
                              : "border-border/60 bg-muted/50 text-muted-foreground hover:border-pink-300"
                          )}>
                          {inst.icon} {inst.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Velocidad calculada desde bloques y fragmentos */}
        <DaySpeedSection speedPlan={speedPlan} blocks={blocks} />

      </div>

      {/* Crear tarea */}
      <Dialog open={isCreateOpen} onOpenChange={o => { setIsCreateOpen(o); if (!o) resetCreateForm(); }}>
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
