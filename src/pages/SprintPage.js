import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useSprints } from '@/hooks/useSprints';
import { usePointBMetrics } from '@/hooks/usePointBMetrics';
import { useSystemsTracking } from '@/hooks/useSystemsTracking';
import { SprintHeader } from '@/components/sprint/SprintHeader';
import { FocoObjectiveCard } from '@/components/sprint/FocoObjectiveCard';
import { MejoraObjectiveCard } from '@/components/sprint/MejoraObjectiveCard';
import { CreateSprintDialog } from '@/components/sprint/CreateSprintDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, TrendingUp, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
const AREAS_FOCO = [
    { id: 'universidad', label: 'Universidad' },
    { id: 'emprendimiento', label: 'Emprendimiento' },
    { id: 'proyectos', label: 'Proyectos' },
];
const AREAS_MEJORA = [
    { id: 'gym', label: 'Gym' },
    { id: 'piano', label: 'Piano' },
    { id: 'guitarra', label: 'Guitarra' },
    { id: 'lectura', label: 'Lectura' },
    { id: 'ajedrez', label: 'Ajedrez' },
    { id: 'idiomas', label: 'Idiomas' },
];
const AREA_LABELS = {
    universidad: '🎓', emprendimiento: '💼', proyectos: '🚀',
    gym: '💪', piano: '🎹', guitarra: '🎸', lectura: '📖',
    ajedrez: '♟️', idiomas: '🌍',
};
const AREA_TO_PB = {
    gym: { label: 'Salud / Físico', metric: 'Masa muscular' },
    piano: { label: 'Mente / Música', metric: 'Habilidad musical' },
    guitarra: { label: 'Mente / Música', metric: 'Habilidad musical' },
    lectura: { label: 'Mente', metric: 'Libros leídos' },
    idiomas: { label: 'Mente / Idiomas', metric: 'Nivel de idiomas' },
    universidad: { label: 'Carrera', metric: 'Título universitario' },
    emprendimiento: { label: 'Carrera / Emprendimiento', metric: 'Ingresos del negocio' },
    proyectos: { label: 'Carrera', metric: 'Portafolio' },
};
export default function SprintPage() {
    const { sprints, activeSprint, loading, createSprint, addObjective, updateObjective, completeSprint, deleteSprint } = useSprints();
    const { groupedByArea } = usePointBMetrics();
    const { data: systemsData } = useSystemsTracking();
    const [showCreate, setShowCreate] = useState(false);
    const [showAddObjective, setShowAddObjective] = useState(false);
    const [newObjective, setNewObjective] = useState({
        area: 'universidad',
        type: 'foco',
        title: '',
        target_value: 30,
        unit: 'horas',
        min_daily: 15,
        max_daily: 30,
    });
    const handleCreateSprint = async (name, startDate, endDate) => {
        await createSprint(name, startDate, endDate);
        toast.success('Sprint creado');
    };
    const handleAddObjective = async () => {
        if (!activeSprint || !newObjective.title.trim())
            return;
        await addObjective(activeSprint.id, {
            area: newObjective.area,
            type: newObjective.type,
            title: newObjective.title.trim(),
            description: null,
            target_value: newObjective.target_value,
            current_value: 0,
            unit: newObjective.unit,
            min_daily: newObjective.type === 'mejora' ? newObjective.min_daily : null,
            max_daily: newObjective.type === 'mejora' ? newObjective.max_daily : null,
            status: 'pending',
        });
        setShowAddObjective(false);
        setNewObjective({ area: 'universidad', type: 'foco', title: '', target_value: 30, unit: 'horas', min_daily: 15, max_daily: 30 });
        toast.success('Objetivo añadido');
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-background flex items-center justify-center pt-24", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    const focoObjectives = activeSprint?.objectives.filter(o => o.type === 'foco') || [];
    const mejoraObjectives = activeSprint?.objectives.filter(o => o.type === 'mejora') || [];
    return (_jsxs("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20 pb-24", children: [_jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2", children: [_jsx(Target, { className: "h-6 w-6 text-primary" }), "Sprint"] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Objetivos con fecha l\u00EDmite para alcanzar tu Point B" })] }), _jsxs(Button, { onClick: () => setShowCreate(true), className: "gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), " Nuevo Sprint"] })] }), sprints.length > 0 && !activeSprint && (_jsx(Card, { className: "border-2 border-muted", children: _jsxs(CardContent, { className: "p-6 text-center", children: [_jsx("p", { className: "text-muted-foreground mb-2", children: "No hay sprint activo." }), _jsxs(Button, { variant: "outline", onClick: () => setShowCreate(true), children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), " Crear nuevo sprint"] })] }) })), sprints.length === 0 && (_jsx(Card, { className: "border-2 border-dashed border-muted-foreground/30", children: _jsxs(CardContent, { className: "p-12 text-center", children: [_jsx(Target, { className: "h-12 w-12 text-muted-foreground/30 mx-auto mb-3" }), _jsx("h3", { className: "text-lg font-semibold mb-1", children: "Sin sprints a\u00FAn" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Crea tu primer sprint con objetivos en cada \u00E1rea" }), _jsxs(Button, { onClick: () => setShowCreate(true), children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), " Crear Sprint"] })] }) })), activeSprint && (_jsxs(_Fragment, { children: [_jsx(SprintHeader, { sprint: activeSprint, onComplete: () => { completeSprint(activeSprint.id); toast.success('Sprint completado 🎉'); }, onDelete: () => { deleteSprint(activeSprint.id); toast.success('Sprint eliminado'); } }), _jsxs(Card, { className: "border-blue-500/20", children: [_jsxs(CardHeader, { className: "pb-3 flex flex-row items-center justify-between", children: [_jsxs("div", { children: [_jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(Target, { className: "h-4 w-4 text-blue-500" }), "Foco \u2014 Objetivos con deadline"] }), _jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: "Universidad \u00B7 Emprendimiento \u00B7 Proyectos" })] }), _jsxs(Button, { size: "sm", variant: "outline", className: "h-8 text-xs gap-1", onClick: () => {
                                                    setNewObjective(prev => ({ ...prev, type: 'foco', area: 'universidad', unit: 'tareas' }));
                                                    setShowAddObjective(true);
                                                }, children: [_jsx(Plus, { className: "h-3 w-3" }), " A\u00F1adir"] })] }), _jsx(CardContent, { children: focoObjectives.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Sin objetivos de foco en este sprint" }), _jsxs(Button, { size: "sm", variant: "ghost", className: "mt-2", onClick: () => {
                                                        setNewObjective(prev => ({ ...prev, type: 'foco', area: 'universidad', unit: 'tareas' }));
                                                        setShowAddObjective(true);
                                                    }, children: [_jsx(Plus, { className: "h-3 w-3 mr-1" }), " A\u00F1adir objetivo"] })] })) : (_jsx("div", { className: "space-y-3", children: focoObjectives.map(obj => (_jsxs("div", { className: "relative", children: [_jsx(FocoObjectiveCard, { objective: obj, onUpdate: (updates) => updateObjective(obj.id, updates) }), _jsx(PointBLink, { area: obj.area, groupedByArea: groupedByArea })] }, obj.id))) })) })] }), _jsxs(Card, { className: "border-purple-500/20", children: [_jsxs(CardHeader, { className: "pb-3 flex flex-row items-center justify-between", children: [_jsxs("div", { children: [_jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-purple-500" }), "Mejora \u2014 Metas por acumulaci\u00F3n"] }), _jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: "Gym \u00B7 Piano \u00B7 Guitarra \u00B7 Lectura \u00B7 Ajedrez \u00B7 Idiomas" })] }), _jsxs(Button, { size: "sm", variant: "outline", className: "h-8 text-xs gap-1", onClick: () => {
                                                    setNewObjective(prev => ({ ...prev, type: 'mejora', area: 'gym', unit: 'horas', min_daily: 15, max_daily: 60 }));
                                                    setShowAddObjective(true);
                                                }, children: [_jsx(Plus, { className: "h-3 w-3" }), " A\u00F1adir"] })] }), _jsx(CardContent, { children: mejoraObjectives.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Sin objetivos de mejora en este sprint" }), _jsxs(Button, { size: "sm", variant: "ghost", className: "mt-2", onClick: () => {
                                                        setNewObjective(prev => ({ ...prev, type: 'mejora', area: 'gym', unit: 'horas', min_daily: 15, max_daily: 60 }));
                                                        setShowAddObjective(true);
                                                    }, children: [_jsx(Plus, { className: "h-3 w-3 mr-1" }), " A\u00F1adir objetivo"] })] })) : (_jsx("div", { className: "space-y-3", children: mejoraObjectives.map(obj => (_jsxs("div", { className: "relative", children: [_jsx(MejoraObjectiveCard, { objective: obj, todayMinutes: getTodayMinutes(obj.area, systemsData) }, obj.id), _jsx(PointBLink, { area: obj.area, groupedByArea: groupedByArea })] }, obj.id))) })) })] })] })), sprints.filter(s => s.status !== 'active').length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground", children: "Sprints anteriores" }) }), _jsx(CardContent, { className: "space-y-2", children: sprints.filter(s => s.status !== 'active').map(s => (_jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/30", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium", children: s.name }), _jsxs("span", { className: "text-xs text-muted-foreground ml-2", children: [s.objectives.filter(o => o.status === 'completed').length, "/", s.objectives.length, " objetivos"] })] }), _jsx(Badge, { variant: s.status === 'completed' ? 'default' : 'outline', className: "text-[10px]", children: s.status === 'completed' ? '✓ Completado' : 'Cancelado' })] }, s.id))) })] }))] }), _jsx(CreateSprintDialog, { open: showCreate, onOpenChange: setShowCreate, onCreate: handleCreateSprint }), _jsx(Dialog, { open: showAddObjective, onOpenChange: setShowAddObjective, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Nuevo objetivo" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Tipo" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: newObjective.type === 'foco' ? 'default' : 'outline', size: "sm", className: "flex-1", onClick: () => setNewObjective(prev => ({ ...prev, type: 'foco', unit: 'tareas', min_daily: 0, max_daily: 0 })), children: "\uD83C\uDFAF Foco" }), _jsx(Button, { variant: newObjective.type === 'mejora' ? 'default' : 'outline', size: "sm", className: "flex-1", onClick: () => setNewObjective(prev => ({ ...prev, type: 'mejora', unit: 'horas', min_daily: 15, max_daily: 30 })), children: "\uD83D\uDCC8 Mejora" })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "\u00C1rea" }), _jsxs(Select, { value: newObjective.area, onValueChange: v => setNewObjective(prev => ({ ...prev, area: v })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: (newObjective.type === 'foco' ? AREAS_FOCO : AREAS_MEJORA).map(a => (_jsxs(SelectItem, { value: a.id, children: [AREA_LABELS[a.id] || '', " ", a.label] }, a.id))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "T\u00EDtulo del objetivo" }), _jsx(Input, { value: newObjective.title, onChange: e => setNewObjective(prev => ({ ...prev, title: e.target.value })), placeholder: newObjective.type === 'foco' ? 'Ej: Terminar proyecto X' : 'Ej: 30 horas de piano' })] }), _jsxs("div", { children: [_jsxs(Label, { children: ["Meta: ", newObjective.target_value, " ", newObjective.unit] }), _jsx(Input, { type: "number", value: newObjective.target_value, onChange: e => setNewObjective(prev => ({ ...prev, target_value: parseInt(e.target.value) || 0 })) })] }), newObjective.type === 'mejora' && (_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "M\u00EDnimo diario (min)" }), _jsx(Input, { type: "number", value: newObjective.min_daily, onChange: e => setNewObjective(prev => ({ ...prev, min_daily: parseInt(e.target.value) || 0 })) })] }), _jsxs("div", { children: [_jsx(Label, { children: "M\u00E1ximo diario (min)" }), _jsx(Input, { type: "number", value: newObjective.max_daily, onChange: e => setNewObjective(prev => ({ ...prev, max_daily: parseInt(e.target.value) || 0 })) })] })] }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowAddObjective(false), children: "Cancelar" }), _jsx(Button, { onClick: handleAddObjective, disabled: !newObjective.title.trim(), children: "A\u00F1adir" })] })] }) })] }));
}
function PointBLink({ area, groupedByArea }) {
    const pbMetrics = Object.values(groupedByArea).flat().filter(m => m.area === area);
    const areaInfo = AREA_TO_PB[area];
    if (pbMetrics.length === 0 && !areaInfo)
        return null;
    return (_jsxs("div", { className: "mt-1 ml-2 flex items-start gap-1.5 text-[10px] text-muted-foreground/60", children: [_jsx(ArrowRight, { className: "h-3 w-3 mt-0.5 flex-shrink-0" }), _jsxs("span", { children: ["Contribuye a ", _jsx("strong", { children: "Point B" }), pbMetrics.length > 0
                        ? `: ${pbMetrics.map(m => `${m.metric_name} (${m.current_value}/${m.target_value} ${m.unit})`).join(', ')}`
                        : areaInfo
                            ? `: ${areaInfo.label} — ${areaInfo.metric}`
                            : ''] })] }));
}
function getTodayMinutes(area, systemsData) {
    const timeKey = {
        gym: 'gym',
        piano: 'musica',
        guitarra: 'musica',
        lectura: 'lectura',
        ajedrez: 'ajedrez',
        idiomas: 'idiomas',
    }[area] || area;
    return systemsData?.timeData?.[timeKey] || 0;
}
