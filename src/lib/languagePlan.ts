import { format, startOfMonth, startOfWeek } from 'date-fns';

// ---------------------------------------------------------------------------
// Idiomas: modelo único de datos
//
// - Minutos: `daily_systems_tracking.time_data.ingles` / `.italiano`
// - Días activos y sesiones: días con minutos > 0 (se derivan, no se guardan)
// - Habilidades: `completions.idioma-{idioma}-{habilidad}`
// - Plan del mes: `monthly_plan_*.languages`
// - Plan de la semana: `weekly_plan_*.languages` (espejo en
//   `monthly_plan_*.week_distribution[semana].languages`)
// - Plan del trimestre: `trimestral_plan_*.languages`
// ---------------------------------------------------------------------------

export type LanguageId = 'ingles' | 'italiano';

export const LANGUAGE_IDS: LanguageId[] = ['ingles', 'italiano'];

export const LANGUAGE_LABELS: Record<LanguageId, string> = {
  ingles: 'Inglés',
  italiano: 'Italiano',
};

/** Niveles CEFR con subniveles. Escala única de la app. */
export const CEFR_LEVELS = [
  'A1.1', 'A1.2', 'A2.1', 'A2.2',
  'B1.1', 'B1.2', 'B2.1', 'B2.2',
  'C1.1', 'C1.2', 'C2.1', 'C2.2',
] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const DEFAULT_CEFR_LEVEL: Record<LanguageId, CefrLevel> = {
  ingles: 'B1.1',
  italiano: 'A1.1',
};

const LEGACY_LEVELS: Record<string, CefrLevel> = {
  beginner: 'A1.1',
  principiante: 'A1.1',
  elementary: 'A1.2',
  intermediate: 'B1.1',
  intermedio: 'B1.1',
  'upper-intermediate': 'B2.1',
  advanced: 'C1.1',
  avanzado: 'C1.1',
};

export function normalizeCefr(raw: unknown, fallback: CefrLevel = 'A1.1'): CefrLevel {
  if (typeof raw !== 'string') return fallback;
  const value = raw.trim();
  if ((CEFR_LEVELS as readonly string[]).includes(value)) return value as CefrLevel;
  return LEGACY_LEVELS[value.toLowerCase()] ?? fallback;
}

export function nextCefr(level: string): CefrLevel {
  const index = (CEFR_LEVELS as readonly string[]).indexOf(level);
  if (index < 0) return 'A1.1';
  return CEFR_LEVELS[Math.min(CEFR_LEVELS.length - 1, index + 1)];
}

export interface LanguageSkillDef {
  id: string;
  name: string;
  short: string;
}

/** Las 6 habilidades que se marcan a diario. */
export const LANGUAGE_SKILLS: LanguageSkillDef[] = [
  { id: 'gramatica', name: 'Gramática', short: 'Gram' },
  { id: 'vocabulario', name: 'Vocabulario', short: 'Vocab' },
  { id: 'lectura-l', name: 'Lectura', short: 'Lect' },
  { id: 'listening', name: 'Listening', short: 'Listen' },
  { id: 'speaking', name: 'Speaking', short: 'Speak' },
  { id: 'escritura', name: 'Escritura', short: 'Escri' },
];

export type LanguageSkillId = (typeof LANGUAGE_SKILLS)[number]['id'];

export const LANGUAGE_SKILL_IDS = LANGUAGE_SKILLS.map(s => s.id);

export function skillCompletionKey(lang: LanguageId, skill: string): string {
  return `idioma-${lang}-${skill}`;
}

const SKILL_KEY_RE = /^idioma-(ingles|italiano)-(.+)$/;

export function parseSkillCompletionKey(key: string): { lang: LanguageId; skill: string } | null {
  const match = SKILL_KEY_RE.exec(key);
  if (!match) return null;
  return { lang: match[1] as LanguageId, skill: match[2] };
}

// ---------------------------------------------------------------------------
// Planes
// ---------------------------------------------------------------------------

export interface LanguageMonthPlan {
  /** Nivel CEFR actual del idioma este mes. */
  level: string;
  /** Minutos objetivo del mes. 0 = sin meta (se muestra sugerencia editable). */
  monthMinutes: number;
  /** Hito concreto del mes (ej. "Terminar unidad 4 del curso"). */
  milestone: string;
  /** Autoevaluación opcional por habilidad: 0 = sin evaluar, 1–5. */
  selfEvaluation: Partial<Record<LanguageSkillId, number>>;
}

export type LanguageMonthPlans = Record<LanguageId, LanguageMonthPlan>;

export interface LanguageWeekPlan {
  /** Habilidad foco de la semana. */
  focusSkill: string;
  /** Reto concreto de la semana. */
  challenge: string;
  /** Minutos objetivo de la semana (0 = sin meta). */
  minutesTarget: number;
}

export type LanguageWeekPlans = Record<LanguageId, LanguageWeekPlan>;

export interface LanguageQuarterPlan {
  /** Nivel CEFR que se quiere alcanzar al cerrar el trimestre. */
  levelGoal: string;
  /** Hito del trimestre. */
  milestone: string;
}

export type LanguageQuarterPlans = Record<LanguageId, LanguageQuarterPlan>;

export function emptyMonthPlan(lang: LanguageId): LanguageMonthPlan {
  return {
    level: DEFAULT_CEFR_LEVEL[lang],
    monthMinutes: 0,
    milestone: '',
    selfEvaluation: {},
  };
}

export function emptyWeekPlan(): LanguageWeekPlan {
  return { focusSkill: '', challenge: '', minutesTarget: 0 };
}

export function emptyQuarterPlan(lang: LanguageId): LanguageQuarterPlan {
  return { levelGoal: nextCefr(DEFAULT_CEFR_LEVEL[lang]), milestone: '' };
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function readEvaluation(raw: unknown): Partial<Record<LanguageSkillId, number>> {
  const out: Partial<Record<LanguageSkillId, number>> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const skill of LANGUAGE_SKILLS) {
    const value = Number((raw as Record<string, unknown>)[skill.id]);
    if (Number.isFinite(value) && value >= 1 && value <= 5) {
      out[skill.id as LanguageSkillId] = Math.round(value);
    }
  }
  return out;
}

export function readLanguageMonthPlans(raw: unknown): LanguageMonthPlans {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const out = {} as LanguageMonthPlans;
  for (const lang of LANGUAGE_IDS) {
    const item = source[lang] || {};
    const base = emptyMonthPlan(lang);
    out[lang] = {
      level: normalizeCefr(item.level, base.level as CefrLevel),
      monthMinutes: num(item.monthMinutes ?? item.month_minutes, 0),
      milestone: str(item.milestone),
      selfEvaluation: readEvaluation(item.selfEvaluation ?? item.self_evaluation),
    };
  }
  return out;
}

export function readLanguageWeekPlans(raw: unknown): LanguageWeekPlans {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const out = {} as LanguageWeekPlans;
  for (const lang of LANGUAGE_IDS) {
    const item = source[lang] || {};
    out[lang] = {
      focusSkill: str(item.focusSkill ?? item.focus_skill),
      challenge: str(item.challenge),
      minutesTarget: num(item.minutesTarget ?? item.minutes_target, 0),
    };
  }
  return out;
}

export function readLanguageQuarterPlans(raw: unknown): LanguageQuarterPlans {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const out = {} as LanguageQuarterPlans;
  for (const lang of LANGUAGE_IDS) {
    const item = source[lang] || {};
    out[lang] = {
      levelGoal: normalizeCefr(item.levelGoal ?? item.level_goal, nextCefr(DEFAULT_CEFR_LEVEL[lang])),
      milestone: str(item.milestone),
    };
  }
  return out;
}

/** Sugerencia editable de minutos del mes. Nunca se guarda sola. */
const LEVEL_BASELINE_MINUTES: Record<string, number> = {
  'A1.1': 300, 'A1.2': 330, 'A2.1': 360, 'A2.2': 390,
  'B1.1': 450, 'B1.2': 480, 'B2.1': 540, 'B2.2': 600,
  'C1.1': 660, 'C1.2': 720, 'C2.1': 780, 'C2.2': 840,
};

export function suggestedMonthMinutes(level: string, previousMonthMinutes = 0): number {
  if (previousMonthMinutes > 0) return Math.max(15, Math.round(previousMonthMinutes / 5) * 5);
  return LEVEL_BASELINE_MINUTES[level] ?? 300;
}

// ---------------------------------------------------------------------------
// Lectura de planes guardados (localStorage)
// ---------------------------------------------------------------------------

function readJson<T = any>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Espejo del plan semanal en el plan mensual (lo leen las tarjetas diarias). */
export function getMirroredWeekLanguages(weekStart: Date): unknown {
  try {
    const start = startOfWeek(weekStart, { weekStartsOn: 1 });
    const weekKey = format(start, 'yyyy-MM-dd');
    const monthKey = `monthly_plan_${format(startOfMonth(start), 'yyyy-MM-dd')}`;
    const month = readJson<{ week_distribution?: Record<string, { languages?: unknown }> }>(monthKey);
    const slot = month?.week_distribution?.[weekKey];
    if (slot?.languages) return slot.languages;
  } catch { /* ignore */ }
  return null;
}

export function getWeekLanguagePlans(weekStart: Date): LanguageWeekPlans {
  const mirrored = getMirroredWeekLanguages(weekStart);
  if (mirrored) {
    const parsed = readLanguageWeekPlans(mirrored);
    if (LANGUAGE_IDS.some(l => parsed[l].focusSkill || parsed[l].challenge || parsed[l].minutesTarget > 0)) {
      return parsed;
    }
  }
  const weekId = format(startOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-ww');
  const weekly = readJson<{ languages?: unknown }>(`weekly_plan_${weekId}`);
  return readLanguageWeekPlans(weekly?.languages);
}

export function getMonthLanguagePlans(month: Date): LanguageMonthPlans {
  const monthKey = `monthly_plan_${format(startOfMonth(month), 'yyyy-MM-dd')}`;
  const monthly = readJson<{ languages?: unknown }>(monthKey);
  return readLanguageMonthPlans(monthly?.languages);
}

// ---------------------------------------------------------------------------
// Estadísticas canónicas
// ---------------------------------------------------------------------------

export interface LanguageTrackingRow {
  tracking_date?: string | null;
  time_data?: unknown;
  completions?: unknown;
}

export interface LanguageDayStat {
  date: string;
  minutes: number;
  skills: string[];
}

export interface LanguageStats {
  minutes: number;
  /** Días con minutos > 0. Es también el número de sesiones. */
  activeDays: number;
  sessions: number;
  /** Días en los que se marcó al menos una habilidad. */
  skillDays: number;
  /** Veces (días) que se practicó cada habilidad. */
  skills: Record<string, number>;
  /** Habilidades practicadas al menos una vez. */
  skillCoverage: string[];
  perDay: LanguageDayStat[];
}

export interface LanguagesStats {
  ingles: LanguageStats;
  italiano: LanguageStats;
  totalMinutes: number;
  /** Días con actividad en cualquiera de los dos idiomas. */
  activeDays: number;
  totalSessions: number;
  skillCoverage: string[];
  perDay: { date: string; minutes: number; skills: string[] }[];
}

function asRecord(raw: unknown): Record<string, any> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, any>) : {};
}

export function emptyLanguageStats(): LanguageStats {
  return { minutes: 0, activeDays: 0, sessions: 0, skillDays: 0, skills: {}, skillCoverage: [], perDay: [] };
}

export function computeLanguageStats(rows: LanguageTrackingRow[], lang: LanguageId): LanguageStats {
  const perDay: LanguageDayStat[] = [];
  const skills: Record<string, number> = {};

  for (const row of rows) {
    const date = String(row.tracking_date ?? '').slice(0, 10);
    if (!date) continue;
    const timeData = asRecord(row.time_data);
    const completions = asRecord(row.completions);
    const minutes = Math.max(0, Number(timeData[lang]) || 0);
    const daySkills = LANGUAGE_SKILLS
      .filter(skill => completions[skillCompletionKey(lang, skill.id)] === true)
      .map(skill => skill.id);

    if (minutes <= 0 && daySkills.length === 0) continue;
    daySkills.forEach(id => { skills[id] = (skills[id] || 0) + 1; });
    perDay.push({ date, minutes, skills: daySkills });
  }

  perDay.sort((a, b) => a.date.localeCompare(b.date));
  const activeDays = perDay.filter(d => d.minutes > 0).length;

  return {
    minutes: perDay.reduce((acc, d) => acc + d.minutes, 0),
    activeDays,
    sessions: activeDays,
    skillDays: perDay.filter(d => d.skills.length > 0).length,
    skills,
    skillCoverage: Object.keys(skills),
    perDay,
  };
}

export function computeLanguagesStats(rows: LanguageTrackingRow[]): LanguagesStats {
  const ingles = computeLanguageStats(rows, 'ingles');
  const italiano = computeLanguageStats(rows, 'italiano');
  const perDayMap = new Map<string, LanguageDayStat>();

  for (const stat of [ingles, italiano]) {
    for (const day of stat.perDay) {
      const current = perDayMap.get(day.date) || { date: day.date, minutes: 0, skills: [] };
      current.minutes += day.minutes;
      current.skills = [...new Set([...current.skills, ...day.skills])];
      perDayMap.set(day.date, current);
    }
  }

  const perDay = [...perDayMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  return {
    ingles,
    italiano,
    totalMinutes: ingles.minutes + italiano.minutes,
    activeDays: perDay.filter(d => d.minutes > 0).length,
    totalSessions: ingles.activeDays + italiano.activeDays,
    skillCoverage: [...new Set([...ingles.skillCoverage, ...italiano.skillCoverage])],
    perDay,
  };
}
