import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle2, ArrowRight, Crosshair, Target, Eye } from "lucide-react";
import { usePuntoPartida } from "@/hooks/usePuntoPartida";
import { POINT_B_AREAS, VISION_3_YEARS } from "@/data/pointB2027";
import { useState } from "react";
import { toast } from "sonner";
const HOMBRE_LABELS = [
    { id: "liderazgo", label: "LIDERAZGO / DIRECCIÓN", nota: 6, formula: "Profesional 40% + Tasks 30% + Promedio 30%", hecho: "Propósito claro. Plan identidad. Sin resultados tangibles aún" },
    { id: "seguridad", label: "SEGURIDAD / PROTECCIÓN", nota: 4, formula: "= Promedio General (10 áreas)", hecho: "BMI 16.6, 51kg/175cm. Mentalmente quiere proteger, físicamente no lo transmite" },
    { id: "estatus", label: "ESTATUS / RESPETO", nota: 5, formula: "Profesional 60% + Tasks 40%", hecho: "Emprendimiento técnico destacable en Cuba. Sin resultados visibles aún" },
    { id: "provision", label: "PROVISIÓN / AMBICIÓN", nota: 5, formula: "Finanzas 50% + Profesional 50%", hecho: "Ambicioso pero $0 ingresos propios. Proyectos en desarrollo" },
    { id: "fortaleza", label: "FORTALEZA FÍSICA / PRESENCIA", nota: 3, formula: "= Salud y Bienestar", hecho: "BMI 16.6. Constancia 2/4 días. Sin presencia física imponente" },
    { id: "ie", label: "INTELIGENCIA EMOCIONAL / CONEXIÓN", nota: 5, formula: "(Familia+Amor) 20% + Promedio 80%", hecho: "Autocrítica diaria. Journaling irregular. Sin experiencia validando en pareja" },
    { id: "carisma", label: "CARISMA / DIVERSIÓN", nota: 8, formula: "Desarrollo Personal 60% + Ocio 40%", hecho: "Música, lectura, idiomas, ajedrez. Interesante. Sabe crear buen ambiente social" },
    { id: "lealtad", label: "LEALTAD / COMPROMISO", nota: 5, formula: "Tasks 60% + Promedio 40%", hecho: "Valores indican lealtad. Sin experiencia de pareja que lo demuestre" },
];
export default function PuntoPartida() {
    const { saveAll, loading: saving } = usePuntoPartida();
    const [saved, setSaved] = useState(false);
    const handleSave = async () => {
        const wheelEntries = POINT_B_AREAS.map((area) => ({
            area_id: area.id,
            area_type: "wheel",
            nota: Math.round(area.sub.reduce((s, sub) => s + progressPct(sub.start, sub.target, sub.start), 0) / area.sub.length) || 5,
            sub_scores: Object.fromEntries(area.sub.map((s) => [s.id, s.start])),
            respuestas: {},
            hechos: {},
        }));
        const hombreEntries = HOMBRE_LABELS.map((area) => ({
            area_id: area.id,
            area_type: "hombre",
            nota: area.nota,
            sub_scores: {},
            respuestas: {},
            hechos: { formula: area.formula, hecho: area.hecho },
        }));
        const ok = await saveAll([...wheelEntries, ...hombreEntries]);
        if (ok) {
            setSaved(true);
            toast.success("Punto de Partida guardado");
        }
        else {
            toast.error("Error al guardar");
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20 pb-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-8", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h1", { className: "text-3xl font-bold uppercase tracking-tight", children: "PUNTO DE PARTIDA" }), _jsx("p", { className: "text-muted-foreground", children: "Tu l\u00EDnea base \u2014 18 de Junio 2026 \u2014 Daniel, 22 a\u00F1os \u2014 La Habana, Cuba" }), _jsxs("p", { className: "text-sm text-muted-foreground/70 max-w-xl mx-auto", children: ["Cada score tiene dos dimensiones: ", _jsx("strong", { children: "Esfuerzo" }), " (consistencia diaria) y ", _jsx("strong", { children: "Resultados" }), " (% hacia Point B 2027). Las pesta\u00F1as en Inicio alternan entre ambas."] })] }), _jsx(Card, { className: "border-amber-500/30 bg-amber-500/5", children: _jsxs(CardContent, { className: "p-5", children: [_jsxs("h2", { className: "text-sm font-bold uppercase tracking-wide flex items-center gap-2 mb-2", children: [_jsx(Eye, { className: "h-4 w-4 text-amber-500" }), "VISI\u00D3N 3 A\u00D1OS \u2014 Br\u00FAjula (no medible)"] }), _jsx("p", { className: "text-xs text-muted-foreground whitespace-pre-line leading-relaxed", children: VISION_3_YEARS })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("h2", { className: "text-lg font-bold uppercase tracking-wide flex items-center gap-2", children: [_jsx(Crosshair, { className: "h-5 w-5 text-primary" }), "POINT B 2027 \u2014 Metas a 1 a\u00F1o"] }), ["cimientos", "construccion", "recompensas"].map(group => {
                            const areas = POINT_B_AREAS.filter(a => a.group === group);
                            const groupLabels = {
                                cimientos: "🏗️ CIMIENTOS — Estructura y Hábitos",
                                construccion: "🔨 CONSTRUCCIÓN — Trabajo duro y Enfoque",
                                recompensas: "🎁 RECOMPENSAS",
                            };
                            return (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-bold uppercase tracking-wide text-muted-foreground", children: groupLabels[group] }), areas.map(area => {
                                        const avgProgress = Math.round(area.sub.reduce((s, sub) => s + progressPct(sub.start, sub.target, sub.start), 0) / area.sub.length);
                                        return (_jsxs(Card, { className: "overflow-hidden", children: [_jsxs("div", { className: "bg-primary/5 px-5 py-3 flex items-center justify-between border-b", children: [_jsxs("h4", { className: "font-bold text-base flex items-center gap-2", children: [_jsx("span", { children: area.icon }), area.label] }), _jsx("span", { className: "text-sm font-bold text-muted-foreground", children: "0% \u00B7 Point B 2027" })] }), _jsxs(CardContent, { className: "p-4 space-y-2", children: [_jsx("div", { className: "w-full bg-muted rounded-full h-2", children: _jsx("div", { className: "bg-primary h-2 rounded-full transition-all", style: { width: `${avgProgress}%` } }) }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs", children: area.sub.map(sub => {
                                                                const pct = progressPct(sub.start, sub.target, sub.start);
                                                                return (_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx("div", { className: `w-1.5 h-1.5 rounded-full ${pct >= 50 ? "bg-green-500" : "bg-muted-foreground/40"}` }), _jsx("span", { className: "font-medium text-foreground min-w-[100px]", children: sub.label }), _jsxs("span", { children: [sub.start, " \u2192 ", sub.target, " ", sub.unit] })] }, sub.id));
                                                            }) })] })] }, area.id));
                                    })] }, group));
                        })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("h2", { className: "text-lg font-bold uppercase tracking-wide flex items-center gap-2", children: [_jsx(Target, { className: "h-5 w-5 text-primary" }), "HOMBRE TOP \u2014 8 \u00C1reas (derivadas)"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Se calculan autom\u00E1ticamente desde las 10 \u00E1reas + tareas. Tambi\u00E9n tienen doble dimensi\u00F3n: Esfuerzo y Resultados." }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: HOMBRE_LABELS.map(area => (_jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("h4", { className: "font-bold text-sm", children: area.label }), _jsxs("span", { className: "text-lg font-black", children: [area.nota, "/10"] })] }), _jsx("p", { className: "text-xs text-muted-foreground/70", children: area.formula }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: area.hecho })] }, area.id))) })] }), _jsxs("div", { className: "text-center pt-4", children: [saved ? (_jsxs("div", { className: "flex items-center justify-center gap-2 text-green-600 font-semibold", children: [_jsx(CheckCircle2, { className: "w-5 h-5" }), "Punto de Partida guardado"] })) : (_jsx(Button, { onClick: handleSave, disabled: saving, size: "lg", className: "gap-2", children: saving ? "Guardando..." : _jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4" }), " Guardar Punto de Partida"] }) })), _jsxs("p", { className: "text-xs text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed", children: [_jsx(ArrowRight, { className: "w-3 h-3 inline" }), " En Inicio puedes ver el progreso dual: ", _jsx("strong", { children: "Esfuerzo" }), " (\uD83D\uDD28) y ", _jsx("strong", { children: "Resultados" }), " (\uD83D\uDCCA). Los n\u00FAmeros se actualizan solos seg\u00FAn tus datos diarios."] })] })] }) }));
}
function progressPct(start, target, current) {
    if (start === target)
        return 100;
    return Math.max(0, Math.min(100, Math.round(((current - start) / (target - start)) * 100)));
}
