import { useMultiConsistencyScores } from "./useConsistencyScores"
import type { Timeframe } from "@/contexts/TimeframeContext"

export const WHEEL_AREAS = [
  { id: "salud", label: "SALUD FÍSICO APARIENCIA", areaIds: ["gym", "skincare_am", "skincare_pm"] },
  { id: "mente", label: "MENTE Y DESARROLLO PERSONAL", areaIds: ["lectura", "idiomas", "ajedrez", "piano", "guitarra", "universidad"] },
  { id: "carrera", label: "CARRERA / EMPRENDIMIENTO", areaIds: ["universidad", "emprendimiento", "proyectos"] },
  { id: "finanzas", label: "FINANZAS", areaIds: ["finanzas"] },
  { id: "relaciones", label: "RELACIONES / SOCIAL", areaIds: [] },
  { id: "proposito", label: "PROPÓSITO / ESPIRITUAL", areaIds: [] },
]

export function useWheelScores(timeframe: Timeframe) {
  const groups: Record<string, string[]> = {}
  for (const area of WHEEL_AREAS) {
    groups[area.id] = area.areaIds
  }

  const { scores, loading, refresh } = useMultiConsistencyScores(groups, timeframe)

  // Convert to array
  const wheelScores = WHEEL_AREAS.map((area) => ({
    id: area.id,
    label: area.label,
    value: scores[area.id] ?? 0,
  }))

  const average =
    wheelScores.length > 0
      ? Math.round(wheelScores.reduce((a, b) => a + b.value, 0) / wheelScores.length)
      : 0

  return { scores: wheelScores, average, loading, refresh }
}
