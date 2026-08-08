import { startOfMonth, startOfWeek, format } from 'date-fns';
import { pushSyncKey } from '@/lib/planSync';

// ---------------------------------------------------------------------------
// Jerarquía de metas: Trimestre → Mes → Semana → Día
//
// - El plan trimestral guarda las metas de minutos POR MES (timeGoals/areaTimeGoals)
// - La meta del trimestre = suma de sus 3 meses (derivada)
// - La meta de la semana = reparto equitativo de la meta del mes entre las
//   semanas reales que empiezan ese mes (salvo override manual)
// - La meta del día = semana / 7 (salvo override manual)
// - Si editas un nivel inferior, el superior se recalcula como la suma
// - Si editas la meta del trimestre, se reparte equitativamente a los 3 meses
//   y se limpian los overrides de semana/día del trimestre
// - Libros/Canciones: la asignación mensual (distribution) es la fuente;
//   la meta trimestral = suma de los 3 meses
// ---------------------------------------------------------------------------

export const HIERARCHY_AREAS = ['lectura', 'musica', 'ajedrez', 'italiano', 'ingles', 'game', 'gym'] as const;
export const HIERARCHY_FOCUS_AREAS = ['universidad', 'proyectos', 'emprendimiento'] as const;
export const ALL_HIERARCHY_AREAS = [...HIERARCHY_AREAS, ...HIERARCHY_FOCUS_AREAS];

export const AREA_LABELS: Record<string, string> = {
  lectura: 'Lectura',
  musica: 'Música',
  ajedrez: 'Ajedrez',
  italiano: 'Italiano',
  ingles: 'Inglés',
  game: 'Game',
  gym: 'Gym',
  universidad: 'Universidad',
  proyectos: 'Proyectos',
  emprendimiento: 'Emprendimiento',
};

export const QUARTER_MONTH_KEYS = ['month1', 'month2', 'month3'] as const;
export type QuarterMonthKey = (typeof QUARTER_MONTH_KEYS)[number];

const WEEK_OVERRIDES_KEY = 'hierarchy_week_overrides';
const DAY_OVERRIDES_KEY = 'hierarchy_day_overrides';

export interface QuarterPlanLike {
  books?: { goal: number; selected: string[] };
  songs?: { goal: number; selected: string[] };
  distribution?: Record<string, { books: string[]; songs: string[] }>;
  timeGoals?: Record<string, Record<string, number>>;
  areaTimeGoals?: Record<string, Record<string, number>>;
  personal_goals?: { title: string; target?: string }[];
  notes?: Record<string, string>;
  [key: string]: any;
}

export function getQuarterFromDate(date: Date) {
  return { quarter: Math.ceil((date.getMonth() + 1) / 3), year: date.getFullYear() };
}

export function getWeekId(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-ww');
}

export function getMonthKeyOf(date: Date, quarter: number): string {
  const idx = date.getMonth() - (quarter - 1) * 3;
  return `month${idx + 1}`;
}

export function getQuarterPlanKey(quarter: number, year: number): string {
  return `trimestral_plan_Q${quarter}_${year}`;
}

export function getMonthlyPlanKey(month: Date): string {
  return `monthly_plan_${format(startOfMonth(month), 'yyyy-MM-dd')}`;
}

export function loadQuarterPlan(quarter: number, year: number): QuarterPlanLike | null {
  try {
    const raw = localStorage.getItem(getQuarterPlanKey(quarter, year));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveQuarterPlan(quarter: number, year: number, plan: QuarterPlanLike) {
  try {
    localStorage.setItem(getQuarterPlanKey(quarter, year), JSON.stringify(plan));
  } catch {}
  pushSyncKey(getQuarterPlanKey(quarter, year));
}

export function loadMonthlyPlan(month: Date): QuarterPlanLike | null {
  try {
    const raw = localStorage.getItem(getMonthlyPlanKey(month));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMonthlyPlan(month: Date, plan: QuarterPlanLike) {
  try {
    localStorage.setItem(getMonthlyPlanKey(month), JSON.stringify(plan));
  } catch {}
  pushSyncKey(getMonthlyPlanKey(month));
}

// ---------------------------------------------------------------------------
// Reparto equitativo con residuo (4 → [2,1,1])
// ---------------------------------------------------------------------------
export function splitEvenly(value: number, n: number): number[] {
  if (n <= 0) return [];
  if (value <= 0) return Array.from({ length: n }, () => 0);
  const base = Math.floor(value / n);
  const rem = value % n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

// ---------------------------------------------------------------------------
// Semanas reales de un mes (una semana pertenece al mes de su lunes)
// ---------------------------------------------------------------------------
export function getWeeksOfMonth(monthStart: Date): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const wid = getWeekId(new Date(year, month, d));
    if (!seen.has(wid)) {
      seen.add(wid);
      ids.push(wid);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Overrides manuales de semana / día
// ---------------------------------------------------------------------------
function loadWeekOverrides(): Record<string, Record<string, number>> {
  try {
    const raw = localStorage.getItem(WEEK_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveWeekOverrides(data: Record<string, Record<string, number>>) {
  try {
    localStorage.setItem(WEEK_OVERRIDES_KEY, JSON.stringify(data));
  } catch {}
  pushSyncKey(WEEK_OVERRIDES_KEY);
}

function loadDayOverrides(): Record<string, Record<string, number>> {
  try {
    const raw = localStorage.getItem(DAY_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDayOverrides(data: Record<string, Record<string, number>>) {
  try {
    localStorage.setItem(DAY_OVERRIDES_KEY, JSON.stringify(data));
  } catch {}
  pushSyncKey(DAY_OVERRIDES_KEY);
}

function isFocusArea(area: string): boolean {
  return HIERARCHY_FOCUS_AREAS.includes(area as any);
}

function getAreaGoals(plan: QuarterPlanLike, area: string): Record<string, Record<string, number>> {
  return (isFocusArea(area) ? plan.areaTimeGoals : plan.timeGoals) || {};
}

function writeAreaGoal(plan: QuarterPlanLike, monthKey: string, area: string, minutes: number): QuarterPlanLike {
  const bucket = isFocusArea(area) ? 'areaTimeGoals' : 'timeGoals';
  const current = plan[bucket] || {};
  return {
    ...plan,
    [bucket]: {
      ...current,
      [monthKey]: { ...(current[monthKey] || {}), [area]: minutes },
    },
  };
}

function defaultQuarterPlan(quarter: number, year: number): QuarterPlanLike {
  const keys: QuarterMonthKey[] = ['month1', 'month2', 'month3'];
  return {
    books: { goal: 0, selected: [] },
    songs: { goal: 0, selected: [] },
    distribution: {
      month1: { books: [], songs: [] },
      month2: { books: [], songs: [] },
      month3: { books: [], songs: [] },
    },
    timeGoals: Object.fromEntries(keys.map(k => [k, Object.fromEntries(HIERARCHY_AREAS.map(a => [a, 0]))])),
    areaTimeGoals: Object.fromEntries(keys.map(k => [k, Object.fromEntries(HIERARCHY_FOCUS_AREAS.map(a => [a, 0]))])),
    personal_goals: [],
    notes: {},
    quarter,
    year,
  };
}

function ensurePlan(quarter: number, year: number): QuarterPlanLike {
  const existing = loadQuarterPlan(quarter, year);
  if (existing) return existing;
  const fresh = defaultQuarterPlan(quarter, year);
  saveQuarterPlan(quarter, year, fresh);
  return fresh;
}

// ---------------------------------------------------------------------------
// Lectura de metas efectivas
// ---------------------------------------------------------------------------
export function getMonthGoal(quarter: number, year: number, monthKey: string, area: string): number {
  const plan = loadQuarterPlan(quarter, year);
  if (!plan) return 0;
  const goals = getAreaGoals(plan, area);
  return goals?.[monthKey]?.[area] || 0;
}

export function getQuarterGoal(quarter: number, year: number, area: string): number {
  return QUARTER_MONTH_KEYS.reduce((s, mk) => s + (getMonthGoal(quarter, year, mk, area) || 0), 0);
}

export function getWeekGoalEffective(weekStart: Date, area: string): number {
  const weekId = getWeekId(weekStart);
  const ov = loadWeekOverrides();
  const override = ov[weekId]?.[area];
  if (override != null) return override;

  const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
  const weeks = getWeeksOfMonth(monthStart);
  const idx = weeks.indexOf(weekId);
  const { quarter, year } = getQuarterFromDate(monthStart);
  const monthKey = getMonthKeyOf(monthStart, quarter);
  const monthGoal = getMonthGoal(quarter, year, monthKey, area);
  const shares = splitEvenly(monthGoal, weeks.length);
  return shares[idx] || 0;
}

export function getDayGoalEffective(date: Date, area: string): number {
  const dateStr = format(date, 'yyyy-MM-dd');
  const ov = loadDayOverrides();
  const override = ov[dateStr]?.[area];
  if (override != null) return override;
  return Math.round(getWeekGoalEffective(date, area) / 7);
}

export function getWeekGoalSum(weekStart: Date): number {
  return ALL_HIERARCHY_AREAS.reduce((s, a) => s + (getWeekGoalEffective(weekStart, a) || 0), 0);
}

export function getDayGoalSum(date: Date): number {
  return ALL_HIERARCHY_AREAS.reduce((s, a) => s + (getDayGoalEffective(date, a) || 0), 0);
}

// ---------------------------------------------------------------------------
// Limpieza de overrides dentro de un rango
// ---------------------------------------------------------------------------
function clearOverridesForMonth(quarter: number, year: number, monthIdx: number, area: string) {
  const yearMonth = year * 12 + (quarter - 1) * 3 + monthIdx;
  const m = yearMonth % 12;
  const y = Math.floor(yearMonth / 12);
  const days = new Date(y, m + 1, 0).getDate();

  const weekOv = loadWeekOverrides();
  const dayOv = loadDayOverrides();
  let wChanged = false;
  let dChanged = false;

  for (let d = 1; d <= days; d++) {
    const date = new Date(y, m, d);
    const wid = getWeekId(date);
    if (weekOv[wid] && weekOv[wid][area] != null) {
      delete weekOv[wid][area];
      if (Object.keys(weekOv[wid]).length === 0) delete weekOv[wid];
      wChanged = true;
    }
    const dateStr = format(date, 'yyyy-MM-dd');
    if (dayOv[dateStr] && dayOv[dateStr][area] != null) {
      delete dayOv[dateStr][area];
      if (Object.keys(dayOv[dateStr]).length === 0) delete dayOv[dateStr];
      dChanged = true;
    }
  }
  if (wChanged) saveWeekOverrides(weekOv);
  if (dChanged) saveDayOverrides(dayOv);
}

function clearOverridesForQuarter(quarter: number, year: number, area: string) {
  for (let i = 0; i < 3; i++) clearOverridesForMonth(quarter, year, i, area);
}

// ---------------------------------------------------------------------------
// Escritura de metas (propagación)
// ---------------------------------------------------------------------------
export function setMonthGoal(quarter: number, year: number, monthKey: string, area: string, minutes: number) {
  const plan = ensurePlan(quarter, year);
  const next = writeAreaGoal(plan, monthKey, area, Math.max(0, minutes || 0));
  saveQuarterPlan(quarter, year, next);
  const monthIdx = QUARTER_MONTH_KEYS.indexOf(monthKey as QuarterMonthKey);
  if (monthIdx >= 0) clearOverridesForMonth(quarter, year, monthIdx, area);
}

export function setQuarterGoal(quarter: number, year: number, area: string, minutes: number) {
  const plan = ensurePlan(quarter, year);
  const total = Math.max(0, minutes || 0);
  const shares = splitEvenly(total, 3);
  let next = plan;
  QUARTER_MONTH_KEYS.forEach((mk, i) => {
    next = writeAreaGoal(next, mk, area, shares[i]);
  });
  saveQuarterPlan(quarter, year, next);
  clearOverridesForQuarter(quarter, year, area);
}

export function setWeekGoal(weekStart: Date, area: string, minutes: number) {
  const weekId = getWeekId(weekStart);
  const weekOv = loadWeekOverrides();
  const value = Math.max(0, minutes || 0);
  weekOv[weekId] = { ...(weekOv[weekId] || {}), [area]: value };
  saveWeekOverrides(weekOv);

  // Recalcular la meta del mes = suma de metas de sus semanas
  const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
  const { quarter, year } = getQuarterFromDate(monthStart);
  const monthKey = getMonthKeyOf(monthStart, quarter);
  const weeks = getWeeksOfMonth(monthStart);
  const oldMonth = getMonthGoal(quarter, year, monthKey, area);
  const shares = splitEvenly(oldMonth, weeks.length);

  let sum = 0;
  weeks.forEach((wid, i) => {
    const ov = loadWeekOverrides();
    sum += ov[wid]?.[area] != null ? ov[wid][area] : shares[i];
  });

  const plan = loadQuarterPlan(quarter, year);
  if (plan) {
    saveQuarterPlan(quarter, year, writeAreaGoal(plan, monthKey, area, sum));
  }
}

export function setDayGoal(date: Date, area: string, minutes: number) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayOv = loadDayOverrides();
  const value = Math.max(0, minutes || 0);
  dayOv[dateStr] = { ...(dayOv[dateStr] || {}), [area]: value };
  saveDayOverrides(dayOv);

  // Recalcular la meta de la semana = suma de los 7 días
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekId = getWeekId(date);
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    const ds = format(day, 'yyyy-MM-dd');
    const ov = loadDayOverrides();
    if (ov[ds]?.[area] != null) sum += ov[ds][area];
    else sum += Math.round(getWeekGoalEffective(weekStart, area) / 7);
  }
  setWeekGoal(weekStart, area, sum);
}

// ---------------------------------------------------------------------------
// Sincronización libros/canciones/metas personales: mensual ↔ trimestral
// ---------------------------------------------------------------------------
export function getMonthDistribution(quarter: number, year: number, monthKey: string): { books: string[]; songs: string[] } {
  const plan = loadQuarterPlan(quarter, year);
  return plan?.distribution?.[monthKey] || { books: [], songs: [] };
}

export function getQuarterBookGoal(quarter: number, year: number): number {
  const plan = loadQuarterPlan(quarter, year);
  if (!plan?.distribution) return plan?.books?.goal || 0;
  return QUARTER_MONTH_KEYS.reduce((s, mk) => s + ((plan.distribution?.[mk]?.books || []).length), 0);
}

export function getQuarterSongGoal(quarter: number, year: number): number {
  const plan = loadQuarterPlan(quarter, year);
  if (!plan?.distribution) return plan?.songs?.goal || 0;
  return QUARTER_MONTH_KEYS.reduce((s, mk) => s + ((plan.distribution?.[mk]?.songs || []).length), 0);
}

/**
 * Toma el plan mensual y lo hace consistente con el plan trimestral:
 * - La selección de libros/canciones del mes se escribe en la distribution trimestral
 * - La meta trimestral = suma de asignaciones de los 3 meses
 * - La meta del plan mensual = asignación de su mes
 * - Las metas personales se heredan del trimestre
 */
export function reconcileMonthlyToQuarter(month: Date) {
  const { quarter, year } = getQuarterFromDate(month);
  const monthKey = getMonthKeyOf(month, quarter);
  const monthly = loadMonthlyPlan(month);
  const qp = loadQuarterPlan(quarter, year);
  if (!monthly) return;

  const monthlyBooks = monthly.books?.selected || [];
  const monthlySongs = monthly.songs?.selected || [];

  if (qp) {
    const dist = qp.distribution || {};
    const nextDist = {
      ...dist,
      [monthKey]: { books: monthlyBooks, songs: monthlySongs },
    };
    const bookTotal = QUARTER_MONTH_KEYS.reduce((s, mk) => s + ((nextDist[mk]?.books || []).length), 0);
    const songTotal = QUARTER_MONTH_KEYS.reduce((s, mk) => s + ((nextDist[mk]?.songs || []).length), 0);
    const personal = qp.personal_goals || [];
    saveQuarterPlan(quarter, year, {
      ...qp,
      distribution: nextDist,
      books: { ...(qp.books || { goal: 0, selected: [] }), goal: bookTotal, selected: monthlyBooks },
      songs: { ...(qp.songs || { goal: 0, selected: [] }), goal: songTotal, selected: monthlySongs },
      personal_goals: personal,
    });
    // El plan mensual hereda la meta de su mes y las metas personales del trimestre
    const nextMonthly = {
      ...monthly,
      books: { ...monthly.books, goal: monthlyBooks.length, selected: monthlyBooks },
      songs: { ...monthly.songs, goal: monthlySongs.length, selected: monthlySongs },
      personal_goals: personal,
    };
    saveMonthlyPlan(month, nextMonthly);
  } else {
    const nextMonthly = {
      ...monthly,
      books: { ...monthly.books, goal: monthlyBooks.length },
      songs: { ...monthly.songs, goal: monthlySongs.length },
    };
    saveMonthlyPlan(month, nextMonthly);
  }
}

/**
 * Al cargar el plan mensual, hereda del trimestral: libros/canciones del mes,
 * metas personales y metas de minutos del mes (para visualización).
 */
export function syncMonthlyFromQuarter(month: Date): QuarterPlanLike | null {
  const monthly = loadMonthlyPlan(month);
  if (!monthly) return null;
  const { quarter, year } = getQuarterFromDate(month);
  const monthKey = getMonthKeyOf(month, quarter);
  const qp = loadQuarterPlan(quarter, year);
  if (!qp) return monthly;

  const dist = qp.distribution?.[monthKey] || { books: [], songs: [] };
  const next: QuarterPlanLike = {
    ...monthly,
    books: { ...(monthly.books || { goal: 0, selected: [] }), goal: dist.books.length, selected: dist.books },
    songs: { ...(monthly.songs || { goal: 0, selected: [] }), goal: dist.songs.length, selected: dist.songs },
    personal_goals: qp.personal_goals || [],
  };
  return next;
}

/**
 * Metas de minutos del mes (lectura de los niveles superiores), incluye
 * timeGoals + areaTimeGoals.
 */
export function getMonthGoalsSummary(month: Date): Record<string, number> {
  const { quarter, year } = getQuarterFromDate(month);
  const monthKey = getMonthKeyOf(month, quarter);
  const out: Record<string, number> = {};
  ALL_HIERARCHY_AREAS.forEach(area => {
    out[area] = getMonthGoal(quarter, year, monthKey, area);
  });
  return out;
}
