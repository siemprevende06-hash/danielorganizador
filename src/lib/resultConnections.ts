import type { PointBArea, PointBSubAxis } from "@/lib/definitions";
import type { AreaScore, SubAreaScore } from "@/hooks/useAreaScores";
import { HABIT_META } from "@/lib/areaSystemsMap";

export interface ResultConnection {
  id: string;
  name: string;
  emoji?: string;
  todayDone: boolean;
  todayMinutes: number;
  consistency: number;
  minutes30d: number;
}

export interface ResultLeafConnector {
  id: string;
  label: string;
  unit: string;
  start: number;
  target: number;
  current: number;
  pct: number;
  esfuerzo: number;
  minutes: number;
  connections: ResultConnection[];
}

const ORGANIZACION_IDS = [
  "organizacion-cuarto",
  "organizacion-bano",
  "organizacion-sala",
  "organizacion-platos",
];

// Cadenas explícitas para ejes cuyos trackingIds no son sistemas o están vacíos:
//  - "orden" (Apariencia) se alimenta del checklist de Organización.
//  - "seduccion" (Amor) la empuja el sistema Game (Seducción) del día.
const CHAIN_MAP: Record<string, string[]> = {
  orden: ORGANIZACION_IDS,
  seduccion: ["game"],
};

function flattenPointB(subs: PointBSubAxis[]): PointBSubAxis[] {
  const out: PointBSubAxis[] = [];
  for (const s of subs) {
    if (s.children && s.children.length > 0) out.push(...flattenPointB(s.children));
    else out.push(s);
  }
  return out;
}

function flattenScore(subs: SubAreaScore[]): SubAreaScore[] {
  const out: SubAreaScore[] = [];
  for (const s of subs) {
    if (s.children && s.children.length > 0) out.push(...flattenScore(s.children));
    else out.push(s);
  }
  return out;
}

/** Reconstruye el valor "actual" desde el % de avance (para vistas sin usePuntoPartida). */
export function pctToCurrent(pct: number, start: number, target: number): number {
  const range = target - start;
  if (range === 0) return start;
  return Math.round((start + (pct / 100) * range) * 10) / 10;
}

export interface BuildResultLeavesArgs {
  area: PointBArea;
  score: AreaScore;
  /** Resolve el valor actual del eje; si devuelve undefined se reconstruye desde el %. */
  currentOf?: (leafId: string) => number | undefined;
  completions: Record<string, boolean>;
  timeData: Record<string, number>;
  subStats?: Record<string, { consistency: number; minutes: number }>;
}

/**
 * Conecta cada resultado (hoja del Punto B) con los sistemas/hábitos que lo
 * producen: el detalle del día (completado/minutos) y la constancia de 30d.
 */
export function buildResultLeaves({
  area,
  score,
  currentOf,
  completions,
  timeData,
  subStats,
}: BuildResultLeavesArgs): ResultLeafConnector[] {
  const pbLeaves = flattenPointB(area.sub);
  const scLeaves = flattenScore(score.sub);
  const scoreById = new Map(scLeaves.map(l => [l.id, l]));

  return pbLeaves.map(pb => {
    const sc = scoreById.get(pb.id);
    const pct = sc ? Math.round(sc.resultados) : 0;
    const current = currentOf?.(pb.id) ?? pctToCurrent(pct, pb.start, pb.target);

    const direct = pb.trackingIds.filter(id => HABIT_META[id]);
    const chain = CHAIN_MAP[pb.id] ?? [];
    const connIds = [...new Set([...direct, ...chain.filter(id => HABIT_META[id])])];

    const connections: ResultConnection[] = connIds.map(id => {
      const meta = HABIT_META[id];
      const stats = subStats?.[id];
      return {
        id,
        name: meta?.name ?? id,
        emoji: meta?.emoji,
        todayDone: !!completions[id],
        todayMinutes: timeData[id] ?? 0,
        consistency: stats?.consistency ?? 0,
        minutes30d: stats?.minutes ?? 0,
      };
    });

    return {
      id: pb.id,
      label: pb.label,
      unit: pb.unit,
      start: pb.start,
      target: pb.target,
      current,
      pct,
      esfuerzo: sc?.esfuerzo ?? 0,
      minutes: sc?.minutes ?? 0,
      connections,
    };
  });
}