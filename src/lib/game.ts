import { format, startOfMonth, startOfWeek } from 'date-fns';

// ---------------------------------------------------------------------------
// Game (Seducción): motor de XP, niveles, habilidades y planes
//
// - Tiempo: `daily_systems_tracking.time_data.game`
// - Acciones y números: `count_data.game_acciones` / `.game_numeros`
// - Citas, eventos sociales e intimidad: tablas existentes (solo lectura)
// - Planes: `monthly_plan_*.game`, `weekly_plan_*.game`,
//   `trimestral_plan_*.game`
//
// El XP histórico de formación (1.485 min reales con tope de 3 XP/día) ya
// está en las filas diarias: este motor lo recalcula, no lo suma aparte.
// ---------------------------------------------------------------------------

export const GAME_COUNT_KEYS = {
  actions: 'game_acciones',
  numbers: 'game_numeros',
} as const;

export const GAME_XP = {
  /** 1 XP por cada 10 minutos, máximo 3 XP al día. */
  timePer10Minutes: 1,
  timeDailyCap: 3,
  /** 5 XP por acción, máximo 3 acciones con XP al día. */
  action: 5,
  actionDailyCap: 3,
  /** 10 XP por número, máximo 2 números con XP al día. */
  number: 10,
  numberDailyCap: 2,
  /** 30 XP por cita registrada en Vida Social. */
  cita: 30,
  /** 10 XP por evento social, máximo 1 al día. */
  social: 10,
  socialDailyCap: 1,
  /** La intimidad no da XP. */
  intimacy: 0,
  /** Sube un nivel cada 300 XP. */
  levelXp: 300,
} as const;

/** Referencia histórica: 1.485 min con tope diario = 129 XP. */
export const GAME_HISTORICAL_XP = 129;

export interface GameDayInput {
  minutes: number;
  actions: number;
  numbers: number;
  citas: number;
  social: number;
}

export interface GameDayXp {
  time: number;
  actions: number;
  numbers: number;
  citas: number;
  social: number;
  total: number;
}

export function gameDayXp(input: GameDayInput): GameDayXp {
  const minutes = Math.max(0, Number(input.minutes) || 0);
  const actions = Math.max(0, Math.round(Number(input.actions) || 0));
  const numbers = Math.max(0, Math.round(Number(input.numbers) || 0));
  const citas = Math.max(0, Math.round(Number(input.citas) || 0));
  const social = Math.max(0, Math.round(Number(input.social) || 0));

  const time = Math.min(GAME_XP.timeDailyCap, Math.floor(minutes / 10) * GAME_XP.timePer10Minutes);
  const actionXp = Math.min(actions, GAME_XP.actionDailyCap) * GAME_XP.action;
  const numberXp = Math.min(numbers, GAME_XP.numberDailyCap) * GAME_XP.number;
  const citaXp = citas * GAME_XP.cita;
  const socialXp = Math.min(social, GAME_XP.socialDailyCap) * GAME_XP.social;

  return {
    time,
    actions: actionXp,
    numbers: numberXp,
    citas: citaXp,
    social: socialXp,
    total: time + actionXp + numberXp + citaXp + socialXp,
  };
}

export interface GameLevelInfo {
  level: number;
  xpIntoLevel: number;
  xpToNext: number;
  progress: number;
  nextLevelXp: number;
}

export function gameLevel(totalXp: number): GameLevelInfo {
  const xp = Math.max(0, Math.round(Number(totalXp) || 0));
  const level = Math.floor(xp / GAME_XP.levelXp) + 1;
  const xpIntoLevel = xp % GAME_XP.levelXp;
  return {
    level,
    xpIntoLevel,
    xpToNext: GAME_XP.levelXp - xpIntoLevel,
    progress: Math.min(100, Math.round((xpIntoLevel / GAME_XP.levelXp) * 100)),
    nextLevelXp: level * GAME_XP.levelXp,
  };
}

// ---------------------------------------------------------------------------
// Catálogo de habilidades (16 en 4 bloques)
// ---------------------------------------------------------------------------

export interface GameSkillDef {
  id: string;
  name: string;
  block: string;
}

export const GAME_SKILL_BLOCKS: { id: string; name: string; skills: GameSkillDef[] }[] = [
  {
    id: 'presencia',
    name: 'Presencia',
    skills: [
      { id: 'postura', name: 'Postura y lenguaje corporal', block: 'presencia' },
      { id: 'contacto-visual', name: 'Contacto visual', block: 'presencia' },
      { id: 'voz', name: 'Voz y ritmo', block: 'presencia' },
      { id: 'estilo', name: 'Estilo e imagen', block: 'presencia' },
    ],
  },
  {
    id: 'conversacion',
    name: 'Conversación',
    skills: [
      { id: 'apertura', name: 'Apertura', block: 'conversacion' },
      { id: 'storytelling', name: 'Storytelling', block: 'conversacion' },
      { id: 'humor', name: 'Humor y ligereza', block: 'conversacion' },
      { id: 'escucha', name: 'Escucha activa', block: 'conversacion' },
    ],
  },
  {
    id: 'atraccion',
    name: 'Atracción',
    skills: [
      { id: 'calibracion', name: 'Calibración social', block: 'atraccion' },
      { id: 'tension', name: 'Tensión y coqueteo', block: 'atraccion' },
      { id: 'logistica', name: 'Logística y planes', block: 'atraccion' },
      { id: 'cierre', name: 'Cierre y próximos pasos', block: 'atraccion' },
    ],
  },
  {
    id: 'vida',
    name: 'Vida',
    skills: [
      { id: 'vida-social', name: 'Vida social', block: 'vida' },
      { id: 'citas', name: 'Citas', block: 'vida' },
      { id: 'fotos-redes', name: 'Fotos y redes', block: 'vida' },
      { id: 'hobbies', name: 'Hobbies e intereses', block: 'vida' },
    ],
  },
];

export const GAME_SKILLS = GAME_SKILL_BLOCKS.flatMap(block => block.skills);

export function gameSkillName(id: string): string {
  return GAME_SKILLS.find(skill => skill.id === id)?.name ?? '';
}

// ---------------------------------------------------------------------------
// Planes
// ---------------------------------------------------------------------------

export interface GameMonthPlan {
  /** Hasta 4 habilidades del catálogo para trabajar durante el mes. */
  selectedSkills: string[];
  milestone: string;
  actionsGoal: number;
  numbersGoal: number;
  citasGoal: number;
  xpGoal: number;
}

export interface GameWeekPlan {
  /** Una habilidad foco: debe salir de las elegidas en el mes. */
  focusSkill: string;
  challenge: string;
  actionsTarget: number;
  numbersTarget: number;
  /** XP objetivo de la semana (0 = reparto del objetivo mensual). */
  xpTarget: number;
}

export interface GameQuarterPlan {
  xpGoal: number;
  /** Nivel al que se quiere llegar al cerrar el trimestre (0 = sin meta). */
  levelGoal: number;
  milestone: string;
  selectedSkills: string[];
}

export function emptyGameMonthPlan(): GameMonthPlan {
  return { selectedSkills: [], milestone: '', actionsGoal: 0, numbersGoal: 0, citasGoal: 0, xpGoal: 0 };
}

export function emptyGameWeekPlan(): GameWeekPlan {
  return { focusSkill: '', challenge: '', actionsTarget: 0, numbersTarget: 0, xpTarget: 0 };
}

export function emptyGameQuarterPlan(): GameQuarterPlan {
  return { xpGoal: 0, levelGoal: 0, milestone: '', selectedSkills: [] };
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function skillIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id): id is string => typeof id === 'string' && GAME_SKILLS.some(s => s.id === id)))].slice(0, 4);
}

export function readGameMonthPlan(raw: unknown): GameMonthPlan {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  return {
    selectedSkills: skillIds(source.selectedSkills ?? source.selected_skills),
    milestone: str(source.milestone),
    actionsGoal: num(source.actionsGoal ?? source.actions_goal),
    numbersGoal: num(source.numbersGoal ?? source.numbers_goal),
    citasGoal: num(source.citasGoal ?? source.citas_goal),
    xpGoal: num(source.xpGoal ?? source.xp_goal),
  };
}

export function readGameWeekPlan(raw: unknown): GameWeekPlan {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const focusSkill = str(source.focusSkill ?? source.focus_skill);
  return {
    focusSkill: GAME_SKILLS.some(s => s.id === focusSkill) ? focusSkill : '',
    challenge: str(source.challenge),
    actionsTarget: num(source.actionsTarget ?? source.actions_target),
    numbersTarget: num(source.numbersTarget ?? source.numbers_target),
    xpTarget: num(source.xpTarget ?? source.xp_target),
  };
}

export function readGameQuarterPlan(raw: unknown): GameQuarterPlan {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  return {
    xpGoal: num(source.xpGoal ?? source.xp_goal),
    levelGoal: num(source.levelGoal ?? source.level_goal),
    milestone: str(source.milestone),
    selectedSkills: skillIds(source.selectedSkills ?? source.selected_skills),
  };
}

// ---------------------------------------------------------------------------
// Estadísticas del período
// ---------------------------------------------------------------------------

export interface GameTrackingRow {
  tracking_date?: string | null;
  time_data?: unknown;
  count_data?: unknown;
}

export interface GameDayStat {
  date: string;
  minutes: number;
  actions: number;
  numbers: number;
  citas: number;
  social: number;
  xp: number;
}

export interface GamePeriodStats {
  xp: number;
  minutes: number;
  activeDays: number;
  actions: number;
  numbers: number;
  citas: number;
  social: number;
  intimacy: number;
  perDay: GameDayStat[];
}

export function emptyGameStats(): GamePeriodStats {
  return { xp: 0, minutes: 0, activeDays: 0, actions: 0, numbers: 0, citas: 0, social: 0, intimacy: 0, perDay: [] };
}

function asRecord(raw: unknown): Record<string, any> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, any>) : {};
}

export function readGameCount(countData: unknown, key: string): number {
  const value = Number(asRecord(countData)[key]);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export interface GameDayExtras {
  citasByDay?: Record<string, number>;
  socialByDay?: Record<string, number>;
  intimacyByDay?: Record<string, number>;
}

export function computeGamePeriodStats(rows: GameTrackingRow[], extras: GameDayExtras = {}): GamePeriodStats {
  // Base por fecha: las filas diarias pueden no existir en días con solo una
  // cita o un evento social, así que las fechas de `extras` también cuentan.
  const byDate = new Map<string, { minutes: number; actions: number; numbers: number }>();

  for (const row of rows) {
    const date = String(row.tracking_date ?? '').slice(0, 10);
    if (!date) continue;
    const timeData = asRecord(row.time_data);
    const countData = asRecord(row.count_data);
    const current = byDate.get(date) ?? { minutes: 0, actions: 0, numbers: 0 };
    current.minutes += Math.max(0, Number(timeData.game) || 0);
    current.actions += Math.max(0, Number(countData[GAME_COUNT_KEYS.actions]) || 0);
    current.numbers += Math.max(0, Number(countData[GAME_COUNT_KEYS.numbers]) || 0);
    byDate.set(date, current);
  }

  const allDates = new Set<string>([
    ...byDate.keys(),
    ...Object.keys(extras.citasByDay ?? {}),
    ...Object.keys(extras.socialByDay ?? {}),
    ...Object.keys(extras.intimacyByDay ?? {}),
  ]);

  const perDay: GameDayStat[] = [];
  for (const date of allDates) {
    const base = byDate.get(date) ?? { minutes: 0, actions: 0, numbers: 0 };
    const citas = Math.max(0, Number(extras.citasByDay?.[date]) || 0);
    const social = Math.max(0, Number(extras.socialByDay?.[date]) || 0);

    if (base.minutes === 0 && base.actions === 0 && base.numbers === 0 && citas === 0 && social === 0) continue;
    const xp = gameDayXp({ minutes: base.minutes, actions: base.actions, numbers: base.numbers, citas, social }).total;
    perDay.push({ date, minutes: base.minutes, actions: base.actions, numbers: base.numbers, citas, social, xp });
  }

  perDay.sort((a, b) => a.date.localeCompare(b.date));

  return {
    xp: perDay.reduce((acc, day) => acc + day.xp, 0),
    minutes: perDay.reduce((acc, day) => acc + day.minutes, 0),
    activeDays: perDay.filter(day => day.minutes > 0 || day.xp > 0).length,
    actions: perDay.reduce((acc, day) => acc + day.actions, 0),
    numbers: perDay.reduce((acc, day) => acc + day.numbers, 0),
    citas: perDay.reduce((acc, day) => acc + day.citas, 0),
    social: perDay.reduce((acc, day) => acc + day.social, 0),
    intimacy: Object.values(extras.intimacyByDay ?? {}).reduce((acc, value) => acc + (Number(value) || 0), 0),
    perDay,
  };
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

export function getMirroredWeekGame(weekStart: Date): unknown {
  try {
    const start = startOfWeek(weekStart, { weekStartsOn: 1 });
    const weekKey = format(start, 'yyyy-MM-dd');
    const monthKey = `monthly_plan_${format(startOfMonth(start), 'yyyy-MM-dd')}`;
    const month = readJson<{ week_distribution?: Record<string, { game?: unknown }> }>(monthKey);
    return month?.week_distribution?.[weekKey]?.game ?? null;
  } catch {
    return null;
  }
}

export function getWeekGamePlan(weekStart: Date): GameWeekPlan {
  const mirrored = getMirroredWeekGame(weekStart);
  if (mirrored) {
    const parsed = readGameWeekPlan(mirrored);
    if (parsed.focusSkill || parsed.challenge || parsed.actionsTarget || parsed.numbersTarget || parsed.xpTarget) return parsed;
  }
  const weekId = format(startOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-ww');
  const weekly = readJson<{ game?: unknown }>(`weekly_plan_${weekId}`);
  return readGameWeekPlan(weekly?.game);
}

export function getMonthGamePlan(month: Date): GameMonthPlan {
  const monthKey = `monthly_plan_${format(startOfMonth(month), 'yyyy-MM-dd')}`;
  const monthly = readJson<{ game?: unknown }>(monthKey);
  return readGameMonthPlan(monthly?.game);
}
