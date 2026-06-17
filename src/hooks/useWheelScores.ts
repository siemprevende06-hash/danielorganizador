import { useMultiConsistencyScores } from "./useConsistencyScores"
import type { Timeframe } from "@/contexts/TimeframeContext"

export const WHEEL_AREAS = [
  { id: "salud", label: "SALUD FÍSICO APARIENCIA", areaIds: ["gym", "skincare_am", "skincare_pm"] },
  { id: "mente", label: "MENTE Y DESARROLLO PERSONAL", areaIds: ["lectura", "idiomas", "piano", "guitarra", "universidad"] },
  { id: "carrera", label: "CARRERA / EMPRENDIMIENTO", areaIds: ["universidad", "emprendimiento", "proyectos"] },
  { id: "finanzas", label: "FINANZAS", areaIds: ["finanzas"] },
  { id: "relaciones", label: "RELACIONES / SOCIAL", areaIds: [] },
  { id: "proposito", label: "PROPÓSITO / ESPIRITUAL", areaIds: [] },
]

// Baseline: se usará cuando no haya datos reales de tracking
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

  const { scores: realScores, loading, refresh } = useMultiConsistencyScores(groups, timeframe)

  const wheelScores = WHEEL_AREAS.map((area) => {
    const real = realScores[area.id] ?? 0
    if (real > 0) return { id: area.id, label: area.label, value: real }
    return { id: area.id, label: area.label, value: (WHEEL_BASELINE_NOTAS[area.id] ?? 0) * 10 }
  })

  const average =
    wheelScores.length > 0
      ? Math.round(wheelScores.reduce((a, b) => a + b.value, 0) / wheelScores.length)
      : 0

  return { scores: wheelScores, average, loading, refresh }
}
