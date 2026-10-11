import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export function useSystemCardCovers() {
  const [covers, setCovers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from("system_card_covers")
      .select("card_id, cover_url")
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error("Error cargando portadas de tarjetas:", error)
          setLoading(false)
          return
        }
        const map: Record<string, string> = {}
        for (const row of (data ?? []) as Array<{ card_id: string; cover_url: string | null }>) {
          if (row.cover_url) map[row.card_id] = row.cover_url
        }
        setCovers(map)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const saveCover = useCallback(async (cardId: string, url: string) => {
    setCovers((prev) => ({ ...prev, [cardId]: url }))
    const { error } = await supabase
      .from("system_card_covers")
      .upsert({ card_id: cardId, cover_url: url, updated_at: new Date().toISOString() }, { onConflict: "card_id" })
    if (error) {
      console.error("Error guardando portada:", error)
      toast.error("No se pudo guardar la portada")
    }
  }, [])

  const removeCover = useCallback(async (cardId: string) => {
    setCovers((prev) => {
      const next = { ...prev }
      delete next[cardId]
      return next
    })
    const { error } = await supabase
      .from("system_card_covers")
      .update({ cover_url: null, updated_at: new Date().toISOString() })
      .eq("card_id", cardId)
    if (error) {
      console.error("Error eliminando portada:", error)
      toast.error("No se pudo eliminar la portada")
    }
  }, [])

  return { covers, loading, saveCover, removeCover }
}