import { Anchor, Sparkles, Target } from "lucide-react"
import type { LucideIcon } from "lucide-react"

/**
 * Los tres bloques de la Rueda de la Vida, compartidos por la pagina
 * "Areas de Vida" y por el vision board de "Direccion" para que ambas
 * vistas hablen el mismo idioma (mismos grupos, colores y jerarquias).
 */
export interface LifeAreaSection {
  key: "cimientos" | "construccion" | "recompensas"
  title: string
  short: string
  subtitle: string
  icon: LucideIcon
  color: string
  border: string
  badgeColor: string
  progressColor: string
}

export const LIFE_AREA_SECTIONS: LifeAreaSection[] = [
  {
    key: "cimientos",
    title: "ÁREAS ESTRUCTURALES",
    short: "Cimientos",
    subtitle: "Cimientos de tu vida — la base sobre la que construyes todo",
    icon: Anchor,
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/20",
    badgeColor: "bg-blue-500/10 text-blue-600",
    progressColor: "bg-blue-500",
  },
  {
    key: "construccion",
    title: "ÁREAS CENTRALES",
    short: "Construcción",
    subtitle: "Construcción activa — donde pones tu energía para crecer",
    icon: Target,
    color: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/20",
    badgeColor: "bg-amber-500/10 text-amber-600",
    progressColor: "bg-amber-500",
  },
  {
    key: "recompensas",
    title: "ÁREAS DE RECOMPENSA",
    short: "Recompensas",
    subtitle: "El resultado de tu esfuerzo — lo que disfrutas al construir",
    icon: Sparkles,
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/20",
    badgeColor: "bg-emerald-500/10 text-emerald-600",
    progressColor: "bg-emerald-500",
  },
]

export function getLifeAreaSection(group: string): LifeAreaSection | undefined {
  return LIFE_AREA_SECTIONS.find(s => s.key === group)
}

/**
 * Áreas que Dirección despliega en sus sub-áreas (una tarjeta por sub-área).
 * El resto se resume en un icono con su % de esfuerzo para no saturar la
 * página: 10 áreas por sub-área serían ~50 tarjetas.
 *
 * Finanzas se queda fuera a propósito: sus sub-áreas (ingresos, gastos, ahorro,
 * inversion, edu-financiera) no existen todavía en daily_systems_tracking, así
 * que sus tarjetas saldrían todas en cero.
 */
export const DIRECCION_EXPANDED_AREA_IDS = ["desarrollo", "profesional"] as const

export function isDireccionExpandedArea(areaId: string): boolean {
  return (DIRECCION_EXPANDED_AREA_IDS as readonly string[]).includes(areaId)
}

/** Destino de cada área que Dirección muestra como icono (todas existen en el router). */
export const DIRECCION_AREA_LINKS: Record<string, string> = {
  salud: "/gym",
  "fuerza-mental": "/habits",
  proposito: "/proposito",
  apariencia: "/identidad",
  finanzas: "/finance",
  familia: "/vida-social",
  amor: "/novia",
  ocio: "/chess",
}