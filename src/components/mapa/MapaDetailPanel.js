import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PILARES_DIRECCION, PILAR_DESEOS, DESEO_DESEOS } from "@/hooks/useMapaDeVida";
import { Clock, ArrowRight, X } from "lucide-react";
import { NecesidadGaleria } from "./NecesidadGaleria";
const NEED_PAGE = {
  moto: "/finanzas",
  dinero: "/finanzas",
  novia: "/novia",
  amigos: "/vida-social",
  intimidad: "/vida-social",
  boxeo: "/boxeo",
  exito: "/life-alignment"
};
function formatMinutes(minutes) {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function statusText(p) {
  if (p >= 80) return "\u2705 Satisfecha";
  if (p >= 50) return "\u{1F504} En camino";
  if (p >= 20) return "\u26A0\uFE0F Insuficiente";
  return "\u274C Insatisfecha";
}
function statusTextColor(p) {
  if (p >= 80) return "#34d399";
  if (p >= 50) return "#fbbf24";
  if (p >= 20) return "#fb923c";
  return "#f87171";
}
function DualBar({ label, value, color }) {
  return /* @__PURE__ */ _jsxs("div", { className: "space-y-1", children: [
    /* @__PURE__ */ _jsxs("div", { className: "flex items-center justify-between text-sm", children: [
      /* @__PURE__ */ _jsx("span", { className: "text-muted-foreground", children: label }),
      /* @__PURE__ */ _jsxs("span", { className: "font-bold tabular-nums", children: [
        value,
        "%"
      ] })
    ] }),
    /* @__PURE__ */ _jsx("div", { className: "h-2 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ _jsx(
      "div",
      {
        className: "h-full rounded-full transition-all duration-500",
        style: { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }
      }
    ) })
  ] });
}
function MapaDetailPanel({
  node,
  areas,
  needs,
  onClose
}) {
  const navigate = useNavigate();
  const area = areas.find((a) => a.id === node.id);
  const need = needs.find((n) => n.necesidad_id === node.id);
  return /* @__PURE__ */ _jsxs(Card, { className: "animate-scale-in", children: [
    /* @__PURE__ */ _jsxs(CardHeader, { className: "pb-3 flex-row items-center justify-between space-y-0", children: [
      /* @__PURE__ */ _jsxs(CardTitle, { className: "flex items-center gap-3 text-lg", children: [
        /* @__PURE__ */ _jsx("span", { className: "text-2xl", children: node.icon }),
        /* @__PURE__ */ _jsx("span", { children: node.label })
      ] }),
      /* @__PURE__ */ _jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ _jsx(Badge, { variant: "outline", children: node.kind === "hub" ? "Energ\xEDa" : node.kind === "area" ? "\xC1rea de Vida" : node.kind === "deseo" ? "Deseo" : "Pilar de Direcci\xF3n" }),
        /* @__PURE__ */ _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: onClose, children: /* @__PURE__ */ _jsx(X, { className: "h-4 w-4" }) })
      ] })
    ] }),
    /* @__PURE__ */ _jsxs(CardContent, { className: "space-y-4", children: [
      node.kind === "hub" && /* @__PURE__ */ _jsxs(_Fragment, { children: [
        /* @__PURE__ */ _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ _jsx(DualBar, { label: "Esfuerzo promedio", value: node.score, color: "#22d3ee" }),
          /* @__PURE__ */ _jsx(DualBar, { label: "Resultados Promedio", value: node.score2, color: "#34d399" })
        ] }),
        /* @__PURE__ */ _jsxs("p", { className: "text-xs text-muted-foreground", children: [
          formatMinutes(areas.reduce((s, a) => s + (a.sub ? sumSubMinutes(a) : 0), 0)),
          " de esfuerzo registrado en el per\xEDodo."
        ] }),
        /* @__PURE__ */ _jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: areas.map((a) => /* @__PURE__ */ _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ _jsx("span", { children: a.icon }),
          /* @__PURE__ */ _jsx("span", { className: "text-xs flex-1 truncate", children: a.label }),
          /* @__PURE__ */ _jsxs("span", { className: "tabular-nums font-semibold", style: { color: a.esfuerzo >= 70 ? "#22d3ee" : a.esfuerzo >= 40 ? "#38bdf8" : "#64748b" }, children: [
            a.esfuerzo,
            "%"
          ] })
        ] }, a.id)) })
      ] }),
      node.kind === "area" && area && /* @__PURE__ */ _jsxs(_Fragment, { children: [
        /* @__PURE__ */ _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ _jsx(DualBar, { label: "Esfuerzo invertido", value: node.score, color: "#22d3ee" }),
          /* @__PURE__ */ _jsx(DualBar, { label: "Avance a resultados", value: node.score2, color: "#34d399" })
        ] }),
        /* @__PURE__ */ _jsxs("p", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ _jsx(Clock, { className: "h-3.5 w-3.5" }),
          formatMinutes(node.minutes),
          " invertidos en esta \xE1rea"
        ] }),
        /* @__PURE__ */ _jsx("div", { className: "space-y-2", children: area.sub.slice(0, 8).map((s) => /* @__PURE__ */ _jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ _jsx("span", { className: "text-xs flex-1 truncate", children: s.label }),
          /* @__PURE__ */ _jsx("div", { className: "h-1.5 w-24 bg-muted rounded-full overflow-hidden shrink-0", children: /* @__PURE__ */ _jsx("div", { className: "h-full rounded-full bg-cyan-400", style: { width: `${s.esfuerzo}%` } }) }),
          /* @__PURE__ */ _jsxs("span", { className: "text-[10px] tabular-nums text-muted-foreground w-8 text-right", children: [
            s.esfuerzo,
            "%"
          ] })
        ] }, s.id)) }),
        /* @__PURE__ */ _jsxs(Button, { size: "sm", variant: "outline", onClick: () => navigate("/areas-de-vida"), children: [
          "Ver todas las \xE1reas ",
          /* @__PURE__ */ _jsx(ArrowRight, { className: "h-3 w-3 ml-1" })
        ] })
      ] }),
      node.kind === "deseo" && need && /* @__PURE__ */ _jsx(_Fragment, { children: (() => {
        const manual = Math.max(0, Math.min(100, need.progreso ?? 0));
        const areaFeeders = areas.filter((a) => isFeeder(node.id, a.id));
        const deseoFeeders = needs.filter(
          (n) => Object.entries(DESEO_DESEOS).some(([fromId, tos]) => tos.includes(node.id) && fromId === n.necesidad_id)
        );
        const valores = [];
        areaFeeders.forEach((a) => valores.push(Math.round((a.esfuerzo + a.resultados) / 2)));
        for (const [fromId, tos] of Object.entries(DESEO_DESEOS)) {
          if (!tos.includes(node.id)) continue;
          const feed = needs.find((n) => n.necesidad_id === fromId);
          if (feed && (feed.progreso ?? 0) > 0) valores.push(Math.round((feed.progreso ?? 0) * 0.5));
        }
        const shown = manual > 0 ? manual : valores.length > 0 ? Math.round(valores.reduce((s, v) => s + v, 0) / valores.length) : 0;
        return /* @__PURE__ */ _jsxs(_Fragment, { children: [
          /* @__PURE__ */ _jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ _jsxs("div", { className: "flex items-center justify-between text-sm", children: [
              /* @__PURE__ */ _jsx("span", { className: "muted-foreground", children: "Progreso de este deseo" }),
              /* @__PURE__ */ _jsxs("span", { className: "font-bold tabular-nums", children: [
                shown,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ _jsx(Progress, { value: shown, className: "h-3" })
          ] }),
          /* @__PURE__ */ _jsx("p", { className: "text-sm text-muted-foreground", children: need.descripcion }),
          /* @__PURE__ */ _jsx(Badge, { variant: "secondary", children: statusText(shown) }),
          areaFeeders.length > 0 && /* @__PURE__ */ _jsx("div", { className: "flex flex-wrap gap-1.5", children: areaFeeders.map((a) => /* @__PURE__ */ _jsxs(Badge, { variant: "outline", className: "gap-1", children: [
            /* @__PURE__ */ _jsx("span", { children: a.icon }),
            a.label
          ] }, a.id)) }),
          deseoFeeders.length > 0 && /* @__PURE__ */ _jsx("div", { className: "flex flex-wrap gap-1.5", children: deseoFeeders.map((d) => /* @__PURE__ */ _jsxs(Badge, { variant: "outline", className: "gap-1", children: [
            /* @__PURE__ */ _jsx("span", { children: d.icono }),
            d.titulo,
            /* @__PURE__ */ _jsxs("span", { className: "tabular-nums font-semibold", style: { color: statusTextColor(d.progreso ?? 0) }, children: [
              d.progreso ?? 0,
              "%"
            ] })
          ] }, d.necesidad_id)) }),
          NEED_PAGE[node.id] && /* @__PURE__ */ _jsxs(Button, { size: "sm", onClick: () => navigate(NEED_PAGE[node.id]), children: [
            "Trabajar en esto ",
            /* @__PURE__ */ _jsx(ArrowRight, { className: "h-3 w-3 ml-1" })
          ] }),
          /* @__PURE__ */ _jsx(NecesidadGaleria, { necesidadId: node.id }, node.id)
        ] });
      })() }),
      node.kind === "pilar" && (() => {
        const pilar = PILARES_DIRECCION.find((p) => p.id === node.id);
        const feeding = needs.filter((n) => (PILAR_DESEOS[node.id] ?? []).includes(n.necesidad_id));
        const avg = feeding.length ? Math.round(feeding.reduce((s, n) => s + (n.progreso ?? 0), 0) / feeding.length) : 0;
        return /* @__PURE__ */ _jsxs(_Fragment, { children: [
          pilar && /* @__PURE__ */ _jsx("p", { className: "text-sm text-muted-foreground", children: pilar.desc }),
          /* @__PURE__ */ _jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ _jsxs("div", { className: "flex items-center justify-between text-sm", children: [
              /* @__PURE__ */ _jsx("span", { className: "text-muted-foreground", children: "Deseos que lo alimentan" }),
              /* @__PURE__ */ _jsxs("span", { className: "font-bold tabular-nums", children: [
                avg,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ _jsx("div", { className: "h-2 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ _jsx("div", { className: "h-full rounded-full transition-all duration-500", style: { width: `${avg}%`, backgroundColor: "#f59e0b" } }) })
          ] }),
          /* @__PURE__ */ _jsx("div", { className: "flex flex-wrap gap-1.5", children: feeding.map((n) => /* @__PURE__ */ _jsxs(Badge, { variant: "outline", className: "gap-1", children: [
            /* @__PURE__ */ _jsx("span", { children: n.icono }),
            n.titulo,
            /* @__PURE__ */ _jsxs("span", { className: "tabular-nums font-semibold", style: { color: statusTextColor(n.progreso ?? 0) }, children: [
              n.progreso ?? 0,
              "%"
            ] })
          ] }, n.necesidad_id)) })
        ] });
      })()
    ] })
  ] });
}
function isFeeder(needId, areaId) {
  const map = {
    moto: ["finanzas", "profesional"],
    dinero: ["finanzas", "profesional"],
    amigos: ["familia"],
    novia: ["apariencia", "amor"],
    intimidad: ["amor"],
    boxeo: ["salud", "fuerza-mental"],
    exito: ["proposito", "desarrollo"]
  };
  return (map[needId] ?? []).includes(areaId);
}
function sumSubMinutes(area) {
  let total = 0;
  const walk = (subs) => {
    for (const s of subs) {
      if (s.children && s.children.length > 0) walk(s.children);
      else total += s.minutes;
    }
  };
  walk(area.sub);
  return total;
}
export {
  MapaDetailPanel
};