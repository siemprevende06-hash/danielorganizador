import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useTimeframe } from "@/contexts/TimeframeContext";
import { useMapaDeVida } from "@/hooks/useMapaDeVida";
import { useEsfuerzoIslas } from "@/hooks/useEsfuerzoIslas";
import { MapaDeVida } from "@/components/mapa/MapaDeVida";
import { MapaDetailPanel } from "@/components/mapa/MapaDetailPanel";
import { EsfuerzoIslas } from "@/components/mapa/EsfuerzoIslas";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { Network } from "lucide-react";
const TIMEFRAME_LABEL = {
  today: "HOY",
  week: "\xDALTIMOS 7 D\xCDAS",
  month: "\xDALTIMOS 30 D\xCDAS",
  quarter: "\xDALTIMO TRIMESTRE",
  year: "\xDALTIMO A\xD1O",
  sprint: "SPRINT ACTIVO"
};
function MapaDeVidaPage() {
  const { timeframe } = useTimeframe();
  const { nodes, edges, loading, areas, necesidades } = useMapaDeVida(timeframe);
  const { islands, totalMinutes } = useEsfuerzoIslas();
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);
  useEffect(() => {
    setSelected(null);
  }, [timeframe]);
  const areaNodes = nodes.filter((n) => n.kind === "area");
  const handleSelectArea = (areaId) => {
    const node = nodes.find((n) => n.id === areaId && n.kind === "area") ?? null;
    setSelected(node);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return /* @__PURE__ */ _jsxs("div", { className: "container mx-auto px-4 py-12 space-y-6", children: [
    /* @__PURE__ */ _jsxs("header", { className: "text-center space-y-3", children: [
      /* @__PURE__ */ _jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full", children: [
        /* @__PURE__ */ _jsx(Network, { className: "h-5 w-5 text-primary" }),
        /* @__PURE__ */ _jsx("span", { className: "font-semibold text-primary", children: "MAPA DE CONEXI\xD3N" })
      ] }),
      /* @__PURE__ */ _jsx("h1", { className: "text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent", children: "Mapa de Vida" }),
      /* @__PURE__ */ _jsx("p", { className: "text-muted-foreground max-w-lg mx-auto", children: "Tu esfuerzo diario ilumina cada \xE1rea, tus \xE1reas alimentan tus deseos y tus deseos apuntan a tu direcci\xF3n: los 3 pilares de tu vida." }),
      /* @__PURE__ */ _jsxs("div", { className: "flex items-center justify-center gap-3 flex-wrap text-xs text-muted-foreground", children: [
        /* @__PURE__ */ _jsxs("span", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ _jsx("span", { className: "h-2.5 w-2.5 rounded-full", style: { background: "#22d3ee" } }),
          "Esfuerzo"
        ] }),
        /* @__PURE__ */ _jsxs("span", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ _jsx("span", { className: "h-2.5 w-2.5 rounded-full", style: { background: "#34d399" } }),
          "Resultados"
        ] }),
        /* @__PURE__ */ _jsxs("span", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ _jsx("span", { className: "h-2.5 w-2.5 rounded-full border-2 border-red-400" }),
          "Deseo insatisfecho"
        ] }),
        /* @__PURE__ */ _jsxs("span", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ _jsx("span", { className: "h-2.5 w-2.5 rounded-full border-2 border-green-400" }),
          "Deseo satisfecho"
        ] }),
        /* @__PURE__ */ _jsxs("span", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ _jsx("span", { className: "h-2.5 w-2.5 rounded-full", style: { background: "#f59e0b" } }),
          "Pilares de direcci\xF3n"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ _jsx("div", { className: "flex items-center justify-center gap-2 text-xs text-muted-foreground", children: /* @__PURE__ */ _jsx("span", { className: "font-semibold", style: { color: "#a78bfa" }, children: TIMEFRAME_LABEL[timeframe] }) }),
    /* @__PURE__ */ _jsx(TimeframeSelector, {}),
    loading ? /* @__PURE__ */ _jsx("div", { className: "animate-pulse space-y-4", children: /* @__PURE__ */ _jsx("div", { className: "h-96 bg-muted rounded-xl" }) }) : /* @__PURE__ */ _jsxs(_Fragment, { children: [
      /* @__PURE__ */ _jsx("div", { ref: mapRef, className: "scroll-mt-20", children: /* @__PURE__ */ _jsx(MapaDeVida, { nodes, edges, selected, onSelect: setSelected }) }),
      selected && /* @__PURE__ */ _jsx(
        MapaDetailPanel,
        {
          node: selected,
          areas,
          needs: necesidades,
          onClose: () => setSelected(null)
        }
      ),
      !selected && /* @__PURE__ */ _jsx("p", { className: "text-center text-xs text-muted-foreground", children: "Toca cualquier nodo para iluminar su ruta: esfuerzo \u2192 \xE1rea \u2192 deseo \u2192 pilar" }),
      /* @__PURE__ */ _jsx("div", { className: "border-t border-border/40 pt-6", children: /* @__PURE__ */ _jsx(
        EsfuerzoIslas,
        {
          islands,
          totalMinutes,
          areaNodes,
          selectedAreaId: selected?.kind === "area" ? selected.id : null,
          onSelectArea: handleSelectArea
        }
      ) })
    ] })
  ] });
}
export {
  MapaDeVidaPage as default
};