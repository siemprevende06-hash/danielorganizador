import { addDays, differenceInCalendarDays, endOfQuarter, format, startOfQuarter } from 'date-fns';
import {
  computeResultForecast,
  type ForecastPoint,
  type ResultForecast,
} from '@/lib/forecasting/resultForecast';
import { METAS_SYSTEMS, type MetaSystemDef } from '@/lib/metasSistemas';
import type { SystemGoal } from '@/lib/systemGoals';
import {
  GAME_XP,
  gameDayXp,
  gameLevel,
  type GameQuarterPlan,
} from '@/lib/game';
import {
  CEFR_LEVELS,
  LANGUAGE_IDS,
  LANGUAGE_LABELS,
  normalizeCefr,
  type CefrLevel,
  type LanguageId,
  type LanguageQuarterPlans,
} from '@/lib/languagePlan';

// ---------------------------------------------------------------------------
// Adaptadores de resultados por sistema.
//
// El motor (resultForecast.ts) es genérico. Este archivo traduce los datos de
// cada sistema a una serie medible y decide la meta y la fecha límite:
//   1. Meta numérica propia del sistema (libro, ELO, peso, fuerza…).
//   2. Si no existe, metas con fecha de `system_goals_v1`.
//   3. Si tampoco hay, "Sin meta".
//
// Los proxies (adherencia de skincare, minutos por tarea de proyecto) se
// declaran siempre como supuesto para que el pronóstico sea transparente.
// ---------------------------------------------------------------------------

const HISTORY_DAYS = 180;
const MINUTES_PER_CEFR_LEVEL = 1800;
const MINUTES_PER_PROJECT_TASK = 600;
const SKINCARE_TARGET_PCT = 0.86;

export type ForecastHorizon = 'quarter' | 'year';

export interface ForecastHorizonInfo {
  id: ForecastHorizon;
  label: string;
  startKey: string;
  endKey: string;
}

export interface ForecastTrackingRow {
  tracking_date: string;
  completions?: Record<string, boolean> | null;
  time_data?: Record<string, number> | null;
  count_data?: Record<string, number> | null;
}

export interface ForecastReadingBook {
  id: string;
  title: string;
  status: string;
  pages_total: number | null;
  pages_read: number | null;
  start_date: string | null;
  finish_date: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface ForecastReadingSession {
  session_date: string;
  book_id: string | null;
  pages_read: number | null;
}

export interface ForecastChessSession {
  session_date: string;
  current_elo: number | null;
  games_played: number | null;
}

export interface ForecastChessGoal {
  target_elo: number | null;
  starting_elo: number | null;
  created_at: string;
}

export interface ForecastMusicSong {
  id: string;
  title: string;
  status: string | null;
  practice_minutes: number | null;
  learned_at: string | null;
  mastered_at: string | null;
  recorded_at: string | null;
  updated_at: string | null;
}

export interface ForecastUniversityTask {
  id: string;
  title: string;
  completed: boolean | null;
  updated_at: string;
  due_date: string | null;
  task_type: string | null;
  topic_id: string | null;
  source_id: string | null;
}

export interface ForecastTopic {
  id: string;
  title: string;
  is_for_final: boolean | null;
}

export interface ForecastEntrepreneurshipGoal {
  id: string;
  title: string;
  completed: boolean | null;
  updated_at: string;
  created_at: string;
}

export interface ForecastEntrepreneurshipTask {
  id: string;
  title: string;
  completed: boolean | null;
  updated_at: string;
  due_date: string | null;
  created_at: string;
}

export interface ForecastIncomeRow {
  amount: number | null;
  income_date: string;
}

export interface ForecastProject {
  id: string;
  title: string;
  tasks: Array<{ id: string; title: string; completed?: boolean }> | null;
}

export interface ForecastFinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt?: string;
}

export interface ForecastTransaction {
  transaction_date: string;
  amount: number | null;
  transaction_type: string | null;
  currency: string | null;
}

export interface ForecastPhysicalGoal {
  start_weight: number | null;
  target_weight: number | null;
  start_date: string | null;
  target_date: string | null;
}

export interface ForecastMeasurement {
  weight: number | null;
  measurement_date: string;
}

export interface ForecastConfidenceStep {
  id: string;
  completed: boolean | null;
  updated_at: string;
  target_date: string | null;
}

export interface ForecastStrengthGoal {
  exercise_key: string;
  exercise_name: string;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
}

export interface ForecastWorkoutExercise {
  id: string;
  name: string;
}

export interface ForecastExerciseLog {
  exercise_id: string;
  log_date: string;
  weight_kg: number | null;
  weights_per_set: number[] | null;
}

export interface ForecastQuarterPlan {
  books?: { goal: number; selected: string[] };
  songs?: { goal: number; selected: string[] };
  projects?: string[];
  languages?: LanguageQuarterPlans;
  game?: GameQuarterPlan;
}

export interface ForecastPlanningData {
  quarterPlan: ForecastQuarterPlan | null;
  currentLevels: Record<LanguageId, string>;
}

export interface ForecastBuildInput {
  today: Date;
  horizon: ForecastHorizonInfo;
  goals: SystemGoal[];
  deadlines: Record<string, string>;
  reading: {
    books: ForecastReadingBook[];
    sessions: ForecastReadingSession[];
  };
  chess: {
    goal: ForecastChessGoal | null;
    sessions: ForecastChessSession[];
  };
  game: {
    tracking: ForecastTrackingRow[];
    citas: string[];
    social: string[];
  };
  languages: {
    tracking: ForecastTrackingRow[];
  };
  music: {
    songs: ForecastMusicSong[];
  };
  university: {
    tasks: ForecastUniversityTask[];
    topics: ForecastTopic[];
    examDates: string[];
  };
  entrepreneurship: {
    goals: ForecastEntrepreneurshipGoal[];
    tasks: ForecastEntrepreneurshipTask[];
    income: ForecastIncomeRow[];
  };
  projects: {
    projects: ForecastProject[];
    tracking: ForecastTrackingRow[];
  };
  finance: {
    goals: ForecastFinancialGoal[];
    transactions: ForecastTransaction[];
    exchangeRate: number | null;
  };
  health: {
    goal: ForecastPhysicalGoal | null;
    measurements: ForecastMeasurement[];
  };
  confidence: {
    steps: ForecastConfidenceStep[];
  };
  appearance: {
    tracking: ForecastTrackingRow[];
  };
  strength: {
    goals: ForecastStrengthGoal[];
    exercises: ForecastWorkoutExercise[];
    logs: ForecastExerciseLog[];
  };
  planning: ForecastPlanningData;
}

export type ForecastDeadlineSource = 'custom' | 'target' | 'goal' | 'horizon';

export interface SystemForecastCard {
  systemId: string;
  label: string;
  emoji: string;
  kind: 'area' | 'system';
  forecast: ResultForecast;
  deadline: string | null;
  deadlineSource: ForecastDeadlineSource;
  /** "Meta numérica", "Metas del sistema", "Proxy de adherencia"… */
  sourceLabel: string;
  /** Líneas cortas de contexto para la tarjeta. */
  context: string[];
  /** Valores legibles (nivel, rango, texto) cuando el número no es suficiente. */
  displayCurrent: string;
  displayTarget: string;
  href: string;
  isGoalFallback: boolean;
  goalCount?: number;
  goalDone?: number;
}

interface DeadlineInfo {
  deadline: string;
  source: ForecastDeadlineSource;
}

interface CardExtras {
  context: string[];
  href: string;
  sourceLabel: string;
  deadlineInfo: DeadlineInfo;
  displayCurrent?: string;
  displayTarget?: string;
  isGoalFallback?: boolean;
  goalCount?: number;
  goalDone?: number;
}

// ---------------------------------------------------------------------------
// Utilidades de fechas y series
// ---------------------------------------------------------------------------

function todayKey(today: Date): string {
  return format(today, 'yyyy-MM-dd');
}

function dayKey(value: unknown): string | null {
  if (!value) return null;
  const key = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
}

function parseDay(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

function eachDayKey(startKey: string, endKey: string): string[] {
  const out: string[] = [];
  if (!startKey || !endKey || startKey > endKey) return out;
  let cursor = parseDay(startKey);
  const end = parseDay(endKey);
  let guard = 0;
  while (cursor <= end && guard < 1000) {
    out.push(format(cursor, 'yyyy-MM-dd'));
    cursor = addDays(cursor, 1);
    guard++;
  }
  return out;
}

function historyStart(today: Date, startedAt?: string | null): string {
  const floor = format(addDays(today, -HISTORY_DAYS), 'yyyy-MM-dd');
  const start = dayKey(startedAt);
  return start && start > floor ? start : floor;
}

function earliestKey(...keys: Array<string | null | undefined>): string | null {
  const valid = keys.filter((key): key is string => !!key && /^\d{4}-\d{2}-\d{2}$/.test(key));
  return valid.length ? valid.sort()[0] : null;
}

function latestKey(...keys: Array<string | null | undefined>): string | null {
  const valid = keys.filter((key): key is string => !!key && /^\d{4}-\d{2}-\d{2}$/.test(key));
  return valid.length ? valid.sort()[valid.length - 1] : null;
}

function countByDay(dates: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const raw of dates) {
    const key = dayKey(raw);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function numberFrom(record: unknown, key: string): number {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return 0;
  const value = Number((record as Record<string, unknown>)[key]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function flagFrom(record: unknown, key: string): boolean {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
  return (record as Record<string, unknown>)[key] === true;
}

/** Serie acumulada diaria que termina exactamente en `current`. */
function cumulativeSeries(params: {
  startKey: string;
  endKey: string;
  current: number;
  events: Array<{ date: string; value: number }>;
}): ForecastPoint[] {
  const events = new Map<string, number>();
  for (const event of params.events) {
    const key = dayKey(event.date);
    if (!key || key < params.startKey || key > params.endKey) continue;
    if (!Number.isFinite(event.value) || event.value <= 0) continue;
    events.set(key, (events.get(key) ?? 0) + event.value);
  }

  const total = [...events.values()].reduce((sum, value) => sum + value, 0);
  const current = Math.max(0, params.current);
  const scale = total > current && total > 0 ? current / total : 1;
  const offset = Math.max(0, current - total * scale);

  const out: ForecastPoint[] = [];
  let running = offset;
  for (const key of eachDayKey(params.startKey, params.endKey)) {
    running += (events.get(key) ?? 0) * scale;
    out.push({ date: key, value: Math.min(current, running) });
  }
  if (out.length) out[out.length - 1] = { date: out[out.length - 1].date, value: current };
  return out;
}

/**
 * Serie anclada al valor actual: el avance diario viene de un proxy (minutos)
 * pero la serie termina en el progreso real de hoy. Si el proxy supera el
 * progreso real, se escala para que el inicio nunca quede por debajo de cero.
 */
function anchoredSeries(params: {
  startKey: string;
  endKey: string;
  current: number;
  dailyProgress: Array<{ date: string; value: number }>;
}): ForecastPoint[] {
  const progress = new Map<string, number>();
  for (const item of params.dailyProgress) {
    const key = dayKey(item.date);
    if (!key || key < params.startKey || key > params.endKey) continue;
    if (!Number.isFinite(item.value) || item.value <= 0) continue;
    progress.set(key, (progress.get(key) ?? 0) + item.value);
  }

  const keys = eachDayKey(params.startKey, params.endKey);
  const total = [...progress.values()].reduce((sum, value) => sum + value, 0);
  const current = Math.max(0, params.current);
  const scale = total > current && total > 0 ? current / total : 1;

  const out: ForecastPoint[] = [];
  let after = 0;
  for (let index = keys.length - 1; index >= 0; index--) {
    const key = keys[index];
    out.push({ date: key, value: Math.max(0, current - after) });
    after += (progress.get(key) ?? 0) * scale;
  }
  out.reverse();
  if (out.length) out[out.length - 1] = { date: out[out.length - 1].date, value: current };
  return out;
}

function absoluteSeries(points: Array<{ date: string; value: number }>): ForecastPoint[] {
  const map = new Map<string, number>();
  for (const point of points) {
    const key = dayKey(point.date);
    if (!key || !Number.isFinite(point.value)) continue;
    map.set(key, point.value);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));
}

// ---------------------------------------------------------------------------
// Fechas límite y metas de respaldo
// ---------------------------------------------------------------------------

function resolveDeadline(
  systemId: string,
  input: ForecastBuildInput,
  targetDate?: string | null,
): DeadlineInfo {
  const custom = dayKey(input.deadlines[systemId]);
  if (custom) return { deadline: custom, source: 'custom' };

  const target = dayKey(targetDate);
  if (target) return { deadline: target, source: 'target' };

  const nextGoal = input.goals
    .filter(goal => goal.systemId === systemId && !goal.completed && dayKey(goal.date))
    .map(goal => dayKey(goal.date) as string)
    .sort()[0];
  if (nextGoal) return { deadline: nextGoal, source: 'goal' };

  return { deadline: input.horizon.endKey, source: 'horizon' };
}

function systemGoalsFor(input: ForecastBuildInput, systemId: string): SystemGoal[] {
  return input.goals.filter(goal => goal.systemId === systemId);
}

function goalCompletionSeries(
  input: ForecastBuildInput,
  systemGoals: SystemGoal[],
): { series: ForecastPoint[]; completed: number; startedAt: string | null } {
  const completedGoals = systemGoals.filter(goal => goal.completed);
  const startedAt = earliestKey(...systemGoals.map(goal => dayKey(goal.createdAt)));
  const events = completedGoals.map(goal => ({
    date: dayKey(goal.completedAt) ?? dayKey(goal.updatedAt) ?? goal.date,
    value: 1,
  }));
  const startKey = historyStart(input.today, startedAt);
  return {
    series: cumulativeSeries({
      startKey,
      endKey: todayKey(input.today),
      current: completedGoals.length,
      events,
    }),
    completed: completedGoals.length,
    startedAt,
  };
}

function goalFallbackCard(
  input: ForecastBuildInput,
  def: MetaSystemDef,
  reason: string,
  href: string,
): SystemForecastCard {
  const systemGoals = systemGoalsFor(input, def.id);
  const deadlineInfo = resolveDeadline(def.id, input);

  if (!systemGoals.length) {
    const forecast = computeResultForecast({
      today: input.today,
      label: 'Metas del sistema',
      unit: 'metas',
      target: null,
      current: 0,
      series: [],
      deadline: deadlineInfo.deadline,
      maxConfidence: 'media',
      targetSource: 'Metas con fecha del sistema',
      noTargetReason: reason,
      assumption: 'Sin meta numérica ni metas con fecha, no hay un resultado que pronosticar.',
    });
    return makeCard(def, forecast, {
      deadlineInfo,
      context: ['Sin meta numérica', 'Sin metas con fecha'],
      href,
      sourceLabel: 'Sin meta',
      isGoalFallback: true,
      goalCount: 0,
      goalDone: 0,
      displayCurrent: '—',
      displayTarget: '—',
    });
  }

  const { series, completed, startedAt } = goalCompletionSeries(input, systemGoals);
  const forecast = computeResultForecast({
    today: input.today,
    label: 'Metas del sistema',
    unit: 'metas',
    target: systemGoals.length,
    current: completed,
    series,
    startedAt,
    deadline: deadlineInfo.deadline,
    seriesMode: 'cumulative',
    maxConfidence: 'media',
    targetSource: 'Metas con fecha del sistema',
    assumption: 'Cada meta con fecha completada cuenta como avance; las pendientes son el objetivo.',
  });

  const pending = systemGoals.length - completed;
  return makeCard(def, forecast, {
    deadlineInfo,
    context: [
      `${completed} de ${systemGoals.length} metas cumplidas`,
      `${pending} pendiente${pending === 1 ? '' : 's'}`,
    ],
    href,
    sourceLabel: 'Metas del sistema',
    isGoalFallback: true,
    goalCount: systemGoals.length,
    goalDone: completed,
    displayCurrent: `${completed} / ${systemGoals.length} metas`,
    displayTarget: `${systemGoals.length} metas`,
  });
}

// ---------------------------------------------------------------------------
// Tarjetas
// ---------------------------------------------------------------------------

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value);
}

function makeCard(
  def: MetaSystemDef,
  forecast: ResultForecast,
  extras: CardExtras,
): SystemForecastCard {
  return {
    systemId: def.id,
    label: def.label,
    emoji: def.emoji,
    kind: def.kind,
    forecast,
    deadline: extras.deadlineInfo.deadline,
    deadlineSource: extras.deadlineInfo.source,
    sourceLabel: extras.sourceLabel,
    context: extras.context,
    displayCurrent: extras.displayCurrent ?? `${formatNumber(forecast.current)} ${forecast.unit}`,
    displayTarget: extras.displayTarget ?? `${formatNumber(forecast.target)} ${forecast.unit}`,
    href: extras.href,
    isGoalFallback: !!extras.isGoalFallback,
    goalCount: extras.goalCount,
    goalDone: extras.goalDone,
  };
}

function numericCard(params: {
  input: ForecastBuildInput;
  def: MetaSystemDef;
  label: string;
  unit: string;
  target: number;
  current: number;
  series: ForecastPoint[];
  startedAt?: string | null;
  targetDate?: string | null;
  direction?: 'up' | 'down';
  seriesMode?: 'cumulative' | 'absolute';
  startValue?: number | null;
  maxConfidence?: 'alta' | 'media' | 'baja' | 'nula';
  maxHistoryDays?: number;
  minDays?: number;
  minActiveDays?: number;
  targetSource: string;
  assumption?: string;
  noTargetReason?: string;
  context: string[];
  href: string;
  sourceLabel: string;
  displayCurrent?: string;
  displayTarget?: string;
}): SystemForecastCard {
  const deadlineInfo = resolveDeadline(params.def.id, params.input, params.targetDate);
  const forecast = computeResultForecast({
    today: params.input.today,
    label: params.label,
    unit: params.unit,
    target: params.target,
    current: params.current,
    series: params.series,
    startedAt: params.startedAt,
    deadline: deadlineInfo.deadline,
    direction: params.direction,
    seriesMode: params.seriesMode,
    startValue: params.startValue,
    maxConfidence: params.maxConfidence,
    maxHistoryDays: params.maxHistoryDays,
    minDays: params.minDays,
    minActiveDays: params.minActiveDays,
    targetSource: params.targetSource,
    assumption: params.assumption,
    noTargetReason: params.noTargetReason,
  });

  return makeCard(params.def, forecast, {
    deadlineInfo,
    context: params.context,
    href: params.href,
    sourceLabel: params.sourceLabel,
    displayCurrent: params.displayCurrent,
    displayTarget: params.displayTarget,
  });
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

function readingCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'lectura');
  const href = '/reading-library';
  const books = [...input.reading.books]
    .filter(book => (book.pages_total ?? 0) > 0)
    .sort((a, b) => String(b.updated_at ?? b.created_at).localeCompare(String(a.updated_at ?? a.created_at)));

  const book = books.find(item => item.status === 'reading')
    ?? books.find(item => item.status !== 'completed' && (item.pages_read ?? 0) < (item.pages_total ?? 0));

  if (!book) {
    return goalFallbackCard(
      input,
      def,
      'No hay un libro en curso con páginas totales. Añade páginas al libro para pronosticar la fecha de fin.',
      href,
    );
  }

  const total = Math.max(1, Number(book.pages_total) || 0);
  const current = Math.max(0, Math.min(total, Number(book.pages_read) || 0));
  const bookSessions = input.reading.sessions.filter(session => session.book_id === book.id);
  const sessions = bookSessions.length ? bookSessions : input.reading.sessions;
  const startedAt = dayKey(book.start_date)
    ?? earliestKey(...sessions.map(session => dayKey(session.session_date)))
    ?? dayKey(book.created_at);
  const startKey = historyStart(input.today, startedAt);
  const events = sessions.map(session => ({
    date: session.session_date,
    value: Number(session.pages_read) || 0,
  }));
  const series = cumulativeSeries({
    startKey,
    endKey: todayKey(input.today),
    current,
    events,
  });

  const recentPages = sessions
    .filter(session => (dayKey(session.session_date) ?? '') >= format(addDays(input.today, -14), 'yyyy-MM-dd'))
    .reduce((sum, session) => sum + (Number(session.pages_read) || 0), 0);

  const overallPace = current > 0 && series.length > 1
    ? (current - series[0].value) / Math.max(1, series.length - 1)
    : 0;
  const recentPace = recentPages / 14;
  const paceForDaysLeft = recentPace > 0 ? recentPace : overallPace;
  const daysLeft = paceForDaysLeft > 0 ? Math.ceil((total - current) / paceForDaysLeft) : null;

  return numericCard({
    input,
    def,
    label: `Terminar “${book.title}”`,
    unit: 'pág',
    target: total,
    current,
    series,
    startedAt,
    seriesMode: 'cumulative',
    targetSource: `Libro en curso: ${book.title}`,
    assumption: bookSessions.length
      ? 'Páginas leídas según las sesiones de lectura; los días sin sesión cuentan como 0.'
      : 'El libro no tiene sesiones propias: se usa el ritmo global de lectura como referencia.',
    context: [
      `${current} de ${total} páginas`,
      `${formatNumber(recentPages)} páginas en 14 días`,
      daysLeft != null ? `~${daysLeft} días restantes` : 'Sin ritmo suficiente',
    ],
    href,
    sourceLabel: 'Meta del libro',
    displayCurrent: `${formatNumber(current)} / ${formatNumber(total)} pág`,
    displayTarget: `${formatNumber(total)} pág`,
  });
}

// ---------------------------------------------------------------------------
// Ajedrez
// ---------------------------------------------------------------------------

function chessCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'ajedrez');
  const href = '/chess';
  const goal = input.chess.goal;
  const target = Number(goal?.target_elo) || 0;

  if (!goal || target <= 0) {
    return goalFallbackCard(
      input,
      def,
      'No hay una meta de ELO activa. Define el ELO objetivo en Ajedrez para pronosticar la fecha.',
      href,
    );
  }

  const sessions = [...input.chess.sessions]
    .filter(session => Number(session.current_elo) > 0 && dayKey(session.session_date))
    .sort((a, b) => a.session_date.localeCompare(b.session_date));
  const points: Array<{ date: string; value: number }> = [];
  const startedAt = dayKey(goal.created_at);
  const firstSessionDate = sessions[0]?.session_date ?? null;
  if (goal.starting_elo && startedAt && (!firstSessionDate || startedAt <= firstSessionDate)) {
    points.push({ date: startedAt, value: Number(goal.starting_elo) });
  }
  for (const session of sessions) {
    points.push({ date: session.session_date, value: Number(session.current_elo) });
  }

  const series = absoluteSeries(points);
  const lastSession = sessions[sessions.length - 1];
  const current = lastSession
    ? Number(lastSession.current_elo)
    : (Number(goal.starting_elo) || 0);
  const games30 = sessions
    .filter(session => (dayKey(session.session_date) ?? '') >= format(addDays(input.today, -30), 'yyyy-MM-dd'))
    .reduce((sum, session) => sum + (Number(session.games_played) || 0), 0);

  return numericCard({
    input,
    def,
    label: 'ELO objetivo',
    unit: 'ELO',
    target,
    current,
    series,
    startedAt: series[0]?.date ?? startedAt,
    seriesMode: 'absolute',
    startValue: Number(goal.starting_elo) || current,
    maxConfidence: 'media',
    targetSource: 'Meta de ELO activa',
    assumption: 'El ELO es ruidoso: la confianza se limita a media y el rango refleja esa variabilidad.',
    context: [
      `ELO actual ${formatNumber(current)}`,
      `Objetivo ${formatNumber(target)}`,
      `${formatNumber(games30)} partidas en 30 días`,
    ],
    href,
    sourceLabel: 'Meta de ELO',
    displayCurrent: `ELO ${formatNumber(current)}`,
    displayTarget: `ELO ${formatNumber(target)}`,
  });
}

// ---------------------------------------------------------------------------
// Game (Seducción)
// ---------------------------------------------------------------------------

function gameCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'game');
  const href = '/daily';
  const plan = input.planning.quarterPlan?.game;
  const levelGoal = Math.max(0, Number(plan?.levelGoal) || 0);
  const xpGoal = Math.max(0, Number(plan?.xpGoal) || 0);

  if (!levelGoal && !xpGoal) {
    return goalFallbackCard(
      input,
      def,
      'No hay un nivel o XP objetivo en el plan del trimestre. Añádelo en Planificación para pronosticar Game.',
      href,
    );
  }

  const citasByDay = countByDay(input.game.citas);
  const socialByDay = countByDay(input.game.social);
  const dayMap = new Map<string, { minutes: number; actions: number; numbers: number; citas: number; social: number }>();

  const ensure = (key: string) => {
    const existing = dayMap.get(key);
    if (existing) return existing;
    const created = { minutes: 0, actions: 0, numbers: 0, citas: 0, social: 0 };
    dayMap.set(key, created);
    return created;
  };

  for (const row of input.game.tracking) {
    const key = dayKey(row.tracking_date);
    if (!key) continue;
    const day = ensure(key);
    day.minutes += numberFrom(row.time_data, 'game');
    day.actions += numberFrom(row.count_data, 'game_acciones');
    day.numbers += numberFrom(row.count_data, 'game_numeros');
  }
  citasByDay.forEach((count, key) => { ensure(key).citas += count; });
  socialByDay.forEach((count, key) => { ensure(key).social += count; });

  const events = [...dayMap.entries()]
    .map(([date, day]) => ({
      date,
      value: gameDayXp({
        minutes: day.minutes,
        actions: day.actions,
        numbers: day.numbers,
        citas: day.citas,
        social: day.social,
      }).total,
    }))
    .filter(event => event.value > 0);

  const totalXp = events.reduce((sum, event) => sum + event.value, 0);
  const level = gameLevel(totalXp);
  const commonAssumption = 'XP: 1 por cada 10 min (máx. 3/día), 5 por acción (máx. 3/día), 10 por número (máx. 2/día), 30 por cita y 10 por evento social (máx. 1/día).';

  if (levelGoal > 0) {
    // `gameLevel` sube de nivel cada 300 XP: para estar en el nivel N hacen
    // falta (N − 1) × 300 XP.
    const targetXp = Math.max(0, (levelGoal - 1) * GAME_XP.levelXp);
    const series = cumulativeSeries({
      startKey: historyStart(input.today, earliestKey(...events.map(event => event.date))),
      endKey: todayKey(input.today),
      current: totalXp,
      events,
    });
    return numericCard({
      input,
      def,
      label: `Nivel ${levelGoal} de Game`,
      unit: 'XP',
      target: targetXp,
      current: totalXp,
      series,
      startedAt: earliestKey(...events.map(event => event.date)),
      seriesMode: 'cumulative',
      maxConfidence: 'media',
      targetSource: `Nivel ${levelGoal} del trimestre`,
      assumption: commonAssumption,
      context: [
        `Nivel ${level.level} · ${formatNumber(totalXp)} XP`,
        `Faltan ${formatNumber(Math.max(0, targetXp - totalXp))} XP`,
        `${formatNumber(level.xpToNext)} XP para el siguiente nivel`,
      ],
      href,
      sourceLabel: 'Nivel del trimestre',
      displayCurrent: `Nivel ${level.level}`,
      displayTarget: `Nivel ${levelGoal}`,
    });
  }

  // Meta de XP del trimestre: se mide el XP ganado desde el inicio del trimestre.
  const quarterStart = format(startOfQuarter(input.today), 'yyyy-MM-dd');
  const quarterEnd = format(endOfQuarter(input.today), 'yyyy-MM-dd');
  const quarterEvents = events.filter(event => event.date >= quarterStart);
  const currentXp = quarterEvents.reduce((sum, event) => sum + event.value, 0);
  const series = cumulativeSeries({
    startKey: quarterStart,
    endKey: todayKey(input.today),
    current: currentXp,
    events: quarterEvents,
  });

  return numericCard({
    input,
    def,
    label: 'XP del trimestre',
    unit: 'XP',
    target: xpGoal,
    current: currentXp,
    series,
    startedAt: quarterStart,
    targetDate: quarterEnd,
    seriesMode: 'cumulative',
    maxConfidence: 'media',
    targetSource: 'XP objetivo del trimestre',
    assumption: commonAssumption,
    context: [
      `${formatNumber(currentXp)} de ${formatNumber(xpGoal)} XP`,
      `Nivel ${level.level}`,
      `${formatNumber(Math.max(0, xpGoal - currentXp))} XP restantes`,
    ],
    href,
    sourceLabel: 'XP del trimestre',
    displayCurrent: `${formatNumber(currentXp)} XP`,
    displayTarget: `${formatNumber(xpGoal)} XP`,
  });
}

// ---------------------------------------------------------------------------
// Idiomas
// ---------------------------------------------------------------------------

function languagesCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'idiomas');
  const href = '/languages-dashboard';
  const plans = input.planning.quarterPlan?.languages;

  if (!plans) {
    return goalFallbackCard(
      input,
      def,
      'No hay niveles CEFR objetivo en el plan del trimestre. Añádelos en Planificación para pronosticar Idiomas.',
      href,
    );
  }

  const parts: string[] = [];
  let totalRemaining = 0;
  let currentIndexSum = 0;
  let targetIndexSum = 0;

  for (const lang of LANGUAGE_IDS) {
    const configured = normalizeCefr(input.planning.currentLevels[lang], 'A1.1');
    const target = normalizeCefr(plans[lang]?.levelGoal, configured);
    const currentIndex = CEFR_LEVELS.indexOf(configured as CefrLevel);
    const targetIndex = CEFR_LEVELS.indexOf(target as CefrLevel);
    const remaining = Math.max(0, targetIndex - currentIndex);
    totalRemaining += remaining;
    currentIndexSum += Math.max(0, currentIndex);
    targetIndexSum += Math.max(0, targetIndex);
    parts.push(`${LANGUAGE_LABELS[lang]}: ${configured} → ${target}`);
  }

  const startKey = input.horizon.startKey;
  const endKey = todayKey(input.today);
  const minutesByDay = new Map<string, number>();
  for (const row of input.languages.tracking) {
    const key = dayKey(row.tracking_date);
    if (!key || key < startKey || key > endKey) continue;
    const minutes = numberFrom(row.time_data, 'ingles') + numberFrom(row.time_data, 'italiano');
    if (minutes > 0) minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + minutes);
  }
  const currentMinutes = [...minutesByDay.values()].reduce((sum, value) => sum + value, 0);
  const targetMinutes = totalRemaining * MINUTES_PER_CEFR_LEVEL;
  const activeDays = minutesByDay.size;

  // Si ya se cumplieron los niveles, la meta está lograda.
  const target = totalRemaining > 0 ? Math.max(1, targetMinutes) : Math.max(1, currentMinutes);
  const current = totalRemaining > 0 ? currentMinutes : target;
  const series = cumulativeSeries({
    startKey,
    endKey,
    current,
    events: [...minutesByDay.entries()].map(([date, value]) => ({ date, value })),
  });

  return numericCard({
    input,
    def,
    label: 'Práctica hacia el nivel CEFR',
    unit: 'min',
    target,
    current,
    series,
    startedAt: startKey,
    seriesMode: 'cumulative',
    maxConfidence: 'baja',
    targetSource: 'Niveles CEFR del trimestre',
    assumption: `Supuesto: ${MINUTES_PER_CEFR_LEVEL} min (30 h) de práctica por subnivel CEFR.`,
    context: [
      ...parts,
      totalRemaining > 0
        ? `${formatNumber(currentMinutes)} min en el periodo · faltan ${formatNumber(targetMinutes)} min`
        : 'Niveles objetivo ya alcanzados',
      `${activeDays} días activos`,
    ],
    href,
    sourceLabel: 'Niveles CEFR',
    displayCurrent: parts.join(' · '),
    displayTarget: totalRemaining > 0
      ? `${formatNumber(targetIndexSum)} niveles CEFR`
      : `${formatNumber(currentIndexSum)} niveles CEFR`,
  });
}

// ---------------------------------------------------------------------------
// Música
// ---------------------------------------------------------------------------

function songCompletionDate(song: ForecastMusicSong): string | null {
  return dayKey(song.mastered_at)
    ?? dayKey(song.recorded_at)
    ?? (song.status === 'mastered' ? dayKey(song.updated_at) : null);
}

function musicCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'musica');
  const href = '/music-dashboard';
  const songPlan = input.planning.quarterPlan?.songs;
  const selectedIds = songPlan?.selected ?? [];
  const goal = Math.max(0, Number(songPlan?.goal) || 0);

  if (!selectedIds.length && goal <= 0) {
    return goalFallbackCard(
      input,
      def,
      'No hay canciones seleccionadas ni meta de canciones en el trimestre. Añádelas en Planificación para pronosticar Música.',
      href,
    );
  }

  const selectedSongs = selectedIds.length
    ? input.music.songs.filter(song => selectedIds.includes(song.id))
    : [];
  const scopeSongs = selectedSongs.length ? selectedSongs : input.music.songs;
  const target = selectedSongs.length
    ? Math.max(selectedSongs.length, goal)
    : goal;

  const completedSongs = scopeSongs.filter(song => !!songCompletionDate(song));
  const current = selectedSongs.length
    ? completedSongs.length
    : completedSongs.filter(song => (songCompletionDate(song) ?? '') >= input.horizon.startKey).length;

  const events = completedSongs
    .map(song => ({ date: songCompletionDate(song) as string, value: 1 }))
    .filter(event => selectedSongs.length || event.date >= input.horizon.startKey);

  const practiceMinutes = scopeSongs.reduce((sum, song) => sum + (Number(song.practice_minutes) || 0), 0);
  const learning = scopeSongs.filter(song => song.status === 'learning').length;

  return numericCard({
    input,
    def,
    label: selectedSongs.length ? 'Canciones del trimestre' : 'Canciones completadas en el periodo',
    unit: 'canciones',
    target,
    current,
    series: cumulativeSeries({
      startKey: historyStart(input.today, earliestKey(...events.map(event => event.date))),
      endKey: todayKey(input.today),
      current,
      events,
    }),
    startedAt: earliestKey(...events.map(event => event.date)),
    seriesMode: 'cumulative',
    maxConfidence: 'media',
    targetSource: selectedSongs.length ? 'Canciones seleccionadas en el trimestre' : 'Meta de canciones del trimestre',
    assumption: 'Una canción cuenta como completada al dominarla o grabarla.',
    context: [
      `${current} de ${target} canciones`,
      `${learning} en aprendizaje`,
      `${formatNumber(practiceMinutes)} min de práctica`,
    ],
    href,
    sourceLabel: 'Canciones del trimestre',
    displayCurrent: `${current} / ${target} canciones`,
    displayTarget: `${target} canciones`,
  });
}

// ---------------------------------------------------------------------------
// Universidad
// ---------------------------------------------------------------------------

function universityCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'universidad');
  const href = '/university';
  const tasks = input.university.tasks;
  const finalTopics = input.university.topics.filter(topic => topic.is_for_final);
  const nextExam = [...input.university.examDates]
    .map(dayKey)
    .filter((key): key is string => !!key && key >= todayKey(input.today))
    .sort()[0] ?? null;

  if (finalTopics.length) {
    const completedByTopic = new Map<string, string>();
    for (const task of tasks) {
      if (!task.completed || !task.topic_id) continue;
      const date = dayKey(task.updated_at) ?? dayKey(task.due_date);
      if (!date) continue;
      const previous = completedByTopic.get(task.topic_id);
      if (!previous || date > previous) completedByTopic.set(task.topic_id, date);
    }
    const current = finalTopics.filter(topic => completedByTopic.has(topic.id)).length;
    const events = [...completedByTopic.entries()].map(([, date]) => ({ date, value: 1 }));
    const pendingTasks = tasks.filter(task => !task.completed).length;

    return numericCard({
      input,
      def,
      label: 'Temas para el final',
      unit: 'temas',
      target: finalTopics.length,
      current,
      series: cumulativeSeries({
        startKey: historyStart(input.today, earliestKey(...events.map(event => event.date))),
        endKey: todayKey(input.today),
        current,
        events,
      }),
      startedAt: earliestKey(...events.map(event => event.date)),
      targetDate: nextExam,
      seriesMode: 'cumulative',
      maxConfidence: 'media',
      targetSource: 'Temas marcados para el final',
      assumption: 'Un tema del final cuenta como dominado cuando tiene al menos una tarea completada. La fecha de actualización se usa como fecha de cumplimiento.',
      context: [
        `${current} de ${finalTopics.length} temas`,
        nextExam ? `Próximo examen: ${format(parseDay(nextExam), 'd MMM')}` : 'Sin examen próximo',
        `${pendingTasks} tareas pendientes`,
      ],
      href,
      sourceLabel: 'Temas del final',
      displayCurrent: `${current} / ${finalTopics.length} temas`,
      displayTarget: `${finalTopics.length} temas`,
    });
  }

  if (!tasks.length) {
    return goalFallbackCard(
      input,
      def,
      'No hay temas para el final ni tareas de universidad con seguimiento. Añade tareas para pronosticar.',
      href,
    );
  }

  const completed = tasks.filter(task => task.completed);
  const events = completed
    .map(task => ({ date: dayKey(task.updated_at) ?? dayKey(task.due_date), value: 1 }))
    .filter((event): event is { date: string; value: number } => !!event.date);

  return numericCard({
    input,
    def,
    label: 'Tareas de universidad',
    unit: 'tareas',
    target: tasks.length,
    current: completed.length,
    series: cumulativeSeries({
      startKey: historyStart(input.today, earliestKey(...events.map(event => event.date))),
      endKey: todayKey(input.today),
      current: completed.length,
      events,
    }),
    startedAt: earliestKey(...events.map(event => event.date)),
    targetDate: nextExam,
    seriesMode: 'cumulative',
    maxConfidence: 'media',
    targetSource: 'Tareas de universidad',
    assumption: 'La fecha de actualización se usa como fecha de finalización de la tarea.',
    context: [
      `${completed.length} de ${tasks.length} tareas`,
      nextExam ? `Próximo examen: ${format(parseDay(nextExam), 'd MMM')}` : 'Sin examen próximo',
      `${tasks.length - completed.length} pendientes`,
    ],
    href,
    sourceLabel: 'Tareas de universidad',
    displayCurrent: `${completed.length} / ${tasks.length} tareas`,
    displayTarget: `${tasks.length} tareas`,
  });
}

// ---------------------------------------------------------------------------
// Emprendimiento
// ---------------------------------------------------------------------------

function entrepreneurshipCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'emprendimiento');
  const href = '/entrepreneurship';
  const goals = input.entrepreneurship.goals;
  const tasks = input.entrepreneurship.tasks;
  const quarterStart = input.horizon.startKey;
  const income = input.entrepreneurship.income
    .filter(row => (dayKey(row.income_date) ?? '') >= quarterStart)
    .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  if (goals.length) {
    const completed = goals.filter(goal => goal.completed);
    const events = completed.map(goal => ({
      date: dayKey(goal.updated_at) ?? dayKey(goal.created_at),
      value: 1,
    })).filter((event): event is { date: string; value: number } => !!event.date);

    return numericCard({
      input,
      def,
      label: 'Metas de emprendimiento',
      unit: 'metas',
      target: goals.length,
      current: completed.length,
      series: cumulativeSeries({
        startKey: historyStart(input.today, earliestKey(...events.map(event => event.date))),
        endKey: todayKey(input.today),
        current: completed.length,
        events,
      }),
      startedAt: earliestKey(...events.map(event => event.date)),
      seriesMode: 'cumulative',
      maxConfidence: 'media',
      targetSource: 'Metas de emprendimiento',
      assumption: 'La fecha de actualización se usa como fecha de cumplimiento de la meta.',
      context: [
        `${completed.length} de ${goals.length} metas`,
        `${tasks.filter(task => task.completed).length} de ${tasks.length} tareas`,
        `${formatNumber(income)} en ingresos del periodo`,
      ],
      href,
      sourceLabel: 'Metas de emprendimiento',
      displayCurrent: `${completed.length} / ${goals.length} metas`,
      displayTarget: `${goals.length} metas`,
    });
  }

  if (!tasks.length) {
    return goalFallbackCard(
      input,
      def,
      'No hay metas ni tareas de emprendimiento con seguimiento. Añade metas para pronosticar.',
      href,
    );
  }

  const completed = tasks.filter(task => task.completed);
  const events = completed.map(task => ({
    date: dayKey(task.updated_at) ?? dayKey(task.due_date),
    value: 1,
  })).filter((event): event is { date: string; value: number } => !!event.date);

  return numericCard({
    input,
    def,
    label: 'Tareas de emprendimiento',
    unit: 'tareas',
    target: tasks.length,
    current: completed.length,
    series: cumulativeSeries({
      startKey: historyStart(input.today, earliestKey(...events.map(event => event.date))),
      endKey: todayKey(input.today),
      current: completed.length,
      events,
    }),
    startedAt: earliestKey(...events.map(event => event.date)),
    seriesMode: 'cumulative',
    maxConfidence: 'media',
    targetSource: 'Tareas de emprendimiento',
    assumption: 'La fecha de actualización se usa como fecha de finalización de la tarea.',
    context: [
      `${completed.length} de ${tasks.length} tareas`,
      `${formatNumber(income)} en ingresos del periodo`,
    ],
    href,
    sourceLabel: 'Tareas de emprendimiento',
    displayCurrent: `${completed.length} / ${tasks.length} tareas`,
    displayTarget: `${tasks.length} tareas`,
  });
}

// ---------------------------------------------------------------------------
// Proyectos
// ---------------------------------------------------------------------------

function projectsCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'proyectos');
  const href = '/projects';
  const selectedIds = input.planning.quarterPlan?.projects ?? [];
  const allProjects = input.projects.projects.filter(project => (project.tasks?.length ?? 0) > 0);
  const scope = selectedIds.length
    ? allProjects.filter(project => selectedIds.includes(project.id))
    : allProjects;

  if (!scope.length) {
    return goalFallbackCard(
      input,
      def,
      'No hay proyectos con tareas. Añade tareas a un proyecto para pronosticar.',
      href,
    );
  }

  let target = 0;
  let current = 0;
  for (const project of scope) {
    const tasks = project.tasks ?? [];
    target += tasks.length;
    current += tasks.filter(task => task.completed).length;
  }

  const startKey = historyStart(input.today, null);
  const dailyProgress = input.projects.tracking
    .map(row => ({
      date: row.tracking_date,
      value: numberFrom(row.time_data, 'proyectos') / MINUTES_PER_PROJECT_TASK,
    }))
    .filter(item => item.value > 0);

  const series = anchoredSeries({
    startKey,
    endKey: todayKey(input.today),
    current,
    dailyProgress,
  });

  const minutes30 = input.projects.tracking
    .filter(row => (dayKey(row.tracking_date) ?? '') >= format(addDays(input.today, -30), 'yyyy-MM-dd'))
    .reduce((sum, row) => sum + numberFrom(row.time_data, 'proyectos'), 0);

  return numericCard({
    input,
    def,
    label: 'Tareas de proyectos',
    unit: 'tareas',
    target,
    current,
    series,
    startedAt: startKey,
    seriesMode: 'cumulative',
    maxConfidence: 'baja',
    targetSource: selectedIds.length ? 'Proyectos seleccionados en el trimestre' : 'Todos los proyectos con tareas',
    assumption: `Se estiman ${MINUTES_PER_PROJECT_TASK} min (10 h) de trabajo por tarea de proyecto.`,
    context: [
      `${current} de ${target} tareas`,
      `${scope.length} proyectos`,
      `${formatNumber(minutes30)} min de trabajo en 30 días`,
    ],
    href,
    sourceLabel: 'Proyectos del trimestre',
    displayCurrent: `${current} / ${target} tareas`,
    displayTarget: `${target} tareas`,
  });
}

// ---------------------------------------------------------------------------
// Finanzas
// ---------------------------------------------------------------------------

function financeCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'finanzas');
  const href = '/finance';
  const goals = input.finance.goals.filter(goal => Number(goal.targetAmount) > 0);

  if (!goals.length) {
    return goalFallbackCard(
      input,
      def,
      'No hay metas financieras con monto objetivo. Crea una meta de ahorro en Finanzas para pronosticar.',
      href,
    );
  }

  const sorted = [...goals].sort((a, b) => {
    const ratioA = Number(a.currentAmount) / Math.max(1, Number(a.targetAmount));
    const ratioB = Number(b.currentAmount) / Math.max(1, Number(b.targetAmount));
    return ratioB - ratioA;
  });
  const goal = sorted.find(item => Number(item.currentAmount) < Number(item.targetAmount)) ?? sorted[0];
  const target = Math.max(1, Number(goal.targetAmount) || 0);
  const current = Math.max(0, Math.min(target, Number(goal.currentAmount) || 0));

  const rate = Number(input.finance.exchangeRate) > 0 ? Number(input.finance.exchangeRate) : 1;
  const savingsByDay = new Map<string, number>();
  for (const transaction of input.finance.transactions) {
    const key = dayKey(transaction.transaction_date);
    if (!key || key < format(addDays(input.today, -180), 'yyyy-MM-dd')) continue;
    const amount = Number(transaction.amount) || 0;
    const converted = transaction.currency === 'USD' ? amount * rate : amount;
    const sign = transaction.transaction_type === 'expense' ? -1 : 1;
    savingsByDay.set(key, (savingsByDay.get(key) ?? 0) + converted * sign);
  }
  const dailySavings = [...savingsByDay.entries()]
    .map(([date, value]) => ({ date, value: Math.max(0, value) }))
    .filter(item => item.value > 0);

  const series = anchoredSeries({
    startKey: historyStart(input.today, null),
    endKey: todayKey(input.today),
    current,
    dailyProgress: dailySavings,
  });

  const savings30 = [...savingsByDay.entries()]
    .filter(([date]) => date >= format(addDays(input.today, -30), 'yyyy-MM-dd'))
    .reduce((sum, [, value]) => sum + Math.max(0, value), 0);

  const currency = rate !== 1 || input.finance.transactions.some(transaction => transaction.currency === 'CUP')
    ? 'CUP'
    : 'USD';

  return numericCard({
    input,
    def,
    label: `Meta de ahorro: ${goal.name}`,
    unit: currency,
    target,
    current,
    series,
    startedAt: historyStart(input.today, null),
    seriesMode: 'cumulative',
    maxConfidence: 'baja',
    targetSource: `Meta financiera: ${goal.name}`,
    assumption: 'El ritmo de ahorro se estima con el flujo neto positivo de los últimos 180 días; los depósitos manuales pueden no coincidir con el flujo.',
    context: [
      `${formatNumber(current)} de ${formatNumber(target)} ${currency}`,
      `${formatNumber(savings30)} ${currency} de ahorro neto en 30 días`,
      `${goals.length} meta${goals.length === 1 ? '' : 's'} financiera${goals.length === 1 ? '' : 's'}`,
    ],
    href,
    sourceLabel: 'Meta financiera',
    displayCurrent: `${formatNumber(current)} ${currency}`,
    displayTarget: `${formatNumber(target)} ${currency}`,
  });
}

// ---------------------------------------------------------------------------
// Salud
// ---------------------------------------------------------------------------

function healthCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'salud');
  const href = '/sistemas/salud';
  const goal = input.health.goal;
  const target = Number(goal?.target_weight) || 0;
  const startValue = Number(goal?.start_weight) || 0;

  if (!goal || target <= 0 || startValue <= 0) {
    return goalFallbackCard(
      input,
      def,
      'No hay una meta de peso activa. Define peso objetivo y fecha en Salud para pronosticar.',
      href,
    );
  }

  const points = input.health.measurements
    .filter(measurement => Number(measurement.weight) > 0)
    .map(measurement => ({
      date: measurement.measurement_date,
      value: Number(measurement.weight),
    }));

  if (goal.start_date && !points.some(point => (dayKey(point.date) ?? '') <= (dayKey(goal.start_date) ?? ''))) {
    points.unshift({ date: goal.start_date, value: startValue });
  }

  const series = absoluteSeries(points);
  const current = series.length ? series[series.length - 1].value : startValue;
  const direction = target < startValue ? 'down' : 'up';
  const targetDate = dayKey(goal.target_date);

  return numericCard({
    input,
    def,
    label: 'Peso objetivo',
    unit: 'kg',
    target,
    current,
    series,
    startedAt: dayKey(goal.start_date) ?? series[0]?.date,
    direction,
    seriesMode: 'absolute',
    startValue,
    maxConfidence: 'media',
    targetDate,
    targetSource: 'Meta de peso activa',
    assumption: 'El peso se mueve con ruido diario; el rango del pronóstico refleja esa variabilidad.',
    context: [
      `${formatNumber(startValue)} → ${formatNumber(target)} kg`,
      `Actual ${formatNumber(current)} kg`,
      `${input.health.measurements.length} mediciones`,
    ],
    href,
    sourceLabel: 'Meta de peso',
    displayCurrent: `${formatNumber(current)} kg`,
    displayTarget: `${formatNumber(target)} kg`,
  });
}

// ---------------------------------------------------------------------------
// Fuerza mental
// ---------------------------------------------------------------------------

function confidenceCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'fuerza-mental');
  const href = '/confidence-steps';
  const steps = input.confidence.steps;

  if (!steps.length) {
    return goalFallbackCard(
      input,
      def,
      'No hay pasos de confianza registrados. Añade pasos en Fuerza Mental para pronosticar.',
      href,
    );
  }

  const completed = steps.filter(step => step.completed);
  const events = completed.map(step => ({
    date: dayKey(step.updated_at) ?? dayKey(step.target_date),
    value: 1,
  })).filter((event): event is { date: string; value: number } => !!event.date);

  const level = Math.min(5, Math.floor(completed.length / 3) + 1);
  const nextDate = steps
    .filter(step => !step.completed && dayKey(step.target_date))
    .map(step => dayKey(step.target_date) as string)
    .sort()[0] ?? null;

  return numericCard({
    input,
    def,
    label: 'Pasos de confianza',
    unit: 'pasos',
    target: steps.length,
    current: completed.length,
    series: cumulativeSeries({
      startKey: historyStart(input.today, earliestKey(...events.map(event => event.date))),
      endKey: todayKey(input.today),
      current: completed.length,
      events,
    }),
    startedAt: earliestKey(...events.map(event => event.date)),
    targetDate: nextDate,
    seriesMode: 'cumulative',
    maxConfidence: 'media',
    targetSource: 'Pasos de confianza',
    assumption: 'La fecha de actualización se usa como fecha de cumplimiento del paso.',
    context: [
      `Nivel ${level} de 5`,
      `${completed.length} de ${steps.length} pasos`,
      `${steps.length - completed.length} pendientes`,
    ],
    href,
    sourceLabel: 'Pasos de confianza',
    displayCurrent: `Nivel ${level} · ${completed.length} pasos`,
    displayTarget: `${steps.length} pasos`,
  });
}

// ---------------------------------------------------------------------------
// Apariencia (proxy de adherencia)
// ---------------------------------------------------------------------------

function appearanceCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'apariencia');
  const href = '/sistemas/apariencia';
  const tracking = input.appearance.tracking;

  if (!tracking.length) {
    return goalFallbackCard(
      input,
      def,
      'No hay registros de skincare. Marca los hábitos en Daily para pronosticar la adherencia.',
      href,
    );
  }

  const startKey = input.horizon.startKey;
  const endKey = input.horizon.endKey;
  const today = todayKey(input.today);
  const daysInHorizon = eachDayKey(startKey, endKey).length;
  const elapsedDays = eachDayKey(startKey, today < endKey ? today : endKey).length;
  const target = Math.max(1, Math.round(daysInHorizon * 2 * SKINCARE_TARGET_PCT));

  const events: Array<{ date: string; value: number }> = [];
  let completedCount = 0;
  for (const row of tracking) {
    const key = dayKey(row.tracking_date);
    if (!key || key < startKey || key > today) continue;
    const done = (flagFrom(row.completions, 'skincare-manana') ? 1 : 0)
      + (flagFrom(row.completions, 'skincare-noche') ? 1 : 0);
    if (done > 0) {
      events.push({ date: key, value: done });
      completedCount += done;
    }
  }

  const current = completedCount;
  const adherence = elapsedDays > 0 ? (current / (elapsedDays * 2)) * 100 : 0;
  const series = cumulativeSeries({ startKey, endKey: today, current, events });

  return numericCard({
    input,
    def,
    label: 'Adherencia al skincare',
    unit: 'marcas',
    target,
    current,
    series,
    startedAt: startKey,
    seriesMode: 'cumulative',
    maxConfidence: 'media',
    targetSource: `Adherencia objetivo: ${Math.round(SKINCARE_TARGET_PCT * 100)}% del periodo`,
    assumption: `La meta es completar el ${Math.round(SKINCARE_TARGET_PCT * 100)}% del skincare de mañana y noche durante el periodo (2 marcas por día).`,
    context: [
      `${formatNumber(adherence)}% de adherencia en lo que va del periodo`,
      `${formatNumber(current)} de ${formatNumber(target)} marcas`,
      `${daysInHorizon} días en el periodo`,
    ],
    href,
    sourceLabel: 'Adherencia skincare',
    displayCurrent: `${formatNumber(adherence)}% adherencia`,
    displayTarget: `${Math.round(SKINCARE_TARGET_PCT * 100)}%`,
  });
}

// ---------------------------------------------------------------------------
// Gym (fuerza)
// ---------------------------------------------------------------------------

function normalizeExerciseName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function gymCard(input: ForecastBuildInput): SystemForecastCard {
  const def = METAS_SYSTEMS.find(system => system.id === 'gym');
  const href = '/gym';
  const goals = input.strength.goals.filter(goal => Number(goal.target_weight_kg) > 0);

  if (!goals.length) {
    return goalFallbackCard(
      input,
      def,
      'No hay metas de fuerza con peso objetivo. Añádelas en Gym para pronosticar.',
      href,
    );
  }

  const exerciseById = new Map(input.strength.exercises.map(exercise => [exercise.id, exercise.name]));
  const logsByExercise = new Map<string, Array<{ date: string; weight: number }>>();

  for (const log of input.strength.logs) {
    const exerciseName = exerciseById.get(log.exercise_id);
    if (!exerciseName) continue;
    const weights = [
      Number(log.weight_kg) || 0,
      ...(Array.isArray(log.weights_per_set) ? log.weights_per_set.map(Number) : []),
    ].filter(value => Number.isFinite(value) && value > 0);
    if (!weights.length) continue;
    const date = dayKey(log.log_date);
    if (!date) continue;
    const key = normalizeExerciseName(exerciseName);
    const list = logsByExercise.get(key) ?? [];
    list.push({ date, weight: Math.max(...weights) });
    logsByExercise.set(key, list);
  }

  const withLogs = goals
    .map(goal => ({ goal, logs: logsByExercise.get(normalizeExerciseName(goal.exercise_name)) ?? [] }))
    .sort((a, b) => b.logs.length - a.logs.length);
  const chosen = withLogs[0]?.logs.length ? withLogs[0] : { goal: goals[0], logs: [] };
  const goal = chosen.goal;
  const target = Number(goal.target_weight_kg) || 1;

  const points: Array<{ date: string; value: number }> = [];
  for (const log of chosen.logs) points.push({ date: log.date, value: log.weight });
  const series = absoluteSeries(points);
  const current = series.length
    ? series[series.length - 1].value
    : (Number(goal.current_weight_kg) || 0);

  const gymDays30 = new Set(
    input.strength.logs
      .filter(log => (dayKey(log.log_date) ?? '') >= format(addDays(input.today, -30), 'yyyy-MM-dd'))
      .map(log => dayKey(log.log_date)),
  ).size;

  return numericCard({
    input,
    def,
    label: `Fuerza: ${goal.exercise_name}`,
    unit: 'kg',
    target,
    current,
    series,
    startedAt: series[0]?.date,
    seriesMode: 'absolute',
    startValue: Number(goal.current_weight_kg) || current,
    maxConfidence: 'media',
    targetSource: `Meta de fuerza: ${goal.exercise_name}`,
    assumption: 'Se usa el peso máximo registrado por sesión para el ejercicio de fuerza.',
    context: [
      `${formatNumber(current)} → ${formatNumber(target)} kg`,
      `${chosen.logs.length} registros del ejercicio`,
      `${gymDays30} días de gym en 30 días`,
    ],
    href,
    sourceLabel: 'Meta de fuerza',
    displayCurrent: `${formatNumber(current)} kg`,
    displayTarget: `${formatNumber(target)} kg`,
  });
}

// ---------------------------------------------------------------------------
// Entrada principal
// ---------------------------------------------------------------------------

export function buildSystemForecasts(input: ForecastBuildInput): SystemForecastCard[] {
  const builders: Record<string, () => SystemForecastCard> = {
    lectura: () => readingCard(input),
    ajedrez: () => chessCard(input),
    game: () => gameCard(input),
    idiomas: () => languagesCard(input),
    musica: () => musicCard(input),
    universidad: () => universityCard(input),
    emprendimiento: () => entrepreneurshipCard(input),
    proyectos: () => projectsCard(input),
    finanzas: () => financeCard(input),
    salud: () => healthCard(input),
    'fuerza-mental': () => confidenceCard(input),
    apariencia: () => appearanceCard(input),
    gym: () => gymCard(input),
  };

  return METAS_SYSTEMS.map(def => {
    const builder = builders[def.id];
    if (builder) return builder();
    const href = {
      salud: '/sistemas/salud',
      'fuerza-mental': '/confidence-steps',
      apariencia: '/sistemas/apariencia',
    }[def.id] ?? '/metas-sistemas';
    return goalFallbackCard(input, def, 'Sin una fuente de resultados conectada.', href);
  });
}

/** Días que faltan para una fecha (negativo si ya pasó). */
export function daysUntil(dateKeyValue: string | null, today: Date): number | null {
  if (!dateKeyValue) return null;
  return differenceInCalendarDays(parseDay(dateKeyValue), today);
}
