import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRoutineBlocks, parseTime } from "./useRoutineBlocks";
const MIRROR_AREAS = [
  { id: "salud", label: "Salud y Bienestar", icon: "\u{1FA7A}" },
  { id: "fuerza-mental", label: "Fuerza Mental", icon: "\u{1F9E0}" },
  { id: "proposito", label: "Prop\xF3sito", icon: "\u{1F3AF}" },
  { id: "apariencia", label: "Apariencia", icon: "\u2728" },
  { id: "desarrollo", label: "Desarrollo", icon: "\u{1F4DA}" },
  { id: "profesional", label: "Profesional", icon: "\u{1F4BC}" },
  { id: "finanzas", label: "Finanzas", icon: "\u{1F4B0}" },
  { id: "familia", label: "Familia", icon: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}" },
  { id: "amor", label: "Amor", icon: "\u2764\uFE0F" },
  { id: "ocio", label: "Ocio", icon: "\u{1F3AE}" }
];
const BLOCK_AREA_RULES = [
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
  [/ajedrez/i, "ocio"],
  [/almuerzo/i, "ocio"],
  [/ocio/i, "ocio"],
  [/comida/i, "ocio"]
];
function blockAreaId(blockId) {
  for (const [re, areaId] of BLOCK_AREA_RULES) {
    if (re.test(blockId)) return areaId;
  }
  return null;
}
function blockMinutes(block) {
  const start = parseTime(block.startTime);
  let end = parseTime(block.endTime);
  if (end <= start) end += 24 * 60;
  return end - start;
}
function useEsfuerzoIslas() {
  const { blocks, isLoaded } = useRoutineBlocks();
  const islands = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const area of MIRROR_AREAS) {
      map.set(area.id, {
        areaId: area.id,
        label: area.label,
        icon: area.icon,
        minutes: 0,
        blocks: []
      });
    }
    for (const b of blocks) {
      const areaId = blockAreaId(b.id);
      if (!areaId) continue;
      const isla = map.get(areaId);
      if (!isla) continue;
      const minutes = blockMinutes(b);
      isla.blocks.push({
        id: b.id,
        title: b.title,
        start: b.startTime,
        end: b.endTime,
        minutes,
        tasks: b.genericTasks ?? b.tasks ?? []
      });
      isla.minutes += minutes;
    }
    for (const isla of map.values()) {
      isla.blocks.sort((a, z) => parseTime(a.start) - parseTime(z.start));
    }
    return [...map.values()];
  }, [blocks]);
  const totalMinutes = useMemo(() => islands.reduce((s, i) => s + i.minutes, 0), [islands]);
  return { islands, totalMinutes, isLoaded };
}
export {
  useEsfuerzoIslas
};