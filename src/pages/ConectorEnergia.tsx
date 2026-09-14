import { Link2, RotateCcw, Trash2, Zap, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConectorEnergia } from "@/components/energia/ConectorEnergia"
import {
  useConectorEnergia,
  RECURSOS,
  getAreaMeta,
  type ConectorNode,
} from "@/hooks/useConectorEnergia"

export default function ConectorEnergiaPage() {
  const {
    nodes,
    edges,
    metas,
    viewHeight,
    loading,
    addEdge,
    removeEdge,
    resetEdges,
    resetPositions,
    moveNode,
  } = useConectorEnergia()

  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  const metasNodes = nodes.filter((n) => n.kind === "meta")

  const resourceTargets = RECURSOS.map((r) => {
    const fromId = `recurso-${r.id}`
    const targets = edges
      .filter((e) => e.from === fromId)
      .map((e) => nodeById.get(e.to))
      .filter((n): n is ConectorNode => Boolean(n))
    return { ...r, fromId, targets }
  })

  const energyTargets = edges
    .filter((e) => e.from === "energia-hub")
    .map((e) => nodeById.get(e.to))
    .filter((n): n is ConectorNode => Boolean(n))

  const areaLegend = metasNodes.reduce<Record<string, { label: string; icon: string; color: string }>>(
    (acc, n) => {
      const key = n.sublabel ?? "Área general"
      if (!acc[key]) {
        const meta = getAreaMeta(metas.find((m) => `meta-${m.id}` === n.id)?.area_id ?? null)
        acc[key] = { label: key, icon: meta.icon, color: n.color }
      }
      return acc
    },
    {}
  )

  return (
    <div className="container mx-auto px-4 py-12 space-y-6">
      <header className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">CONECTOR DE ENERGÍA</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          ¿A dónde va mi esfuerzo?
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Tu energía es el centro. Conecta manualmente de dónde sale tu esfuerzo
          (tiempo, dinero, mente, pasión, foco, cuerpo) hacia cada meta y su área.
        </p>
        <p className="text-xs text-muted-foreground">
          Modo <span className="text-foreground font-semibold">Mover</span> para arrastrar nodos ·{" "}
          <span className="text-foreground font-semibold">Conectar</span> para arrastrar de un nodo a otro y crear el vínculo ·{" "}
          <span className="text-foreground font-semibold">Borrar</span> para eliminar conexiones con un toque
        </p>
      </header>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      ) : (
        <>
          <ConectorEnergia
            nodes={nodes}
            edges={edges}
            viewHeight={viewHeight}
            onAddEdge={addEdge}
            onRemoveEdge={removeEdge}
            onMoveNode={moveNode}
          />

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button size="sm" variant="outline" onClick={resetPositions}>
              <RotateCcw className="h-4 w-4" /> Restaurar posiciones
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={resetEdges}
              disabled={edges.length === 0}
            >
              <Trash2 className="h-4 w-4" /> Limpiar conexiones ({edges.length})
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                <Link2 className="h-4 w-4" /> Tus conexiones
              </h3>

              <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-3">
                <div className="flex items-center gap-1.5">
                  <span>⚡</span>
                  <span className="text-xs font-medium">Energía</span>
                  <span className="ml-auto text-xs font-bold text-muted-foreground">{energyTargets.length}</span>
                </div>
                {resourceTargets.map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5">
                    <span>{r.icon}</span>
                    <span className="text-xs font-medium">{r.label}</span>
                    <span className="ml-auto text-xs font-bold text-muted-foreground">{r.targets.length}</span>
                  </div>
                ))}
              </div>

              {edges.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aún no hay conexiones. Activa el modo <span className="text-foreground font-semibold">Conectar</span>,
                  pulsa un nodo y arrastra hasta el destino.
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-72 overflow-y-auto">
                  {edges.map((edge) => {
                    const from = nodeById.get(edge.from)
                    const to = nodeById.get(edge.to)
                    if (!from || !to) return null
                    return (
                      <li
                        key={edge.id}
                        className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/40 px-2.5 py-1.5"
                      >
                        <span className="text-base leading-none">{from.icon}</span>
                        <span className="text-xs font-medium truncate">
                          {from.kind === "recurso" || from.kind === "hub" ? from.label : trunc(from.label, 16)}
                        </span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-base leading-none">{to.icon}</span>
                        <span className="text-xs font-medium truncate flex-1">
                          {to.kind === "recurso" || to.kind === "hub" ? to.label : trunc(to.label, 18)}
                        </span>
                        <button
                          onClick={() => removeEdge(edge.id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          title="Eliminar conexión"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold text-primary">Metas de esfuerzo</h3>

              {metas.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No hay metas activas todavía. Crea tus metas con su área para conectarlas aquí.
                </p>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto">
                  {metas.map((m) => {
                    const area = getAreaMeta(m.area_id)
                    const metaNode = nodeById.get(`meta-${m.id}`)
                    const recibidos = edges.filter((e) => e.to === `meta-${m.id}`).length
                    return (
                      <li key={m.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/40 px-3 py-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ background: area.color }}
                        />
                        <span className="text-base leading-none">{area.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{m.title}</p>
                          <p className="text-[10px] text-muted-foreground">{area.label}</p>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {recibidos} {recibidos === 1 ? "vínculo" : "vínculos"}
                          {metaNode ? "" : " · sin nodo"}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Áreas</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(areaLegend).map(([label, a]) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                      {a.icon} {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function trunc(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s
}