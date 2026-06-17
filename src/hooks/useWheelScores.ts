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

// Hardcoded baseline notas — usadas cuando no hay datos en Supabase ni tracking real
const WHEEL_BASELINE_NOTAS: Record<string, number> = {
  salud: 4,
  mente: 7,
  carrera: 5,
  finanzas: 5,
  relaciones: 5,
  proposito: 7,
}

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
    if (real > 0) return { id: area.id, label: area.label, value: real }
    // Fallback: try Supabase baseline, then hardcoded
    const baseFromDB = baselineEntries[area.id]?.nota
    if (baseFromDB !== undefined) return { id: area.id, label: area.label, value: Math.round(baseFromDB * 10) }
    return { id: area.id, label: area.label, value: (WHEEL_BASELINE_NOTAS[area.id] ?? 0) * 10 }
  })

  const average =
    wheelScores.length > 0
      ? Math.round(wheelScores.reduce((a, b) => a + b.value, 0) / wheelScores.length)
      : 0

  return { scores: wheelScores, average, loading, refresh }
}
