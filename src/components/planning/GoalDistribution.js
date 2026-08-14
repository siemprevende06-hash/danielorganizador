import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export function GoalDistribution({ label, icon, total, distribution, onChange, monthLabels }) {
    const months = [
        { key: 'month1', value: distribution.month1 },
        { key: 'month2', value: distribution.month2 },
        { key: 'month3', value: distribution.month3 },
    ];
    const updateMonth = (idx, newVal) => {
        const keys = ['month1', 'month2', 'month3'];
        const old = distribution[keys[idx]];
        const diff = newVal - old;
        if (total <= 0)
            return;
        let updated = { ...distribution, [keys[idx]]: Math.max(0, newVal) };
        const used = updated.month1 + updated.month2 + updated.month3;
        const remaining = total - used;
        if (remaining !== 0 && idx < 2) {
            const nextIdx = idx + 1;
            updated = { ...updated, [keys[nextIdx]]: Math.max(0, updated[keys[nextIdx]] + remaining) };
        }
        onChange(updated);
    };
    if (total <= 0)
        return null;
    return (_jsxs("div", { className: "space-y-2 pl-9", children: [_jsxs("p", { className: "text-xs font-medium text-muted-foreground flex items-center gap-1.5", children: [icon, "Distribuci\u251C\u2502n: ", total, " ", label] }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: months.map((m, i) => (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] text-muted-foreground", children: monthLabels[i] }), _jsx("span", { className: "text-xs font-semibold", children: m.value })] }), _jsx("input", { type: "range", min: 0, max: total, value: m.value, onChange: e => updateMonth(i, parseInt(e.target.value)), className: "w-full h-1.5 rounded-full appearance-none bg-muted accent-indigo-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500" })] }, m.key))) })] }));
}
