import { useMemo, useState } from "react"
import type { MapaNode, MapaEdge } from "@/hooks/useMapaDeVida"
import "./mapa.css"

const CYAN = "#22d3ee"
const EMERALD = "#34d399"
const BLUE = "#38bdf8"
const ROSE = "#f87171"
const AMBER = "#fbbf24"
const ORANGE = "#fb923c"
const PURPLE = "#a78bfa"
const GOLD = "#f59e0b"
const SLATE = "#64748b"
const PULSE = "#7dd3fc"

function glowOpacity(score: number): number {
  if (score >= 70) return 1
  if (score >= 40) return 0.55
  if (score >= 20) return 0.25
  return 0.07
}

function clampBar(score: number): number {
  return Math.max(0, Math.min(1, (Number.isFinite(score) ? score : 0) / 100))
}

function statusColor(progress: number): string {
  if (progress >= 80) return EMERALD
  if (progress >= 50) return AMBER
  if (progress >= 20) return ORANGE
  return ROSE
}

function ringColor(kind: MapaNode["kind"], score: number): string {
  if (kind === "hub") return PURPLE
  if (kind === "pilar") return GOLD
  if (kind === "deseo") return statusColor(score)
  if (score >= 70) return CYAN
  if (score >= 40) return BLUE
  return SLATE
}

function computeRoute(node: MapaNode | null, edges: MapaEdge[]): Set<string> {
  const ids = new Set<string>()
  if (!node) return ids
  if (node.kind === "hub") {
    edges.forEach((e) => ids.add(e.id))
    return ids
  }
  if (node.kind === "area") {
    edges.forEach((e) => {
      if (e.to === node.id || e.from === node.id) ids.add(e.id)
    })
    return ids
  }
  const feeding = new Set<string>()
  edges.forEach((e) => {
    if (e.to === node.id) {
      ids.add(e.id)
      feeding.add(e.from)
    }
  })
  edges.forEach((e) => {
    if (e.from === node.id) ids.add(e.id)
  })
  edges.forEach((e) => {
    if (e.from === "esfuerzo-hub" && feeding.has(e.to)) ids.add(e.id)
  })
  return ids
}

function computePilarRoute(node: MapaNode, edges: MapaEdge[]): Set<string> {
  const ids = new Set<string>()
  const feeding = new Set<string>()
  edges.forEach((e) => {
    if (e.to === node.id) {
      ids.add(e.id)
      feeding.add(e.from)
    }
  })
  const baseAreas = new Set<string>()
  edges.forEach((e) => {
    if (feeding.has(e.to)) {
      ids.add(e.id)
      baseAreas.add(e.from)
    }
  })
  edges.forEach((e) => {
    if (e.from === "esfuerzo-hub" && baseAreas.has(e.to)) ids.add(e.id)
  })
  return ids
}

export function MapaDeVida({
  nodes,
  edges,
  selected,
  onSelect,
}: {
  nodes: MapaNode[]
  edges: MapaEdge[]
  selected: MapaNode | null
  onSelect: (node: MapaNode | null) => void
}) {
  const [hover, setHover] = useState<string | null>(null)
  const activeNodeId = hover ?? selected?.id ?? null
  const activeNode = useMemo(
    () => nodes.find((n) => n.id === activeNodeId) ?? null,
    [nodes, activeNodeId]
  )
  const route = useMemo(() => {
    if (!activeNode) return new Set<string>()
    if (activeNode.kind === "pilar") return computePilarRoute(activeNode, edges)
    return computeRoute(activeNode, edges)
  }, [activeNode, edges])

  return (
    <div className="mapa-canvas border border-border/60 relative overflow-hidden">
      <svg
        viewBox="0 0 1200 1000"
        className="w-full h-auto select-none"
        onClick={() => {
          setHover(null)
          onSelect(null)
        }}
      >
        <defs>
          <radialGradient id="mapa-node-grad" cx="0.35" cy="0.3" r="1">
            <stop offset="0%" stopColor="hsl(var(--card))" />
            <stop offset="100%" stopColor="hsl(var(--muted))" />
          </radialGradient>
        </defs>

        {edges.map((e) => {
          const inRoute = !activeNodeId || route.has(e.id)
          const opacity = inRoute ? 1 : 0.06
          return (
            <g key={e.id} className="mapa-edge" opacity={opacity}>
              <path d={e.path} fill="none" stroke="transparent" strokeWidth={16} strokeLinecap="round"
                onPointerEnter={() => setHover(e.to)}
                onPointerLeave={() => setHover((h) => (h === e.to ? null : h))}
              />
              <path
                d={e.path}
                fill="none"
                stroke={CYAN}
                strokeWidth={9}
                strokeLinecap="round"
                strokeOpacity={glowOpacity(e.esfuerzo) * 0.35}
              />
              <path
                d={e.path}
                fill="none"
                stroke={CYAN}
                strokeWidth={4}
                strokeLinecap="round"
                strokeOpacity={glowOpacity(e.esfuerzo)}
              />
              <path
                d={e.path}
                fill="none"
                stroke={EMERALD}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeOpacity={glowOpacity(e.resultados)}
              />
              {selected && inRoute && (
                <path
                  d={e.path}
                  className="mapa-pulse"
                  pathLength={100}
                  fill="none"
                  stroke={PULSE}
                  strokeWidth={2.4}
                  strokeOpacity={0.85}
                  strokeLinecap="round"
                />
              )}
            </g>
          )
        })}

        {nodes.map((node) => {
          const inRoute = !activeNodeId || route.has(node.id)
          const isHover = hover === node.id
          const isSelected = selected?.id === node.id
          const ring = ringColor(node.kind, node.score)

          return (
            <g
              key={node.id}
              className="mapa-node"
              opacity={inRoute ? 1 : 0.15}
              onClick={(ev) => {
                ev.stopPropagation()
                onSelect(isSelected ? null : node)
                setHover(null)
              }}
              onPointerEnter={() => setHover(node.id)}
              onPointerLeave={() => setHover(null)}
            >
              {node.kind === "hub" && !activeNodeId && (
                <>
                  <circle cx={node.x} cy={node.y} r={node.r} fill="none" stroke={PURPLE} strokeWidth={1.5} className="mapa-ping" />
                  <circle cx={node.x} cy={node.y} r={node.r} fill="none" stroke={PURPLE} strokeWidth={1.5} className="mapa-ping mapa-ping-alt" />
                </>
              )}

              {isSelected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r + 7}
                  fill="none"
                  stroke={ring}
                  strokeWidth={2.5}
                  className="mapa-selected-ring"
                />
              )}

              {isHover && !isSelected && (
                <circle cx={node.x} cy={node.y} r={node.r + 6} fill="none" stroke={ring} strokeWidth={2} strokeOpacity={0.7} />
              )}

              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill="url(#mapa-node-grad)"
                stroke={ring}
                strokeWidth={isSelected ? 3.5 : 2}
                style={{ filter: `drop-shadow(0 0 ${8 + glowOpacity(node.score) * 10}px ${ring}55)` }}
              />

              {node.kind === "hub" && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r - 12}
                  fill="none"
                  stroke={PURPLE}
                  strokeWidth={1}
                  strokeDasharray="4 8"
                  strokeOpacity={0.6}
                />
              )}

              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={node.kind === "deseo" ? 30 : node.kind === "pilar" ? 28 : node.kind === "area" ? 27 : 34}
              >
                {node.icon}
              </text>

              <text
                x={node.x}
                y={node.y + node.r + 16}
                textAnchor="middle"
                fontSize={node.kind === "area" ? 12 : 13}
                fontWeight={600}
                className="mapa-text"
              >
                {node.label}
              </text>

              {node.kind === "deseo" ? (
                <text
                  x={node.x}
                  y={node.y + node.r + 30}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill={statusColor(node.score)}
                >
                  {node.score}%
                </text>
              ) : node.kind === "pilar" ? null : (
                <>
                  <rect x={node.x - 28} y={node.y + node.r + 24} width={56} height={4} rx={2} fill="hsl(var(--border))" />
                  <rect x={node.x - 28} y={node.y + node.r + 24} width={56 * clampBar(node.score)} height={4} rx={2} fill={CYAN} />
                  <rect x={node.x - 28} y={node.y + node.r + 32} width={56} height={4} rx={2} fill="hsl(var(--border))" />
                  <rect x={node.x - 28} y={node.y + node.r + 32} width={56 * clampBar(node.score2)} height={4} rx={2} fill={EMERALD} />
                </>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}