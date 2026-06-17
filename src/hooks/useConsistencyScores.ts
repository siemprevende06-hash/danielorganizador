import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { format, subDays, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns"
import type { Timeframe } from "@/contexts/TimeframeContext"

function getDateRange(timeframe: Timeframe): { start: string; end: string } {
  const today = new Date()
  const end = format(today, "yyyy-MM-dd")
  let start: Date

  switch (timeframe) {
    case "today":
      start = today
      break
    case "week":
      start = subDays(today, 6)
      break
    case "month":
      start = subDays(today, 29)
      break
    case "quarter":
      start = subDays(today, 89)
      break
    case "year":
      start = subDays(today, 364)
      break
    default:
      start = subDays(today, 6)
  }

  return { start: format(start, "yyyy-MM-dd"), end }
}

/**
 * Returns the average consistency score (0–100) for a group of area_ids
 * over a given timeframe. Score = average daily time_spent / time_goal ratio.
 * Days with no data are excluded from the average.
 */
export function useConsistencyScores(areaIds: string[], timeframe: Timeframe) {
  const [score, setScore] = useState(0)
  const [daysWithData, setDaysWithData] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (areaIds.length === 0) {
      setScore(0)
      setDaysWithData(0)
      setLoading(false)
      return
    }

    const { start, end } = getDateRange(timeframe)
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("daily_area_stats")
        .select("area_id, stat_date, time_spent_minutes, time_goal_minutes")
        .in("area_id", areaIds)
        .gte("stat_date", start)
        .lte("stat_date", end)

      if (error) {
        console.warn("[useConsistencyScores] error:", error.message)
        setScore(0)
        setDaysWithData(0)
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setScore(0)
        setDaysWithData(0)
        setLoading(false)
        return
      }

      // Group by area_id + stat_date and calculate daily completion rate
      const dailyRates: number[] = []
      const seen = new Set<string>()

      for (const row of data) {
        const key = `${row.area_id}|${row.stat_date}`
        if (seen.has(key)) continue
        seen.add(key)

        const goal = row.time_goal_minutes || 30
        const spent = row.time_spent_minutes || 0
        const rate = Math.min(100, Math.round((spent / goal) * 100))
        dailyRates.push(rate)
      }

      if (dailyRates.length === 0) {
        setScore(0)
        setDaysWithData(0)
      } else {
        const avg = Math.round(dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length)
        setScore(avg)
        setDaysWithData(dailyRates.length)
      }
    } catch (err) {
      console.warn("[useConsistencyScores] exception:", err)
      setScore(0)
      setDaysWithData(0)
    } finally {
      setLoading(false)
    }
  }, [areaIds.join(","), timeframe])

  useEffect(() => {
    load()
  }, [load])

  return { score, daysWithData, loading, refresh: load }
}

/**
 * Returns scores for multiple area groups in one call.
 * Groups is a record of group_name -> area_ids[].
 */
export function useMultiConsistencyScores(
  groups: Record<string, string[]>,
  timeframe: Timeframe
) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const allAreaIds = Object.values(groups).flat()
  const { score: _single, ...rest } = useConsistencyScores(allAreaIds, timeframe)
  // We use the individual hook per group instead
  const groupKeys = Object.keys(groups)

  const loadAll = useCallback(async () => {
    if (groupKeys.length === 0) {
      setScores({})
      setLoading(false)
      return
    }

    const { start, end } = getDateRange(timeframe)
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("daily_area_stats")
        .select("area_id, stat_date, time_spent_minutes, time_goal_minutes")
        .in("area_id", allAreaIds)
        .gte("stat_date", start)
        .lte("stat_date", end)

      if (error || !data) {
        setScores({})
        setLoading(false)
        return
      }

      const result: Record<string, number> = {}

      for (const [groupName, ids] of Object.entries(groups)) {
        const groupData = data.filter((r) => ids.includes(r.area_id))
        if (groupData.length === 0) {
          result[groupName] = 0
          continue
        }

        const seen = new Set<string>()
        const rates: number[] = []

        for (const row of groupData) {
          const key = `${row.area_id}|${row.stat_date}`
          if (seen.has(key)) continue
          seen.add(key)

          const goal = row.time_goal_minutes || 30
          const spent = row.time_spent_minutes || 0
          const rate = Math.min(100, Math.round((spent / goal) * 100))
          rates.push(rate)
        }

        result[groupName] =
          rates.length > 0
            ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
            : 0
      }

      setScores(result)
    } catch (err) {
      console.warn("[useMultiConsistencyScores] exception:", err)
      setScores({})
    } finally {
      setLoading(false)
    }
  }, [allAreaIds.join(","), timeframe])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  return { scores, loading, refresh: loadAll }
}
