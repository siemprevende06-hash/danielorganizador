import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildStudyPlan,
  countWeekProgress,
  defaultStudyPlanState,
  getStudyCycleInfo,
  loadStudyPlanState,
  saveStudyPlanState,
  STUDY_PLAN_CHANGED_EVENT,
  studyTaskKey,
  type StudyDay,
  type StudyErrorEntry,
  type StudyLanguage,
  type StudyPace,
  type StudyPlanState,
  type StudyTask,
  type StudyWeek,
} from '@/lib/languageStudyPlan';

// ---------------------------------------------------------------------------
// Plan de 4 semanas como fuente de la sesión diaria.
//
// Antes el plan solo vivía dentro de su pestaña. Ahora la pestaña Plan y la
// sesión guiada de Hoy comparten el mismo estado y se refrescan entre sí.
// ---------------------------------------------------------------------------

export interface TodayTask extends StudyTask {
  done: boolean;
}

interface UseLanguageStudyPlanResult {
  state: StudyPlanState;
  plan: StudyWeek[];
  week: StudyWeek | null;
  today: StudyDay | null;
  cycle: ReturnType<typeof getStudyCycleInfo>;
  currentWeek: number;
  weekProgress: { done: number; total: number; percent: number };
  overall: { done: number; total: number; percent: number };
  tasksToday: TodayTask[];
  todayMinutes: number;
  todayDoneMinutes: number;
  toggleTask: (taskId: string) => void;
  setPace: (pace: StudyPace) => void;
  resetProgress: () => void;
  errors: StudyErrorEntry[];
  pendingErrors: StudyErrorEntry[];
  masteredCount: number;
  toggleErrorReviewed: (id: string) => void;
  removeError: (id: string) => void;
  addError: (input: Pick<StudyErrorEntry, 'wrong' | 'correct' | 'note' | 'category'>) => { ok: boolean; reason?: 'empty' | 'duplicate' };
}

export function useLanguageStudyPlan(language: StudyLanguage, level: string): UseLanguageStudyPlanResult {
  const [state, setState] = useState<StudyPlanState>(() => loadStudyPlanState(language));

  // El plan es por idioma: al cambiar de idioma se recarga.
  useEffect(() => {
    setState(loadStudyPlanState(language));
  }, [language]);

  // Otra vista (la pestaña Plan) puede marcar tareas o añadir errores.
  useEffect(() => {
    const refresh = () => setState(loadStudyPlanState(language));
    window.addEventListener(STUDY_PLAN_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(STUDY_PLAN_CHANGED_EVENT, refresh);
  }, [language]);

  const commit = useCallback(
    (next: StudyPlanState) => {
      setState(next);
      saveStudyPlanState(language, next);
    },
    [language]
  );

  const cycle = useMemo(() => getStudyCycleInfo(state.startDate), [state.startDate]);
  const plan = useMemo(() => buildStudyPlan(language, level, state.pace), [language, level, state.pace]);

  const currentWeek = cycle.weekIndex + 1;
  const week = plan[cycle.weekIndex] ?? plan[0] ?? null;
  const today = week?.days[cycle.dayIndex] ?? week?.days[0] ?? null;

  const weekProgress = useMemo(
    () => (week ? countWeekProgress(week, state.completed, cycle.cycleStart) : { done: 0, total: 0, percent: 0 }),
    [week, state.completed, cycle.cycleStart]
  );

  const overall = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const item of plan) {
      const progress = countWeekProgress(item, state.completed, cycle.cycleStart);
      done += progress.done;
      total += progress.total;
    }
    return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [plan, state.completed, cycle.cycleStart]);

  const tasksToday = useMemo<TodayTask[]>(() => {
    if (!week || !today) return [];
    return today.tasks.map(task => ({
      ...task,
      done: !!state.completed[studyTaskKey(cycle.cycleStart, week.week, today.id, task.id)],
    }));
  }, [week, today, state.completed, cycle.cycleStart]);

  const todayMinutes = tasksToday.reduce((sum, task) => sum + task.minutes, 0);
  const todayDoneMinutes = tasksToday.reduce((sum, task) => sum + (task.done ? task.minutes : 0), 0);

  const toggleTask = useCallback(
    (taskId: string) => {
      if (!week || !today) return;
      const key = studyTaskKey(cycle.cycleStart, week.week, today.id, taskId);
      const completed = { ...state.completed };
      if (completed[key]) delete completed[key];
      else completed[key] = true;
      commit({ ...state, completed });
    },
    [week, today, cycle.cycleStart, state, commit]
  );

  const setPace = useCallback(
    (pace: StudyPace) => {
      if (pace === state.pace) return;
      commit({ ...state, pace });
    },
    [state, commit]
  );

  const resetProgress = useCallback(() => {
    commit({ ...state, startDate: defaultStudyPlanState().startDate, completed: {} });
  }, [state, commit]);

  const toggleErrorReviewed = useCallback(
    (id: string) => {
      commit({
        ...state,
        errors: state.errors.map(entry => (entry.id === id ? { ...entry, reviewed: !entry.reviewed } : entry)),
      });
    },
    [state, commit]
  );

  const removeError = useCallback(
    (id: string) => {
      commit({ ...state, errors: state.errors.filter(entry => entry.id !== id) });
    },
    [state, commit]
  );

  const addError = useCallback(
    (input: Pick<StudyErrorEntry, 'wrong' | 'correct' | 'note' | 'category'>) => {
      const wrong = input.wrong.trim();
      const correct = input.correct.trim();
      if (!wrong || !correct) return { ok: false, reason: 'empty' as const };
      if (state.errors.some(entry => entry.wrong.toLowerCase() === wrong.toLowerCase())) {
        return { ok: false, reason: 'duplicate' as const };
      }
      const entry: StudyErrorEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        wrong,
        correct,
        note: input.note.trim(),
        category: input.category,
        createdAt: new Date().toISOString(),
        reviewed: false,
      };
      commit({ ...state, errors: [entry, ...state.errors] });
      return { ok: true };
    },
    [state, commit]
  );

  const pendingErrors = useMemo(() => state.errors.filter(entry => !entry.reviewed), [state.errors]);

  return {
    state,
    plan,
    week,
    today,
    cycle,
    currentWeek,
    weekProgress,
    overall,
    tasksToday,
    todayMinutes,
    todayDoneMinutes,
    toggleTask,
    setPace,
    resetProgress,
    errors: state.errors,
    pendingErrors,
    masteredCount: state.errors.length - pendingErrors.length,
    toggleErrorReviewed,
    removeError,
    addError,
  };
}
