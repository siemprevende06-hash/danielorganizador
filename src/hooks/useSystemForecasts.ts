import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfQuarter, startOfYear, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { pullPlansIntoLocal } from '@/lib/planSync';
import { getQuarterFromDate, loadTrimestralPlanFromLocal, type TrimestralPlanData } from '@/hooks/useTrimestralPlan';
import { CEFR_LEVELS, LANGUAGE_IDS, normalizeCefr, type LanguageId, type LanguageQuarterPlans } from '@/lib/languagePlan';
import type { GameQuarterPlan } from '@/lib/game';
import type { SystemGoal } from '@/lib/systemGoals';
import {
  buildSystemForecasts,
  type ForecastBuildInput,
  type ForecastChessGoal,
  type ForecastExerciseLog,
  type ForecastFinancialGoal,
  type ForecastHorizon,
  type ForecastHorizonInfo,
  type ForecastMusicSong,
  type ForecastPhysicalGoal,
  type ForecastQuarterPlan,
  type ForecastTrackingRow,
  type ForecastTransaction,
  type SystemForecastCard,
} from '@/lib/forecasting/systemForecastAdapters';

// ---------------------------------------------------------------------------
// Hook de pronósticos de Metas Sistemas.
//
// Una sola consulta en paralelo trae los resultados de los 13 sistemas y el
// motor puro calcula las tarjetas. React Query refresca al montar, al volver a
// la ventana y cada 90 segundos; el botón de la cabecera fuerza el refresh.
// ---------------------------------------------------------------------------

export const FORECAST_DEADLINES_KEY = 'metas_forecast_deadlines_v1';
const FORECAST_DEADLINES_EVENT = 'metas-forecast-deadlines-updated';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDeadlines(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'string') continue;
    const date = value.slice(0, 10);
    if (DATE_RE.test(date)) out[key] = date;
  }
  return out;
}

export function loadForecastDeadlines(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(FORECAST_DEADLINES_KEY);
    return raw ? normalizeDeadlines(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function useForecastDeadlines() {
  const [deadlines, setDeadlines] = useState<Record<string, string>>(() => loadForecastDeadlines());

  useEffect(() => {
    const sync = () => setDeadlines(loadForecastDeadlines());
    window.addEventListener(FORECAST_DEADLINES_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(FORECAST_DEADLINES_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const commit = useCallback((next: Record<string, string>) => {
    try {
      window.localStorage.setItem(FORECAST_DEADLINES_KEY, JSON.stringify(next));
    } catch {
      // Sin persistencia: la fecha sigue funcionando en memoria.
    }
    setDeadlines(next);
    window.dispatchEvent(new Event(FORECAST_DEADLINES_EVENT));
  }, []);

  const setDeadline = useCallback((systemId: string, date: string) => {
    const key = date.slice(0, 10);
    if (!DATE_RE.test(key)) return;
    commit({ ...loadForecastDeadlines(), [systemId]: key });
  }, [commit]);

  const clearDeadline = useCallback((systemId: string) => {
    const next = { ...loadForecastDeadlines() };
    delete next[systemId];
    commit(next);
  }, [commit]);

  return { deadlines, setDeadline, clearDeadline };
}

export function forecastHorizonInfo(horizon: ForecastHorizon, today: Date): ForecastHorizonInfo {
  if (horizon === 'year') {
    return {
      id: 'year',
      label: `Año ${today.getFullYear()}`,
      startKey: format(startOfYear(today), 'yyyy-MM-dd'),
      endKey: format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd'),
    };
  }
  const { quarter, year } = getQuarterFromDate(today);
  return {
    id: 'quarter',
    label: `Q${quarter} ${year}`,
    startKey: format(startOfQuarter(today), 'yyyy-MM-dd'),
    endKey: format(new Date(year, quarter * 3, 0), 'yyyy-MM-dd'),
  };
}

interface SupabaseResult {
  data?: unknown;
  error: unknown;
}

/**
 * Los tipos generados de Supabase están desactualizados (faltan columnas como
 * `learned_at` o `currency`). Los helpers aceptan la respuesta como `unknown`
 * y el llamador declara el tipo de fila que espera.
 */
function rows<T = any>(result: SupabaseResult | null | undefined): T[] {
  const data = result?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}

function row<T = any>(result: SupabaseResult | null | undefined): T | null {
  const data = result?.data;
  return data == null ? null : (data as T);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function mergeQuarterPlans(plans: TrimestralPlanData[]): ForecastQuarterPlan | null {
  if (!plans.length) return null;

  const selectedSongs = unique(plans.flatMap(plan => plan.songs?.selected ?? []));
  const songsGoal = plans.reduce((sum, plan) => sum + (Number(plan.songs?.goal) || 0), 0);
  const projects = unique(plans.flatMap(plan => plan.projects ?? []));

  let languages: LanguageQuarterPlans | undefined;
  for (const plan of plans) {
    if (!plan.languages) continue;
    if (!languages) {
      languages = { ...plan.languages };
      continue;
    }
    const merged = { ...languages };
    for (const lang of LANGUAGE_IDS) {
      const currentIndex = CEFR_LEVELS.indexOf(merged[lang].levelGoal as any);
      const nextIndex = CEFR_LEVELS.indexOf(plan.languages[lang].levelGoal as any);
      if (nextIndex > currentIndex) merged[lang] = { ...plan.languages[lang] };
    }
    languages = merged;
  }

  let game: GameQuarterPlan | undefined;
  for (const plan of plans) {
    if (!plan.game) continue;
    if (!game) {
      game = { ...plan.game };
      continue;
    }
    game = {
      ...game,
      levelGoal: Math.max(game.levelGoal, plan.game.levelGoal),
      xpGoal: game.xpGoal + plan.game.xpGoal,
      milestone: game.milestone || plan.game.milestone,
      selectedSkills: unique([...game.selectedSkills, ...plan.game.selectedSkills]),
    };
  }

  return {
    songs: { goal: songsGoal, selected: selectedSongs },
    projects,
    languages,
    game,
  };
}

function loadPlanningData(horizon: ForecastHorizon, today: Date): ForecastQuarterPlan | null {
  const { quarter, year } = getQuarterFromDate(today);
  const quarterNumbers = horizon === 'year' ? [1, 2, 3, 4] : [quarter];
  const plans = quarterNumbers
    .map(number => loadTrimestralPlanFromLocal(`Q${number}_${year}`))
    .filter((plan): plan is TrimestralPlanData => !!plan);
  return mergeQuarterPlans(plans);
}

function parseFinanceGoals(raw: unknown): ForecastFinancialGoal[] {
  const value = Array.isArray(raw)
    ? raw
    : (() => {
        try {
          const local = typeof window !== 'undefined' ? window.localStorage.getItem('finance_goals') : null;
          const parsed = local ? JSON.parse(local) : null;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

  return value
    .map((item: any) => ({
      id: String(item?.id ?? ''),
      name: String(item?.name ?? 'Meta de ahorro'),
      targetAmount: Number(item?.targetAmount) || 0,
      currentAmount: Number(item?.currentAmount) || 0,
      createdAt: item?.createdAt,
    }))
    .filter(goal => !!goal.id && goal.targetAmount > 0);
}

function parseExchangeRate(raw: unknown): number | null {
  const direct = Number(raw);
  if (Number.isFinite(direct) && direct > 0) return direct;
  try {
    const local = typeof window !== 'undefined' ? window.localStorage.getItem('finance_exchange_rate') : null;
    const parsed = local ? Number(JSON.parse(local)) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function financeGoalsFromSections(sections: Array<{ section_key: string; content: unknown }>): ForecastFinancialGoal[] {
  const goalsSection = sections.find(section => section.section_key === 'finance_goals');
  return parseFinanceGoals(goalsSection?.content);
}

function exchangeRateFromSections(sections: Array<{ section_key: string; content: unknown }>): number | null {
  const rateSection = sections.find(section => section.section_key === 'finance_exchange_rate');
  return parseExchangeRate(rateSection?.content);
}

export interface UseSystemForecastsOptions {
  goals: SystemGoal[];
  horizon: ForecastHorizon;
  deadlines: Record<string, string>;
}

export interface UseSystemForecastsResult {
  cards: SystemForecastCard[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  horizonInfo: ForecastHorizonInfo;
  refresh: () => void;
}

export function useSystemForecasts({
  goals,
  horizon,
  deadlines,
}: UseSystemForecastsOptions): UseSystemForecastsResult {
  const now = new Date();
  const horizonInfo = useMemo(() => forecastHorizonInfo(horizon, new Date()), [horizon]);
  const goalsKey = useMemo(
    () => goals.map(goal => `${goal.id}:${goal.completed ? 1 : 0}:${goal.date}:${goal.completedAt ?? ''}`).join('|'),
    [goals],
  );
  const deadlinesKey = useMemo(
    () => Object.entries(deadlines).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('|'),
    [deadlines],
  );

  const query = useQuery({
    queryKey: ['system-forecasts', horizon, format(now, 'yyyy-MM-dd'), goalsKey, deadlinesKey],
    queryFn: async (): Promise<SystemForecastCard[]> => {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const since = format(subDays(today, 400), 'yyyy-MM-dd');
      const since200 = format(subDays(today, 200), 'yyyy-MM-dd');

      // Los planes viven en localStorage; se sincronizan antes de leerlos para
      // que el pronóstico use el plan más reciente entre dispositivos.
      await pullPlansIntoLocal();

      const [
        booksRes,
        readingSessionsRes,
        chessGoalRes,
        chessSessionsRes,
        trackingRes,
        citasRes,
        socialRes,
        musicRes,
        uniTasksRes,
        topicsRes,
        examsRes,
        partialsRes,
        projectsRes,
        entGoalsRes,
        entTasksRes,
        incomeRes,
        textSectionsRes,
        transactionsRes,
        physicalGoalRes,
        measurementsRes,
        strengthGoalsRes,
        exercisesRes,
        exerciseLogsRes,
        confidenceRes,
        languageSettingsRes,
      ] = await Promise.all([
        supabase.from('reading_library').select('id,title,status,pages_total,pages_read,start_date,finish_date,created_at,updated_at'),
        supabase.from('reading_sessions').select('session_date,book_id,pages_read').gte('session_date', since).lte('session_date', todayStr).order('session_date', { ascending: true }),
        supabase.from('chess_goals').select('target_elo,starting_elo,created_at').eq('is_active', true).maybeSingle(),
        supabase.from('chess_sessions').select('session_date,current_elo,games_played').gte('session_date', since).lte('session_date', todayStr).order('session_date', { ascending: true }),
        supabase.from('daily_systems_tracking').select('tracking_date,completions,time_data,count_data').gte('tracking_date', since).lte('tracking_date', todayStr).order('tracking_date', { ascending: true }),
        supabase.from('citas').select('fecha').gte('fecha', since).lte('fecha', todayStr),
        supabase.from('eventos_sociales').select('fecha').gte('fecha', since).lte('fecha', todayStr),
        supabase.from('music_repertoire').select('id,title,status,practice_minutes,learned_at,mastered_at,recorded_at,updated_at'),
        supabase.from('tasks').select('id,title,completed,updated_at,due_date,task_type,topic_id,source_id').eq('source', 'university'),
        supabase.from('subject_topics').select('id,title,is_for_final'),
        supabase.from('exams').select('exam_date'),
        supabase.from('partial_exams').select('exam_date'),
        supabase.from('projects').select('id,title,tasks'),
        supabase.from('entrepreneurship_goals').select('id,title,completed,updated_at,created_at'),
        supabase.from('entrepreneurship_tasks').select('id,title,completed,updated_at,due_date,created_at'),
        supabase.from('entrepreneurship_income').select('amount,income_date').gte('income_date', since200).lte('income_date', todayStr),
        supabase.from('text_sections').select('section_key,content').in('section_key', ['finance_goals', 'finance_exchange_rate']),
        supabase.from('transactions').select('transaction_date,amount,transaction_type,currency').gte('transaction_date', since200).lte('transaction_date', todayStr).order('transaction_date', { ascending: true }),
        supabase.from('physical_goals').select('start_weight,target_weight,start_date,target_date').eq('is_active', true).maybeSingle(),
        supabase.from('physical_tracking').select('weight,measurement_date').gte('measurement_date', since).lte('measurement_date', todayStr).order('measurement_date', { ascending: true }),
        supabase.from('strength_goals').select('exercise_key,exercise_name,current_weight_kg,target_weight_kg'),
        supabase.from('workout_exercises').select('id,name'),
        supabase.from('exercise_logs').select('exercise_id,log_date,weight_kg,weights_per_set').gte('log_date', since).lte('log_date', todayStr).order('log_date', { ascending: true }),
        supabase.from('confidence_steps').select('id,completed,updated_at,target_date'),
        supabase.from('language_settings').select('english_level,italian_level').maybeSingle(),
      ]);

      const planning = loadPlanningData(horizon, today);
      const languageSettings = row<{ english_level: string | null; italian_level: string | null }>(languageSettingsRes);
      const currentLevels: Record<LanguageId, string> = {
        ingles: normalizeCefr(languageSettings?.english_level, 'B1.1'),
        italiano: normalizeCefr(languageSettings?.italian_level, 'A1.1'),
      };

      const textSections = rows<{ section_key: string; content: unknown }>(textSectionsRes);

      const input: ForecastBuildInput = {
        today,
        horizon: forecastHorizonInfo(horizon, today),
        goals,
        deadlines,
        reading: {
          books: rows(booksRes),
          sessions: rows(readingSessionsRes),
        },
        chess: {
          goal: row<ForecastChessGoal>(chessGoalRes),
          sessions: rows(chessSessionsRes),
        },
        game: {
          tracking: rows<ForecastTrackingRow>(trackingRes),
          citas: rows<{ fecha: string }>(citasRes).map(item => item.fecha),
          social: rows<{ fecha: string }>(socialRes).map(item => item.fecha),
        },
        languages: {
          tracking: rows<ForecastTrackingRow>(trackingRes),
        },
        music: {
          songs: rows<ForecastMusicSong>(musicRes),
        },
        university: {
          tasks: rows(uniTasksRes),
          topics: rows(topicsRes),
          examDates: [
            ...rows<{ exam_date: string | null }>(examsRes).map(item => item.exam_date),
            ...rows<{ exam_date: string | null }>(partialsRes).map(item => item.exam_date),
          ].filter((date): date is string => !!date),
        },
        entrepreneurship: {
          goals: rows(entGoalsRes),
          tasks: rows(entTasksRes),
          income: rows<{ amount: number | null; income_date: string }>(incomeRes),
        },
        projects: {
          projects: rows(projectsRes).map((project: any) => ({
            id: project.id,
            title: project.title,
            tasks: Array.isArray(project.tasks) ? project.tasks : [],
          })),
          tracking: rows<ForecastTrackingRow>(trackingRes),
        },
        finance: {
          goals: financeGoalsFromSections(textSections),
          transactions: rows<ForecastTransaction>(transactionsRes),
          exchangeRate: exchangeRateFromSections(textSections),
        },
        health: {
          goal: row<ForecastPhysicalGoal>(physicalGoalRes),
          measurements: rows(measurementsRes),
        },
        confidence: {
          steps: rows(confidenceRes),
        },
        appearance: {
          tracking: rows<ForecastTrackingRow>(trackingRes),
        },
        strength: {
          goals: rows(strengthGoalsRes),
          exercises: rows(exercisesRes),
          logs: rows<ForecastExerciseLog>(exerciseLogsRes),
        },
        planning: {
          quarterPlan: planning,
          currentLevels,
        },
      };

      return buildSystemForecasts(input);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 90_000,
    retry: 1,
  });

  return {
    cards: query.data ?? [],
    loading: query.isLoading,
    refreshing: query.isFetching,
    error: query.error ? String((query.error as Error)?.message ?? query.error) : null,
    horizonInfo,
    refresh: () => { void query.refetch(); },
  };
}
