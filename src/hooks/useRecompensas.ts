import { useState, useEffect, useCallback } from "react"
import { useAreaScores } from "./useAreaScores"
import { useTimeframe } from "@/contexts/TimeframeContext"
import { RECOMPENSAS, type Canje } from "@/data/recompensas"

const STORAGE_BALANCE_KEY = "recompensas_balance"
const STORAGE_CANJES_KEY = "recompensas_canjes"
const STORAGE_LAST_EARNED_KEY = "recompensas_last_earned"

interface DailyEarning {
  date: string
  points: number
}

function loadBalance(): number {
  try {
    const raw = localStorage.getItem(STORAGE_BALANCE_KEY)
    return raw ? JSON.parse(raw) : 0
  } catch {
    return 0
  }
}

function saveBalance(balance: number) {
  localStorage.setItem(STORAGE_BALANCE_KEY, JSON.stringify(balance))
}

function loadCanjes(): Canje[] {
  try {
    const raw = localStorage.getItem(STORAGE_CANJES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCanjes(canjes: Canje[]) {
  localStorage.setItem(STORAGE_CANJES_KEY, JSON.stringify(canjes))
}

function loadLastEarned(): DailyEarning | null {
  try {
    const raw = localStorage.getItem(STORAGE_LAST_EARNED_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveLastEarned(earning: DailyEarning) {
  localStorage.setItem(STORAGE_LAST_EARNED_KEY, JSON.stringify(earning))
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0]
}

export function useRecompensas() {
  const { timeframe, view } = useTimeframe()
  const { scores, averages, loading: scoresLoading } = useAreaScores(timeframe, view)
  const [balance, setBalance] = useState(loadBalance)
  const [canjes, setCanjes] = useState<Canje[]>(loadCanjes)
  const [lastEarned, setLastEarned] = useState<DailyEarning | null>(loadLastEarned)

  const puntosHoy = lastEarned?.date === todayKey() ? lastEarned.points : 0
  const puntosPosibles = scoresLoading ? 0 : averages.esfuerzo

  useEffect(() => {
    if (scoresLoading || scores.length === 0) return

    const today = todayKey()
    const earnedToday = lastEarned?.date === today ? lastEarned.points : 0

    if (earnedToday === 0 && puntosPosibles > 0) {
      const newEarning: DailyEarning = { date: today, points: puntosPosibles }
      setLastEarned(newEarning)
      saveLastEarned(newEarning)

      const newBalance = balance + puntosPosibles
      setBalance(newBalance)
      saveBalance(newBalance)
    }
  }, [scoresLoading, puntosPosibles])

  const canjearRecompensa = useCallback((recompensaId: string): boolean => {
    const recompensa = RECOMPENSAS.find((r) => r.id === recompensaId)
    if (!recompensa) return false
    if (balance < recompensa.costo) return false

    const nuevoCanje: Canje = {
      id: `${recompensaId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      recompensaId: recompensa.id,
      nombre: recompensa.nombre,
      icono: recompensa.icono,
      costo: recompensa.costo,
      fecha: new Date().toISOString(),
    }

    const nuevosCanjes = [nuevoCanje, ...canjes]
    const nuevoBalance = balance - recompensa.costo

    setCanjes(nuevosCanjes)
    saveCanjes(nuevosCanjes)
    setBalance(nuevoBalance)
    saveBalance(nuevoBalance)

    return true
  }, [balance, canjes])

  const puntosGanadosHoy = puntosHoy
  const puntosGastadosHoy = canjes
    .filter((c) => c.fecha.startsWith(todayKey()))
    .reduce((sum, c) => sum + c.costo, 0)

  return {
    balance,
    canjes,
    scores,
    scoresLoading,
    puntosPosibles,
    puntosGanadosHoy,
    puntosGastadosHoy,
    canjearRecompensa,
  }
}
