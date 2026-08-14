import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useMidnightReset } from "@/hooks/useMidnightReset";
import { getCubaDate } from "@/lib/cubaTime";
const DEFAULT_TIME_GOALS = {
    universidad: 120, emprendimiento: 60, proyectos: 60,
    lectura: 30, ajedrez: 15, idiomas: 60,
    piano: 30, guitarra: 30, dibujo: 60,
    gym: 60, calistenia: 30, boxeo: 60,
    skincare_am: 10, skincare_pm: 10,
    finanzas: 15,
};
const todayKey = () => getCubaDate();
function dateKeyOf(target) {
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
function withStreakMirror(data) {
    const out = {};
    const habitIds = new Set();
    for (const [k, v] of Object.entries(data.completions || {})) {
        if (k.startsWith("streak:"))
            continue;
        out[k] = v;
        if (v)
            habitIds.add(k);
    }
    for (const habitId of habitIds) {
        const minutes = data.timeData?.[habitId] ?? 0;
        const level = minutes >= STREAK_MAX_MINUTES ? "max" : "min";
        out[`streak:${habitId}`] = level;
    }
    return out;
}
const DEFAULT_DATA = {
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
export function useSystemsTracking(targetDate) {
    const [data, setData] = useState(DEFAULT_DATA);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(() => dateKeyOf(targetDate));
    const dataRef = useRef(data);
    dataRef.current = data;
    const dateRef = useRef(currentDate);
    dateRef.current = currentDate;
    // Cambiar de día (navegación a días anteriores/posteriores)
    const targetKey = dateKeyOf(targetDate);
    useEffect(() => {
        if (currentDate === targetKey)
            return;
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
        if (dateRef.current !== todayKey())
            return;
        setData(DEFAULT_DATA);
        setCurrentDate(todayKey());
    }, []));
    // Load from DB with offline cache fallback
    useEffect(() => {
        const load = async () => {
            const dateKey = currentDate;
            const buildData = (row) => ({
                completions: row.completions || {},
                timeData: row.time_data || {},
                countData: row.count_data || {},
                waterData: row.water_data || {},
                workAssignments: row.work_assignments || {},
                blockCompletions: row.block_completions || {},
                wakeTime: row.wake_time || "",
                sleepTime: row.sleep_time || "",
                workoutDuration: row.workout_duration || 0,
                workoutIntensity: row.workout_intensity || "moderate",
                mealPhotos: row.meal_photos || {},
                skipped: row.skipped || {},
                activeFocusAreas: row.active_focus_areas || ["universidad", "emprendimiento", "proyectos"],
            });
            let row = null;
            try {
                const { data } = await supabase
                    .from("daily_systems_tracking")
                    .select("*")
                    .eq("tracking_date", dateKey)
                    .maybeSingle();
                row = data;
            }
            catch { } // offline, row stays null
            if (row) {
                setData(buildData(row));
            }
            setLoading(false);
        };
        load();
    }, [currentDate]);
    // Sync time_data + completions to daily_area_stats so the Wheel of Life sees real data
    const syncToAreaStats = useCallback(async (newData, forDate) => {
        const areaUpdates = new Map();
        for (const [id, minutes] of Object.entries(newData.timeData)) {
            areaUpdates.set(id, {
                time_spent_minutes: minutes,
                completed: areaUpdates.get(id)?.completed ?? !!newData.completions[id],
                completed_at: areaUpdates.get(id)?.completed_at ?? (newData.completions[id] ? new Date().toISOString() : null),
            });
        }
        for (const [id, done] of Object.entries(newData.completions)) {
            if (!areaUpdates.has(id)) {
                areaUpdates.set(id, {
                    time_spent_minutes: newData.timeData[id] ?? 0,
                    completed: done,
                    completed_at: done ? new Date().toISOString() : null,
                });
            }
            else {
                const existing = areaUpdates.get(id);
                existing.completed = done;
                existing.completed_at = done ? new Date().toISOString() : null;
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
                }, { onConflict: "area_id,stat_date" });
            }
            catch (err) {
                console.warn("[syncToAreaStats] error for", areaId, err);
            }
        }
    }, []);
    // Save to DB (debounced) — upsert por fecha para poder guardar días anteriores
    const save = useCallback(async (newData, forDate) => {
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
        }
        catch { } // offline
        syncToAreaStats(newData, forDate);
    }, [syncToAreaStats]);
    // Debounced save
    useEffect(() => {
        if (loading)
            return;
        const t = setTimeout(() => save(data, currentDate), 100);
        return () => clearTimeout(t);
    }, [data, loading, save, currentDate]);
    const update = useCallback((key, value) => {
        setData(prev => ({ ...prev, [key]: value }));
    }, []);
    const toggleCompletion = useCallback((id) => {
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
    const setTimeValue = useCallback((id, v) => {
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
    const setCountValue = useCallback((id, v) => {
        setData(prev => ({
            ...prev,
            countData: { ...prev.countData, [id]: v },
        }));
    }, []);
    const toggleWater = useCallback((id) => {
        setData(prev => ({
            ...prev,
            waterData: { ...prev.waterData, [id]: !prev.waterData[id] },
        }));
    }, []);
    const setWorkAssignment = useCallback((blockId, area) => {
        setData(prev => ({
            ...prev,
            workAssignments: { ...prev.workAssignments, [blockId]: area },
        }));
    }, []);
    const toggleBlock = useCallback((blockId) => {
        setData(prev => ({
            ...prev,
            blockCompletions: { ...prev.blockCompletions, [blockId]: !prev.blockCompletions[blockId] },
        }));
    }, []);
    const toggleSkip = useCallback((id) => {
        setData(prev => {
            const wasSkipped = !!prev.skipped[id];
            const newSkipped = { ...prev.skipped };
            if (wasSkipped) {
                delete newSkipped[id];
            }
            else {
                newSkipped[id] = true;
            }
            return { ...prev, skipped: newSkipped };
        });
    }, []);
    const toggleActiveFocusArea = useCallback((areaId) => {
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
    const setMealPhoto = useCallback((mealId, url) => {
        setData(prev => ({
            ...prev,
            mealPhotos: { ...prev.mealPhotos, [mealId]: url },
        }));
    }, []);
    // Load historical data for charts
    const loadHistory = useCallback(async (days) => {
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
        }
        catch {
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
