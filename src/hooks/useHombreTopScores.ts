import { useWheelScores, WHEEL_AREAS } from "./useWheelScores"
import { useConsistencyScores } from "./useConsistencyScores"
import type { Timeframe } from "@/contexts/TimeframeContext"

export const HOMBRE_TOP_AREAS = [
  { id: "liderazgo", label: "LIDERAZGO / DIRECCIÓN" },
  { id: "seguridad", label: "SEGURIDAD / PROTECCIÓN" },
  { id: "estatus", label: "ESTATUS / RESPETO" },
  { id: "provision", label: "PROVISIÓN / AMBICIÓN" },
  { id: "fortaleza", label: "FORTALEZA FÍSICA / PRESENCIA" },
  { id: "ie", label: "INTELIGENCIA EMOCIONAL / CONEXIÓN" },
  { id: "carisma", label: "CARISMA / DIVERSIÓN" },
  { id: "lealtad", label: "LEALTAD / COMPROMISO" },
]

// Baseline notas — usadas cuando no hay tracking real
export const HOMBRE_BASELINE_NOTAS: Record<string, number> = {
  liderazgo: 6,
  seguridad: 4,
  estatus: 5,
  provision: 5,
  fortaleza: 3,
  ie: 5,
  carisma: 8,
  lealtad: 5,
}

function scoreTo10(raw: number): number {
  return Math.round(raw / 10)
}

export function useHombreTopScores(timeframe: Timeframe) {
  const { scores: wheelScores, average: wheelAverage, loading: wheelLoading } = useWheelScores(timeframe)
  const { score: taskCompletion } = useConsistencyScores(["universidad", "emprendimiento", "proyectos"], timeframe)

  const getWheelValue = (id: string): number => {
    const found = wheelScores.find((s) => s.id === id)
    return found?.value ?? 0
  }

  const carga = getWheelValue("carrera")
  const finanzas = getWheelValue("finanzas")
  const mente = getWheelValue("mente")
  const salud = getWheelValue("salud")
  const relaciones = getWheelValue("relaciones")

  const rawValues = [
    Math.round(carga * 0.4 + taskCompletion * 0.3 + wheelAverage * 0.3),
    wheelAverage,
    Math.round(carga * 0.6 + taskCompletion * 0.4),
    Math.round(finanzas * 0.5 + carga * 0.5),
    salud,
    Math.round(relaciones * 0.2 + wheelAverage * 0.8),
    Math.round(mente * 0.6),
    Math.round(taskCompletion * 0.6 + wheelAverage * 0.4),
  ]

  const hasRealData = wheelScores.some((s) => s.value > 0)

  const values = HOMBRE_TOP_AREAS.map((area, i) => {
    if (hasRealData) return scoreTo10(rawValues[i])
    return HOMBRE_BASELINE_NOTAS[area.id] ?? 5
  })

  const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length)

  return {
    scores: HOMBRE_TOP_AREAS.map((area, i) => ({
      id: area.id,
      label: area.label,
      value: values[i],
    })),
    average,
    loading: wheelLoading,
  }
}
