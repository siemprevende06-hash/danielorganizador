import {
  ArrowUpFromLine,
  Bike,
  Dumbbell,
  Flame,
  Footprints,
  Grid3x3,
  Hand,
  Heart,
  HeartPulse,
  LayoutGrid,
  Moon,
  PersonStanding,
  Rocket,
  Timer,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

export const DEFAULT_GLYPH = "figureStrength";

export const GLYPH_GROUPS: { key: string; items: string[] }[] = [
  { key: "Fuerza", items: ["figureStrength", "arm", "abs", "legs", "pullup"] },
  { key: "Equipo", items: ["dumbbell", "barbell", "kettlebell", "plate", "machine"] },
  { key: "Cardio", items: ["figureRun", "bike", "swim", "boxing", "timer"] },
  { key: "Recovery", items: ["stretch", "moon", "heart", "flame", "bolt"] },
];

export const GLYPHS = GLYPH_GROUPS.flatMap((g) => g.items);

const LUCID: Record<string, LucideIcon> = {
  figureStrength: Dumbbell,
  arm: Hand,
  abs: Grid3x3,
  legs: Footprints,
  pullup: ArrowUpFromLine,
  dumbbell: Dumbbell,
  barbell: Dumbbell,
  kettlebell: Dumbbell,
  plate: LayoutGrid,
  machine: Rocket,
  figureRun: PersonStanding,
  bike: Bike,
  swim: Waves,
  boxing: Hand,
  timer: Timer,
  stretch: HeartPulse,
  moon: Moon,
  heart: Heart,
  flame: Flame,
  bolt: Zap,
};

const LEGACY: Record<string, string> = {
  "💪": "arm",
  "🦾": "arm",
  "🦵": "legs",
  "🔥": "flame",
  "⚡": "bolt",
  "🏋️": "dumbbell",
  "🏋": "dumbbell",
  "🏃": "figureRun",
  "🚴": "bike",
  "🏊": "swim",
  "🧗": "pullup",
  "🏆": "trophy",
  "🎯": "target",
  "⭐": "star",
  "🌙": "moon",
  "💪🏼": "arm",
};

export function glyphOf(v?: string | null): string {
  if (!v) return DEFAULT_GLYPH;
  if (LUCID[v]) return v;
  if (LEGACY[v]) return LEGACY[v];
  const base = [...v].filter((c) => c !== "\uFE0F" && c !== "\u200D")[0];
  return LEGACY[base] || DEFAULT_GLYPH;
}

export function glyphIcon(v?: string | null): LucideIcon {
  return LUCID[glyphOf(v)] || Dumbbell;
}

export function Glyph({
  name,
  className,
  style,
}: {
  name?: string | null;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon = glyphIcon(name);
  return <Icon className={className} style={style} />;
}