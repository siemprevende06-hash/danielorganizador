import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMidnightReset } from "@/hooks/useMidnightReset";
import { getCached, setCache, clearTableCache } from "@/lib/offlineCache";
import { cachedMutation } from "@/lib/supabaseCache";
import { getCubaDate } from "@/lib/cubaTime";

const todayKey = () => getCubaDate();

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
  for (const [k, v] of Object.entries(data.completions || {})) {
    if (!k.startsWith("streak:")) out[k] = v;
  }
  for (const [habitId, completed] of Object.entries(data.completions || {})) {
    if (habitId.startsWith("streak:")) continue;
    if (!completed) continue;
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
};

export function useSystemsTracking() {
  const [data, setData] = useState<SystemsData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(todayKey());

  // Reset visual + recarga de la fila correcta al pasar la medianoche
  useMidnightReset(useCallback(() => {
    setData(DEFAULT_DATA);
    setRecordId(null);
    setCurrentDate(todayKey());
  }, []));

  // Load from DB with offline cache fallback
  useEffect(() => {
    const load = async () => {
      const today = todayKey();

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
      });

      const cacheKey = `tracking_${today}`;

      let row: any = null;
      try {
        const { data } = await supabase
          .from("daily_systems_tracking")
          .select("*")
          .eq("tracking_date", today)
          .maybeSingle();
        row = data;
        if (row) {
          setRecordId(row.id);
          await setCache("daily_systems_tracking", cacheKey, row);
        }
      } catch {
        const cached = await getCached<any>("daily_systems_tracking", cacheKey);
        row = cached;
      }

      if (row) {
        setData(buildData(row));
      }
      setLoading(false);
    };
    load();
  }, [currentDate]);

  // Save to DB (debounced) with offline queue fallback
  const save = useCallback(async (newData: SystemsData) => {
    const today = todayKey();
    const payload = {
      tracking_date: today,
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
    };

    if (recordId) {
      const r = await cachedMutation("daily_systems_tracking", "update", payload, { id: recordId });
      if (!r.queued) {
        await clearTableCache("daily_systems_tracking").catch(() => {});
      }
    } else {
      try {
        const { data: row, error } = await supabase
          .from("daily_systems_tracking")
          .upsert(payload, { onConflict: "tracking_date" })
          .select("id")
          .single();
        if (error) throw error;
        if (row) setRecordId(row.id);
      } catch {
        await cachedMutation("daily_systems_tracking", "upsert", payload, undefined, "tracking_date");
      }
    }
  }, [recordId]);

  // Debounced save
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => save(data), 500);
    return () => clearTimeout(t);
  }, [data, loading, save]);

  const update = useCallback(<K extends keyof SystemsData>(key: K, value: SystemsData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleCompletion = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      completions: { ...prev.completions, [id]: !prev.completions[id] },
    }));
  }, []);

  const setTimeValue = useCallback((id: string, v: number) => {
    setData(prev => ({
      ...prev,
      timeData: { ...prev.timeData, [id]: v },
    }));
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

    const { data: rows } = await supabase
      .from("daily_systems_tracking")
      .select("*")
      .gte("tracking_date", startStr)
      .lte("tracking_date", endDate)
      .order("tracking_date", { ascending: true });

    return rows || [];
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
    setMealPhoto,
    loadHistory,
  };
}
