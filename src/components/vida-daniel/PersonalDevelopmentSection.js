import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, Music, BookOpen, Languages, CheckCircle2, XCircle, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
const getIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('guitarra') || lowerName.includes('piano'))
        return Music;
    if (lowerName.includes('lectura') || lowerName.includes('libro'))
        return BookOpen;
    if (lowerName.includes('italiano') || lowerName.includes('inglés') || lowerName.includes('idioma'))
        return Languages;
    return Brain;
};
// Mock data for trend chart
const generateTrendData = () => {
    const data = [];
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toLocaleDateString('es', { day: '2-digit', month: 'short' }),
            piano: Math.floor(Math.random() * 3) + 3,
            guitarra: Math.floor(Math.random() * 2) + 1,
            lectura: Math.floor(Math.random() * 2) + 2,
            idiomas: Math.floor(Math.random() * 2) + 1,
        });
    }
    return data;
};
export const PersonalDevelopmentSection = ({ stats }) => {
    const trendData = generateTrendData();
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "bg-gradient-to-r from-green-500/10 to-teal-500/10", children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Brain, { className: "h-5 w-5 text-green-500" }), "Desarrollo Personal"] }) }), _jsxs(CardContent, { className: "pt-6", children: [_jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8", children: stats.personalDevelopment.map((skill, index) => {
                            const Icon = getIcon(skill.name);
                            return (_jsxs("div", { className: "p-4 rounded-lg border bg-card text-center", children: [_jsx(Icon, { className: "h-6 w-6 mx-auto mb-2 text-primary" }), _jsx("h4", { className: "font-medium text-sm mb-2", children: skill.name }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "General" }), _jsxs("p", { className: "text-lg font-bold", children: [skill.generalScore, "/10"] })] }), _jsxs("div", { className: "flex items-center justify-center gap-1", children: [skill.completedToday ? (_jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" })) : (_jsx(XCircle, { className: "h-4 w-4 text-red-500" })), _jsx("span", { className: "text-xs", children: "Hoy" })] }), skill.streak > 0 && (_jsxs("div", { className: "flex items-center justify-center gap-1 text-orange-500", children: [_jsx(Flame, { className: "h-3 w-3" }), _jsx("span", { className: "text-xs font-medium", children: skill.streak })] })), _jsx(Progress, { value: skill.progress, className: "h-1" }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [skill.progress, "%"] })] })] }, index));
                        }) }), _jsxs("div", { className: "pt-6 border-t", children: [_jsx("h4", { className: "font-medium mb-4", children: "\uD83D\uDCCA Tendencia (\u00FAltimos 30 d\u00EDas)" }), _jsx("div", { className: "h-64", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: trendData, children: [_jsx(XAxis, { dataKey: "date", tick: { fontSize: 10 }, interval: "preserveStartEnd" }), _jsx(YAxis, { domain: [0, 10], tick: { fontSize: 10 } }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "piano", stroke: "hsl(var(--primary))", strokeWidth: 2, dot: false, name: "Piano" }), _jsx(Line, { type: "monotone", dataKey: "guitarra", stroke: "#f97316", strokeWidth: 2, dot: false, name: "Guitarra" }), _jsx(Line, { type: "monotone", dataKey: "lectura", stroke: "#22c55e", strokeWidth: 2, dot: false, name: "Lectura" }), _jsx(Line, { type: "monotone", dataKey: "idiomas", stroke: "#a855f7", strokeWidth: 2, dot: false, name: "Idiomas" })] }) }) })] })] })] }));
};
