import type { SystemsData } from "@/hooks/useSystemsTracking";

export type SystemSpeed = "minimo" | "maximo" | "extra" | "racha";

export interface SpeedOption {
  id: SystemSpeed;
  label: string;
  minutes: number;
}

export interface DaySystem {
  id: string;
  name: string;
  cover: { type: "area" | "sub"; id: string };
  streakMinutes: number;
  speedOptions: SpeedOption[];
  timeKey?: string;
  countKey?: string;
  countLabel?: string;
  getMinutes?: (data: Pick<SystemsData, "timeData">) => number;
}

export interface DaySystemArea {
  id: string;
  name: string;
  kind: "central" | "estructural";
  cover: { type: "area" | "sub"; id: string };
  systems: DaySystem[];
  riffle?: never;
}

export function systemActualMinutes(system: DaySystem, data: Pick<SystemsData, "timeData">): number {
  if (system.getMinutes) return system.getMinutes(data);
  if (system.timeKey) return data.timeData?.[system.timeKey] ?? 0;
  return data.timeData?.[system.id] ?? 0;
}

export function systemMinForSpeed(system: DaySystem, speed: SystemSpeed): number {
  const opt = systemSpeedOptions(system).find(o => o.id === speed);
  return opt?.minutes ?? 0;
}

// Opciones de velocidad de un sistema, incluyendo "Racha" (minutos para salvar la racha) cuando aplica
export function systemSpeedOptions(system: DaySystem): SpeedOption[] {
  if (system.streakMinutes > 0) {
    return [...system.speedOptions, { id: "racha", label: "Racha", minutes: system.streakMinutes }];
  }
  return system.speedOptions;
}

const BLOCK80: SpeedOption[] = [
  { id: "minimo", label: "Mín", minutes: 80 },
  { id: "maximo", label: "Máx", minutes: 240 },
  { id: "extra", label: "Extra", minutes: 300 },
];

const HOBBY_LARGE: SpeedOption[] = [
  { id: "minimo", label: "Mín", minutes: 15 },
  { id: "maximo", label: "Máx", minutes: 30 },
  { id: "extra", label: "Extra", minutes: 60 },
];

const HOBBY_SMALL: SpeedOption[] = [
  { id: "minimo", label: "Mín", minutes: 10 },
  { id: "maximo", label: "Máx", minutes: 20 },
  { id: "extra", label: "Extra", minutes: 60 },
];

export const DAY_SYSTEMS: DaySystemArea[] = [
  {
    id: "prof-acad",
    name: "Profesional / Académico",
    kind: "central",
    cover: { type: "area", id: "profesional" },
    systems: [
      {
        id: "universidad",
        name: "Universidad",
        cover: { type: "sub", id: "universidad" },
        streakMinutes: 30,
        speedOptions: BLOCK80,
      },
      {
        id: "emprendimiento",
        name: "Emprendimiento",
        cover: { type: "sub", id: "emprendimiento" },
        streakMinutes: 30,
        speedOptions: BLOCK80,
      },
    ],
  },
  {
    id: "desarrollo",
    name: "Desarrollo Personal",
    kind: "central",
    cover: { type: "area", id: "desarrollo" },
    systems: [
      {
        id: "musica",
        name: "Música",
        cover: { type: "sub", id: "musica" },
        streakMinutes: 5,
        speedOptions: HOBBY_LARGE,
      },
      {
        id: "idiomas",
        name: "Idiomas",
        cover: { type: "sub", id: "idiomas" },
        streakMinutes: 5,
        speedOptions: HOBBY_SMALL,
        getMinutes: (d) => (d.timeData?.idiomas ?? 0) + (d.timeData?.italiano ?? 0) + (d.timeData?.ingles ?? 0),
      },
      {
        id: "game",
        name: "Game (Seducción)",
        cover: { type: "sub", id: "game" },
        streakMinutes: 5,
        speedOptions: HOBBY_SMALL,
      },
      {
        id: "ajedrez",
        name: "Ajedrez",
        cover: { type: "sub", id: "ajedrez" },
        streakMinutes: 5,
        speedOptions: HOBBY_SMALL,
        countKey: "ajedrez",
        countLabel: "partidas",
      },
      {
        id: "lectura",
        name: "Lectura",
        cover: { type: "sub", id: "lectura" },
        streakMinutes: 5,
        speedOptions: HOBBY_LARGE,
      },
    ],
  },
  {
    id: "finanzas",
    name: "Finanzas",
    kind: "central",
    cover: { type: "area", id: "finanzas" },
    systems: [
      {
        id: "finanzas",
        name: "Control Financiero",
        cover: { type: "sub", id: "finanzas" },
        streakMinutes: 0,
        speedOptions: HOBBY_SMALL,
      },
    ],
  },
  {
    id: "salud",
    name: "Salud y Bienestar",
    kind: "estructural",
    cover: { type: "area", id: "salud" },
    systems: [],
  },
  {
    id: "fuerza-mental",
    name: "Fuerza de Voluntad",
    kind: "estructural",
    cover: { type: "area", id: "fuerza-mental" },
    systems: [],
  },
  {
    id: "apariencia",
    name: "Apariencia",
    kind: "estructural",
    cover: { type: "area", id: "apariencia" },
    systems: [],
  },
];

// ---------- Sostén: áreas estructurales del día ----------
export interface SostenHabit {
  id: string;
  name: string;
  emoji: string;
  cover?: { type: "area" | "sub"; id: string };
  hasWater?: boolean;
  hasMealPhoto?: boolean;
  hasTime?: boolean;
  isWorkout?: boolean;
  isSleepSchedule?: boolean;
  linkTo?: string;
}

export interface SostenSubarea {
  id: string;
  title: string;
  emoji: string;
  habits: SostenHabit[];
}

export interface SostenArea {
  id: string;
  subareas: SostenSubarea[];
}

// Sub-áreas del Sostén por área estructural:
//  - Fuerza de Voluntad: Hábitos (página Hábitos) · Rutinas · Detox Dopamínico
//  - Salud y Bienestar: Alimentación y Agua · Entrenamiento y Sueño
//  - Apariencia: Skin Care · Higiene
export const SOSTEN_AREAS: SostenArea[] = [
  {
    id: "fuerza-mental",
    subareas: [
      {
        id: "habitos",
        title: "Hábitos",
        emoji: "🎯",
        habits: [
          { id: "habit-sueno", name: "Hábito: Horario de sueño", emoji: "🌙" },
          { id: "habit-rutina-activacion", name: "Hábito: Activación", emoji: "⚡" },
          { id: "habit-entrenamiento", name: "Hábito: Gym", emoji: "💪" },
          { id: "habit-desayuno", name: "Hábito: Alistamiento y desayuno", emoji: "🍳" },
          { id: "habit-skincare-am", name: "Hábito: Skin care AM", emoji: "☀️" },
          { id: "habit-skincare-pm", name: "Hábito: Skin care PM", emoji: "🌙" },
          { id: "habit-rutina-desactivacion", name: "Hábito: Desactivación", emoji: "🕯️" },
          { id: "habit-alimentacion", name: "Hábito: Alimentación y agua", emoji: "💧" },
          { id: "habit-finanzas", name: "Hábito: Control financiero", emoji: "💰" },
          { id: "mini-nofap", name: "Mini: No FAP", emoji: "🚫" },
          { id: "mini-nosocial", name: "Mini: No Redes Sociales +30min", emoji: "📵" },
        ],
      },
      {
        id: "rutinas",
        title: "Rutinas",
        emoji: "🔁",
        habits: [
          { id: "rutina-activacion", name: "Rutina de Activación", emoji: "⚡", linkTo: "/activation-routine" },
          { id: "alistamiento-desayuno", name: "Alistamiento y Desayuno", emoji: "🍽️" },
          { id: "rutina-desactivacion", name: "Rutina de Desactivación", emoji: "🕯️", linkTo: "/deactivation-routine" },
        ],
      },
      {
        id: "detox",
        title: "Detox Dopamínico",
        emoji: "🧘",
        habits: [
          { id: "no-videojuegos", name: "Videojuegos (máx 1h)", emoji: "🎮", hasTime: true },
          { id: "no-porn", name: "No Porn", emoji: "🚫" },
          { id: "no-fap", name: "No FAP", emoji: "🚫" },
          { id: "redes-sociales", name: "Redes Sociales (máx 30 min)", emoji: "📵", hasTime: true },
        ],
      },
    ],
  },
  {
    id: "salud",
    subareas: [
      {
        id: "alimentacion-agua",
        title: "Alimentación y Agua",
        emoji: "🍽️",
        habits: [
          { id: "pre-entreno", name: "Pre-entreno", emoji: "⚡", hasWater: true, hasMealPhoto: true },
          { id: "desayuno", name: "Desayuno", emoji: "🍳", hasWater: true, hasMealPhoto: true },
          { id: "merienda-1", name: "Merienda 1", emoji: "🍎", hasWater: true, hasMealPhoto: true },
          { id: "almuerzo", name: "Almuerzo", emoji: "🍲", hasWater: true, hasMealPhoto: true },
          { id: "merienda-2", name: "Merienda 2", emoji: "🥪", hasWater: true, hasMealPhoto: true },
          { id: "comida", name: "Comida", emoji: "🍛", hasWater: true, hasMealPhoto: true },
          { id: "antes-dormir", name: "Antes de dormir", emoji: "🌙", hasWater: true, hasMealPhoto: true },
          { id: "suplementos", name: "Suplementos", emoji: "💊" },
        ],
      },
      {
        id: "cuerpo-sueno",
        title: "Entrenamiento y Sueño",
        emoji: "💪",
        habits: [
          { id: "gym", name: "Gym", emoji: "💪", isWorkout: true },
          { id: "horario-regular", name: "Horario Regular", emoji: "🛏️", isSleepSchedule: true },
        ],
      },
    ],
  },
  {
    id: "apariencia",
    subareas: [
      {
        id: "skincare",
        title: "Skin Care",
        emoji: "✨",
        habits: [
          { id: "skincare-manana", name: "Skin Care Mañana", emoji: "☀️" },
          { id: "skincare-noche", name: "Skin Care Noche", emoji: "🌙" },
        ],
      },
      {
        id: "higiene",
        title: "Higiene y Vestimenta",
        emoji: "🛁",
        habits: [
          { id: "banarme-vestirme", name: "Bañarme y Vestirme", emoji: "👔" },
        ],
      },
    ],
  },
];

// Vista plana del Sostén (compat con estadísticas y consumidores previos)
export const SOSTEN_STRUCTURAL: Record<string, { id: string; name: string }[]> = Object.fromEntries(
  SOSTEN_AREAS.map(area => [
    area.id,
    area.subareas.flatMap(s => s.habits.map(h => ({ id: h.id, name: h.name }))),
  ])
);
