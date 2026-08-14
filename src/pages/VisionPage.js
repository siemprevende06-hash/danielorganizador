import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePointBMetrics } from '@/hooks/usePointBMetrics';
import { usePuntoPartida } from '@/hooks/usePuntoPartida';
import { useSystemsTracking } from '@/hooks/useSystemsTracking';
import { POINT_B_AREAS } from '@/data/pointB2027';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Compass, Target, TrendingUp, Pencil, Check, X, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EditMetricDialog } from '@/components/vision/EditMetricDialog';
import { AreaSystemsAndGoals } from '@/components/vision/AreaSystemsAndGoals';
const GROUP_LABELS = {
    cimientos: { label: 'CIMIENTOS', icon: '🏗️', desc: 'Estructura y Hábitos' },
    construccion: { label: 'CONSTRUCCIÓN', icon: '🔨', desc: 'Trabajo duro y Enfoque' },
    recompensas: { label: 'RECOMPENSAS', icon: '🎁', desc: '' },
};
const HOMBRE_LABELS = [
    { id: 'liderazgo', label: 'Liderazgo / Dirección', icon: '👑' },
    { id: 'seguridad', label: 'Seguridad / Protección', icon: '🛡️' },
    { id: 'estatus', label: 'Estatus / Respeto', icon: '🏆' },
    { id: 'provision', label: 'Provisión / Ambición', icon: '💰' },
    { id: 'fortaleza', label: 'Fortaleza Física', icon: '💪' },
    { id: 'ie', label: 'Inteligencia Emocional', icon: '🧠' },
    { id: 'carisma', label: 'Carisma / Diversión', icon: '✨' },
    { id: 'lealtad', label: 'Lealtad / Compromiso', icon: '🤝' },
];
const HOMBRE_NOTAS = {
    liderazgo: 6, seguridad: 4, estatus: 5, provision: 5,
    fortaleza: 3, ie: 5, carisma: 8, lealtad: 5,
};
function getProgressColor(pct) {
    if (pct >= 80)
        return 'text-green-500';
    if (pct >= 40)
        return 'text-amber-500';
    return 'text-red-500';
}
function getBarColor(pct) {
    if (pct >= 80)
        return 'bg-green-500';
    if (pct >= 40)
        return 'bg-amber-500';
    return 'bg-red-500';
}
function calcProgress(current, start, target) {
    if (start === target)
        return 100;
    return Math.max(0, Math.min(100, Math.round(((current - start) / (target - start)) * 100)));
}
function getRemainingText(current, target, unit) {
    const diff = Math.abs(target - current);
    const rounded = Number.isInteger(diff) ? diff : diff.toFixed(1);
    const direction = target > current ? 'Faltan' : 'Pasaste';
    return `${direction} ${rounded}${unit}`;
}
export default function VisionPage() {
    const { entries, loading: ppLoading, updateSubScore } = usePuntoPartida();
    const { metrics, groupedByPointBArea: customMetricsByPB, loading: metricsLoading, addMetric, updateMetric, deleteMetric } = usePointBMetrics();
    const { data: sysData, loading: sysLoading, toggleCompletion, setTimeValue, setCountValue, } = useSystemsTracking();
    const [showEdit, setShowEdit] = useState(false);
    const [editingMetric, setEditingMetric] = useState(null);
    const [editingSub, setEditingSub] = useState(null);
    const [editValue, setEditValue] = useState('');
    const editRef = useRef(null);
    useEffect(() => {
        if (editingSub && editRef.current) {
            editRef.current.focus();
            editRef.current.select();
        }
    }, [editingSub]);
    const overallProgress = useCallback(() => {
        let total = 0;
        let count = 0;
        for (const area of POINT_B_AREAS) {
            for (const sub of area.sub) {
                const current = entries[area.id]?.sub_scores?.[sub.id] ?? sub.start;
                total += calcProgress(current, sub.start, sub.target);
                count++;
            }
        }
        return count > 0 ? Math.round(total / count) : 0;
    }, [entries]);
    const completedSubAxes = useCallback(() => {
        let total = 0;
        let completed = 0;
        for (const area of POINT_B_AREAS) {
            for (const sub of area.sub) {
                const current = entries[area.id]?.sub_scores?.[sub.id] ?? sub.start;
                if (calcProgress(current, sub.start, sub.target) >= 100)
                    completed++;
                total++;
            }
        }
        return { completed, total };
    }, [entries]);
    const progress = overallProgress();
    const { completed, total: totalSubAxes } = completedSubAxes();
    const getCurrent = useCallback((areaId, subId, start) => {
        return entries[areaId]?.sub_scores?.[subId] ?? start;
    }, [entries]);
    const handleStartEdit = (areaId, subId, currentValue) => {
        setEditingSub({ areaId, subId });
        setEditValue(String(currentValue));
    };
    const handleSaveEdit = async () => {
        if (!editingSub)
            return;
        const val = parseFloat(editValue);
        if (isNaN(val))
            return;
        const ok = await updateSubScore(editingSub.areaId, editingSub.subId, val);
        if (ok) {
            toast.success('Valor actualizado');
        }
        else {
            toast.error('Error al guardar');
        }
        setEditingSub(null);
    };
    const handleCancelEdit = () => {
        setEditingSub(null);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter')
            handleSaveEdit();
        if (e.key === 'Escape')
            handleCancelEdit();
    };
    const areaResultados = useCallback((area) => {
        let total = 0;
        let count = 0;
        for (const sub of area.sub) {
            const current = entries[area.id]?.sub_scores?.[sub.id] ?? sub.start;
            total += calcProgress(current, sub.start, sub.target);
            count++;
        }
        return count > 0 ? Math.round(total / count) : 0;
    }, [entries]);
    const loading = ppLoading || metricsLoading || sysLoading;
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-background flex items-center justify-center pt-24", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20 pb-24", children: [_jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2", children: [_jsx(Compass, { className: "h-6 w-6 text-primary" }), "Mi Point B 2027"] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "De Punto A \u2192 Point B \u00B7 Cada sub-eje es un tramo del camino" })] }), _jsx(Link, { to: "/systems", children: _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [_jsx(ExternalLink, { className: "h-4 w-4" }), " Ir a Sistemas"] }) })] }), _jsx(Card, { className: "border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background overflow-hidden", children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "text-center md:text-left", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Progreso Global" }), _jsxs("p", { className: "text-5xl font-bold text-primary", children: [progress, "%"] }), _jsxs(Badge, { variant: "secondary", className: "mt-2", children: [completed, "/", totalSubAxes, " sub-ejes completados"] })] }), _jsxs("div", { className: "flex flex-col justify-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-muted-foreground min-w-[100px]", children: "Resultados" }), _jsxs("span", { className: "font-bold", children: [progress, "%"] }), _jsx("div", { className: "flex-1 h-2 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn('h-full rounded-full transition-all', getBarColor(progress)), style: { width: `${progress}%` } }) })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Target, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-muted-foreground min-w-[100px]", children: "Meta" }), _jsx("span", { className: "font-bold", children: "100%" }), _jsx("div", { className: "flex-1 h-2 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-primary/30", style: { width: '100%' } }) })] })] }), _jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [_jsx("p", { className: cn('text-lg font-bold', getProgressColor(progress)), children: progress >= 80 ? '🎉 Muy cerca de tu visión' :
                                                    progress >= 50 ? '💪 Buen progreso, sigue así' :
                                                        progress >= 25 ? '📈 Avanzando paso a paso' :
                                                            '🌱 Empieza desde donde estás' }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [progress, "% del camino recorrido \u00B7 ", 100 - progress, "% por delante"] })] })] }) }) }), ['cimientos', 'construccion', 'recompensas'].map(group => {
                        const areas = POINT_B_AREAS.filter(a => a.group === group);
                        const gl = GROUP_LABELS[group];
                        return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: gl.icon }), _jsx("h2", { className: "text-base font-bold uppercase tracking-wide", children: gl.label }), gl.desc && (_jsxs("span", { className: "text-xs text-muted-foreground hidden sm:inline", children: ["\u2014 ", gl.desc] }))] }), areas.map(area => {
                                    const res = areaResultados(area);
                                    const areaMetrics = customMetricsByPB[area.id] || [];
                                    return (_jsxs(Card, { className: "overflow-hidden border-l-4", style: { borderLeftColor: res >= 80 ? '#22c55e' : res >= 40 ? '#f59e0b' : '#6b7280' }, children: [_jsxs(CardHeader, { className: "pb-0 pt-4 px-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-2xl", children: area.icon }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-base font-bold", children: area.label }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [area.sub.length, " sub-ejes \u00B7 ", res, "% completo", areaMetrics.length > 0 && ` · ${areaMetrics.length} metas`] })] })] }), _jsxs(Badge, { variant: res >= 50 ? 'default' : 'secondary', className: cn('text-xs', res >= 50 && 'bg-green-500/20 text-green-600 hover:bg-green-500/30'), children: [res, "%"] })] }), _jsx("div", { className: "mt-2 h-1.5 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn('h-full rounded-full transition-all duration-700', getBarColor(res)), style: { width: `${res}%` } }) })] }), _jsxs(CardContent, { className: "p-4 pt-3 space-y-1", children: [area.sub.map(sub => {
                                                        const current = getCurrent(area.id, sub.id, sub.start);
                                                        const pct = calcProgress(current, sub.start, sub.target);
                                                        const isEditing = editingSub?.areaId === area.id && editingSub?.subId === sub.id;
                                                        return (_jsxs("div", { className: "group flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors", children: [_jsx("div", { className: cn('w-2 h-2 rounded-full shrink-0', pct >= 100 ? 'bg-green-500' :
                                                                        pct >= 50 ? 'bg-amber-500' :
                                                                            'bg-muted-foreground/30') }), _jsx("span", { className: "text-sm min-w-[130px] sm:min-w-[160px] text-foreground/80", children: sub.label }), _jsxs("div", { className: "flex items-center gap-1.5 text-sm min-w-[140px]", children: [_jsx("span", { className: "text-muted-foreground text-xs", children: sub.start }), _jsx(ChevronRight, { className: "h-3 w-3 text-muted-foreground/50" }), isEditing ? (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Input, { ref: editRef, value: editValue, onChange: e => setEditValue(e.target.value), onKeyDown: handleKeyDown, type: "number", step: "any", className: "h-7 w-16 text-xs px-1.5" }), _jsx("button", { onClick: handleSaveEdit, className: "h-5 w-5 flex items-center justify-center text-green-500 hover:bg-green-500/10 rounded", children: _jsx(Check, { className: "h-3.5 w-3.5" }) }), _jsx("button", { onClick: handleCancelEdit, className: "h-5 w-5 flex items-center justify-center text-muted-foreground hover:bg-muted rounded", children: _jsx(X, { className: "h-3.5 w-3.5" }) })] })) : (_jsx("button", { onClick: () => handleStartEdit(area.id, sub.id, current), className: "font-semibold text-foreground hover:text-primary transition-colors cursor-pointer", children: current })), _jsx(ChevronRight, { className: "h-3 w-3 text-muted-foreground/50" }), _jsx("span", { className: "font-bold text-primary", children: sub.target }), _jsx("span", { className: "text-xs text-muted-foreground", children: sub.unit })] }), _jsx("div", { className: "flex-1 min-w-[60px]", children: _jsx("div", { className: "h-2 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn('h-full rounded-full transition-all duration-700', getBarColor(pct)), style: { width: `${pct}%` } }) }) }), _jsxs("div", { className: "flex items-center gap-2 min-w-[80px] justify-end", children: [_jsxs("span", { className: cn('text-sm font-bold', getProgressColor(pct)), children: [pct, "%"] }), _jsx("span", { className: "text-xs text-muted-foreground hidden sm:inline", children: getRemainingText(current, sub.target, sub.unit) })] }), !isEditing && (_jsx("button", { onClick: () => handleStartEdit(area.id, sub.id, current), className: "h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground", children: _jsx(Pencil, { className: "h-3 w-3" }) }))] }, sub.id));
                                                    }), _jsx(AreaSystemsAndGoals, { pbAreaId: area.id, areaName: area.label, areaIcon: area.icon, completions: sysData.completions, timeData: sysData.timeData, countData: sysData.countData, metrics: areaMetrics, onToggleCompletion: toggleCompletion, onSetTimeValue: setTimeValue, onSetCountValue: setCountValue, onAddMetric: () => { setEditingMetric(null); setShowEdit(true); }, onEditMetric: (m) => { setEditingMetric(m); setShowEdit(true); }, onDeleteMetric: async (id) => {
                                                            await deleteMetric(id);
                                                            toast.success('Meta eliminada');
                                                        } })] })] }, area.id));
                                })] }, group));
                    }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Target, { className: "h-5 w-5 text-primary" }), _jsx("h2", { className: "text-base font-bold uppercase tracking-wide", children: "Hombre Top" }), _jsx("span", { className: "text-xs text-muted-foreground", children: "\u2014 8 dimensiones derivadas" })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: HOMBRE_LABELS.map(h => {
                                    const nota = HOMBRE_NOTAS[h.id] ?? 5;
                                    const pct = Math.round((nota / 10) * 100);
                                    return (_jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: h.icon }), _jsx("span", { className: "text-xs font-bold leading-tight", children: h.label })] }), _jsxs("span", { className: cn('text-lg font-black', getProgressColor(pct)), children: [nota, "/10"] })] }), _jsx("div", { className: "h-1.5 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn('h-full rounded-full transition-all', getBarColor(pct)), style: { width: `${pct}%` } }) }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1 text-right", children: [pct, "%"] })] }, h.id));
                                }) })] })] }), _jsx(EditMetricDialog, { open: showEdit, onOpenChange: setShowEdit, metric: editingMetric, onSave: async (data) => {
                    if (editingMetric) {
                        await updateMetric(editingMetric.id, data);
                        toast.success('Métrica actualizada');
                    }
                    else {
                        await addMetric(data);
                        toast.success('Métrica añadida');
                    }
                } })] }));
}
