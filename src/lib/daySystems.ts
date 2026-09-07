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
  getMinutes?: (data: SystemsData) => number;
}

export interface DaySystemArea {
  id: string;
  name: string;
  kind: "central" | "estructural";
  cover: { type: "area" | "sub"; id: string };
  riffle?: never;
}

export function systemActualMinutes(system: DaySystem, data: SystemsData): number {
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
    name: "Fuerza Mental",
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

// Tareas del Sostén agrupadas por área estructural
export const SOSTEN_STRUCTURAL: Record<string, { id: string; name: string }[]> = {
  salud: [
    { id: "gym", name: "Gym" },
    { id: "desayuno", name: "Desayuno" },
    { id: "almuerzo", name: "Almuerzo" },
    { id: "comida", name: "Comida" },
    { id: "suplementos", name: "Suplementos" },
    { id: "horario-regular", name: "Horario de Sueño" },
  ],
  "fuerza-mental": [
    { id: "rutina-activacion", name: "Rutina de Activación" },
    { id: "rutina-desactivacion", name: "Rutina de Desactivación" },
    { id: "alistamiento-desayuno", name: "Alistamiento y Desayuno" },
  ],
  apariencia: [
    { id: "skincare-manana", name: "Skin Care Mañana" },
    { id: "skincare-noche", name: "Skin Care Noche" },
    { id: "banarme-vestirme", name: "Bañarme y Vestirme" },
  ],
};
