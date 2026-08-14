import { useMemo } from "react"
import { useRoutineBlocks, parseTime, type RoutineBlock } from "./useRoutineBlocks"

export interface IslaBloque {
  id: string
  title: string
  start: string
  end: string
  minutes: number
  tasks: string[]
}

export interface IslaEsfuerzo {
  areaId: string
  label: string
  icon: string
  minutes: number
  blocks: IslaBloque[]
}

const MIRROR_AREAS: { id: string; label: string; icon: string }[] = [
  { id: "salud", label: "Salud y Bienestar", icon: "🩺" },
  { id: "fuerza-mental", label: "Fuerza Mental", icon: "🧠" },
  { id: "proposito", label: "Propósito", icon: "🎯" },
  { id: "apariencia", label: "Apariencia", icon: "✨" },
  { id: "desarrollo", label: "Desarrollo", icon: "📚" },
  { id: "profesional", label: "Profesional", icon: "💼" },
  { id: "finanzas", label: "Finanzas", icon: "💰" },
  { id: "familia", label: "Familia", icon: "👨‍👩‍👧‍👦" },
  { id: "amor", label: "Amor", icon: "❤️" },
  { id: "ocio", label: "Ocio", icon: "🎮" },
]

const BLOCK_AREA_RULES: [RegExp, string][] = [
  [/activacion/i, "fuerza-mental"],
  [/desactivacion/i, "fuerza-mental"],
  [/alistamiento/i, "fuerza-mental"],
  [/gym/i, "salud"],
  [/lectura/i, "desarrollo"],
  [/piano/i, "desarrollo"],
  [/idiomas/i, "desarrollo"],
  [/musica/i, "desarrollo"],
  [/deep/i, "profesional"],
  [/focus/i, "profesional"],
  [/trabajo/i, "profesional"],
  [/bloque/i, "profesional"],
  [/skincare/i, "apariencia"],
  [/banarme/i, "apariencia"],
  [/vestirme/i, "apariencia"],
  [/game/i, "desarrollo"],
  [/ajedrez/i, "desarrollo"],
  [/almuerzo/i, "ocio"],
  [/ocio/i, "ocio"],
  [/comida/i, "ocio"],
]

function blockAreaId(blockId: string): string | null {
  for (const [re, areaId] of BLOCK_AREA_RULES) {
    if (re.test(blockId)) return areaId
  }
  return null
}

function blockMinutes(block: RoutineBlock): number {
  const start = parseTime(block.startTime)
  let end = parseTime(block.endTime)
  if (end <= start) end += 24 * 60
  return end - start
}

export function useEsfuerzoIslas() {
  const { blocks, isLoaded } = useRoutineBlocks()

  const islands = useMemo(() => {
    const map = new Map<string, IslaEsfuerzo>()
    for (const area of MIRROR_AREAS) {
      map.set(area.id, {
        areaId: area.id,
        label: area.label,
        icon: area.icon,
        minutes: 0,
        blocks: [],
      })
    }
    for (const b of blocks) {
      const areaId = blockAreaId(b.id)
      if (!areaId) continue
      const isla = map.get(areaId)
      if (!isla) continue
      const minutes = blockMinutes(b)
      isla.blocks.push({
        id: b.id,
        title: b.title,
        start: b.startTime,
        end: b.endTime,
        minutes,
        tasks: b.genericTasks ?? b.tasks ?? [],
      })
      isla.minutes += minutes
    }
    for (const isla of map.values()) {
      isla.blocks.sort((a, z) => parseTime(a.start) - parseTime(z.start))
    }
    return [...map.values()]
  }, [blocks])

  const totalMinutes = useMemo(() => islands.reduce((s, i) => s + i.minutes, 0), [islands])

  return { islands, totalMinutes, isLoaded }
}