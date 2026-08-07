import { useMemo } from "react"
import { useAreaScores, type AreaScore } from "./useAreaScores"
import { useNecesidades } from "./useNecesidades"
import type { Timeframe } from "@/contexts/TimeframeContext"

export type MapaNodeKind = "hub" | "area" | "deseo" | "pilar"

export interface MapaNode {
  id: string
  kind: MapaNodeKind
  label: string
  icon: string
  x: number
  y: number
  r: number
  score: number
  score2: number
  minutes: number
}

export interface PilarMeta {
  id: string
  label: string
  short: string
  icon: string
  desc: string
}

export const PILARES_DIRECCION: PilarMeta[] = [
  {
    id: "p-mejor-version",
    label: "Mejor Versión de Mí",
    short: "Mejor Versión",
    icon: "👑",
    desc: "Convertirme en mi mejor versión en todas las áreas posibles.",
  },
  {
    id: "p-amor-familia",
    label: "Amor y Familia",
    short: "Amor y Familia",
    icon: "💍",
    desc: "Conseguir a una mujer hermosa, el amor de mi vida, y construir una familia con ella.",
  },
  {
    id: "p-libertad",
    label: "Negocios y Libertad Financiera",
    short: "Negocios y Libertad",
    icon: "💰",
    desc: "Tener mis negocios y libertad financiera.",
  },
]

export const PILAR_DESEOS: Record<string, string[]> = {
  "p-mejor-version": ["exito", "boxeo"],
  "p-amor-familia": ["novia", "intimidad", "amigos"],
  "p-libertad": ["dinero", "moto"],
}

export interface MapaEdge {
  id: string
  from: string
  to: string
  esfuerzo: number
  resultados: number
  path: string
}

const VIEW_W = 1200

const HUB = { x: VIEW_W / 2, y: 715, r: 68 }
const AREAS_Y = 470
const DESEOS_Y = 270
const PILARES_Y = 60

const AREA_SHORT: Record<string, string> = {
  salud: "Salud",
  "fuerza-mental": "Fuerza Mental",
  proposito: "Propósito",
  apariencia: "Apariencia",
  desarrollo: "Desarrollo",
  profesional: "Profesional",
  finanzas: "Finanzas",
  familia: "Familia y Amistad",
  amor: "Amor y Romance",
  ocio: "Ocio y Experiencias",
}

const DESEO_AREAS: Record<string, string[]> = {
  moto: ["finanzas", "profesional"],
  dinero: ["finanzas", "profesional"],
  amigos: ["familia"],
  novia: ["apariencia", "amor"],
  intimidad: ["amor"],
  boxeo: ["salud", "fuerza-mental"],
  exito: ["proposito", "desarrollo"],
}

function spread(count: number, start: number, end: number): number[] {
  if (count <= 0) return []
  if (count === 1) return [(start + end) / 2]
  return Array.from({ length: count }, (_, i) => start + (i * (end - start)) / (count - 1))
}

function edgePath(ax: number, ay: number, r1: number, bx: number, by: number, r2: number): string {
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
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${mx.toFixed(1)} ${(my - lift).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`
}

function nodeMinutes(area: AreaScore): number {
  let total = 0
  const walk = (subs: AreaScore["sub"]) => {
    for (const s of subs) {
      if (s.children && s.children.length > 0) walk(s.children)
      else total += s.minutes
    }
  }
  walk(area.sub)
  return total
}

export function useMapaDeVida(timeframe: Timeframe) {
  const { scores, averages, loading } = useAreaScores(timeframe, "ambos")
  const { necesidades, loading: needsLoading } = useNecesidades()

  const { nodes, edges } = useMemo(() => {
    const areaNodes: MapaNode[] = []
    const deseoNodes: MapaNode[] = []
    const pilarNodes: MapaNode[] = []

    const areaPositions = spread(scores.length || 1, 110, VIEW_W - 110)
    const deseoPositions = spread(necesidades.length || 1, 150, VIEW_W - 150)
    const pilarPositions = spread(PILARES_DIRECCION.length, 110, VIEW_W - 110)

    scores.forEach((area, i) => {
      areaNodes.push({
        id: area.id,
        kind: "area",
        label: AREA_SHORT[area.id] ?? area.label,
        icon: area.icon,
        x: areaPositions[i] ?? VIEW_W / 2,
        y: AREAS_Y,
        r: 54,
        score: Math.round(area.esfuerzo),
        score2: Math.round(area.resultados),
        minutes: nodeMinutes(area),
      })
    })

    necesidades.forEach((n, i) => {
      deseoNodes.push({
        id: n.necesidad_id,
        kind: "deseo",
        label: n.titulo,
        icon: n.icono || "⭐",
        x: deseoPositions[i] ?? VIEW_W / 2,
        y: DESEOS_Y,
        r: 48,
        score: n.progreso ?? 0,
        score2: 0,
        minutes: 0,
      })
    })

    PILARES_DIRECCION.forEach((p, i) => {
      pilarNodes.push({
        id: p.id,
        kind: "pilar",
        label: p.short,
        icon: p.icon,
        x: pilarPositions[i] ?? VIEW_W / 2,
        y: PILARES_Y,
        r: 52,
        score: 0,
        score2: 0,
        minutes: 0,
      })
    })

    const areaById: Record<string, MapaNode> = {}
    for (const n of areaNodes) areaById[n.id] = n

    const nodes: MapaNode[] = [
      ...areaNodes,
      ...deseoNodes,
      ...pilarNodes,
      {
        id: "esfuerzo-hub",
        kind: "hub",
        label: "TU ESFUERZO",
        icon: "🔥",
        x: HUB.x,
        y: HUB.y,
        r: HUB.r,
        score: Math.round(averages.esfuerzo),
        score2: Math.round(averages.resultados),
        minutes: 0,
      },
    ]

    const edges: MapaEdge[] = []

    for (const area of areaNodes) {
      edges.push({
        id: `hub-${area.id}`,
        from: "esfuerzo-hub",
        to: area.id,
        esfuerzo: area.score,
        resultados: area.score2,
        path: edgePath(HUB.x, HUB.y, HUB.r, area.x, area.y, area.r),
      })
    }

    for (const deseo of deseoNodes) {
      const areaIds = DESEO_AREAS[deseo.id] ?? []
      for (const areaId of areaIds) {
        const area = areaById[areaId]
        if (!area) continue
        edges.push({
          id: `${area.id}-${deseo.id}`,
          from: area.id,
          to: deseo.id,
          esfuerzo: area.score,
          resultados: area.score2,
          path: edgePath(area.x, area.y, area.r, deseo.x, deseo.y, deseo.r),
        })
      }
    }

    const deseoById: Record<string, MapaNode> = {}
    for (const n of deseoNodes) deseoById[n.id] = n

    for (const pilar of pilarNodes) {
      const deseoIds = PILAR_DESEOS[pilar.id] ?? []
      for (const deseoId of deseoIds) {
        const deseo = deseoById[deseoId]
        if (!deseo) continue
        edges.push({
          id: `${deseo.id}-${pilar.id}`,
          from: deseo.id,
          to: pilar.id,
          esfuerzo: deseo.score,
          resultados: deseo.score,
          path: edgePath(deseo.x, deseo.y, deseo.r, pilar.x, pilar.y, pilar.r),
        })
      }
    }

    return { nodes, edges }
  }, [scores, necesidades, averages])

  return {
    nodes,
    edges,
    hub: nodes.find((n) => n.id === "esfuerzo-hub") ?? null,
    loading: loading || needsLoading,
    averageEsfuerzo: Math.round(averages.esfuerzo),
    areas: scores,
    necesidades,
  }
}