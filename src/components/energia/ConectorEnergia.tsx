import { useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { Link2, Move, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ConectorNode, ConectorEdge } from "@/hooks/useConectorEnergia"
import { VIEW_W } from "@/hooks/useConectorEnergia"
import "./conector.css"

type Modo = "mover" | "conectar" | "borrar"

interface Geometry {
  d: string
  ex: number
  ey: number
  ux: number
  uy: number
}

function edgeGeometry(ax: number, ay: number, r1: number, bx: number, by: number, r2: number): Geometry {
  const dx = bx - ax
  const dy = by - ay
  const dist = Math.hypot(dx, dy) || 1
  const ux = dx / dist
  const uy = dy / dist
  const sx = ax + ux * r1
  const sy = ay + uy * r1
  const ex = bx - ux * r2
  const ey = by - uy * r2
  const mx = (sx + ex) / 2
  const my = (sy + ey) / 2
  const lift = Math.min(70, dist * 0.16)
  return {
    d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${mx.toFixed(1)} ${(my - lift).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
    ex,
    ey,
    ux,
    uy,
  }
}

function arrowPath(ex: number, ey: number, ux: number, uy: number): string {
  const px = -uy
  const py = ux
  const len = 10
  const half = 5.5
  const x1 = ex - ux * len + px * half
  const y1 = ey - uy * len + py * half
  const x2 = ex - ux * len - px * half
  const y2 = ey - uy * len - py * half
  return `M ${ex.toFixed(1)} ${ey.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} Z`
}

function trunc(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

interface ConectorEnergiaProps {
  nodes: ConectorNode[]
  edges: ConectorEdge[]
  viewHeight: number
  onAddEdge: (from: string, to: string) => void
  onRemoveEdge: (id: string) => void
  onMoveNode: (id: string, x: number, y: number) => void
}

export function ConectorEnergia({
  nodes,
  edges,
  viewHeight,
  onAddEdge,
  onRemoveEdge,
  onMoveNode,
}: ConectorEnergiaProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [modo, setModo] = useState<Modo>("mover")
  const [hover, setHover] = useState<string | null>(null)
  const [dragNode, setDragNode] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [connectFrom, setConnectFrom] = useState<{ id: string } | null>(null)
  const [connectCursor, setConnectCursor] = useState<{ x: number; y: number } | null>(null)

  const hasMetas = nodes.some((n) => n.kind === "meta")
  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  const posFromEvent = (e: ReactPointerEvent): { x: number; y: number } => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: ((e.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((e.clientY - rect.top) / rect.height) * viewHeight,
    }
  }

  const findNodeAt = (p: { x: number; y: number }): ConectorNode | null => {
    let best: ConectorNode | null = null
    let bestDist = Infinity
    for (const n of nodes) {
      const dist = Math.hypot(n.x - p.x, n.y - p.y)
      if (dist <= n.r + 12 && dist < bestDist) {
        best = n
        bestDist = dist
      }
    }
    return best
  }

  const handleNodePointerDown = (e: ReactPointerEvent, node: ConectorNode) => {
    if (modo === "borrar") return
    e.preventDefault()
    svgRef.current?.setPointerCapture(e.pointerId)
    const p = posFromEvent(e)
    if (modo === "conectar") {
      setConnectFrom({ id: node.id })
      setConnectCursor(p)
    } else {
      setDragNode({ id: node.id, dx: node.x - p.x, dy: node.y - p.y })
    }
  }

  const handlePointerMove = (e: ReactPointerEvent) => {
    const p = posFromEvent(e)
    if (dragNode) {
      const nx = clamp(p.x + dragNode.dx, 45, VIEW_W - 45)
      const ny = clamp(p.y + dragNode.dy, 70, viewHeight - 30)
      onMoveNode(dragNode.id, nx, ny)
    } else if (connectFrom) {
      setConnectCursor(p)
    }
  }

  const handlePointerUp = (e: ReactPointerEvent) => {
    if (connectFrom) {
      const p = posFromEvent(e)
      const target = findNodeAt(p)
      if (target && target.id !== connectFrom.id) {
        onAddEdge(connectFrom.id, target.id)
      }
      setConnectFrom(null)
      setConnectCursor(null)
    }
    setDragNode(null)
  }

  const sourceNode = connectFrom ? nodeById.get(connectFrom.id) : null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Modo:</span>
        <Button
          size="sm"
          variant={modo === "mover" ? "default" : "outline"}
          onClick={() => setModo("mover")}
        >
          <Move className="h-4 w-4" /> Mover
        </Button>
        <Button
          size="sm"
          variant={modo === "conectar" ? "default" : "outline"}
          onClick={() => setModo("conectar")}
        >
          <Link2 className="h-4 w-4" /> Conectar
        </Button>
        <Button
          size="sm"
          variant={modo === "borrar" ? "destructive" : "outline"}
          onClick={() => setModo("borrar")}
        >
          <Trash2 className="h-4 w-4" /> Borrar
        </Button>
      </div>

      <div className="conector-canvas border border-border/60 relative overflow-hidden">
        {!hasMetas && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground bg-background/70 px-4 py-2 rounded-lg border border-border/60">
              Crea metas activas en <span className="font-semibold">Metas</span> para conectarlas aquí
            </p>
          </div>
        )}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${viewHeight}`}
          className="w-full h-auto"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            if (dragNode) setDragNode(null)
            if (connectFrom) {
              setConnectFrom(null)
              setConnectCursor(null)
            }
          }}
        >
          <defs>
            <radialGradient id="conector-node-grad" cx="0.35" cy="0.3" r="1">
              <stop offset="0%" stopColor="hsl(var(--card))" />
              <stop offset="100%" stopColor="hsl(var(--muted))" />
            </radialGradient>
          </defs>

          {edges.map((edge) => {
            const from = nodeById.get(edge.from)
            const to = nodeById.get(edge.to)
            if (!from || !to) return null
            const g = edgeGeometry(from.x, from.y, from.r, to.x, to.y, to.r)
            const color = from.color
            return (
              <g
                key={edge.id}
                className="conector-edge"
                opacity={modo === "borrar" ? 1 : 0.9}
              >
                <path
                  d={g.d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={26}
                  strokeLinecap="round"
                  className={modo === "borrar" ? "cursor-pointer" : "cursor-default"}
                  onPointerDown={
                    modo === "borrar"
                      ? (ev) => {
                          ev.stopPropagation()
                          onRemoveEdge(edge.id)
                        }
                      : undefined
                  }
                />
                <path d={g.d} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeOpacity={0.14} />
                <path d={g.d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeOpacity={0.85} />
                <path d={arrowPath(g.ex, g.ey, g.ux, g.uy)} fill={color} opacity={0.95} />
              </g>
            )
          })}

          {sourceNode && connectCursor && (
            <g>
              <path
                d={`M ${sourceNode.x} ${sourceNode.y} L ${connectCursor.x} ${connectCursor.y}`}
                fill="none"
                stroke={sourceNode.color}
                strokeWidth={3}
                strokeDasharray="7 7"
                className="conector-connect-line"
              />
              <circle cx={connectCursor.x} cy={connectCursor.y} r={5} fill={sourceNode.color} />
            </g>
          )}

          {nodes.map((node) => {
            const isHover = hover === node.id
            const dim = modo === "borrar" ? 0.6 : isHover ? 1 : 0.92
            return (
              <g
                key={node.id}
                className={cn(
                  "conector-node",
                  modo === "mover" && "cursor-grab active:cursor-grabbing",
                  modo === "conectar" && "cursor-crosshair"
                )}
                opacity={dim}
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                onPointerEnter={() => setHover(node.id)}
                onPointerLeave={() => setHover(null)}
              >
                {node.kind === "hub" && (
                  <>
                    <circle cx={node.x} cy={node.y} r={node.r} fill="none" stroke={node.color} strokeWidth={1.5} className="conector-ping" />
                    <circle cx={node.x} cy={node.y} r={node.r} fill="none" stroke={node.color} strokeWidth={1.5} className="conector-ping conector-ping-alt" />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r - 14}
                      fill="none"
                      stroke={node.color}
                      strokeWidth={1}
                      strokeDasharray="4 8"
                      strokeOpacity={0.6}
                    />
                  </>
                )}

                {isHover && (
                  <circle cx={node.x} cy={node.y} r={node.r + 6} fill="none" stroke={node.color} strokeWidth={2} strokeOpacity={0.7} />
                )}

                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill="url(#conector-node-grad)"
                  stroke={node.color}
                  strokeWidth={isHover ? 3 : 2}
                  style={{ filter: `drop-shadow(0 0 ${node.kind === "hub" ? 18 : 10}px ${node.color}55)` }}
                />

                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={node.kind === "hub" ? 42 : node.kind === "recurso" ? 25 : 23}
                >
                  {node.icon}
                </text>

                <text
                  x={node.x}
                  y={node.y + node.r + (node.kind === "meta" ? 14 : 16)}
                  textAnchor="middle"
                  fontSize={node.kind === "hub" ? 15 : 12}
                  fontWeight={700}
                  className="conector-text"
                >
                  {node.kind === "meta" ? trunc(node.label, 22) : node.label}
                </text>

                {node.kind === "meta" && node.sublabel && (
                  <>
                    <circle cx={node.x - 4} cy={node.y + node.r + 26} r={2.5} fill={node.color} />
                    <text
                      x={node.x}
                      y={node.y + node.r + 29}
                      textAnchor="middle"
                      fontSize={10}
                      className="conector-text-muted"
                    >
                      {trunc(node.sublabel, 20)}
                    </text>
                  </>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}