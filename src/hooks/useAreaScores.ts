import { useState, useEffect } from "react"
import type { Timeframe, ScoreView } from "@/contexts/TimeframeContext"
import { POINT_B_AREAS } from "@/data/pointB2027"
import type { PointBArea } from "@/lib/definitions"
import { useMultiConsistencyScores } from "./useConsistencyScores"

export interface AreaScore {
  id: string
  label: string
  icon: string
  group: string
  esfuerzo: number
  resultados: number
  sub: { id: string; label: string; esfuerzo: number; resultados: number; unit: string }[]
}

function buildEffortGroups(areas: PointBArea[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const area of areas) {
    if (area.effortTrackingIds.length > 0) {
      groups[area.id] = area.effortTrackingIds
    }
  }
  return groups
}

function calcResultadosForArea(area: PointBArea): number {
  if (area.sub.length === 0) return 0
  let total = 0
  let count = 0
  for (const sub of area.sub) {
    const range = sub.target - sub.start
    if (range === 0) continue
    const progress = Math.max(0, Math.min(100, ((sub.start - sub.start) / range) * 100))
    total += progress
    count++
  }
  return count > 0 ? Math.round(total / count) : 0
}

function calcSubResultados(sub: PointBArea["sub"][0]): number {
  const range = sub.target - sub.start
  if (range === 0) return 100
  return Math.max(0, Math.min(100, ((sub.start - sub.start) / range) * 100))
}

export function useAreaScores(
  timeframe: Timeframe,
  view: ScoreView,
  sprintDateRange?: { start: string; end: string }
) {
  const [scores, setScores] = useState<AreaScore[]>([])
  const [averages, setAverages] = useState({ esfuerzo: 0, resultados: 0 })
  const [loading, setLoading] = useState(true)

  const effortGroups = buildEffortGroups(POINT_B_AREAS)
  const { scores: effortScores, loading: effortLoading } = useMultiConsistencyScores(
    effortGroups,
    timeframe,
    sprintDateRange
  )

  useEffect(() => {
    const computed: AreaScore[] = POINT_B_AREAS.map(area => {
      const areaEsfuerzo = area.effortTrackingIds.length > 0
        ? (effortScores[area.id] ?? 0)
        : 0

      const areaResultados = calcResultadosForArea(area)

      const subScores = area.sub.map(sub => ({
        id: sub.id,
        label: sub.label,
        esfuerzo: sub.trackingIds.length > 0 ? (effortScores[area.id] ?? 0) : 0,
        resultados: calcSubResultados(sub),
        unit: sub.unit,
      }))

      return {
        id: area.id,
        label: area.label,
        icon: area.icon,
        group: area.group,
        esfuerzo: areaEsfuerzo,
        resultados: areaResultados,
        sub: subScores,
      }
    })

    setScores(computed)

    const totalEsfuerzo = computed.reduce((s, a) => s + a.esfuerzo, 0)
    const totalResultados = computed.reduce((s, a) => s + a.resultados, 0)
    setAverages({
      esfuerzo: computed.length > 0 ? Math.round(totalEsfuerzo / computed.length) : 0,
      resultados: computed.length > 0 ? Math.round(totalResultados / computed.length) : 0,
    })

    setLoading(effortLoading)
  }, [effortScores, effortLoading])

  return { scores, averages, loading }
}
