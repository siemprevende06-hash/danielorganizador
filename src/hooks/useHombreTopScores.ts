import { useAreaScores } from "./useAreaScores"
import { useConsistencyScores } from "./useConsistencyScores"
import type { Timeframe, ScoreView } from "@/contexts/TimeframeContext"

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
  return Math.min(10, Math.max(0, Math.round(raw / 10)))
}

export function useHombreTopScores(
  timeframe: Timeframe,
  view: ScoreView,
  sprintDateRange?: { start: string; end: string }
) {
  const { scores: areaScores, averages, loading } = useAreaScores(timeframe, view, sprintDateRange)
  const { score: taskCompletion } = useConsistencyScores(["universidad", "emprendimiento", "proyectos"], timeframe, sprintDateRange)

  const getValue = (id: string, type: "esfuerzo" | "resultados"): number => {
    const found = areaScores.find((a) => a.id === id)
    return found ? found[type] : 0
  }

  const profesional = getValue("profesional", "esfuerzo")
  const finanzas = getValue("finanzas", "esfuerzo")
  const desarrollo = getValue("desarrollo", "esfuerzo")
  const salud = getValue("salud", "esfuerzo")
  const familia = getValue("familia", "esfuerzo")
  const amor = getValue("amor", "esfuerzo")
  const relAvg = Math.round((familia + amor) / 2)

  const resultadoProfesional = getValue("profesional", "resultados")
  const resultadoFinanzas = getValue("finanzas", "resultados")
  const resultadoDesarrollo = getValue("desarrollo", "resultados")
  const resultadoSalud = getValue("salud", "resultados")
  const resultadoFamilia = getValue("familia", "resultados")
  const resultadoAmor = getValue("amor", "resultados")
  const resultadoRelAvg = Math.round((resultadoFamilia + resultadoAmor) / 2)

  const rawEsfuerzo = [
    Math.round(profesional * 0.4 + taskCompletion * 0.3 + averages.esfuerzo * 0.3),
    averages.esfuerzo,
    Math.round(profesional * 0.6 + taskCompletion * 0.4),
    Math.round(finanzas * 0.5 + profesional * 0.5),
    salud,
    Math.round(relAvg * 0.2 + averages.esfuerzo * 0.8),
    Math.round(desarrollo * 0.6),
    Math.round(taskCompletion * 0.6 + averages.esfuerzo * 0.4),
  ]

  const rawResultados = [
    Math.round(resultadoProfesional * 0.4 + taskCompletion * 0.3 + averages.resultados * 0.3),
    averages.resultados,
    Math.round(resultadoProfesional * 0.6 + taskCompletion * 0.4),
    Math.round(resultadoFinanzas * 0.5 + resultadoProfesional * 0.5),
    resultadoSalud,
    Math.round(resultadoRelAvg * 0.2 + averages.resultados * 0.8),
    Math.round(resultadoDesarrollo * 0.6),
    Math.round(taskCompletion * 0.6 + averages.resultados * 0.4),
  ]

  const hasRealData = areaScores.some((a) => a.esfuerzo > 0)

  const esfuerzoValues = HOMBRE_TOP_AREAS.map((area, i) => {
    if (hasRealData) return scoreTo10(rawEsfuerzo[i])
    return HOMBRE_BASELINE_NOTAS[area.id] ?? 5
  })

  const resultadosValues = HOMBRE_TOP_AREAS.map((area, i) => {
    if (hasRealData) return scoreTo10(rawResultados[i])
    return HOMBRE_BASELINE_NOTAS[area.id] ?? 5
  })

  const esfuerzoAvg = Math.round(esfuerzoValues.reduce((a, b) => a + b, 0) / esfuerzoValues.length)
  const resultadosAvg = Math.round(resultadosValues.reduce((a, b) => a + b, 0) / resultadosValues.length)

  return {
    scores: HOMBRE_TOP_AREAS.map((area, i) => ({
      id: area.id,
      label: area.label,
      value: view === "resultados" ? resultadosValues[i] : esfuerzoValues[i],
      esfuerzo: esfuerzoValues[i],
      resultados: resultadosValues[i],
    })),
    average: view === "resultados" ? resultadosAvg : esfuerzoAvg,
    esfuerzoAverage: esfuerzoAvg,
    resultadosAverage: resultadosAvg,
    loading,
  }
}
