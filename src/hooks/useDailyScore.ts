import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"

export interface DailyScoreResult {
  sosten: number
  acumulativos: number
  focus: number
  total: number
  loading: boolean
}

const SOSTEN_HABITS = [
  "habit-sueno", "habit-rutina-activacion", "habit-entrenamiento",
  "habit-desayuno", "habit-skincare-am", "habit-skincare-pm",
  "habit-rutina-desactivacion", "habit-alimentacion", "habit-finanzas",
]

const FOCUS_HABITS = [
  "habit-foco", "habit-universidad", "habit-emprendimiento", "habit-proyectos",
]

const ACUMULATIVOS_AREAS = ["gym", "idiomas", "lectura", "ajedrez", "piano", "guitarra"]
const FOCUS_AREAS = ["universidad", "emprendimiento", "proyectos"]

function todayKey(): string {
  return new Date().toISOString().split("T")[0]
}

export function useDailyScore(): DailyScoreResult {
  const [result, setResult] = useState<DailyScoreResult>({
    sosten: 0, acumulativos: 0, focus: 0, total: 0, loading: true,
  })

  useEffect(() => {
    const today = todayKey()

    Promise.all([
      supabase.from("daily_systems_tracking")
        .select("completions")
        .eq("tracking_date", today)
        .maybeSingle(),

      supabase.from("daily_area_stats")
        .select("*")
        .eq("stat_date", today),

      supabase.from("routine_completions")
        .select("routine_type, completed_tasks")
        .eq("completion_date", today),

      supabase.from("app_settings")
        .select("setting_value")
        .eq("setting_key", "mini_habits_defs")
        .maybeSingle(),
    ]).then(([sysRes, areaRes, routineRes, miniRes]) => {
      const completions = (sysRes.data?.completions as Record<string, boolean>) || {}

      // --- SOSTEN (10%) ---
      const miniDefs: { id: string }[] = []
      const raw = miniRes.data?.setting_value as any
      const arr = raw?.value ?? raw
      if (Array.isArray(arr)) miniDefs.push(...arr)

      const miniIds = miniDefs.map(d => d.id)
      const allHabitIds = [...SOSTEN_HABITS, ...FOCUS_HABITS, ...miniIds]

      const doneCount = allHabitIds.filter(id => completions[id]).length
      const totalCount = allHabitIds.length || 1

      const routines = routineRes.data || []
      const hasActivation = routines.some(r => r.routine_type === "activation")
      const hasDeactivation = routines.some(r => r.routine_type === "deactivation")
      const routineScore = ((hasActivation ? 1 : 0) + (hasDeactivation ? 1 : 0)) / 2

      const sosten = Math.round(((doneCount / totalCount) * 0.7 + routineScore * 0.3) * 100)

      // --- ACUMULATIVOS (40%) ---
      const areaMap = new Map<string, { spent: number; goal: number }>()
      for (const row of (areaRes.data || []) as any[]) {
        areaMap.set(row.area_id, { spent: row.time_spent_minutes || 0, goal: row.time_goal_minutes || 30 })
      }

      const acumPcts: number[] = []
      for (const areaId of ACUMULATIVOS_AREAS) {
        const entry = areaMap.get(areaId)
        if (entry) {
          acumPcts.push(Math.min(100, Math.round((entry.spent / entry.goal) * 100)))
        }
      }
      const acumulativos = acumPcts.length > 0
        ? Math.round(acumPcts.reduce((a, b) => a + b, 0) / acumPcts.length)
        : 0

      // --- FOCUS (50%) ---
      let weightedTime = 0
      let maxGoal = 60

      for (const areaId of FOCUS_AREAS) {
        const entry = areaMap.get(areaId)
        if (entry) {
          weightedTime += entry.spent * 1.0
          if (entry.goal > maxGoal) maxGoal = entry.goal
        }
      }

      const focus = weightedTime > 0
        ? Math.min(100, Math.round((weightedTime / maxGoal) * 100))
        : 0

      // --- TOTAL ---
      const total = Math.round(sosten * 0.10 + acumulativos * 0.40 + focus * 0.50)

      setResult({ sosten, acumulativos, focus, total, loading: false })
    }).catch(() => {
      setResult({ sosten: 0, acumulativos: 0, focus: 0, total: 0, loading: false })
    })
  }, [])

  return result
}
