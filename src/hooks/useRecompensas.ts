import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAreaScores } from "./useAreaScores"
import { useDailyScore } from "./useDailyScore"
import { useTimeframe } from "@/contexts/TimeframeContext"
import { RECOMPENSAS_DEFAULT, type Recompensa, type Canje } from "@/data/recompensas"

interface DailyEarning {
  date: string
  points: number
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0]
}

const CATALOGO_KEY = "recompensas_catalogo"
const LAST_EARNED_KEY = "recompensas_last_earned"

async function getSetting<T>(key: string): Promise<T | null> {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", key)
      .maybeSingle()
    if (!data) return null
    const v: any = data.setting_value
    return (v?.value ?? v) as T
  } catch {
    return null
  }
}

async function setSetting(key: string, value: any) {
  try {
    await supabase
      .from("app_settings")
      .upsert(
        { setting_key: key, setting_value: { value } as any },
        { onConflict: "user_id,setting_key" }
      )
  } catch (e) {
    console.warn("app_settings upsert failed", e)
  }
}

async function loadBalance(): Promise<number> {
  try {
    const { data } = await supabase
      .from("user_settings")
      .select("id, rewards_balance")
      .maybeSingle()
    return (data as any)?.rewards_balance ?? 0
  } catch {
    return 0
  }
}

async function saveBalance(balance: number) {
  try {
    const { data } = await supabase
      .from("user_settings")
      .select("id")
      .maybeSingle()
    if (data?.id) {
      await supabase
        .from("user_settings")
        .update({ rewards_balance: balance })
        .eq("id", data.id)
    } else {
      await supabase
        .from("user_settings")
        .insert({ user_id: crypto.randomUUID(), rewards_balance: balance } as any)
    }
  } catch (e) {
    console.warn("saveBalance error", e)
  }
}

async function loadCanjes(): Promise<Canje[]> {
  try {
    const { data } = await supabase
      .from("rewards_redemptions")
      .select("*")
      .order("fecha", { ascending: false })
    return (
      data?.map((r: any) => ({
        id: r.id,
        recompensaId: r.recompensa_id,
        nombre: r.nombre,
        icono: r.icono,
        costo: r.costo,
        fecha: r.fecha,
      })) ?? []
    )
  } catch {
    return []
  }
}

function generarId(): string {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function useRecompensas() {
  const { timeframe, view } = useTimeframe()
  const { scores, averages, loading: scoresLoading } = useAreaScores(timeframe, view)
  const dailyScore = useDailyScore()
  const [balance, setBalance] = useState<number>(0)
  const [canjes, setCanjes] = useState<Canje[]>([])
  const [lastEarned, setLastEarned] = useState<DailyEarning | null>(null)
  const [catalogo, setCatalogo] = useState<Recompensa[]>(RECOMPENSAS_DEFAULT)

  useEffect(() => {
    (async () => {
      const [b, c, le, cat] = await Promise.all([
        loadBalance(),
        loadCanjes(),
        getSetting<DailyEarning>(LAST_EARNED_KEY),
        getSetting<Recompensa[]>(CATALOGO_KEY),
      ])
      setBalance(b)
      setCanjes(c)
      setLastEarned(le)
      if (cat && Array.isArray(cat) && cat.length > 0) {
        setCatalogo(cat)
      } else {
        await setSetting(CATALOGO_KEY, RECOMPENSAS_DEFAULT)
      }
    })()
  }, [])

  const puntosHoy = lastEarned?.date === todayKey() ? lastEarned.points : 0
  const puntosPosibles = dailyScore.loading ? 0 : dailyScore.total

  useEffect(() => {
    if (dailyScore.loading) return

    const today = todayKey()
    const earnedToday = lastEarned?.date === today ? lastEarned.points : 0

    if (puntosPosibles > 0 && puntosPosibles !== earnedToday) {
      const delta = puntosPosibles - earnedToday

      if (delta > 0) {
        const newEarning: DailyEarning = { date: today, points: puntosPosibles }
        setLastEarned(newEarning)
        setSetting(LAST_EARNED_KEY, newEarning)

        const newBalance = balance + delta
        setBalance(newBalance)
        saveBalance(newBalance)
      }
    }
  }, [dailyScore.loading, puntosPosibles])

  const canjearRecompensa = useCallback(
    (recompensaId: string): boolean => {
      const recompensa = catalogo.find((r) => r.id === recompensaId)
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
      setBalance(nuevoBalance)
      saveBalance(nuevoBalance)
      supabase
        .from("rewards_redemptions")
        .insert({
          recompensa_id: recompensa.id,
          nombre: recompensa.nombre,
          icono: recompensa.icono,
          costo: recompensa.costo,
          fecha: nuevoCanje.fecha,
        } as any)
        .then(({ error }) => {
          if (error) console.warn("insert redemption error", error)
        })

      return true
    },
    [balance, canjes, catalogo]
  )

  const persistCatalogo = (nuevo: Recompensa[]) => {
    setCatalogo(nuevo)
    setSetting(CATALOGO_KEY, nuevo)
  }

  const agregarRecompensa = useCallback(
    (data: Omit<Recompensa, "id">): Recompensa => {
      const nueva: Recompensa = { id: generarId(), ...data }
      persistCatalogo([...catalogo, nueva])
      return nueva
    },
    [catalogo]
  )

  const editarRecompensa = useCallback(
    (id: string, data: Partial<Omit<Recompensa, "id">>): boolean => {
      const idx = catalogo.findIndex((r) => r.id === id)
      if (idx === -1) return false
      const nuevo = [...catalogo]
      nuevo[idx] = { ...nuevo[idx], ...data }
      persistCatalogo(nuevo)
      return true
    },
    [catalogo]
  )

  const eliminarRecompensa = useCallback(
    (id: string): boolean => {
      const idx = catalogo.findIndex((r) => r.id === id)
      if (idx === -1) return false
      persistCatalogo(catalogo.filter((r) => r.id !== id))
      return true
    },
    [catalogo]
  )

  const puntosGanadosHoy = puntosHoy
  const puntosGastadosHoy = canjes
    .filter((c) => c.fecha.startsWith(todayKey()))
    .reduce((sum, c) => sum + c.costo, 0)

  return {
    balance,
    canjes,
    scores,
    scoresLoading,
    dailyScore,
    catalogo,
    puntosPosibles,
    puntosGanadosHoy,
    puntosGastadosHoy,
    canjearRecompensa,
    agregarRecompensa,
    editarRecompensa,
    eliminarRecompensa,
  }
}
