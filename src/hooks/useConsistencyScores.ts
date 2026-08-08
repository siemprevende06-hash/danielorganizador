import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { format, subDays } from "date-fns"
import type { Timeframe } from "@/contexts/TimeframeContext"

function dayCount(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00`).getTime()
  const e = new Date(`${end}T00:00:00`).getTime()
  return Math.max(1, Math.round((e - s) / 86400000) + 1)
}

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
    case "sprint":
      return { start: "", end: "" }
    default:
      start = subDays(today, 6)
  }

  return { start: format(start, "yyyy-MM-dd"), end }
}

export function useConsistencyScores(
  areaIds: string[],
  timeframe: Timeframe,
  sprintDateRange?: { start: string; end: string }
) {
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

    let start: string, end: string
    if (timeframe === "sprint" && sprintDateRange) {
      start = sprintDateRange.start
      end = sprintDateRange.end
    } else if (timeframe === "sprint") {
      const { data: active } = await supabase
        .from("sprints")
        .select("start_date, end_date")
        .eq("status", "active")
        .order("start_date", { ascending: false })
        .limit(1)
        .single()

      if (active) {
        start = active.start_date
        end = active.end_date
      } else {
        setScore(0)
        setDaysWithData(0)
        setLoading(false)
        return
      }
    } else {
      const range = getDateRange(timeframe)
      start = range.start
      end = range.end
    }

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
        const days = dayCount(start, end)
        const consistency = Math.min(100, Math.round(avg * (dailyRates.length / days)))
        setScore(consistency)
        setDaysWithData(dailyRates.length)
      }
    } catch (err) {
      console.warn("[useConsistencyScores] exception:", err)
      setScore(0)
      setDaysWithData(0)
    } finally {
      setLoading(false)
    }
  }, [areaIds.join(","), timeframe, sprintDateRange?.start, sprintDateRange?.end])

  useEffect(() => {
    load()
  }, [load])

  return { score, daysWithData, loading, refresh: load }
}

export function useMultiConsistencyScores(
  groups: Record<string, string[]>,
  timeframe: Timeframe,
  sprintDateRange?: { start: string; end: string }
) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const allAreaIds = Object.values(groups).flat()
  const groupKeys = Object.keys(groups)

  const loadAll = useCallback(async () => {
    if (groupKeys.length === 0) {
      setScores({})
      setLoading(false)
      return
    }

    let start: string, end: string
    if (timeframe === "sprint" && sprintDateRange) {
      start = sprintDateRange.start
      end = sprintDateRange.end
    } else if (timeframe === "sprint") {
      const { data: active } = await supabase
        .from("sprints")
        .select("start_date, end_date")
        .eq("status", "active")
        .order("start_date", { ascending: false })
        .limit(1)
        .single()

      if (active) {
        start = active.start_date
        end = active.end_date
      } else {
        setScores({})
        setLoading(false)
        return
      }
    } else {
      const range = getDateRange(timeframe)
      start = range.start
      end = range.end
    }

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
            ? Math.min(100, Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * (rates.length / dayCount(start, end))))
            : 0
      }

      setScores(result)
    } catch (err) {
      console.warn("[useMultiConsistencyScores] exception:", err)
      setScores({})
    } finally {
      setLoading(false)
    }
  }, [allAreaIds.join(","), timeframe, sprintDateRange?.start, sprintDateRange?.end])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  return { scores, loading, refresh: loadAll }
}
