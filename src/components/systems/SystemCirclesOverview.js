import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const AREA_COLORS = {
    universidad: "#a855f7",
    emprendimiento: "#f59e0b",
    proyectos: "#06b6d4",
    idiomas: "#22c55e",
};
function CircleIndicator({ label, percent, icon, color }) {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return (_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsxs("div", { className: "relative w-16 h-16", children: [_jsxs("svg", { className: "w-16 h-16 -rotate-90", viewBox: "0 0 72 72", children: [_jsx("circle", { cx: "36", cy: "36", r: radius, fill: "none", stroke: "hsl(var(--muted))", strokeWidth: "5" }), _jsx("circle", { cx: "36", cy: "36", r: radius, fill: "none", stroke: color, strokeWidth: "5", strokeDasharray: circumference, strokeDashoffset: offset, strokeLinecap: "round", className: "transition-all duration-500" })] }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center text-lg", children: icon })] }), _jsx("span", { className: "text-[10px] text-muted-foreground text-center leading-tight max-w-16", children: label }), _jsxs("span", { className: "text-xs font-bold", children: [Math.round(percent), "%"] })] }));
}
function WorkBlocksCircle({ workAssignments, blockCompletions }) {
    const blocks = Object.entries(workAssignments).filter(([, v]) => v);
    const totalBlocks = 7;
    const completedBlocks = Object.values(blockCompletions).filter(Boolean).length;
    // Build segments
    const segments = [];
    for (let i = 1; i <= totalBlocks; i++) {
        const area = workAssignments[`work-${i}`] || "";
        segments.push({ color: AREA_COLORS[area] || "hsl(var(--muted))", area });
    }
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const segmentLength = circumference / totalBlocks;
    return (_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsxs("div", { className: "relative w-16 h-16", children: [_jsxs("svg", { className: "w-16 h-16 -rotate-90", viewBox: "0 0 72 72", children: [_jsx("circle", { cx: "36", cy: "36", r: radius, fill: "none", stroke: "hsl(var(--muted))", strokeWidth: "5" }), segments.map((seg, i) => (_jsx("circle", { cx: "36", cy: "36", r: radius, fill: "none", stroke: seg.color, strokeWidth: "5", strokeDasharray: `${segmentLength - 2} ${circumference - segmentLength + 2}`, strokeDashoffset: -(i * segmentLength), strokeLinecap: "round", className: "transition-all duration-300" }, i)))] }), _jsxs("div", { className: "absolute inset-0 flex items-center justify-center text-sm font-bold", children: [completedBlocks, "/", totalBlocks] })] }), _jsx("span", { className: "text-[10px] text-muted-foreground text-center leading-tight max-w-16", children: "Bloques" }), _jsxs("span", { className: "text-xs font-bold", children: [Math.round((completedBlocks / totalBlocks) * 100), "%"] })] }));
}
const GROUP_ICONS = {
    estructural: "🏗️",
    fisica: "💪",
    hobbys: "📚",
    apariencia: "✨",
    alimentacion: "🍽️",
};
const GROUP_COLORS = {
    estructural: "#3b82f6",
    fisica: "#f97316",
    hobbys: "#a855f7",
    apariencia: "#ec4899",
    alimentacion: "#f59e0b",
};
export function SystemCirclesOverview({ groups, completions, workAssignments, blockCompletions }) {
    return (_jsxs("div", { className: "flex items-start justify-center gap-3 flex-wrap px-2", children: [groups.map(group => {
                const completed = group.habits.filter(h => completions[h.id]).length;
                const percent = group.habits.length > 0 ? (completed / group.habits.length) * 100 : 0;
                return (_jsx(CircleIndicator, { label: group.name, percent: percent, icon: GROUP_ICONS[group.id] || "📊", color: GROUP_COLORS[group.id] || "#3b82f6" }, group.id));
            }), _jsx(WorkBlocksCircle, { workAssignments: workAssignments, blockCompletions: blockCompletions })] }));
}
