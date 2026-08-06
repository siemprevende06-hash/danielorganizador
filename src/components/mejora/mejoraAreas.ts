import { BookOpen, Music2, Gamepad2, Globe, Sparkles, Dumbbell, type LucideIcon } from "lucide-react";

export type MejoraAreaId = "lectura" | "musica" | "ajedrez" | "idiomas" | "game" | "gym";

export interface MejoraAreaMeta {
  id: MejoraAreaId;
  label: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  dailyTarget: number;
  unit: string;
}

export const MEJORA_AREAS: MejoraAreaMeta[] = [
  { id: "lectura", label: "Lectura", icon: BookOpen, color: "text-purple-500", gradient: "from-purple-500 to-fuchsia-400", dailyTarget: 20, unit: "min" },
  { id: "musica", label: "Música", icon: Music2, color: "text-pink-500", gradient: "from-pink-500 to-rose-400", dailyTarget: 30, unit: "min" },
  { id: "ajedrez", label: "Ajedrez", icon: Gamepad2, color: "text-indigo-500", gradient: "from-indigo-500 to-violet-400", dailyTarget: 15, unit: "min" },
  { id: "idiomas", label: "Idiomas", icon: Globe, color: "text-emerald-500", gradient: "from-emerald-500 to-teal-400", dailyTarget: 30, unit: "min" },
  { id: "game", label: "Game", icon: Sparkles, color: "text-amber-500", gradient: "from-amber-500 to-orange-400", dailyTarget: 15, unit: "min" },
  { id: "gym", label: "Gym", icon: Dumbbell, color: "text-orange-500", gradient: "from-orange-500 to-red-400", dailyTarget: 45, unit: "min" },
];

export const areaMetaById = (id: MejoraAreaId): MejoraAreaMeta =>
  MEJORA_AREAS.find((a) => a.id === id) || MEJORA_AREAS[0];

export function getAreaMinutes(row: any, area: MejoraAreaId): number {
  if (area === "gym") return Number(row?.workout_duration) || 0;
  const td = row?.time_data || {};
  if (area === "idiomas") return (Number(td.italiano) || 0) + (Number(td.ingles) || 0);
  return Number(td[area]) || 0;
}