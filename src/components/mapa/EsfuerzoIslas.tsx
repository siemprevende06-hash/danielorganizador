import { useMemo } from "react"
import type { MapaNode } from "@/hooks/useMapaDeVida"
import type { IslaEsfuerzo } from "@/hooks/useEsfuerzoIslas"
import { Flame, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import "./mapa.css"

const CYAN = "#22d3ee"
const BLUE = "#38bdf8"
const SLATE = "#64748b"
const PURPLE = "#a78bfa"

function ringColor(score: number): string {
  if (score >= 70) return CYAN
  if (score >= 40) return BLUE
  return SLATE
}

function islaPath(x: number): string {
  const x1 = 600
  const y1 = 195
  const y2 = 62
  const mx = (x1 + x) / 2
  const my = Math.min(y1, y2) - 26
  return `M ${x1} ${y1} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y2}`
}

function formatTime(t: string): string {
  const [h, m] = t.split(":")
  return `${Number(h)}:${m}`
}

function formatTotal(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function EsfuerzoIslas({
  islands,
  totalMinutes,
  areaNodes,
  selectedAreaId,
  onSelectArea,
}: {
  islands: IslaEsfuerzo[]
  totalMinutes: number
  areaNodes: MapaNode[]
  selectedAreaId: string | null
  onSelectArea: (areaId: string) => void
}) {
  const maxMinutes = useMemo(
    () => Math.max(1, ...islands.map((i) => i.minutes)),
    [islands]
  )

  return (
    <section className="space-y-4">
      <header className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
          <Flame className="h-4 w-4 text-primary" />
          <span className="font-semibold text-primary text-sm">ISLAS DE ESFUERZO · TU DÍA</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Tu rutina diaria repartida por áreas · {formatTotal(totalMinutes)} de esfuerzo planificado · toca una isla para iluminar su ruta en el mapa
        </p>
      </header>

      <div className="mapa-canvas border border-border/60 relative overflow-hidden p-2">
        <svg viewBox="0 0 1200 250" className="w-full h-auto select-none">
          {islands.map((isla) => {
            const node = areaNodes.find((n) => n.id === isla.areaId)
            if (!node || isla.minutes <= 0) return null
            const glow = 0.15 + 0.75 * (isla.minutes / maxMinutes)
            return (
              <g key={isla.areaId} className="mapa-edge">
                <path
                  d={islaPath(node.x)}
                  fill="none"
                  stroke={CYAN}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeOpacity={glow}
                  onClick={() => onSelectArea(isla.areaId)}
                  className="mapa-node"
                />
              </g>
            )
          })}

          {areaNodes.map((node) => {
            const isla = islands.find((i) => i.areaId === node.id)
            const minutes = isla?.minutes ?? 0
            const isSelected = selectedAreaId === node.id
            const ring = ringColor(node.score)
            return (
              <g
                key={node.id}
                className="mapa-node"
                onClick={() => onSelectArea(node.id)}
              >
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={62}
                    r={24}
                    fill="none"
                    stroke={ring}
                    strokeWidth={2}
                    className="mapa-selected-ring"
                  />
                )}
                <circle
                  cx={node.x}
                  cy={62}
                  r={17}
                  fill="url(#isla-node-grad)"
                  stroke={ring}
                  strokeWidth={isSelected ? 3 : 1.5}
                  style={{ filter: minutes > 0 ? `drop-shadow(0 0 6px ${ring}66)` : undefined }}
                />
                <text x={node.x} y={62} textAnchor="middle" dominantBaseline="central" fontSize={15}>
                  {node.icon}
                </text>
                <text
                  x={node.x}
                  y={90}
                  textAnchor="middle"
                  fontSize={9.5}
                  fontWeight={600}
                  fill="hsl(var(--foreground))"
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={101}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={700}
                  fill={minutes > 0 ? CYAN : "hsl(var(--muted-foreground))"}
                >
                  {minutes > 0 ? `${formatTotal(minutes)}` : "—"}
                </text>
              </g>
            )
          })}

          <g className="mapa-node">
            <circle cx={600} cy={225} r={34} fill="url(#isla-node-grad)" stroke={PURPLE} strokeWidth={2} style={{ filter: `drop-shadow(0 0 8px ${PURPLE}55)` }} />
            <text x={600} y={225} textAnchor="middle" dominantBaseline="central" fontSize={26}>
              🔥
            </text>
            <text x={600} y={268} textAnchor="middle" fontSize={11} fontWeight={700} fill="hsl(var(--foreground))">
              TU DÍA
            </text>
          </g>

          <defs>
            <radialGradient id="isla-node-grad" cx="0.35" cy="0.3" r="1">
              <stop offset="0%" stopColor="hsl(var(--card))" />
              <stop offset="100%" stopColor="hsl(var(--muted))" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
        {islands.map((isla) => {
          const isSelected = selectedAreaId === isla.areaId
          const empty = isla.minutes <= 0
          return (
            <button
              key={isla.areaId}
              onClick={() => onSelectArea(isla.areaId)}
              className={cn(
                "text-left rounded-2xl border p-3 transition-all",
                isSelected
                  ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/10 scale-[1.02]"
                  : "border-border/60 bg-card/80 hover:border-cyan-400/50 hover:bg-cyan-400/5",
                empty && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg leading-none">{isla.icon}</span>
                <span className="text-[11px] font-bold leading-tight flex-1">{isla.label}</span>
                <span
                  className={cn(
                    "text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full",
                    empty ? "bg-muted text-muted-foreground" : "bg-cyan-400/15 text-cyan-500"
                  )}
                >
                  {empty ? "0m" : formatTotal(isla.minutes)}
                </span>
              </div>
              <div className="space-y-1">
                {isla.blocks.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">Sin bloques en tu rutina</p>
                )}
                {isla.blocks.map((b) => (
                  <div key={b.id} className="flex items-center gap-1.5 text-[10px]">
                    <Clock className="h-2.5 w-2.5 shrink-0 text-muted-foreground/60" />
                    <span className="text-muted-foreground tabular-nums shrink-0">{formatTime(b.start)}</span>
                    <span className="truncate flex-1">{b.title}</span>
                    <span className="tabular-nums text-muted-foreground/70 shrink-0">{b.minutes}m</span>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-muted-foreground">
        <span className="font-semibold text-cyan-400">Tu Día</span>
        <span>→</span>
        <span className="font-semibold" style={{ color: "#38bdf8" }}>Áreas de Vida</span>
        <span>→</span>
        <span className="font-semibold" style={{ color: "#34d399" }}>Deseos</span>
        <span>→</span>
        <span className="font-semibold" style={{ color: "#f59e0b" }}>Pilares de Dirección</span>
      </div>
    </section>
  )
}