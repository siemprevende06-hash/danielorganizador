import { useState, useCallback } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns'

const STORAGE_KEY = 'weeklyData'

export interface WeeklyAreaData {
  effortMinutes: number
  metrics: Record<string, number>
}

type WeeklyStore = Record<string, Record<string, WeeklyAreaData>>

function loadAll(): WeeklyStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function saveAll(data: WeeklyStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getWeekKey(date: Date): string {
  return format(date, "yyyy-'W'ww")
}

export function getWeeksInRange(start: Date, end: Date): string[] {
  const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
  return weeks.map(w => getWeekKey(w))
}

export function getDaysInPeriod(periodType: 'week' | 'month' | 'quarter', periodStart: Date): number {
  if (periodType === 'week') return 7
  const end = periodType === 'month'
    ? endOfMonth(periodStart)
    : new Date(periodStart.getFullYear(), periodStart.getMonth() + 3, 0)
  return Math.round((end.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export function useWeeklyData() {
  const [store, setStore] = useState<WeeklyStore>(loadAll)

  const getWeek = useCallback((weekKey: string) => {
    const all = loadAll()
    return all[weekKey] || {}
  }, [])

  const setEffortMinutes = useCallback((weekKey: string, areaId: string, minutes: number) => {
    const all = loadAll()
    if (!all[weekKey]) all[weekKey] = {}
    if (!all[weekKey][areaId]) all[weekKey][areaId] = { effortMinutes: 0, metrics: {} }
    all[weekKey][areaId].effortMinutes = minutes
    saveAll(all)
    setStore(all)
  }, [])

  const setMetricValue = useCallback((weekKey: string, areaId: string, metricId: string, value: number) => {
    const all = loadAll()
    if (!all[weekKey]) all[weekKey] = {}
    if (!all[weekKey][areaId]) all[weekKey][areaId] = { effortMinutes: 0, metrics: {} }
    all[weekKey][areaId].metrics[metricId] = value
    saveAll(all)
    setStore(all)
  }, [])

  const getEffortMinutes = useCallback((weekKey: string, areaId: string): number => {
    const all = loadAll()
    return all[weekKey]?.[areaId]?.effortMinutes ?? 0
  }, [])

  const getMetricValue = useCallback((weekKey: string, areaId: string, metricId: string): number => {
    const all = loadAll()
    return all[weekKey]?.[areaId]?.metrics?.[metricId] ?? 0
  }, [])

  const sumEffortForWeeks = useCallback((weekKeys: string[], areaId: string): number => {
    const all = loadAll()
    return weekKeys.reduce((sum, wk) => sum + (all[wk]?.[areaId]?.effortMinutes ?? 0), 0)
  }, [])

  const sumMetricForWeeks = useCallback((weekKeys: string[], areaId: string, metricId: string): number => {
    const all = loadAll()
    return weekKeys.reduce((sum, wk) => sum + (all[wk]?.[areaId]?.metrics?.[metricId] ?? 0), 0)
  }, [])

  return {
    store, getWeek, setEffortMinutes, setMetricValue,
    getEffortMinutes, getMetricValue, sumEffortForWeeks, sumMetricForWeeks,
  }
}
