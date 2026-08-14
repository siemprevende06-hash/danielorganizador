import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WorkoutRoutine {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  workout_days: Record<string, boolean>;
  is_active: boolean;
  tipo: string;
  created_at: string;
  updated_at: string;
}

export type TrainingType = 'gimnasio' | 'calistenia';

export interface WorkoutExercise {
  id: string;
  routine_id: string;
  name: string;
  day_of_week: string;
  target_sets: number;
  target_reps: string;
  muscle_group: string | null;
  order_index: number;
  created_at: string;
}

export interface ExerciseLog {
  id: string;
  exercise_id: string;
  user_id: string | null;
  session_id: string | null;
  log_date: string;
  sets_completed: number | null;
  reps_per_set: number[];
  weights_per_set: number[];
  weight_kg: number | null;
  is_pr: boolean | null;
  notes: string | null;
  created_at: string;
}

export interface ExerciseHistoryPoint {
  date: string;
  weight: number;
  reps: number;
  e1rm: number;
  isPr: boolean;
}

export interface WorkoutSession {
  id: string;
  user_id: string | null;
  routine_id: string | null;
  tipo: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export interface SessionWithLogs extends WorkoutSession {
  exercise_logs: ExerciseLog[];
}

export interface SessionSummary {
  id: string;
  started_at: string;
  duration_minutes: number | null;
  tipo: string;
  exerciseCount: number;
  setCount: number;
  totalReps: number;
  totalVolumeKg: number;
  exercises: { name: string; sets: number; reps: number[]; volumeKg: number }[];
}

export const computeSessionSummary = (session: SessionWithLogs, exercises: WorkoutExercise[]): SessionSummary => {
  const exerciseNameById = new Map(exercises.map(e => [e.id, e.name]));
  const byExercise = new Map<string, { name: string; sets: number; reps: number[]; volumeKg: number }>();
  let totalReps = 0;
  let setCount = 0;
  let totalVolumeKg = 0;

  for (const log of session.exercise_logs || []) {
    const reps = Array.isArray(log.reps_per_set) ? log.reps_per_set.filter((r): r is number => typeof r === 'number' && !isNaN(r)) : [];
    const weights = Array.isArray(log.weights_per_set) && log.weights_per_set.length === reps.length && reps.length > 0
      ? log.weights_per_set
      : reps.map(() => Number(log.weight_kg) || 0);

    const volume = reps.reduce((sum, r, i) => sum + r * (weights[i] || 0), 0);
    totalVolumeKg += volume;
    setCount += reps.length;
    totalReps += reps.reduce((a, b) => a + b, 0);

    const name = exerciseNameById.get(log.exercise_id) || 'Ejercicio';
    const entry = byExercise.get(log.exercise_id) || { name, sets: 0, reps: [], volumeKg: 0 };
    entry.sets += reps.length;
    entry.reps = [...entry.reps, ...reps];
    entry.volumeKg += volume;
    byExercise.set(log.exercise_id, entry);
  }

  return {
    id: session.id,
    started_at: session.started_at,
    duration_minutes: session.duration_minutes,
    tipo: session.tipo,
    exerciseCount: byExercise.size,
    setCount,
    totalReps,
    totalVolumeKg,
    exercises: Array.from(byExercise.values())
  };
};

export interface ExerciseProgress {
  exercise: WorkoutExercise;
  initialWeight: number;
  currentWeight: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  logs: ExerciseLog[];
}

const DAY_NAMES: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

export const useWorkoutTracking = () => {
  const [routine, setRoutine] = useState<WorkoutRoutine | null>(null);
  const [allRoutines, setAllRoutines] = useState<WorkoutRoutine[]>([]);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [sessions, setSessions] = useState<SessionWithLogs[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRoutine = useCallback(async (tipo?: TrainingType) => {
    let query = supabase
      .from('workout_routines')
      .select('*')
      .eq('is_active', true);

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data } = await query
      .limit(1)
      .single();
    
    if (data) {
      setRoutine({
        ...data,
        workout_days: (data.workout_days as Record<string, boolean>) || {}
      });
    } else {
      setRoutine(null);
    }
    return data;
  }, []);

  const loadAllRoutines = useCallback(async (tipo?: TrainingType) => {
    let query = supabase
      .from('workout_routines')
      .select('*')
      .order('created_at', { ascending: false });

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data } = await query;
    
    if (data) {
      setAllRoutines(data.map(r => ({
        ...r,
        workout_days: (r.workout_days as Record<string, boolean>) || {}
      })));
    }
    return data;
  }, []);

  const loadExercises = useCallback(async (routineId: string) => {
    const { data } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('routine_id', routineId)
      .order('order_index');
    
    if (data) {
      setExercises(data as WorkoutExercise[]);
    }
    return data;
  }, []);

  const loadLogs = useCallback(async () => {
    const { data } = await supabase
      .from('exercise_logs')
      .select('*')
      .order('log_date', { ascending: false })
      .limit(500);
    
    if (data) {
      setLogs(data.map(log => ({
        ...log,
        reps_per_set: (log.reps_per_set as number[]) || [],
        weights_per_set: (log.weights_per_set as number[]) || []
      })));
    }
    return data;
  }, []);

  const loadSessions = useCallback(async () => {
    const { data } = await supabase
      .from('workout_sessions')
      .select('*, exercise_logs(*)')
      .order('started_at', { ascending: false })
      .limit(60);

    if (data) {
      setSessions(data.map(s => ({
        ...s,
        exercise_logs: (s.exercise_logs || []).map((l: any) => ({
          ...l,
          reps_per_set: (l.reps_per_set as number[]) || [],
          weights_per_set: (l.weights_per_set as number[]) || []
        }))
      })));
    }
    return data;
  }, []);

  const loadAll = useCallback(async (tipo?: TrainingType) => {
    setIsLoading(true);
    const routineData = await loadRoutine(tipo);
    if (routineData) {
      await loadExercises(routineData.id);
    }
    await loadLogs();
    await loadSessions();
    await loadAllRoutines(tipo);
    setIsLoading(false);
  }, [loadRoutine, loadExercises, loadLogs, loadSessions, loadAllRoutines]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const selectRoutine = useCallback(async (routineId: string) => {
    await supabase
      .from('workout_routines')
      .update({ is_active: false })
      .eq('is_active', true);

    await supabase
      .from('workout_routines')
      .update({ is_active: true })
      .eq('id', routineId);

    const { data } = await supabase
      .from('workout_routines')
      .select('*')
      .eq('id', routineId)
      .single();

    if (data) {
      setRoutine({
        ...data,
        workout_days: (data.workout_days as Record<string, boolean>) || {}
      });
      await loadExercises(data.id);
    }
  }, [loadExercises]);

  const createRoutine = async (name: string, workoutDays: Record<string, boolean>, tipo: TrainingType = 'gimnasio', description?: string) => {
    // Deactivate existing routines of same type
    await supabase
      .from('workout_routines')
      .update({ is_active: false })
      .eq('is_active', true)
      .eq('tipo', tipo);

    const { data, error } = await supabase
      .from('workout_routines')
      .insert({
        name,
        description,
        workout_days: workoutDays,
        is_active: true,
        tipo
      })
      .select()
      .single();

    if (!error && data) {
      setRoutine({
        ...data,
        workout_days: (data.workout_days as Record<string, boolean>) || {}
      });
      setAllRoutines(prev => [{ ...data, workout_days: (data.workout_days as Record<string, boolean>) || {} }, ...prev]);
    }
    return { data, error };
  };

  const updateRoutine = async (routineId: string, updates: Partial<WorkoutRoutine>) => {
    const { error } = await supabase
      .from('workout_routines')
      .update(updates)
      .eq('id', routineId);

    if (!error) {
      await loadRoutine();
    }
    return { error };
  };

  const addExercise = async (
    routineId: string,
    name: string,
    dayOfWeek: string,
    targetSets: number = 3,
    targetReps: string = '8-12',
    muscleGroup?: string
  ) => {
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert({
        routine_id: routineId,
        name,
        day_of_week: dayOfWeek,
        target_sets: targetSets,
        target_reps: targetReps,
        muscle_group: muscleGroup,
        order_index: exercises.filter(e => e.day_of_week === dayOfWeek).length
      })
      .select()
      .single();

    if (!error && data) {
      setExercises(prev => [...prev, data as WorkoutExercise]);
    }
    return { data, error };
  };

  const removeExercise = async (exerciseId: string) => {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', exerciseId);

    if (!error) {
      setExercises(prev => prev.filter(e => e.id !== exerciseId));
    }
    return { error };
  };

  const logWorkout = async (
    exerciseId: string,
    weightKg: number,
    setsCompleted: number,
    repsPerSet: number[],
    notes?: string,
    sessionId?: string,
    weightsPerSet?: number[]
  ) => {
    const prevMax = logs
      .filter(l => l.exercise_id === exerciseId && l.weight_kg)
      .reduce((max, l) => Math.max(max, Number(l.weight_kg) || 0), 0);
    const isPr = weightKg > 0 && weightKg > prevMax;

    const { data, error } = await supabase
      .from('exercise_logs')
      .insert({
        exercise_id: exerciseId,
        weight_kg: weightKg,
        sets_completed: setsCompleted,
        reps_per_set: repsPerSet,
        weights_per_set: weightsPerSet || [],
        notes,
        session_id: sessionId || null,
        is_pr: isPr,
        log_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (!error && data) {
      setLogs(prev => [{
        ...data,
        reps_per_set: (data.reps_per_set as number[]) || [],
        weights_per_set: (data.weights_per_set as number[]) || [],
        is_pr: data.is_pr || false
      }, ...prev]);
    }
    return { data, error };
  };

  const startSession = async (routineId: string, tipo: TrainingType = 'gimnasio') => {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        routine_id: routineId,
        tipo,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (!error && data) {
      setSessions(prev => [{
        ...data,
        exercise_logs: []
      }, ...prev]);
    }
    return { data, error };
  };

  const finishSession = async (sessionId: string, durationMinutes: number) => {
    const { error } = await supabase
      .from('workout_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_minutes: Math.max(1, Math.round(durationMinutes))
      })
      .eq('id', sessionId);

    if (!error) {
      setSessions(prev => prev.map(s => s.id === sessionId
        ? { ...s, ended_at: new Date().toISOString(), duration_minutes: Math.max(1, Math.round(durationMinutes)) }
        : s));
    }
    return { error };
  };

  const syncWorkoutDuration = async (minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('daily_systems_tracking')
      .select('*')
      .eq('tracking_date', today)
      .maybeSingle();

    const base = existing || {
      tracking_date: today,
      completions: {},
      time_data: {},
      count_data: {},
      water_data: {},
      block_completions: {},
      skipped: {},
      active_focus_areas: ['universidad', 'emprendimiento', 'proyectos']
    };

    await supabase
      .from('daily_systems_tracking')
      .upsert({
        ...base,
        workout_duration: minutes,
        workout_intensity: base.workout_intensity || 'moderate',
        completions: { ...(base.completions || {}), 'entrenamiento-fisico': true },
        time_data: { ...(base.time_data || {}), 'entrenamiento-fisico': minutes }
      }, { onConflict: 'tracking_date' });
  };

  const getExerciseProgress = useCallback((exerciseId: string): ExerciseProgress | null => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;

    const exerciseLogs = logs
      .filter(l => l.exercise_id === exerciseId && l.weight_kg)
      .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());

    if (exerciseLogs.length === 0) {
      return {
        exercise,
        initialWeight: 0,
        currentWeight: 0,
        changePercent: 0,
        trend: 'stable',
        logs: []
      };
    }

    const initialWeight = exerciseLogs[0].weight_kg || 0;
    const currentWeight = exerciseLogs[exerciseLogs.length - 1].weight_kg || 0;
    const changePercent = initialWeight > 0 
      ? Math.round(((currentWeight - initialWeight) / initialWeight) * 100) 
      : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (exerciseLogs.length >= 2) {
      const lastTwo = exerciseLogs.slice(-2);
      const prev = lastTwo[0].weight_kg || 0;
      const curr = lastTwo[1].weight_kg || 0;
      trend = curr > prev ? 'up' : curr < prev ? 'down' : 'stable';
    }

    return {
      exercise,
      initialWeight,
      currentWeight,
      changePercent,
      trend,
      logs: exerciseLogs
    };
  }, [exercises, logs]);

  const getAllProgress = useCallback((): ExerciseProgress[] => {
    return exercises
      .map(e => getExerciseProgress(e.id))
      .filter((p): p is ExerciseProgress => p !== null && p.logs.length > 0);
  }, [exercises, getExerciseProgress]);

  const getTodayWorkout = useCallback(() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    
    const isWorkoutDay = routine?.workout_days[today] || false;
    const todayExercises = exercises.filter(e => e.day_of_week === today);
    
    return {
      dayName: DAY_NAMES[today],
      isWorkoutDay,
      exercises: todayExercises
    };
  }, [routine, exercises]);

  const getExercisesByDay = useCallback((day: string) => {
    return exercises.filter(e => e.day_of_week === day);
  }, [exercises]);

  const epley = (weightKg: number, reps: number) => {
    if (weightKg <= 0 || reps <= 0) return 0;
    return Math.round(weightKg * (1 + reps / 30));
  };

  const getExerciseHistory = useCallback((exerciseId: string): ExerciseHistoryPoint[] => {
    return logs
      .filter(l => l.exercise_id === exerciseId)
      .sort((a, b) => a.log_date.localeCompare(b.log_date) || a.created_at.localeCompare(b.created_at))
      .map(l => {
        const reps = (l.reps_per_set || []).filter(r => typeof r === 'number' && !isNaN(r)).reduce((a, b) => a + b, 0);
        const weight = Number(l.weight_kg) || 0;
        return {
          date: l.log_date,
          weight,
          reps,
          e1rm: epley(weight, reps),
          isPr: !!l.is_pr
        };
      });
  }, [logs]);

  const getLastLog = useCallback((exerciseId: string): ExerciseLog | undefined => {
    return logs
      .filter(l => l.exercise_id === exerciseId && l.weight_kg)
      .sort((a, b) => b.log_date.localeCompare(a.log_date) || b.created_at.localeCompare(a.created_at))[0];
  }, [logs]);

  const getSessionPrNames = useCallback((sessionId: string): string[] => {
    const nameById = new Map(exercises.map(e => [e.id, e.name]));
    return logs
      .filter(l => l.session_id === sessionId && l.is_pr)
      .map(l => nameById.get(l.exercise_id) || 'Ejercicio');
  }, [logs, exercises]);

  return {
    routine,
    allRoutines,
    exercises,
    logs,
    sessions,
    isLoading,
    createRoutine,
    updateRoutine,
    selectRoutine,
    addExercise,
    removeExercise,
    logWorkout,
    startSession,
    finishSession,
    syncWorkoutDuration,
    loadSessions,
    getExerciseProgress,
    getAllProgress,
    getTodayWorkout,
    getExercisesByDay,
    getExerciseHistory,
    getLastLog,
    getSessionPrNames,
    loadAllRoutines,
    reload: loadAll,
    DAY_NAMES
  };
};
