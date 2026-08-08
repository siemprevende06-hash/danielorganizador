import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useMidnightReset } from "@/hooks/useMidnightReset";
import { getCubaDate } from "@/lib/cubaTime";

const DEFAULT_TIME_GOALS: Record<string, number> = {
  universidad: 120, emprendimiento: 60, proyectos: 60,
  lectura: 30, ajedrez: 15, idiomas: 60,
  piano: 30, guitarra: 30, dibujo: 60,
  gym: 60, calistenia: 30, boxeo: 60,
  skincare_am: 10, skincare_pm: 10,
  finanzas: 15,
}

const todayKey = () => getCubaDate();

function dateKeyOf(target: Date | undefined): string {
  return target ? format(target, 'yyyy-MM-dd') : todayKey();
}

// Umbrales por defecto para computar "min"/"max" en la racha semanal.
const STREAK_MIN_MINUTES = 1;
const STREAK_MAX_MINUTES = 30;

/**
 * Añade a `completions` claves `streak:<habitId>` = "min" | "max" para cada
 * hábito completado hoy, para que el trigger de BD actualice
 * `system_habit_streaks`. Preserva claves streak: existentes no relacionadas.
 */
function withStreakMirror(data: SystemsData): Record<string, any> {
  const out: Record<string, any> = {};
  const habitIds = new Set<string>();
  for (const [k, v] of Object.entries(data.completions || {})) {
    if (k.startsWith("streak:")) continue;
    out[k] = v;
    if (v) habitIds.add(k);
  }
  for (const habitId of habitIds) {
    const minutes = data.timeData?.[habitId] ?? 0;
    const level = minutes >= STREAK_MAX_MINUTES ? "max" : "min";
    out[`streak:${habitId}`] = level;
  }
  return out;
}

export interface SystemsData {
  completions: Record<string, boolean>;
  timeData: Record<string, number>;
  countData: Record<string, number>;
  waterData: Record<string, boolean>;
  workAssignments: Record<string, string>;
  blockCompletions: Record<string, boolean>;
  wakeTime: string;
  sleepTime: string;
  workoutDuration: number;
  workoutIntensity: string;
  mealPhotos: Record<string, string>;
  skipped: Record<string, boolean>;
  activeFocusAreas: string[];
}

const DEFAULT_DATA: SystemsData = {
  completions: {},
  timeData: {},
  countData: {},
  waterData: {},
  workAssignments: {},
  blockCompletions: {},
  wakeTime: "",
  sleepTime: "",
  workoutDuration: 0,
  workoutIntensity: "moderate",
  mealPhotos: {},
  skipped: {},
  activeFocusAreas: ["universidad", "emprendimiento", "proyectos"],
};

export function useSystemsTracking(targetDate?: Date) {
  const [data, setData] = useState<SystemsData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => dateKeyOf(targetDate));
  const dataRef = useRef(data);
  dataRef.current = data;
  const dateRef = useRef(currentDate);
  dateRef.current = currentDate;

  // Cambiar de día (navegación a días anteriores/posteriores)
  const targetKey = dateKeyOf(targetDate);
  useEffect(() => {
    if (currentDate === targetKey) return;
    setCurrentDate(targetKey);
    setData(DEFAULT_DATA);
    setLoading(true);
  }, [targetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on unmount to avoid losing pending changes
  useEffect(() => {
    return () => {
      if (!loading) {
        save(dataRef.current, dateRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset visual + recarga de la fila correcta al pasar la medianoche (solo si estamos viendo hoy)
  useMidnightReset(useCallback(() => {
    if (dateRef.current !== todayKey()) return;
    setData(DEFAULT_DATA);
    setCurrentDate(todayKey());
  }, []));

  // Load from DB with offline cache fallback
  useEffect(() => {
    const load = async () => {
      const dateKey = currentDate;

      const buildData = (row: any) => ({
        completions: (row.completions as Record<string, boolean>) || {},
        timeData: (row.time_data as Record<string, number>) || {},
        countData: (row.count_data as Record<string, number>) || {},
        waterData: (row.water_data as Record<string, boolean>) || {},
        workAssignments: (row.work_assignments as Record<string, string>) || {},
        blockCompletions: (row.block_completions as Record<string, boolean>) || {},
        wakeTime: row.wake_time || "",
        sleepTime: row.sleep_time || "",
        workoutDuration: row.workout_duration || 0,
        workoutIntensity: row.workout_intensity || "moderate",
        mealPhotos: (row.meal_photos as Record<string, string>) || {},
        skipped: (row.skipped as Record<string, boolean>) || {},
        activeFocusAreas: (row.active_focus_areas as string[]) || ["universidad", "emprendimiento", "proyectos"],
      });

      let row: any = null;
      try {
        const { data } = await supabase
          .from("daily_systems_tracking")
          .select("*")
          .eq("tracking_date", dateKey)
          .maybeSingle();
        row = data;
      } catch {}  // offline, row stays null

      if (row) {
        setData(buildData(row));
      }
      setLoading(false);
    };
    load();
  }, [currentDate]);

  // Sync time_data + completions to daily_area_stats so the Wheel of Life sees real data
  const syncToAreaStats = useCallback(async (newData: SystemsData, forDate: string) => {
    const areaUpdates = new Map<string, { time_spent_minutes: number; completed: boolean; completed_at: string | null }>()

    for (const [id, minutes] of Object.entries(newData.timeData)) {
      areaUpdates.set(id, {
        time_spent_minutes: minutes,
        completed: areaUpdates.get(id)?.completed ?? !!newData.completions[id],
        completed_at: areaUpdates.get(id)?.completed_at ?? (newData.completions[id] ? new Date().toISOString() : null),
      })
    }

    for (const [id, done] of Object.entries(newData.completions)) {
      if (!areaUpdates.has(id)) {
        areaUpdates.set(id, {
          time_spent_minutes: newData.timeData[id] ?? 0,
          completed: done,
          completed_at: done ? new Date().toISOString() : null,
        })
      } else {
        const existing = areaUpdates.get(id)!
        existing.completed = done
        existing.completed_at = done ? new Date().toISOString() : null
      }
    }

    for (const [areaId, vals] of areaUpdates) {
      try {
        await supabase.from("daily_area_stats").upsert({
          area_id: areaId,
          stat_date: forDate,
          time_spent_minutes: vals.time_spent_minutes,
          time_goal_minutes: DEFAULT_TIME_GOALS[areaId] ?? 30,
          completed: vals.completed,
          completed_at: vals.completed_at,
        }, { onConflict: "area_id,stat_date" })
      } catch (err) {
        console.warn("[syncToAreaStats] error for", areaId, err)
      }
    }
  }, [])

  // Save to DB (debounced) — upsert por fecha para poder guardar días anteriores
  const save = useCallback(async (newData: SystemsData, forDate: string) => {
    const payload = {
      tracking_date: forDate,
      completions: withStreakMirror(newData),
      time_data: newData.timeData,
      count_data: newData.countData,
      water_data: newData.waterData,
      work_assignments: newData.workAssignments,
      block_completions: newData.blockCompletions,
      wake_time: newData.wakeTime || null,
      sleep_time: newData.sleepTime || null,
      workout_duration: newData.workoutDuration,
      workout_intensity: newData.workoutIntensity,
      meal_photos: newData.mealPhotos,
      skipped: newData.skipped,
      active_focus_areas: newData.activeFocusAreas,
    };

    try {
      await supabase
        .from("daily_systems_tracking")
        .upsert(payload, { onConflict: "tracking_date" });
    } catch {}  // offline

    syncToAreaStats(newData, forDate)
  }, [syncToAreaStats]);

  // Debounced save
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => save(data, currentDate), 100);
    return () => clearTimeout(t);
  }, [data, loading, save, currentDate]);

  const update = useCallback(<K extends keyof SystemsData>(key: K, value: SystemsData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleCompletion = useCallback((id: string) => {
    setData(prev => {
      const done = !!prev.completions[id];
      const skipped = !!prev.skipped[id];
      if (!done && !skipped) {
        return { ...prev, completions: { ...prev.completions, [id]: true } };
      }
      if (done) {
        const newSkipped = { ...prev.skipped, [id]: true };
        const newCompletions = { ...prev.completions };
        delete newCompletions[id];
        return { ...prev, completions: newCompletions, skipped: newSkipped };
      }
      const newSkipped = { ...prev.skipped };
      delete newSkipped[id];
      return { ...prev, skipped: newSkipped };
    });
  }, []);

  const setTimeValue = useCallback((id: string, v: number) => {
    setData(prev => {
      const newSkipped = { ...prev.skipped };
      if (v > 0) {
        delete newSkipped[id];
      }
      return {
        ...prev,
        timeData: { ...prev.timeData, [id]: v },
        skipped: newSkipped,
      };
    });
  }, []);

  const setCountValue = useCallback((id: string, v: number) => {
    setData(prev => ({
      ...prev,
      countData: { ...prev.countData, [id]: v },
    }));
  }, []);

  const toggleWater = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      waterData: { ...prev.waterData, [id]: !prev.waterData[id] },
    }));
  }, []);

  const setWorkAssignment = useCallback((blockId: string, area: string) => {
    setData(prev => ({
      ...prev,
      workAssignments: { ...prev.workAssignments, [blockId]: area },
    }));
  }, []);

  const toggleBlock = useCallback((blockId: string) => {
    setData(prev => ({
      ...prev,
      blockCompletions: { ...prev.blockCompletions, [blockId]: !prev.blockCompletions[blockId] },
    }));
  }, []);

  const toggleSkip = useCallback((id: string) => {
    setData(prev => {
      const wasSkipped = !!prev.skipped[id];
      const newSkipped = { ...prev.skipped };
      if (wasSkipped) {
        delete newSkipped[id];
      } else {
        newSkipped[id] = true;
      }
      return { ...prev, skipped: newSkipped };
    });
  }, []);

  const toggleActiveFocusArea = useCallback((areaId: string) => {
    setData(prev => {
      const has = prev.activeFocusAreas.includes(areaId);
      return {
        ...prev,
        activeFocusAreas: has
          ? prev.activeFocusAreas.filter(a => a !== areaId)
          : [...prev.activeFocusAreas, areaId],
      };
    });
  }, []);

  const setMealPhoto = useCallback((mealId: string, url: string) => {
    setData(prev => ({
      ...prev,
      mealPhotos: { ...prev.mealPhotos, [mealId]: url },
    }));
  }, []);

  // Load historical data for charts
  const loadHistory = useCallback(async (days: number) => {
    const endDate = todayKey();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split("T")[0];

    try {
      const { data: rows } = await supabase
        .from("daily_systems_tracking")
        .select("*")
        .gte("tracking_date", startStr)
        .lte("tracking_date", endDate)
        .order("tracking_date", { ascending: true });
      return rows || [];
    } catch {
      return [];
    }
  }, []);

  return {
    data,
    loading,
    update,
    toggleCompletion,
    setTimeValue,
    setCountValue,
    toggleWater,
    setWorkAssignment,
    toggleBlock,
    toggleSkip,
    toggleActiveFocusArea,
    setMealPhoto,
    loadHistory,
  };
}