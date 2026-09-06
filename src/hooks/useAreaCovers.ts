import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export type CoverType = "area" | "sub"

export function coverKey(type: CoverType, id: string): string {
  return `${type}:${id}`
}

export function useAreaCovers() {
  const [covers, setCovers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from("area_covers")
      .select("id, type, url")
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error("Error cargando portadas de áreas:", error)
          setLoading(false)
          return
        }
        const map: Record<string, string> = {}
        for (const row of data ?? []) {
          map[coverKey(row.type as CoverType, row.id)] = row.url
        }
        setCovers(map)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const saveCover = useCallback(async (type: CoverType, id: string, url: string) => {
    const key = coverKey(type, id)
    setCovers((prev) => ({ ...prev, [key]: url }))
    const { error } = await supabase
      .from("area_covers")
      .upsert({ id, type, url }, { onConflict: "id,type" })
    if (error) {
      console.error("Error guardando portada:", error)
      toast.error("No se pudo guardar la portada")
    }
  }, [])

  const removeCover = useCallback(async (type: CoverType, id: string) => {
    const key = coverKey(type, id)
    setCovers((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    const { error } = await supabase
      .from("area_covers")
      .delete()
      .eq("id", id)
      .eq("type", type)
    if (error) {
      console.error("Error eliminando portada:", error)
      toast.error("No se pudo eliminar la portada")
    }
  }, [])

  return { covers, loading, saveCover, removeCover }
}