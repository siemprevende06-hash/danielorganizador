import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBoxeo } from '@/hooks/useBoxeo';
import { Dumbbell, Plus, Flame, Target, Activity, Trash2, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
export default function BoxeoPage() {
    const { tecnicas, sesiones, loading, seedTecnicas, actualizarDominio, agregarSesion, eliminarSesion, getNivelGeneral, getSesionesEstaSemana, } = useBoxeo();
    const [sesionDialog, setSesionDialog] = useState(false);
    const [nuevaSesion, setNuevaSesion] = useState({
        tipo: 'saco',
        duracion_minutos: 30,
        rounds: 3,
        intensidad: 'media',
        tecnicas_practicadas: '[]',
        notas: '',
    });
    const nivelGeneral = getNivelGeneral();
    const niveles = ['', '🥊 Principiante', '🥊 Intermedio', '🥊 Avanzado', '🥊 Experto', '🥊 Maestro'];
    const sesionesSemana = getSesionesEstaSemana();
    const handleAddSesion = async () => {
        const tecnicasArray = nuevaSesion.tecnicas_practicadas
            ? nuevaSesion.tecnicas_practicadas.split(',').map(t => t.trim()).filter(Boolean)
            : [];
        await agregarSesion({
            fecha: new Date().toISOString().split('T')[0],
            tipo: nuevaSesion.tipo,
            duracion_minutos: nuevaSesion.duracion_minutos,
            rounds: nuevaSesion.rounds,
            intensidad: nuevaSesion.intensidad,
            tecnicas_practicadas: tecnicasArray,
            notas: nuevaSesion.notas,
        });
        setSesionDialog(false);
        setNuevaSesion({ tipo: 'saco', duracion_minutos: 30, rounds: 3, intensidad: 'media', tecnicas_practicadas: '[]', notas: '' });
    };
    if (loading) {
        return (_jsx("div", { className: "container mx-auto px-4 py-24", children: _jsxs("div", { className: "animate-pulse space-y-4", children: [_jsx("div", { className: "h-8 bg-muted rounded w-1/3" }), _jsx("div", { className: "h-64 bg-muted rounded" })] }) }));
    }
    const categoriaColor = (cat) => {
        switch (cat) {
            case 'basico': return 'bg-green-500/10 text-green-600 border-green-500/30';
            case 'intermedio': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
            case 'avanzado': return 'bg-red-500/10 text-red-600 border-red-500/30';
            default: return '';
        }
    };
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-6", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold flex items-center gap-2", children: [_jsx(Dumbbell, { className: "h-8 w-8" }), "Boxeo T\u00E9cnico"] }), _jsx("p", { className: "text-muted-foreground mt-1", children: "Progresi\u00F3n de habilidades y sesiones de entrenamiento" })] }), _jsx("div", { className: "text-right", children: _jsx(Badge, { className: "text-lg px-4 py-2", children: niveles[nivelGeneral] }) })] }), tecnicas.length === 0 && (_jsx(Card, { className: "border-dashed", children: _jsxs(CardContent, { className: "py-12 text-center", children: [_jsx("p", { className: "text-muted-foreground mb-4", children: "No hay t\u00E9cnicas de boxeo cargadas a\u00FAn" }), _jsxs(Button, { onClick: seedTecnicas, children: [_jsx(Zap, { className: "mr-2 h-4 w-4" }), "Cargar t\u00E9cnicas predefinidas"] })] }) })), _jsxs(Tabs, { defaultValue: "tecnicas", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "tecnicas", children: [_jsx(Target, { className: "h-4 w-4 mr-2" }), "T\u00E9cnicas"] }), _jsxs(TabsTrigger, { value: "sesiones", children: [_jsx(Activity, { className: "h-4 w-4 mr-2" }), "Sesiones"] }), _jsxs(TabsTrigger, { value: "stats", children: [_jsx(BarChartIcon, { className: "h-4 w-4 mr-2" }), "Estad\u00EDsticas"] })] }), _jsx(TabsContent, { value: "tecnicas", className: "space-y-4 mt-4", children: ['basico', 'intermedio', 'avanzado'].map(cat => {
                            const filtradas = tecnicas.filter(t => t.categoria === cat);
                            if (filtradas.length === 0)
                                return null;
                            return (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold uppercase text-muted-foreground mb-2 capitalize", children: cat }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: filtradas.map(t => (_jsx(Card, { className: `border-l-4 ${t.nivel_dominio >= 80 ? 'border-l-green-500' : t.nivel_dominio >= 40 ? 'border-l-amber-500' : 'border-l-muted'}`, children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold", children: t.nombre }), _jsx("p", { className: "text-xs text-muted-foreground", children: t.descripcion })] }), _jsx(Badge, { variant: "outline", className: categoriaColor(t.categoria), children: t.categoria })] }), _jsx(Progress, { value: t.nivel_dominio, className: "h-2 mb-2" }), _jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [_jsxs("span", { children: ["Dominio: ", t.nivel_dominio, "%"] }), _jsxs("span", { children: ["Nivel req: ", t.nivel_requerido] })] }), _jsxs("div", { className: "flex gap-1 mt-2", children: [_jsx(Button, { size: "sm", variant: "outline", className: "h-7 text-xs", onClick: () => actualizarDominio(t.id, Math.min(100, t.nivel_dominio + 10)), children: "+10%" }), _jsx(Button, { size: "sm", variant: "outline", className: "h-7 text-xs", onClick: () => actualizarDominio(t.id, Math.max(0, t.nivel_dominio - 10)), children: "-10%" })] })] }) }, t.id))) })] }, cat));
                        }) }), _jsxs(TabsContent, { value: "sesiones", className: "space-y-4 mt-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("p", { className: "text-sm text-muted-foreground", children: [sesiones.length, " sesiones registradas"] }), _jsxs(Dialog, { open: sesionDialog, onOpenChange: setSesionDialog, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Nueva Sesi\u00F3n"] }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Registrar Sesi\u00F3n de Boxeo" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Select, { value: nuevaSesion.tipo, onValueChange: v => setNuevaSesion(p => ({ ...p, tipo: v })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Tipo" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "saco", children: "Saco" }), _jsx(SelectItem, { value: "sombra", children: "Sombra" }), _jsx(SelectItem, { value: "sparring", children: "Sparring" }), _jsx(SelectItem, { value: "bolsa", children: "Bolsa" }), _jsx(SelectItem, { value: "otros", children: "Otros" })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-xs text-muted-foreground", children: "Duraci\u00F3n (min)" }), _jsx(Input, { type: "number", value: nuevaSesion.duracion_minutos, onChange: e => setNuevaSesion(p => ({ ...p, duracion_minutos: +e.target.value })) })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-xs text-muted-foreground", children: "Rounds" }), _jsx(Input, { type: "number", value: nuevaSesion.rounds, onChange: e => setNuevaSesion(p => ({ ...p, rounds: +e.target.value })) })] })] }), _jsxs(Select, { value: nuevaSesion.intensidad, onValueChange: v => setNuevaSesion(p => ({ ...p, intensidad: v })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Intensidad" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "baja", children: "Baja" }), _jsx(SelectItem, { value: "media", children: "Media" }), _jsx(SelectItem, { value: "alta", children: "Alta" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-muted-foreground", children: "T\u00E9cnicas practicadas (separadas por coma)" }), _jsx(Input, { value: nuevaSesion.tecnicas_practicadas, onChange: e => setNuevaSesion(p => ({ ...p, tecnicas_practicadas: e.target.value })), placeholder: "jab, cross, hook" })] }), _jsx(Textarea, { value: nuevaSesion.notas, onChange: e => setNuevaSesion(p => ({ ...p, notas: e.target.value })), placeholder: "Notas..." }), _jsx(Button, { onClick: handleAddSesion, className: "w-full", children: "Guardar Sesi\u00F3n" })] })] })] })] }), sesiones.map(s => (_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "text-2xl", children: s.tipo === 'saco' ? '🥊' : s.tipo === 'sombra' ? '👻' : s.tipo === 'sparring' ? '🤼' : '💪' }), _jsxs("div", { children: [_jsxs("p", { className: "font-semibold capitalize", children: [s.tipo, " \u00B7 ", s.duracion_minutos, "min"] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [format(new Date(s.fecha), 'd MMM', { locale: es }), " \u00B7 ", s.rounds, " rounds \u00B7 ", s.intensidad] }), s.tecnicas_practicadas && Array.isArray(s.tecnicas_practicadas) && s.tecnicas_practicadas.length > 0 && (_jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["T\u00E9cnicas: ", s.tecnicas_practicadas.join(', ')] }))] })] }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => eliminarSesion(s.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) }, s.id))), sesiones.length === 0 && (_jsx("p", { className: "text-center text-muted-foreground py-8", children: "No hay sesiones registradas. \u00A1Empieza hoy!" }))] }), _jsx(TabsContent, { value: "stats", className: "space-y-4 mt-4", children: _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: [_jsx(Flame, { className: "h-4 w-4 text-orange-500" }), "Esta Semana"] }) }), _jsxs(CardContent, { children: [_jsxs("p", { className: "text-2xl font-bold", children: [sesionesSemana.length, " sesiones"] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [sesionesSemana.reduce((s, s2) => s + s2.duracion_minutos, 0), " min totales"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: [_jsx(Target, { className: "h-4 w-4 text-blue-500" }), "Total Sesiones"] }) }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-2xl font-bold", children: sesiones.length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "desde que empezaste" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: [_jsx(Activity, { className: "h-4 w-4 text-green-500" }), "T\u00E9cnicas Dominadas"] }) }), _jsxs(CardContent, { children: [_jsxs("p", { className: "text-2xl font-bold", children: [tecnicas.filter(t => t.nivel_dominio >= 80).length, "/", tecnicas.length] }), _jsx(Progress, { value: tecnicas.length > 0 ? (tecnicas.filter(t => t.nivel_dominio >= 80).length / tecnicas.length) * 100 : 0, className: "h-2 mt-2" })] })] })] }) })] })] }));
}
function BarChartIcon({ className }) {
    return (_jsxs("svg", { className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("rect", { x: "3", y: "12", width: "4", height: "9", rx: "1" }), _jsx("rect", { x: "10", y: "7", width: "4", height: "14", rx: "1" }), _jsx("rect", { x: "17", y: "3", width: "4", height: "18", rx: "1" })] }));
}
