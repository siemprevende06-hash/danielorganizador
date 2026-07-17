import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { getCached, setCache } from "@/lib/offlineCache"

export interface DailyScoreResult {
  sosten: number
  acumulativos: number
  focus: number
  total: number
  loading: boolean
}

const POLL_INTERVAL_MS = 8000
const CACHE_TTL_MS = 120_000
const CACHE_KEY = "daily_score"

const SOSTEN_HABIT_IDS = [
  "rutina-activacion", "alistamiento-desayuno", "horario-regular",
  "rutina-desactivacion", "skincare-manana", "skincare-noche",
  "banarme-vestirme",
  "pre-entreno", "desayuno", "merienda-1", "almuerzo",
  "merienda-2", "comida", "antes-dormir", "suplementos",
]

const MEJORA_HABIT_IDS = ["lectura", "musica", "ajedrez", "game"]
const FOCUS_AREA_IDS = ["universidad", "emprendimiento", "proyectos", "tareas"]

const TIME_GOALS: Record<string, number> = {
  lectura: 30, musica: 30, ajedrez: 15, game: 30,
  universidad: 120, emprendimiento: 60, proyectos: 60, tareas: 60,
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0]
}

function computeScore(sysRes: any, routineRes: any, miniRes: any) {
  const completions = (sysRes?.completions as Record<string, boolean>) || {}
  const timeData = (sysRes?.time_data as Record<string, number>) || {}

  const miniDefs: { id: string }[] = []
  const raw = miniRes?.setting_value as any
  const arr = raw?.value ?? raw
  if (Array.isArray(arr)) miniDefs.push(...arr)

  const allSostenIds = [...SOSTEN_HABIT_IDS, ...miniDefs.map(d => d.id)]
  const doneCount = allSostenIds.filter(id => completions[id]).length
  const totalCount = allSostenIds.length || 1

  const routines = routineRes || []
  const hasActivation = routines.some((r: any) => r.routine_type === "activation")
  const hasDeactivation = routines.some((r: any) => r.routine_type === "deactivation")
  const routineScore = ((hasActivation ? 1 : 0) + (hasDeactivation ? 1 : 0)) / 2

  const sosten = Math.round(((doneCount / totalCount) * 0.7 + routineScore * 0.3) * 100)

  const acumPcts: number[] = []
  for (const areaId of MEJORA_HABIT_IDS) {
    const spent = timeData[areaId] || 0
    const goal = TIME_GOALS[areaId] || 30
    acumPcts.push(Math.min(100, Math.round((spent / goal) * 100)))
  }

  const gymDone = completions["entrenamiento-fisico"]
  if (gymDone) {
    const gymMin = timeData["entrenamiento-fisico"]
    const gymGoal = 45
    acumPcts.push(Math.min(100, Math.round(((gymMin || 0) / gymGoal) * 100)))
  }

  const acumulativos = acumPcts.length > 0
    ? Math.round(acumPcts.reduce((a, b) => a + b, 0) / acumPcts.length)
    : 0

  let weightedTime = 0
  let maxGoal = 60
  for (const areaId of FOCUS_AREA_IDS) {
    const spent = timeData[areaId] || 0
    const goal = TIME_GOALS[areaId] || 60
    const weight = areaId === "tareas" ? 0.3 : 1.0
    weightedTime += spent * weight
    if (areaId !== "tareas" && goal > maxGoal) maxGoal = goal
  }

  const focus = weightedTime > 0
    ? Math.min(100, Math.round((weightedTime / maxGoal) * 100))
    : 0

  const total = Math.round(sosten * 0.10 + acumulativos * 0.40 + focus * 0.50)

  return { sosten, acumulativos, focus, total, loading: false }
}

async function fetchScoreData() {
  const today = todayKey()
  const [sysRes, routineRes, miniRes] = await Promise.all([
    supabase.from("daily_systems_tracking")
      .select("completions, time_data")
      .eq("tracking_date", today)
      .maybeSingle(),
    supabase.from("routine_completions")
      .select("routine_type")
      .eq("completion_date", today),
    supabase.from("app_settings")
      .select("setting_value")
      .eq("setting_key", "mini_habits_defs")
      .maybeSingle(),
  ])
  return { sysRes: sysRes.data, routineRes: routineRes.data, miniRes: miniRes.data }
}

export function useDailyScore(): DailyScoreResult {
  const [result, setResult] = useState<DailyScoreResult>({
    sosten: 0, acumulativos: 0, focus: 0, total: 0, loading: true,
  })
  const pollRef = useRef<ReturnType<typeof setInterval>>()
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    const online = typeof navigator !== "undefined" ? navigator.onLine : true

    if (!online) {
      const cached = await getCached<DailyScoreResult>("daily_score", CACHE_KEY)
      if (cached) {
        setResult({ ...cached, loading: false })
      }
      return
    }

    try {
      const data = await fetchScoreData()
      const score = computeScore(data.sysRes, data.routineRes, data.miniRes)
      if (mountedRef.current) {
        setResult(score)
        setCache("daily_score", CACHE_KEY, score, CACHE_TTL_MS)
      }
    } catch {
      const cached = await getCached<DailyScoreResult>("daily_score", CACHE_KEY)
      if (cached && mountedRef.current) {
        setResult({ ...cached, loading: false })
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    refresh()

    const handleOnline = () => { refresh() }

    window.addEventListener("online", handleOnline)

    pollRef.current = setInterval(() => {
      if (navigator.onLine) refresh()
    }, POLL_INTERVAL_MS)

    return () => {
      mountedRef.current = false
      window.removeEventListener("online", handleOnline)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [refresh])

  return result
}
