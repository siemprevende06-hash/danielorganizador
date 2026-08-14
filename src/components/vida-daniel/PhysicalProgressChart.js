import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
export const PhysicalProgressChart = ({ measurements, targetWeight, startWeight }) => {
    const chartData = useMemo(() => {
        if (measurements.length === 0)
            return [];
        return [...measurements]
            .reverse()
            .slice(-30)
            .map(m => ({
            date: new Date(m.measurement_date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short'
            }),
            weight: m.weight,
            fullDate: m.measurement_date
        }));
    }, [measurements]);
    if (chartData.length === 0) {
        return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4" }), "Evoluci\u00F3n del Peso"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-32 flex items-center justify-center text-muted-foreground text-sm", children: "Agrega mediciones para ver tu progreso" }) })] }));
    }
    const minWeight = Math.min(...chartData.map(d => d.weight), startWeight) - 2;
    const maxWeight = Math.max(...chartData.map(d => d.weight), targetWeight) + 2;
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4" }), "Evoluci\u00F3n del Peso (\u00FAltimos 30 registros)"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-48", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: chartData, margin: { top: 5, right: 5, left: -20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 10 }, className: "text-muted-foreground" }), _jsx(YAxis, { domain: [minWeight, maxWeight], tick: { fontSize: 10 }, className: "text-muted-foreground" }), _jsx(Tooltip, { contentStyle: {
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }, formatter: (value) => [`${value} kg`, 'Peso'] }), _jsx(ReferenceLine, { y: targetWeight, stroke: "hsl(var(--primary))", strokeDasharray: "5 5", label: {
                                        value: `Meta: ${targetWeight}kg`,
                                        position: 'right',
                                        fontSize: 10,
                                        fill: 'hsl(var(--primary))'
                                    } }), _jsx(ReferenceLine, { y: startWeight, stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3", label: {
                                        value: `Inicio: ${startWeight}kg`,
                                        position: 'right',
                                        fontSize: 10,
                                        fill: 'hsl(var(--muted-foreground))'
                                    } }), _jsx(Line, { type: "monotone", dataKey: "weight", stroke: "hsl(var(--primary))", strokeWidth: 2, dot: { r: 3, fill: 'hsl(var(--primary))' }, activeDot: { r: 5 } })] }) }) }) })] }));
};
