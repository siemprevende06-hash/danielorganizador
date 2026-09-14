import { useCallback, useEffect, useMemo, useState } from "react"
import { useGoalProgress } from "./useGoalProgress"
import { POINT_B_AREAS } from "@/data/pointB2027"
import { AREAS_WITH_METRICS } from "@/data/areaMetricsData"
import { lifeAreas } from "@/lib/data"

export type ConectorNodeKind = "hub" | "recurso" | "meta"

export interface ConectorNode {
  id: string
  kind: ConectorNodeKind
  label: string
  sublabel?: string
  icon: string
  x: number
  y: number
  r: number
  color: string
}

export interface ConectorEdge {
  id: string
  from: string
  to: string
}

export const VIEW_W = 1200

const POS_KEY = "conector_energia_positions"
const EDGES_KEY = "conector_energia_edges"

const GROUP_COLORS: Record<string, string> = {
  cimientos: "#2dd4bf",
  construccion: "#818cf8",
  recompensas: "#fbbf24",
}

export const RECURSOS: { id: string; label: string; icon: string; color: string }[] = [
  { id: "tiempo", label: "Tiempo", icon: "⏰", color: "#fbbf24" },
  { id: "dinero", label: "Dinero", icon: "💰", color: "#34d399" },
  { id: "mente", label: "Mente", icon: "🧠", color: "#a78bfa" },
  { id: "pasion", label: "Pasión", icon: "❤️", color: "#f87171" },
  { id: "foco", label: "Foco", icon: "🎯", color: "#38bdf8" },
  { id: "cuerpo", label: "Cuerpo", icon: "💪", color: "#fb923c" },
]

const AREA_META: Record<string, { label: string; icon: string; color: string }> = {}

for (const a of POINT_B_AREAS) {
  AREA_META[a.id] = { label: a.label, icon: a.icon, color: GROUP_COLORS[a.group] ?? "#94a3b8" }
}
for (const a of AREAS_WITH_METRICS) {
  if (!AREA_META[a.areaId]) AREA_META[a.areaId] = { label: a.label, icon: a.icon, color: "#94a3b8" }
}
for (const a of lifeAreas) {
  if (!AREA_META[a.id]) AREA_META[a.id] = { label: a.name, icon: "🎯", color: "#94a3b8" }
}

export function getAreaMeta(areaId: string | null): { label: string; icon: string; color: string } {
  if (!areaId) return { label: "Área general", icon: "🎯", color: "#94a3b8" }
  return (
    AREA_META[areaId] ?? {
      label: areaId,
      icon: "🎯",
      color: "#94a3b8",
    }
  )
}

function spread(count: number, start: number, end: number): number[] {
  if (count <= 0) return []
  if (count === 1) return [(start + end) / 2]
  return Array.from({ length: count }, (_, i) => start + (i * (end - start)) / (count - 1))
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function defaultPositions(metaRows: ConectorNode[][]): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {
    "energia-hub": { x: VIEW_W / 2, y: 130 },
  }
  RECURSOS.forEach((r, i) => {
    const xs = spread(RECURSOS.length, 170, VIEW_W - 170)
    pos[`recurso-${r.id}`] = { x: xs[i] ?? VIEW_W / 2, y: 310 }
  })
  metaRows.forEach((row, ri) => {
    const xs = spread(row.length, 140, VIEW_W - 140)
    row.forEach((n, ci) => {
      pos[n.id] = { x: xs[ci] ?? VIEW_W / 2, y: 480 + ri * 175 }
    })
  })
  return pos
}

export function useConectorEnergia() {
  const { goals, loading } = useGoalProgress()
  const metas = useMemo(() => goals.filter((g) => g.status === "active"), [goals])

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [positionsReady, setPositionsReady] = useState(false)
  const [edges, setEdges] = useState<ConectorEdge[]>([])

  useEffect(() => {
    setPositions(loadJSON<Record<string, { x: number; y: number }>>(POS_KEY, {}))
    setEdges(loadJSON<ConectorEdge[]>(EDGES_KEY, []))
    setPositionsReady(true)
  }, [])

  useEffect(() => {
    if (!positionsReady) return
    localStorage.setItem(POS_KEY, JSON.stringify(positions))
  }, [positions, positionsReady])

  useEffect(() => {
    if (!positionsReady) return
    localStorage.setItem(EDGES_KEY, JSON.stringify(edges))
  }, [edges, positionsReady])

  const metaNodes = useMemo<ConectorNode[]>(() => {
    return metas.map((g) => {
      const area = getAreaMeta(g.area_id)
      return {
        id: `meta-${g.id}`,
        kind: "meta" as const,
        label: g.title,
        sublabel: area.label,
        icon: area.icon,
        x: 0,
        y: 0,
        r: 46,
        color: area.color,
      }
    })
  }, [metas])

  const nodes = useMemo<ConectorNode[]>(() => {
    const rows: ConectorNode[][] = []
    const perRow = 5
    for (let i = 0; i < metaNodes.length; i += perRow) {
      rows.push(metaNodes.slice(i, i + perRow))
    }
    const defaults = defaultPositions(rows)

    const base: ConectorNode[] = [
      {
        id: "energia-hub",
        kind: "hub",
        label: "ENERGÍA",
        sublabel: "tu esfuerzo",
        icon: "⚡",
        x: 0,
        y: 0,
        r: 84,
        color: "#a78bfa",
      },
      ...RECURSOS.map((r) => ({
        id: `recurso-${r.id}`,
        kind: "recurso" as const,
        label: r.label,
        icon: r.icon,
        x: 0,
        y: 0,
        r: 44,
        color: r.color,
      })),
      ...metaNodes,
    ]

    return base.map((n) => {
      const p = positions[n.id] ?? defaults[n.id]
      return { ...n, x: p.x, y: p.y }
    })
  }, [metaNodes, positions])

  const validEdges = useMemo(() => {
    const ids = new Set(nodes.map((n) => n.id))
    return edges.filter((e) => e.from !== e.to && ids.has(e.from) && ids.has(e.to))
  }, [edges, nodes])

  const addEdge = useCallback((from: string, to: string) => {
    if (!from || !to || from === to) return
    setEdges((prev) =>
      prev.some((e) => e.from === from && e.to === to)
        ? prev
        : [...prev, { id: `${from}:${to}`, from, to }]
    )
  }, [])

  const removeEdge = useCallback((id: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const resetEdges = useCallback(() => setEdges([]), [])

  const resetPositions = useCallback(() => setPositions({}), [])

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setPositions((prev) => ({ ...prev, [id]: { x, y } }))
  }, [])

  const viewHeight = useMemo(() => {
    const rows = Math.max(1, Math.ceil(metaNodes.length / 5))
    return 480 + (rows - 1) * 175 + 150
  }, [metaNodes.length])

  return {
    nodes,
    edges: validEdges,
    metas,
    viewHeight,
    loading,
    addEdge,
    removeEdge,
    resetEdges,
    resetPositions,
    moveNode,
  }
}