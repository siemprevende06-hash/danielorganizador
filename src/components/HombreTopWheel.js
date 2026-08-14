import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const DEFAULT_LABELS = [
    "LIDERAZGO\nDIRECCIÓN",
    "SEGURIDAD\nPROTECCIÓN",
    "ESTATUS\nRESPETO",
    "PROVISIÓN\nAMBICIÓN",
    "FORTALEZA\nPRESENCIA",
    "INTELIGENCIA\nEMOCIONAL",
    "CARISMA\nDIVERSIÓN",
    "LEALTAD\nCOMPROMISO",
];
const DEFAULT_VALUES = [7, 7, 7, 7, 7, 7, 7, 7];
function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
export function HombreTopWheel({ values = DEFAULT_VALUES, values2, labels = DEFAULT_LABELS, average: avgProp, average2: avg2Prop, view = "ambos", loading, }) {
    const cx = 200;
    const cy = 200;
    const maxR = 155;
    const levels = [0.25, 0.5, 0.75, 1];
    const n = values.length;
    const angleStep = 360 / n;
    const showEsfuerzo = view === "esfuerzo" || view === "ambos";
    const showResultados = view === "resultados" || view === "ambos";
    const displayAvg = avgProp !== undefined
        ? avgProp
        : Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const displayAvg2 = avg2Prop !== undefined
        ? avg2Prop
        : values2 ? Math.round(values2.reduce((a, b) => a + b, 0) / values2.length) : displayAvg;
    if (loading) {
        return (_jsx("div", { className: "flex flex-col items-center justify-center py-12 text-muted-foreground", children: _jsx("div", { className: "animate-pulse text-sm", children: "Cargando datos..." }) }));
    }
    const gridPolygons = levels.map((level) => {
        const r = maxR * level;
        const points = Array.from({ length: n }, (_, i) => {
            const p = polarToCartesian(cx, cy, r, i * angleStep);
            return `${p.x},${p.y}`;
        }).join(" ");
        return points;
    });
    const axes = Array.from({ length: n }, (_, i) => {
        const p = polarToCartesian(cx, cy, maxR, i * angleStep);
        return { x1: cx, y1: cy, x2: p.x, y2: p.y };
    });
    const esfuerzoPoints = values.map((val, i) => {
        const r = (Math.min(val, 10) / 10) * maxR;
        return polarToCartesian(cx, cy, r, i * angleStep);
    });
    const esfuerzoPolygon = esfuerzoPoints.map((p) => `${p.x},${p.y}`).join(" ");
    const resultadoPoints = values2
        ? values2.map((val, i) => {
            const r = (Math.min(val, 10) / 10) * maxR;
            return polarToCartesian(cx, cy, r, i * angleStep);
        })
        : [];
    const resultadoPolygon = resultadoPoints.length > 0
        ? resultadoPoints.map((p) => `${p.x},${p.y}`).join(" ")
        : "";
    const labelPositions = values.map((_, i) => {
        const p = polarToCartesian(cx, cy, maxR + 36, i * angleStep);
        const lines = (labels[i] || "").split("\n");
        return { x: p.x, y: p.y, lines };
    });
    return (_jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("svg", { viewBox: "0 0 400 450", className: "w-full max-w-md h-auto", children: [gridPolygons.map((points, i) => (_jsx("polygon", { points: points, fill: "none", stroke: "hsl(var(--border))", strokeWidth: 1, opacity: 0.5 }, `grid-${i}`))), axes.map((ax, i) => (_jsx("line", { ...ax, stroke: "hsl(var(--border))", strokeWidth: 1, opacity: 0.4 }, `axis-${i}`))), showResultados && resultadoPolygon && (_jsxs(_Fragment, { children: [_jsx("polygon", { points: resultadoPolygon, fill: "hsl(35, 85%, 55%)", fillOpacity: 0.12, stroke: "hsl(35, 85%, 55%)", strokeWidth: 2, strokeDasharray: "4 3" }), resultadoPoints.map((p, i) => (_jsx("circle", { cx: p.x, cy: p.y, r: 3.5, fill: "hsl(35, 85%, 55%)" }, `rdot-${i}`)))] })), showEsfuerzo && (_jsxs(_Fragment, { children: [_jsx("polygon", { points: esfuerzoPolygon, fill: "hsl(var(--primary))", fillOpacity: 0.15, stroke: "hsl(var(--primary))", strokeWidth: 2 }), esfuerzoPoints.map((p, i) => (_jsx("circle", { cx: p.x, cy: p.y, r: 4, fill: "hsl(var(--primary))" }, `edot-${i}`)))] })), _jsx("circle", { cx: cx, cy: cy, r: 32, fill: "hsl(var(--card))", stroke: "hsl(var(--border))", strokeWidth: 1 }), view === "ambos" && (_jsxs(_Fragment, { children: [_jsx("text", { x: cx, y: cy - 10, textAnchor: "middle", className: "fill-muted-foreground", fontSize: 8, fontWeight: 600, children: "ESFUERZO" }), _jsx("text", { x: cx, y: cy + 2, textAnchor: "middle", className: "fill-foreground", fontSize: 14, fontWeight: 800, children: displayAvg }), _jsx("text", { x: cx, y: cy + 16, textAnchor: "middle", className: "fill-muted-foreground", fontSize: 7, fontWeight: 600, children: "RESULTADOS" }), _jsx("text", { x: cx, y: cy + 26, textAnchor: "middle", fill: "hsl(35, 85%, 55%)", fontSize: 12, fontWeight: 800, children: displayAvg2 })] })), view === "esfuerzo" && (_jsxs(_Fragment, { children: [_jsx("text", { x: cx, y: cy - 5, textAnchor: "middle", className: "fill-foreground", fontSize: 11, fontWeight: 600, children: "PROMEDIO" }), _jsx("text", { x: cx, y: cy + 14, textAnchor: "middle", className: "fill-foreground", fontSize: 20, fontWeight: 800, children: displayAvg })] })), view === "resultados" && (_jsxs(_Fragment, { children: [_jsx("text", { x: cx, y: cy - 5, textAnchor: "middle", className: "fill-foreground", fontSize: 11, fontWeight: 600, children: "PROMEDIO" }), _jsx("text", { x: cx, y: cy + 14, textAnchor: "middle", fill: "hsl(35, 85%, 55%)", fontSize: 20, fontWeight: 800, children: displayAvg2 })] })), labelPositions.map((pos, i) => (_jsx("text", { x: pos.x, y: pos.y, textAnchor: "middle", dominantBaseline: "middle", className: "fill-muted-foreground", fontSize: 8, fontWeight: 600, style: { textTransform: "uppercase", letterSpacing: "0.3px" }, children: pos.lines.map((line, li) => (_jsx("tspan", { x: pos.x, dy: li === 0 ? 0 : 11, children: line }, li))) }, `label-${i}`)))] }), view === "ambos" && (_jsxs("div", { className: "flex items-center gap-4 text-xs text-muted-foreground mb-2", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-3 h-0.5 bg-primary inline-block" }), _jsx("span", { children: "Esfuerzo" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-3 h-0.5 inline-block", style: { backgroundColor: "hsl(35, 85%, 55%)" } }), _jsx("span", { children: "Resultados" })] })] })), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 mt-1 text-xs", children: labels.map((label, i) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-primary" }), _jsx("span", { className: "text-muted-foreground truncate", children: label.replace(/\n/g, " ") }), _jsxs("span", { className: "font-bold text-foreground", children: [showEsfuerzo ? values[i] : "", view === "ambos" && _jsx("span", { className: "text-muted-foreground font-normal", children: " / " }), showResultados && values2 ? (_jsx("span", { style: { color: "hsl(35, 85%, 55%)" }, children: values2[i] })) : "", "/10"] })] }, i))) })] }));
}
