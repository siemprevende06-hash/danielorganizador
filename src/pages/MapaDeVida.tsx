import { useEffect, useRef, useState } from "react"
import { useTimeframe } from "@/contexts/TimeframeContext"
import { useMapaDeVida, type MapaNode } from "@/hooks/useMapaDeVida"
import { useEsfuerzoIslas } from "@/hooks/useEsfuerzoIslas"
import { MapaDeVida } from "@/components/mapa/MapaDeVida"
import { MapaDetailPanel } from "@/components/mapa/MapaDetailPanel"
import { EsfuerzoIslas } from "@/components/mapa/EsfuerzoIslas"
import { TimeframeSelector } from "@/components/TimeframeSelector"
import { Network } from "lucide-react"
import type { Timeframe } from "@/contexts/TimeframeContext"

const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  today: "HOY",
  week: "ÚLTIMOS 7 DÍAS",
  month: "ÚLTIMOS 30 DÍAS",
  quarter: "ÚLTIMO TRIMESTRE",
  year: "ÚLTIMO AÑO",
  sprint: "SPRINT ACTIVO",
}

export default function MapaDeVidaPage() {
  const { timeframe } = useTimeframe()
  const { nodes, edges, loading, areas, necesidades } = useMapaDeVida(timeframe)
  const { islands, totalMinutes } = useEsfuerzoIslas()
  const [selected, setSelected] = useState<MapaNode | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setSelected(null)
  }, [timeframe])

  const areaNodes = nodes.filter((n) => n.kind === "area")

  const handleSelectArea = (areaId: string) => {
    const node = nodes.find((n) => n.id === areaId && n.kind === "area") ?? null
    setSelected(node)
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-6">
      <header className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Network className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">MAPA DE CONEXIÓN</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Mapa de Vida
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Tu esfuerzo diario ilumina cada área, tus áreas alimentan tus deseos y
          tus deseos apuntan a tu dirección: los 3 pilares de tu vida.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22d3ee" }} />
            Esfuerzo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#34d399" }} />
            Resultados
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-red-400" />
            Deseo insatisfecho
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-green-400" />
            Deseo satisfecho
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} />
            Pilares de dirección
          </span>
        </div>
      </header>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold" style={{ color: "#a78bfa" }}>
          {TIMEFRAME_LABEL[timeframe]}
        </span>
      </div>

      <TimeframeSelector />

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      ) : (
        <>
          <div ref={mapRef} className="scroll-mt-20">
            <MapaDeVida nodes={nodes} edges={edges} selected={selected} onSelect={setSelected} />
          </div>
          {selected && (
            <MapaDetailPanel
              node={selected}
              areas={areas}
              needs={necesidades}
              onClose={() => setSelected(null)}
            />
          )}
          {!selected && (
            <p className="text-center text-xs text-muted-foreground">
              Toca cualquier nodo para iluminar su ruta: esfuerzo → área → deseo → pilar
            </p>
          )}

          <div className="border-t border-border/40 pt-6">
            <EsfuerzoIslas
              islands={islands}
              totalMinutes={totalMinutes}
              areaNodes={areaNodes}
              selectedAreaId={selected?.kind === "area" ? selected.id : null}
              onSelectArea={handleSelectArea}
            />
          </div>
        </>
      )}
    </div>
  )
}