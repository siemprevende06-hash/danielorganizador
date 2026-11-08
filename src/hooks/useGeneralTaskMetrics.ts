import { useCallback, useEffect, useMemo, useState } from "react";
import {
  eachDayOfInterval,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PlanDayStatus, PlanTaskMetrics } from "@/lib/planSystems";
import type { PlanObjectiveRow } from "@/components/planificacion/PlanAreaCard";

export interface GeneralTaskRow {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  area_id: string | null;
  source: string | null;
}

const dayKey = (task: GeneralTaskRow): string => String(task.due_date ?? "").slice(0, 10);

function taskDateLabel(value: string | null): string | undefined {
  if (!value) return undefined;
  const date = parseISO(value.slice(0, 10));
  return Number.isNaN(date.getTime()) ? undefined : format(date, "d MMM", { locale: es });
}

function weekKeyOf(day: string): string {
  return format(startOfWeek(parseISO(day), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

interface DayTaskStat {
  key: string;
  total: number;
  done: number;
  status: PlanDayStatus | null;
}

function buildTaskMetrics(
  tasks: GeneralTaskRow[],
  start: Date,
  end: Date,
): PlanTaskMetrics {
  const total = tasks.length;
  const done = tasks.filter((task) => task.completed).length;
  const today = startOfDay(new Date());
  const lastElapsed = end.getTime() < today.getTime() ? end : today;

  const dayKeys = lastElapsed.getTime() >= start.getTime()
    ? eachDayOfInterval({ start, end: lastElapsed }).map((date) => format(date, "yyyy-MM-dd"))
    : [];

  const dayStats: DayTaskStat[] = dayKeys.map((key) => {
    const dayTasks = tasks.filter((task) => dayKey(task) === key);
    const dayDone = dayTasks.filter((task) => task.completed).length;
    let status: PlanDayStatus | null = null;
    if (dayTasks.length > 0) {
      status = dayDone === dayTasks.length ? "done" : dayDone > 0 ? "partial" : "none";
    }
    return { key, total: dayTasks.length, done: dayDone, status };
  });

  const activeDays = dayStats.filter((day): day is DayTaskStat & { status: PlanDayStatus } => day.status != null);
  const daysWithTasks = activeDays.length;
  const daysDone = activeDays.filter((day) => day.status === "done").length;
  const partialDays = activeDays.filter((day) => day.status === "partial").length;

  let streak = 0;
  for (let index = dayStats.length - 1; index >= 0; index--) {
    const day = dayStats[index];
    if (day.status == null) continue;
    if (day.status === "done") streak++;
    else break;
  }

  let bestStreak = 0;
  let run = 0;
  let gapActive = false;
  let maxGap = 0;
  let recoveries = 0;
  for (const day of activeDays) {
    if (day.status === "done") {
      run += 1;
      bestStreak = Math.max(bestStreak, run);
      if (gapActive) {
        recoveries += 1;
        gapActive = false;
      }
    } else {
      run = 0;
      gapActive = true;
    }
  }

  // Brecha máxima: días seguidos con tareas sin completarlas todas.
  let currentGap = 0;
  let longestGap = 0;
  for (const day of activeDays) {
    if (day.status === "done") {
      currentGap = 0;
    } else {
      currentGap += 1;
      longestGap = Math.max(longestGap, currentGap);
    }
  }
  maxGap = longestGap;

  const weeks = new Map<string, { done: number; available: number }>();
  for (const day of activeDays) {
    const key = weekKeyOf(day.key);
    const entry = weeks.get(key) ?? { done: 0, available: 0 };
    entry.available += 1;
    if (day.status === "done") entry.done += 1;
    weeks.set(key, entry);
  }
  const totalWeeks = weeks.size;
  const greenWeeks = [...weeks.values()]
    .filter((entry) => entry.available > 0 && entry.done / entry.available >= 0.8)
    .length;

  const todayKey = format(today, "yyyy-MM-dd");
  const todayStatus = activeDays.find((day) => day.key === todayKey)?.status;

  return {
    total,
    done,
    pending: Math.max(0, total - done),
    completion: total > 0 ? Math.round((done / total) * 100) : null,
    daysWithTasks,
    daysDone,
    partialDays,
    streak,
    bestStreak,
    maxGap,
    recoveries,
    greenWeeks,
    totalWeeks,
    trend: null,
    status: activeDays.map((day) => day.status),
    days: activeDays.map((day) => day.key),
    todayStatus,
  };
}

/**
 * Tareas generales (tabla `tasks` sin área) para la tarjeta sintética de
 * Inicio 2.0. Devuelve las tareas del periodo como filas marcables y las
 * métricas de cumplimiento por día.
 */
export function useGeneralTaskMetrics(start: Date, end: Date) {
  const startKey = format(start, "yyyy-MM-dd");
  const endKey = format(end, "yyyy-MM-dd");
  const [tasks, setTasks] = useState<GeneralTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, completed, due_date, area_id, source")
        .gte("due_date", `${startKey}T00:00:00`)
        .lte("due_date", `${endKey}T23:59:59`)
        .order("due_date", { ascending: true });

      if (!alive) return;

      if (error) {
        console.error("Error loading general tasks:", error);
        setTasks([]);
      } else {
        const rows = ((data ?? []) as GeneralTaskRow[])
          .filter((task) => task.source === "general" || (!task.source && !task.area_id))
          .map((task) => ({
            id: task.id,
            title: task.title || "Tarea",
            completed: Boolean(task.completed),
            due_date: task.due_date ?? null,
            area_id: task.area_id ?? null,
            source: task.source ?? null,
          }));
        setTasks(rows);
      }
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [startKey, endKey]);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    const next = !task.completed;

    setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, completed: next } : item)));

    const { error } = await supabase.from("tasks").update({ completed: next }).eq("id", id);
    if (error) {
      setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !next } : item)));
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la tarea" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["weeklyData"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyData"] });
      queryClient.invalidateQueries({ queryKey: ["resultados"] });
    }
  }, [tasks, toast, queryClient]);

  const metrics = useMemo(
    () => buildTaskMetrics(tasks, start, end),
    [tasks, startKey, endKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const items = useMemo<PlanObjectiveRow[]>(
    () => tasks.map((task) => ({
      id: `general-task-${task.id}`,
      title: task.title,
      meta: taskDateLabel(task.due_date),
      emoji: "✅",
      tag: task.completed ? "Hecha" : undefined,
      done: task.completed,
      onToggle: () => toggleTask(task.id),
    })),
    [tasks, toggleTask],
  );

  return { tasks, items, metrics, loading, toggleTask };
}
