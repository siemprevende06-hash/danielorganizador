import { useSystemsTracking, type SystemsData } from "@/hooks/useSystemsTracking";

const SOSTEN_IDS = [
  "rutina-activacion", "alistamiento-desayuno", "horario-regular", "rutina-desactivacion",
  "skincare-manana", "skincare-noche", "banarme-vestirme",
  "pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir", "suplementos",
];

const MEJORA_GOALS: Record<string, number> = {
  lectura: 20, musica: 30, ajedrez: 15, game: 15, idiomas: 30, "entrenamiento-fisico": 45,
};

const TOTAL_WORK_BLOCKS = 21;

function getMejoraMinutes(timeData: Record<string, number>, habitId: string): number {
  if (!timeData) return 0;
  if (habitId === "idiomas") {
    return (Number(timeData.italiano) || 0) + (Number(timeData.ingles) || 0);
  }
  return Number(timeData[habitId]) || 0;
}

export interface VisionBalance {
  sostenPercent: number;
  mejoraPercent: number;
  focoPercent: number;
  dailyPercent: number;
  loading: boolean;
}

export function useVisionBalance(targetDate?: Date, overrideData?: SystemsData): VisionBalance {
  const { data: hookData, loading } = useSystemsTracking(targetDate);
  const data = overrideData ?? hookData;

  const sostenDone = SOSTEN_IDS.filter((id) => data.completions[id]).length;
  const sostenPercent = Math.round((sostenDone / SOSTEN_IDS.length) * 100);

  const mejoraHabits = Object.keys(MEJORA_GOALS);
  const mejoraTotal = mejoraHabits.reduce(
    (acc, id) => acc + Math.min(getMejoraMinutes(data.timeData, id) / (MEJORA_GOALS[id] || 1), 1),
    0
  );
  const mejoraPercent = Math.round((mejoraTotal / mejoraHabits.length) * 100);

  const completedWorkBlocks = Object.entries(data.workAssignments)
    .filter(
      ([cellId, area]) => area && !cellId.startsWith("__mode__") && data.blockCompletions[cellId]
    )
    .length;
  const focoPercent = Math.round((completedWorkBlocks / TOTAL_WORK_BLOCKS) * 100);

  const dailyPercent = Math.round((sostenPercent + mejoraPercent + focoPercent) / 3);

  return { sostenPercent, mejoraPercent, focoPercent, dailyPercent, loading };
}