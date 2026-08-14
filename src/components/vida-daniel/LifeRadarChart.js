import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { Radar as RadarIcon } from 'lucide-react';
export const LifeRadarChart = ({ stats }) => {
    // Calculate scores for each life area
    const habitScore = stats.habits.length > 0
        ? Math.round(stats.habits.reduce((acc, h) => acc + h.monthlyCompletion, 0) / stats.habits.length / 10)
        : 5;
    const entScore = stats.entrepreneurship.length > 0
        ? Math.round(stats.entrepreneurship.reduce((acc, e) => acc + e.generalScore, 0) / stats.entrepreneurship.length)
        : 5;
    const devScore = stats.personalDevelopment.length > 0
        ? Math.round(stats.personalDevelopment.reduce((acc, p) => acc + p.generalScore, 0) / stats.personalDevelopment.length)
        : 5;
    const routineScore = Math.round(((stats.routines.activation.monthlyCompletion + stats.routines.deactivation.monthlyCompletion) / 2) / 10);
    const data = [
        { area: 'Universidad', value: stats.university.generalScore, fullMark: 10 },
        { area: 'Emprendimiento', value: entScore, fullMark: 10 },
        { area: 'Hábitos', value: habitScore, fullMark: 10 },
        { area: 'Desarrollo Personal', value: devScore, fullMark: 10 },
        { area: 'Apariencia', value: stats.appearance.generalScore, fullMark: 10 },
        { area: 'Rutinas', value: routineScore, fullMark: 10 },
        { area: 'Proyectos', value: stats.projects.generalScore, fullMark: 10 },
    ];
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(RadarIcon, { className: "h-5 w-5 text-primary" }), "Mapa de Vida"] }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(RadarChart, { data: data, cx: "50%", cy: "50%", outerRadius: "80%", children: [_jsx(PolarGrid, { stroke: "hsl(var(--muted-foreground))", strokeOpacity: 0.3 }), _jsx(PolarAngleAxis, { dataKey: "area", tick: { fontSize: 11, fill: 'hsl(var(--foreground))' } }), _jsx(PolarRadiusAxis, { domain: [0, 10], tick: { fontSize: 10 }, tickCount: 6 }), _jsx(Radar, { name: "Puntuaci\u00F3n Actual", dataKey: "value", stroke: "hsl(var(--primary))", fill: "hsl(var(--primary))", fillOpacity: 0.4, strokeWidth: 2 }), _jsx(Legend, {})] }) }) }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t", children: data.map((item, index) => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded-lg bg-muted/50", children: [_jsx("span", { className: "text-sm truncate", children: item.area }), _jsxs("span", { className: `text-sm font-bold ${item.value >= 7 ? 'text-green-500' :
                                        item.value >= 5 ? 'text-yellow-500' : 'text-red-500'}`, children: [item.value, "/10"] })] }, index))) })] })] }));
};
