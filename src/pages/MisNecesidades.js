import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useNecesidades } from '@/hooks/useNecesidades';
import { useNavigate } from 'react-router-dom';
import { Flame, TrendingUp, Target, Sparkles } from 'lucide-react';
const AREA_LINKS = {
    goals: '/goals',
    finance: '/finance',
    'vida-social': '/vida-social',
    boxeo: '/boxeo',
    vision: '/life-alignment',
};
const NEED_EMOJIS = {
    moto: '🏍️',
    dinero: '💰',
    novia: '❤️',
    amigos: '🎉',
    intimidad: '🔞',
    boxeo: '🥊',
    exito: '🧭',
};
export default function MisNecesidades() {
    const { necesidades, loading, actualizarProgreso, getProgresoGeneral } = useNecesidades();
    const navigate = useNavigate();
    if (loading) {
        return (_jsx("div", { className: "container mx-auto px-4 py-24", children: _jsxs("div", { className: "animate-pulse space-y-4", children: [_jsx("div", { className: "h-8 bg-muted rounded w-1/3" }), _jsx("div", { className: "h-64 bg-muted rounded" })] }) }));
    }
    const progresoGeneral = getProgresoGeneral();
    const getColorByProgreso = (p) => {
        if (p >= 80)
            return 'bg-green-500';
        if (p >= 50)
            return 'bg-amber-500';
        if (p >= 20)
            return 'bg-orange-500';
        return 'bg-red-500';
    };
    const getStatusText = (p) => {
        if (p >= 80)
            return '✅ Satisfecha';
        if (p >= 50)
            return '🔄 En camino';
        if (p >= 20)
            return '⚠️ Insuficiente';
        return '❌ Insatisfecha';
    };
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-6", children: [_jsxs("header", { className: "text-center", children: [_jsxs("h1", { className: "text-3xl font-bold flex items-center justify-center gap-2", children: [_jsx(Flame, { className: "h-8 w-8 text-orange-500" }), "Mis 7 Necesidades"] }), _jsx("p", { className: "text-muted-foreground mt-1", children: "De necesidad insatisfecha a realidad vivida" })] }), _jsx(Card, { className: "bg-gradient-to-r from-primary/10 to-background border-primary/20", children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("h2", { className: "text-lg font-semibold flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-5 w-5" }), "Progreso General"] }), _jsxs(Badge, { variant: "outline", className: "text-base px-3 py-1", children: [progresoGeneral, "%"] })] }), _jsx(Progress, { value: progresoGeneral, className: "h-4" }), _jsx("p", { className: "text-xs text-muted-foreground mt-2", children: progresoGeneral >= 80 ? '🔥 Viviendo tu mejor vida' :
                                progresoGeneral >= 50 ? '💪 Buen progreso, sigue así' :
                                    progresoGeneral >= 20 ? '🚀 Tiempo de acelerar' :
                                        '🎯 Empieza hoy, un paso a la vez' })] }) }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: necesidades.map(n => (_jsx(Card, { className: `overflow-hidden border-l-4 ${getColorByProgreso(n.progreso).replace('bg-', 'border-l-')}`, children: _jsxs(CardContent, { className: "p-5", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-3xl", children: NEED_EMOJIS[n.necesidad_id] || n.icono }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-lg", children: n.titulo }), _jsx("p", { className: "text-xs text-muted-foreground", children: n.descripcion })] })] }), _jsx(Badge, { variant: "secondary", className: "text-xs", children: getStatusText(n.progreso) })] }), _jsx(Progress, { value: n.progreso, className: "h-3 mb-2" }), _jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsxs("span", { className: "text-sm font-semibold", children: [n.progreso, "%"] }), _jsx("div", { className: "flex gap-1", children: [25, 50, 75, 100].map(marker => (_jsxs("button", { onClick: () => actualizarProgreso(n.necesidad_id, marker), className: `text-xs px-2 py-0.5 rounded ${n.progreso >= marker
                                                ? 'bg-primary/20 text-primary'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'}`, children: [marker, "%"] }, marker))) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "number", min: 0, max: 100, value: n.progreso, onChange: e => actualizarProgreso(n.necesidad_id, +e.target.value), className: "h-8 w-20 text-sm" }), AREA_LINKS[n.area_referencia] && (_jsxs(Button, { variant: "outline", size: "sm", className: "h-8 text-xs", onClick: () => navigate(AREA_LINKS[n.area_referencia]), children: [_jsx(Target, { className: "h-3 w-3 mr-1" }), "Ir a ", n.area_referencia === 'goals' ? 'Metas' :
                                                n.area_referencia === 'finance' ? 'Finanzas' :
                                                    n.area_referencia === 'vida-social' ? 'Vida Social' :
                                                        n.area_referencia === 'boxeo' ? 'Boxeo' :
                                                            n.area_referencia === 'vision' ? 'Alineación' : n.area_referencia] }))] })] }) }, n.necesidad_id))) }), _jsx(Card, { className: "border-dashed", children: _jsxs(CardContent, { className: "py-6 text-center", children: [_jsx(Sparkles, { className: "h-8 w-8 mx-auto text-muted-foreground mb-2" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Cada necesidad tiene su propia p\u00E1gina. Usa los botones \"Ir a...\" para trabajar en cada una. Actualiza el progreso manualmente aqu\u00ED o d\u00E9jalo reflejar autom\u00E1ticamente." })] }) })] }));
}
