import { useMultiConsistencyScores } from "./useConsistencyScores"
import { usePuntoPartida } from "./usePuntoPartida"
import type { Timeframe } from "@/contexts/TimeframeContext"

export const WHEEL_AREAS = [
  { id: "salud", label: "SALUD FÍSICO APARIENCIA", areaIds: ["gym", "skincare_am", "skincare_pm"] },
  { id: "mente", label: "MENTE Y DESARROLLO PERSONAL", areaIds: ["lectura", "idiomas", "piano", "guitarra", "universidad"] },
  { id: "carrera", label: "CARRERA / EMPRENDIMIENTO", areaIds: ["universidad", "emprendimiento", "proyectos"] },
  { id: "finanzas", label: "FINANZAS", areaIds: ["finanzas"] },
  { id: "relaciones", label: "RELACIONES / SOCIAL", areaIds: [] },
  { id: "proposito", label: "PROPÓSITO / ESPIRITUAL", areaIds: [] },
]

// Wheel areas map to these baseline IDs in punto_partida
const WHEEL_BASELINE_IDS = ["salud", "mente", "carrera", "finanzas", "relaciones", "proposito"]

export function useWheelScores(timeframe: Timeframe) {
  const groups: Record<string, string[]> = {}
  for (const area of WHEEL_AREAS) {
    groups[area.id] = area.areaIds
  }

  const { scores: realScores, loading: realLoading, refresh } = useMultiConsistencyScores(groups, timeframe)
  const { entries: baselineEntries, loading: baseLoading } = usePuntoPartida()

  const loading = realLoading || baseLoading

  const wheelScores = WHEEL_AREAS.map((area) => {
    const real = realScores[area.id] ?? 0
    // Use baseline if no real data, otherwise use real data
    const base = baselineEntries[area.id]?.nota !== undefined ? Math.round(baselineEntries[area.id].nota * 10) : 0
    const value = real > 0 ? real : base
    return { id: area.id, label: area.label, value }
  })

  const average =
    wheelScores.length > 0
      ? Math.round(wheelScores.reduce((a, b) => a + b.value, 0) / wheelScores.length)
      : 0

  return { scores: wheelScores, average, loading, refresh }
}
