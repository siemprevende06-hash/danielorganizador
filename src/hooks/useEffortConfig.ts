import { useState, useCallback } from 'react'
import { EFFORT_DEFAULTS } from '@/data/areaMetricsData'

const STORAGE_KEY = 'effortConfig'

function loadAll(): Record<string, { bajo: number; normal: number; alto: number }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...EFFORT_DEFAULTS, ...JSON.parse(raw) }
  } catch {}
  return { ...EFFORT_DEFAULTS }
}

function saveAll(data: Record<string, { bajo: number; normal: number; alto: number }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useEffortConfig() {
  const [allConfigs, setAllConfigs] = useState(loadAll)

  const getConfig = useCallback((areaId: string) => {
    const all = loadAll()
    return all[areaId] || EFFORT_DEFAULTS[areaId] || { bajo: 15, normal: 30, alto: 45 }
  }, [])

  const updateConfig = useCallback((areaId: string, values: { bajo: number; normal: number; alto: number }) => {
    const all = loadAll()
    all[areaId] = values
    saveAll(all)
    setAllConfigs(all)
  }, [])

  return { allConfigs, getConfig, updateConfig }
}
