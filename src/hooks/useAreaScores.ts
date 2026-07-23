import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { format, subDays } from "date-fns"
import type { Timeframe, ScoreView } from "@/contexts/TimeframeContext"
import { POINT_B_AREAS } from "@/data/pointB2027"
import type { PointBArea, PointBSubAxis } from "@/lib/definitions"
import { useMultiConsistencyScores } from "./useConsistencyScores"

export interface SubAreaScore {
  id: string
  label: string
  esfuerzo: number
  resultados: number
  unit: string
  minutes: number
  children?: SubAreaScore[]
}

export interface AreaScore {
  id: string
  label: string
  icon: string
  group: string
  esfuerzo: number
  resultados: number
  sub: SubAreaScore[]
}

function getDateRange(timeframe: Timeframe, sprintDateRange?: { start: string; end: string }): { start: string; end: string } | null {
  if (timeframe === "sprint" && sprintDateRange) return sprintDateRange
  if (timeframe === "sprint") return null
  const today = new Date()
  const end = format(today, "yyyy-MM-dd")
  let start: Date
  switch (timeframe) {
    case "today": start = today; break
    case "week": start = subDays(today, 6); break
    case "month": start = subDays(today, 29); break
    case "quarter": start = subDays(today, 89); break
    case "year": start = subDays(today, 364); break
    default: start = subDays(today, 6)
  }
  return { start: format(start, "yyyy-MM-dd"), end }
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
  const subs = flattenSub(area.sub)
  if (subs.length === 0) return 0
  let total = 0
  let count = 0
  for (const sub of subs) {
    const current = sub.start
    const range = sub.target - sub.start
    if (range === 0) continue
    const progress = Math.max(0, Math.min(100, ((current - sub.start) / range) * 100))
    total += progress
    count++
  }
  return count > 0 ? Math.round(total / count) : 0
}

function calcSubResultados(sub: PointBSubAxis): number {
  const current = sub.start
  const range = sub.target - sub.start
  if (range === 0) return 100
  return Math.max(0, Math.min(100, ((current - sub.start) / range) * 100))
}

function flattenSub(sub: PointBSubAxis[]): PointBSubAxis[] {
  const result: PointBSubAxis[] = []
  for (const s of sub) {
    if (s.children && s.children.length > 0) {
      result.push(...flattenSub(s.children))
    } else {
      result.push(s)
    }
  }
  return result
}

function collectLeafTrackingIds(sub: PointBSubAxis[]): string[] {
  const ids: string[] = []
  for (const s of sub) {
    if (s.children && s.children.length > 0) {
      ids.push(...collectLeafTrackingIds(s.children))
    } else {
      ids.push(...s.trackingIds)
    }
  }
  return ids
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

  const [subStats, setSubStats] = useState<Record<string, { consistency: number; minutes: number }>>({})
  const [subStatsLoading, setSubStatsLoading] = useState(true)

  useEffect(() => {
    const allLeafIds: string[] = []
    for (const area of POINT_B_AREAS) {
      allLeafIds.push(...collectLeafTrackingIds(area.sub))
    }
    const uniqueIds = [...new Set(allLeafIds)]

    if (uniqueIds.length === 0) {
      setSubStats({})
      setSubStatsLoading(false)
      return
    }

    const range = getDateRange(timeframe, sprintDateRange)
    if (!range) {
      setSubStats({})
      setSubStatsLoading(false)
      return
    }

    setSubStatsLoading(true)

    supabase
      .from("daily_area_stats")
      .select("area_id, stat_date, time_spent_minutes, time_goal_minutes")
      .in("area_id", uniqueIds)
      .gte("stat_date", range.start)
      .lte("stat_date", range.end)
      .then(({ data, error }) => {
        if (error || !data) {
          setSubStats({})
          setSubStatsLoading(false)
          return
        }

        const grouped: Record<string, { spent: number; rates: number[] }> = {}
        const seen = new Set<string>()

        for (const row of data) {
          const key = `${row.area_id}|${row.stat_date}`
          if (seen.has(key)) continue
          seen.add(key)

          if (!grouped[row.area_id]) {
            grouped[row.area_id] = { spent: 0, rates: [] }
          }
          grouped[row.area_id].spent += row.time_spent_minutes || 0
          const goal = row.time_goal_minutes || 30
          const rate = Math.min(100, Math.round(((row.time_spent_minutes || 0) / goal) * 100))
          grouped[row.area_id].rates.push(rate)
        }

        const result: Record<string, { consistency: number; minutes: number }> = {}
        for (const [id, stats] of Object.entries(grouped)) {
          const consistency = stats.rates.length > 0
            ? Math.round(stats.rates.reduce((a, b) => a + b, 0) / stats.rates.length)
            : 0
          result[id] = { consistency, minutes: Math.round(stats.spent) }
        }

        setSubStats(result)
        setSubStatsLoading(false)
      })
  }, [timeframe, sprintDateRange?.start, sprintDateRange?.end])

  function buildSubScores(sub: PointBSubAxis[]): SubAreaScore[] {
    return sub.map(s => {
      if (s.children && s.children.length > 0) {
        const childScores = buildSubScores(s.children)
        const avgConsistency = childScores.length > 0
          ? Math.round(childScores.reduce((sum, c) => sum + c.esfuerzo, 0) / childScores.length)
          : 0
        const totalMinutes = childScores.reduce((sum, c) => sum + c.minutes, 0)
        const avgResultados = childScores.length > 0
          ? Math.round(childScores.reduce((sum, c) => sum + c.resultados, 0) / childScores.length)
          : 0
        return {
          id: s.id,
          label: s.label,
          esfuerzo: avgConsistency,
          resultados: avgResultados,
          unit: s.unit,
          minutes: totalMinutes,
          children: childScores,
        }
      }

      const stats = s.trackingIds.reduce<{ consistency: number; minutes: number }>(
        (acc, tid) => {
          const subStat = subStats[tid]
          if (subStat) {
            if (subStat.consistency > acc.consistency) acc.consistency = subStat.consistency
            acc.minutes += subStat.minutes
          }
          return acc
        },
        { consistency: 0, minutes: 0 }
      )

      return {
        id: s.id,
        label: s.label,
        esfuerzo: stats.consistency,
        resultados: calcSubResultados(s),
        unit: s.unit,
        minutes: stats.minutes,
      }
    })
  }

  useEffect(() => {
    if (subStatsLoading || effortLoading) return

    const computed: AreaScore[] = POINT_B_AREAS.map(area => {
      const realScore = effortScores[area.id] ?? 0
      const areaEsfuerzo = area.effortTrackingIds.length > 0 ? realScore : 0
      const areaResultados = calcResultadosForArea(area)
      const subScores = buildSubScores(area.sub)

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

    setLoading(false)
  }, [effortScores, effortLoading, subStats, subStatsLoading])

  return { scores, averages, loading, subStats }
}
