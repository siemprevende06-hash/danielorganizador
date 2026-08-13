import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from "react";
import { Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import "./mapa.css";
const CYAN = "#22d3ee";
const BLUE = "#38bdf8";
const SLATE = "#64748b";
const PURPLE = "#a78bfa";
function ringColor(score) {
  if (score >= 70) return CYAN;
  if (score >= 40) return BLUE;
  return SLATE;
}
function islaPath(x) {
  const x1 = 600;
  const y1 = 195;
  const y2 = 62;
  const mx = (x1 + x) / 2;
  const my = Math.min(y1, y2) - 26;
  return `M ${x1} ${y1} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y2}`;
}
function formatTime(t) {
  const [h, m] = t.split(":");
  return `${Number(h)}:${m}`;
}
function formatTotal(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function EsfuerzoIslas({
  islands,
  totalMinutes,
  areaNodes,
  selectedAreaId,
  onSelectArea
}) {
  const maxMinutes = useMemo(
    () => Math.max(1, ...islands.map((i) => i.minutes)),
    [islands]
  );
  return /* @__PURE__ */ _jsxs("section", { className: "space-y-4", children: [
    /* @__PURE__ */ _jsxs("header", { className: "text-center space-y-1", children: [
      /* @__PURE__ */ _jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full", children: [
        /* @__PURE__ */ _jsx(Flame, { className: "h-4 w-4 text-primary" }),
        /* @__PURE__ */ _jsx("span", { className: "font-semibold text-primary text-sm", children: "ISLAS DE ESFUERZO \xB7 TU D\xCDA" })
      ] }),
      /* @__PURE__ */ _jsxs("p", { className: "text-xs text-muted-foreground", children: [
        "Tu rutina diaria repartida por \xE1reas \xB7 ",
        formatTotal(totalMinutes),
        " de esfuerzo planificado \xB7 toca una isla para iluminar su ruta en el mapa"
      ] })
    ] }),
    /* @__PURE__ */ _jsx("div", { className: "mapa-canvas border border-border/60 relative overflow-hidden p-2", children: /* @__PURE__ */ _jsxs("svg", { viewBox: "0 0 1200 250", className: "w-full h-auto select-none", children: [
      islands.map((isla) => {
        const node = areaNodes.find((n) => n.id === isla.areaId);
        if (!node || isla.minutes <= 0) return null;
        const glow = 0.15 + 0.75 * (isla.minutes / maxMinutes);
        return /* @__PURE__ */ _jsx("g", { className: "mapa-edge", children: /* @__PURE__ */ _jsx(
          "path",
          {
            d: islaPath(node.x),
            fill: "none",
            stroke: CYAN,
            strokeWidth: 3,
            strokeLinecap: "round",
            strokeOpacity: glow,
            onClick: () => onSelectArea(isla.areaId),
            className: "mapa-node"
          }
        ) }, isla.areaId);
      }),
      areaNodes.map((node) => {
        const isla = islands.find((i) => i.areaId === node.id);
        const minutes = isla?.minutes ?? 0;
        const isSelected = selectedAreaId === node.id;
        const ring = ringColor(node.score);
        return /* @__PURE__ */ _jsxs(
          "g",
          {
            className: "mapa-node",
            onClick: () => onSelectArea(node.id),
            children: [
              isSelected && /* @__PURE__ */ _jsx(
                "circle",
                {
                  cx: node.x,
                  cy: 62,
                  r: 24,
                  fill: "none",
                  stroke: ring,
                  strokeWidth: 2,
                  className: "mapa-selected-ring"
                }
              ),
              /* @__PURE__ */ _jsx(
                "circle",
                {
                  cx: node.x,
                  cy: 62,
                  r: 17,
                  fill: "url(#isla-node-grad)",
                  stroke: ring,
                  strokeWidth: isSelected ? 3 : 1.5,
                  style: { filter: minutes > 0 ? `drop-shadow(0 0 6px ${ring}66)` : void 0 }
                }
              ),
              /* @__PURE__ */ _jsx("text", { x: node.x, y: 62, textAnchor: "middle", dominantBaseline: "central", fontSize: 15, children: node.icon }),
              /* @__PURE__ */ _jsx(
                "text",
                {
                  x: node.x,
                  y: 90,
                  textAnchor: "middle",
                  fontSize: 9.5,
                  fontWeight: 600,
                  fill: "hsl(var(--foreground))",
                  children: node.label
                }
              ),
              /* @__PURE__ */ _jsx(
                "text",
                {
                  x: node.x,
                  y: 101,
                  textAnchor: "middle",
                  fontSize: 9,
                  fontWeight: 700,
                  fill: minutes > 0 ? CYAN : "hsl(var(--muted-foreground))",
                  children: minutes > 0 ? `${formatTotal(minutes)}` : "\u2014"
                }
              )
            ]
          },
          node.id
        );
      }),
      /* @__PURE__ */ _jsxs("g", { className: "mapa-node", children: [
        /* @__PURE__ */ _jsx("circle", { cx: 600, cy: 225, r: 34, fill: "url(#isla-node-grad)", stroke: PURPLE, strokeWidth: 2, style: { filter: `drop-shadow(0 0 8px ${PURPLE}55)` } }),
        /* @__PURE__ */ _jsx("text", { x: 600, y: 225, textAnchor: "middle", dominantBaseline: "central", fontSize: 26, children: "\u{1F525}" }),
        /* @__PURE__ */ _jsx("text", { x: 600, y: 268, textAnchor: "middle", fontSize: 11, fontWeight: 700, fill: "hsl(var(--foreground))", children: "TU D\xCDA" })
      ] }),
      /* @__PURE__ */ _jsx("defs", { children: /* @__PURE__ */ _jsxs("radialGradient", { id: "isla-node-grad", cx: "0.35", cy: "0.3", r: "1", children: [
        /* @__PURE__ */ _jsx("stop", { offset: "0%", stopColor: "hsl(var(--card))" }),
        /* @__PURE__ */ _jsx("stop", { offset: "100%", stopColor: "hsl(var(--muted))" })
      ] }) })
    ] }) }),
    /* @__PURE__ */ _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3", children: islands.map((isla) => {
      const isSelected = selectedAreaId === isla.areaId;
      const empty = isla.minutes <= 0;
      return /* @__PURE__ */ _jsxs(
        "button",
        {
          onClick: () => onSelectArea(isla.areaId),
          className: cn(
            "text-left rounded-2xl border p-3 transition-all",
            isSelected ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/10 scale-[1.02]" : "border-border/60 bg-card/80 hover:border-cyan-400/50 hover:bg-cyan-400/5",
            empty && "opacity-50"
          ),
          children: [
            /* @__PURE__ */ _jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
              /* @__PURE__ */ _jsx("span", { className: "text-lg leading-none", children: isla.icon }),
              /* @__PURE__ */ _jsx("span", { className: "text-[11px] font-bold leading-tight flex-1", children: isla.label }),
              /* @__PURE__ */ _jsx(
                "span",
                {
                  className: cn(
                    "text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full",
                    empty ? "bg-muted text-muted-foreground" : "bg-cyan-400/15 text-cyan-500"
                  ),
                  children: empty ? "0m" : formatTotal(isla.minutes)
                }
              )
            ] }),
            /* @__PURE__ */ _jsxs("div", { className: "space-y-1", children: [
              isla.blocks.length === 0 && /* @__PURE__ */ _jsx("p", { className: "text-[10px] text-muted-foreground italic", children: "Sin bloques en tu rutina" }),
              isla.blocks.map((b) => /* @__PURE__ */ _jsxs("div", { className: "flex items-center gap-1.5 text-[10px]", children: [
                /* @__PURE__ */ _jsx(Clock, { className: "h-2.5 w-2.5 shrink-0 text-muted-foreground/60" }),
                /* @__PURE__ */ _jsx("span", { className: "text-muted-foreground tabular-nums shrink-0", children: formatTime(b.start) }),
                /* @__PURE__ */ _jsx("span", { className: "truncate flex-1", children: b.title }),
                /* @__PURE__ */ _jsxs("span", { className: "tabular-nums text-muted-foreground/70 shrink-0", children: [
                  b.minutes,
                  "m"
                ] })
              ] }, b.id))
            ] })
          ]
        },
        isla.areaId
      );
    }) }),
    /* @__PURE__ */ _jsxs("div", { className: "flex items-center justify-center gap-2 flex-wrap text-xs text-muted-foreground", children: [
      /* @__PURE__ */ _jsx("span", { className: "font-semibold text-cyan-400", children: "Tu D\xEDa" }),
      /* @__PURE__ */ _jsx("span", { children: "\u2192" }),
      /* @__PURE__ */ _jsx("span", { className: "font-semibold", style: { color: "#38bdf8" }, children: "\xC1reas de Vida" }),
      /* @__PURE__ */ _jsx("span", { children: "\u2192" }),
      /* @__PURE__ */ _jsx("span", { className: "font-semibold", style: { color: "#34d399" }, children: "Deseos" }),
      /* @__PURE__ */ _jsx("span", { children: "\u2192" }),
      /* @__PURE__ */ _jsx("span", { className: "font-semibold", style: { color: "#f59e0b" }, children: "Pilares de Direcci\xF3n" })
    ] })
  ] });
}
export {
  EsfuerzoIslas
};