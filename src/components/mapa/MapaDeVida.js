import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import "./mapa.css";
const CYAN = "#22d3ee";
const EMERALD = "#34d399";
const BLUE = "#38bdf8";
const ROSE = "#f87171";
const AMBER = "#fbbf24";
const ORANGE = "#fb923c";
const PURPLE = "#a78bfa";
const GOLD = "#f59e0b";
const SLATE = "#64748b";
const PULSE = "#7dd3fc";
function glowOpacity(score) {
    if (score >= 70)
        return 1;
    if (score >= 40)
        return 0.55;
    if (score >= 20)
        return 0.25;
    return 0.07;
}
function clampBar(score) {
    return Math.max(0, Math.min(1, (Number.isFinite(score) ? score : 0) / 100));
}
function statusColor(progress) {
    if (progress >= 80)
        return EMERALD;
    if (progress >= 50)
        return AMBER;
    if (progress >= 20)
        return ORANGE;
    return ROSE;
}
function ringColor(kind, score) {
    if (kind === "hub")
        return PURPLE;
    if (kind === "pilar")
        return GOLD;
    if (kind === "deseo")
        return statusColor(score);
    if (score >= 70)
        return CYAN;
    if (score >= 40)
        return BLUE;
    return SLATE;
}
function computeRoute(node, edges) {
    const ids = new Set();
    if (!node)
        return ids;
    if (node.kind === "hub") {
        edges.forEach((e) => ids.add(e.id));
        return ids;
    }
    if (node.kind === "area") {
        edges.forEach((e) => {
            if (e.to === node.id || e.from === node.id)
                ids.add(e.id);
        });
        return ids;
    }
    const feeding = new Set();
    edges.forEach((e) => {
        if (e.to === node.id) {
            ids.add(e.id);
            feeding.add(e.from);
        }
    });
    edges.forEach((e) => {
        if (e.from === node.id)
            ids.add(e.id);
    });
    edges.forEach((e) => {
        if (e.from === "esfuerzo-hub" && feeding.has(e.to))
            ids.add(e.id);
    });
    return ids;
}
function computePilarRoute(node, edges) {
    const ids = new Set();
    const feeding = new Set();
    edges.forEach((e) => {
        if (e.to === node.id) {
            ids.add(e.id);
            feeding.add(e.from);
        }
    });
    const baseAreas = new Set();
    edges.forEach((e) => {
        if (feeding.has(e.to)) {
            ids.add(e.id);
            baseAreas.add(e.from);
        }
    });
    edges.forEach((e) => {
        if (e.from === "esfuerzo-hub" && baseAreas.has(e.to))
            ids.add(e.id);
    });
    return ids;
}
export function MapaDeVida({ nodes, edges, selected, onSelect, }) {
    const [hover, setHover] = useState(null);
    const activeNodeId = hover ?? selected?.id ?? null;
    const activeNode = useMemo(() => nodes.find((n) => n.id === activeNodeId) ?? null, [nodes, activeNodeId]);
    const route = useMemo(() => {
        if (!activeNode)
            return new Set();
        if (activeNode.kind === "pilar")
            return computePilarRoute(activeNode, edges);
        return computeRoute(activeNode, edges);
    }, [activeNode, edges]);
    return (_jsx("div", { className: "mapa-canvas border border-border/60 relative overflow-hidden", children: _jsxs("svg", { viewBox: "0 0 1200 840", className: "w-full h-auto select-none", onClick: () => {
                setHover(null);
                onSelect(null);
            }, children: [_jsx("defs", { children: _jsxs("radialGradient", { id: "mapa-node-grad", cx: "0.35", cy: "0.3", r: "1", children: [_jsx("stop", { offset: "0%", stopColor: "hsl(var(--card))" }), _jsx("stop", { offset: "100%", stopColor: "hsl(var(--muted))" })] }) }), edges.map((e) => {
                    const inRoute = !activeNodeId || route.has(e.id);
                    const opacity = inRoute ? 1 : 0.06;
                    return (_jsxs("g", { className: "mapa-edge", opacity: opacity, children: [_jsx("path", { d: e.path, fill: "none", stroke: "transparent", strokeWidth: 16, strokeLinecap: "round", onPointerEnter: () => setHover(e.to), onPointerLeave: () => setHover((h) => (h === e.to ? null : h)) }), _jsx("path", { d: e.path, fill: "none", stroke: CYAN, strokeWidth: 9, strokeLinecap: "round", strokeOpacity: glowOpacity(e.esfuerzo) * 0.35 }), _jsx("path", { d: e.path, fill: "none", stroke: CYAN, strokeWidth: 4, strokeLinecap: "round", strokeOpacity: glowOpacity(e.esfuerzo) }), _jsx("path", { d: e.path, fill: "none", stroke: EMERALD, strokeWidth: 1.6, strokeLinecap: "round", strokeOpacity: glowOpacity(e.resultados) }), selected && inRoute && (_jsx("path", { d: e.path, className: "mapa-pulse", pathLength: 100, fill: "none", stroke: PULSE, strokeWidth: 2.4, strokeOpacity: 0.85, strokeLinecap: "round" }))] }, e.id));
                }), nodes.map((node) => {
                    const inRoute = !activeNodeId || route.has(node.id);
                    const isHover = hover === node.id;
                    const isSelected = selected?.id === node.id;
                    const ring = ringColor(node.kind, node.score);
                    return (_jsxs("g", { className: "mapa-node", opacity: inRoute ? 1 : 0.15, onClick: (ev) => {
                            ev.stopPropagation();
                            onSelect(isSelected ? null : node);
                            setHover(null);
                        }, onPointerEnter: () => setHover(node.id), onPointerLeave: () => setHover(null), children: [node.kind === "hub" && !activeNodeId && (_jsxs(_Fragment, { children: [_jsx("circle", { cx: node.x, cy: node.y, r: node.r, fill: "none", stroke: PURPLE, strokeWidth: 1.5, className: "mapa-ping" }), _jsx("circle", { cx: node.x, cy: node.y, r: node.r, fill: "none", stroke: PURPLE, strokeWidth: 1.5, className: "mapa-ping mapa-ping-alt" })] })), isSelected && (_jsx("circle", { cx: node.x, cy: node.y, r: node.r + 7, fill: "none", stroke: ring, strokeWidth: 2.5, className: "mapa-selected-ring" })), isHover && !isSelected && (_jsx("circle", { cx: node.x, cy: node.y, r: node.r + 6, fill: "none", stroke: ring, strokeWidth: 2, strokeOpacity: 0.7 })), _jsx("circle", { cx: node.x, cy: node.y, r: node.r, fill: "url(#mapa-node-grad)", stroke: ring, strokeWidth: isSelected ? 3.5 : 2, style: { filter: `drop-shadow(0 0 ${8 + glowOpacity(node.score) * 10}px ${ring}55)` } }), node.kind === "hub" && (_jsx("circle", { cx: node.x, cy: node.y, r: node.r - 12, fill: "none", stroke: PURPLE, strokeWidth: 1, strokeDasharray: "4 8", strokeOpacity: 0.6 })), _jsx("text", { x: node.x, y: node.y, textAnchor: "middle", dominantBaseline: "central", fontSize: node.kind === "deseo" ? 30 : node.kind === "pilar" ? 28 : node.kind === "area" ? 27 : 34, children: node.icon }), _jsx("text", { x: node.x, y: node.y + node.r + 16, textAnchor: "middle", fontSize: node.kind === "area" ? 12 : 13, fontWeight: 600, className: "mapa-text", children: node.label }), node.kind === "deseo" ? (_jsxs("text", { x: node.x, y: node.y + node.r + 30, textAnchor: "middle", fontSize: 11, fontWeight: 700, fill: statusColor(node.score), children: [node.score, "%"] })) : node.kind === "pilar" ? null : (_jsxs(_Fragment, { children: [_jsx("rect", { x: node.x - 28, y: node.y + node.r + 24, width: 56, height: 4, rx: 2, fill: "hsl(var(--border))" }), _jsx("rect", { x: node.x - 28, y: node.y + node.r + 24, width: 56 * clampBar(node.score), height: 4, rx: 2, fill: CYAN }), _jsx("rect", { x: node.x - 28, y: node.y + node.r + 32, width: 56, height: 4, rx: 2, fill: "hsl(var(--border))" }), _jsx("rect", { x: node.x - 28, y: node.y + node.r + 32, width: 56 * clampBar(node.score2), height: 4, rx: 2, fill: EMERALD })] }))] }, node.id));
                })] }) }));
}
