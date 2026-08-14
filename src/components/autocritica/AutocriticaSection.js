import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Activity, Gauge, Save, Scale, Target } from 'lucide-react';
import { format } from 'date-fns';
import { useResultadosPeriodo, EMPTY_RESULTADO, AREA_ORDER } from '@/hooks/useResultadosPeriodo';
import { useDailyReview } from '@/hooks/useDailyReview';
import { usePeriodicReview } from '@/hooks/usePeriodicReview';
import { ReflectionForm } from '@/components/self-review/ReflectionForm';
import { OverallRating } from '@/components/self-review/OverallRating';
import { cn } from '@/lib/utils';
const AREA_LABELS = {
    universidad: 'Universidad',
    emprendimiento: 'Emprendimiento',
    proyectos: 'Proyectos',
    lectura: 'Lectura',
    musica: 'Música',
    ajedrez: 'Ajedrez',
    game: 'Game',
    idiomas: 'Idiomas',
    gym: 'Gym',
    general: 'General',
};
const SCOPE_LABELS = { day: 'Hoy', week: 'Semana', month: 'Mes', quarter: 'Trimestre', year: 'Año' };
const SCOPE_TYPES = { week: 'weekly', month: 'monthly', quarter: 'quarterly', year: 'yearly' };
const verdictFor = (pct) => pct >= 100
    ? { label: 'Cumplido', cls: 'text-emerald-600 bg-emerald-500/10' }
    : pct >= 60
        ? { label: 'Parcial', cls: 'text-amber-600 bg-amber-500/10' }
        : { label: 'No cumplido', cls: 'text-destructive bg-destructive/10' };
const verdictGlobal = (pct) => pct >= 90
    ? { label: 'Excelente', cls: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' }
    : pct >= 75
        ? { label: 'Muy bien', cls: 'text-teal-600 bg-teal-500/10 border-teal-500/30' }
        : pct >= 60
            ? { label: 'Aceptable', cls: 'text-amber-600 bg-amber-500/10 border-amber-500/30' }
            : pct >= 40
                ? { label: 'Regular', cls: 'text-orange-600 bg-orange-500/10 border-orange-500/30' }
                : { label: 'Insuficiente', cls: 'text-destructive bg-destructive/10 border-destructive/30' };
const verdictMsgFor = (pct, e, res, hasPlan) => {
    if (!hasPlan)
        return 'No hay plan planificado para este período. Define metas de minutos, tareas y sistemas para poder medir tu desempeño.';
    const base = pct >= 90
        ? 'Desempeño sobresaliente del período.'
        : pct >= 75
            ? 'Buen desempeño: cumpliste la mayor parte del plan.'
            : pct >= 60
                ? 'Cumpliste lo mínimo planificado, con margen de mejora.'
                : pct >= 40
                    ? 'Período flojo: identifica qué frenó tu avance y ajusta.'
                    : 'Período crítico: replantea el plan antes de continuar.';
    if (res != null && e != null) {
        return base + (res >= e
            ? ' Tu esfuerzo se está convirtiendo en resultados.'
            : ' Tu esfuerzo supera a los resultados: revisa el método, no solo el tiempo invertido.');
    }
    return base;
};
export function AutocriticaSection({ start, end, scope }) {
    const { data } = useResultadosPeriodo(start, end);
    const r = data ?? EMPTY_RESULTADO;
    const isDay = scope === 'day';
    const dateStr = format(start, 'yyyy-MM-dd');
    const dayReview = useDailyReview(dateStr);
    const periodic = usePeriodicReview(isDay ? 'weekly' : (SCOPE_TYPES[scope] || 'weekly'), start);
    const [draft, setDraft] = useState({});
    const [ratingDraft, setRatingDraft] = useState(null);
    const p = periodic.review;
    const field = (k) => draft[k] !== undefined ? draft[k] : (p?.[k] || '');
    const rating = ratingDraft ?? p?.overall_rating ?? 0;
    const savePeriodic = () => {
        if (!p)
            return;
        periodic.saveReview({
            wins: field('wins'),
            struggles: field('struggles'),
            lessons_learned: field('lessons_learned'),
            next_period_focus: field('next_period_focus'),
            overall_rating: ratingDraft ?? p.overall_rating ?? null,
        });
    };
    const rows = AREA_ORDER
        .map(k => ({
        key: k,
        label: AREA_LABELS[k] || k,
        plan: r.byArea[k].goalMinutes || 0,
        real: r.byArea[k].minutes || 0,
        done: r.byArea[k].done || 0,
        total: r.byArea[k].total || 0,
    }))
        .filter(x => x.plan > 0 || x.real > 0 || x.total > 0);
    const planTotal = rows.reduce((s, x) => s + x.plan, 0);
    const realTotal = rows.reduce((s, x) => s + x.real, 0);
    const overallPct = planTotal > 0 ? Math.round((realTotal / planTotal) * 100) : 0;
    const hasPlan = planTotal > 0 || r.globalTotal > 0 || r.systems.total > 0 || r.lectura.pagesGoal > 0 || r.books.length > 0;
    const minPct = planTotal > 0 ? Math.round((realTotal / planTotal) * 100) : null;
    const sysPct = r.systems.total > 0 ? Math.round((r.systems.done / r.systems.total) * 100) : null;
    const taskPct = r.globalTotal > 0 ? Math.round((r.globalDone / r.globalTotal) * 100) : null;
    const booksTotal = r.books.length;
    const booksDone = r.books.filter(b => b.done).length;
    const bookPct = booksTotal > 0 ? Math.round((booksDone / booksTotal) * 100) : null;
    const pagePct = r.lectura.pagesGoal > 0 ? Math.round((r.lectura.pages / r.lectura.pagesGoal) * 100) : null;
    const avgPct = (list) => {
        const v = list.filter(x => x != null);
        return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
    };
    const esfuerzoPct = avgPct([minPct, sysPct]);
    const resultadosPct = avgPct([taskPct, bookPct, pagePct]);
    const scorePct = avgPct([esfuerzoPct, resultadosPct]) ?? 0;
    const verdict = verdictGlobal(scorePct);
    const verdictMsg = verdictMsgFor(scorePct, esfuerzoPct, resultadosPct, hasPlan);
    const scopeLabel = SCOPE_LABELS[scope] || scope;
    const stat = (label, value) => (_jsxs("div", { className: "p-2 rounded-lg bg-muted/30", children: [_jsx("p", { className: "text-lg font-bold tabular-nums", children: value }), _jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: label })] }));
    const indicator = (label, icon, pct, sub) => (_jsxs("div", { className: "rounded-xl bg-muted/30 p-3 space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [icon, _jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: label })] }), _jsx("span", { className: "text-lg font-bold tabular-nums", children: pct != null ? `${pct}%` : '—' })] }), _jsx(Progress, { value: Math.min(pct ?? 0, 100), className: "h-1.5" }), sub && (_jsx("p", { className: "text-[9px] text-muted-foreground", children: sub }))] }));
    const fieldRow = (label, k, placeholder) => (_jsxs("div", { className: "space-y-1.5", children: [_jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: label }), _jsx(Textarea, { value: field(k), onChange: e => setDraft(d => ({ ...d, [k]: e.target.value })), placeholder: placeholder, className: "min-h-[64px] text-xs" })] }));
    const rowElems = rows.map(row => {
        const pct = row.plan > 0 ? Math.round((row.real / row.plan) * 100) : 0;
        const v = verdictFor(pct);
        return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "font-semibold flex-1 truncate", children: row.label }), row.total > 0 && (_jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [row.done, "/", row.total, " tareas"] })), _jsxs("span", { className: "text-[10px] text-muted-foreground whitespace-nowrap", children: ["Plan ", row.plan, " min"] }), _jsxs("span", { className: cn("text-[10px] whitespace-nowrap", pct < 100 ? "text-destructive" : "text-emerald-600"), children: [row.real, " min"] }), _jsxs("span", { className: cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", v.cls), children: [v.label, " ", pct, "%"] })] }), _jsx(Progress, { value: Math.min(pct, 100), className: "h-1.5" })] }, row.key));
    });
    const summaryCard = (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-primary to-primary/60" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Scale, { className: "h-4 w-4 text-primary" }), _jsx("h2", { className: "text-sm font-semibold", children: "Realizado vs Plan" }), _jsxs(Badge, { variant: "secondary", className: "text-[10px] ml-auto", children: [scopeLabel, " \u00B7 ", r.globalDone, "/", r.globalTotal, " tareas"] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-center", children: [stat('Plan (min)', planTotal), stat('Realizado (min)', realTotal), stat('Cumplimiento', `${overallPct}%`)] }), _jsx(Progress, { value: Math.min(overallPct, 100), className: "h-2" })] })] }));
    const chips = [
        r.globalTotal > 0 && { label: 'Tareas', value: `${r.globalDone}/${r.globalTotal}` },
        r.systems.total > 0 && { label: 'Sistemas', value: `${r.systems.done}/${r.systems.total}` },
        booksTotal > 0 && { label: 'Libros', value: `${booksDone}/${booksTotal}` },
        pagePct != null && { label: 'Páginas', value: `${pagePct}%` },
    ].filter(Boolean);
    const verdictCard = (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Gauge, { className: "h-4 w-4 text-violet-500" }), _jsx("h2", { className: "text-sm font-semibold", children: "Esfuerzo y Resultados" }), _jsxs(Badge, { className: cn("text-[10px] ml-auto border", verdict.cls), children: [verdict.label, " \u00B7 ", scorePct, "%"] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [indicator('Esfuerzo', _jsx(Activity, { className: "h-3 w-3 text-violet-500" }), esfuerzoPct, `Plan ${planTotal} min \u00B7 Real ${realTotal} min`), indicator('Resultados', _jsx(Target, { className: "h-3 w-3 text-fuchsia-500" }), resultadosPct, `Tareas ${r.globalDone}/${r.globalTotal}`)] }), chips.length > 0 && (_jsxs("div", { className: "flex flex-wrap gap-1.5", children: chips.map(c => (_jsxs(Badge, { variant: "secondary", className: "text-[10px]", children: [c.value, " ", c.label] }, c.label))) })), _jsxs("div", { className: cn("rounded-xl border p-2.5 text-[11px] leading-snug", verdict.cls), children: [verdictMsg] })] })] }));
    const rowsContent = rows.length === 0
        ? (_jsx("p", { className: "text-xs text-muted-foreground text-center py-4", children: "Sin metas planificadas ni actividad registrada para este per\u00EDodo." }))
        : (_jsxs("div", { className: "space-y-3", children: rowElems }));
    const rowsCard = (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-amber-500 to-orange-400" }), _jsxs(CardContent, { className: "p-4", children: rowsContent })] }));
    const dayReflection = (_jsxs(_Fragment, { children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Reflexi\u00F3n del d\u00EDa" }), _jsx(ReflectionForm, { whatWentWell: dayReview.review?.whatWentWell || '', whatCouldBeBetter: dayReview.review?.whatCouldBeBetter || '', tomorrowPlan: dayReview.review?.tomorrowPlan || '', onWhatWentWellChange: v => dayReview.saveReview({ whatWentWell: v }), onWhatCouldBeBetterChange: v => dayReview.saveReview({ whatCouldBeBetter: v }), onTomorrowPlanChange: v => dayReview.saveReview({ tomorrowPlan: v }) }), _jsx(OverallRating, { rating: dayReview.review?.overallRating || 0, onRatingChange: v => dayReview.saveReview({ overallRating: v }) })] }));
    const periodReflection = (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Reflexi\u00F3n del per\u00EDodo" }), _jsx(Button, { onClick: savePeriodic, disabled: periodic.saving, size: "sm", className: "gap-1.5 h-7 text-[10px]", children: [_jsx(Save, { className: "h-3 w-3" }), periodic.saving ? 'Guardando...' : 'Guardar Autocr\u00EDtica'] })] }), fieldRow('Triunfos', 'wins', '¿Qué salió bien?'), fieldRow('Dificultades', 'struggles', '¿Qué no salió como planeaste?'), fieldRow('Aprendizajes', 'lessons_learned', '¿Qué aprendiste?'), fieldRow('Foco del pr\u00F3ximo per\u00EDodo', 'next_period_focus', '¿En qué te vas a enfocar ahora?'), _jsx(OverallRating, { rating: rating, onRatingChange: setRatingDraft })] }));
    const reflectionCard = (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-emerald-500 to-teal-400" }), _jsxs(CardContent, { className: "p-4 space-y-4", children: isDay ? dayReflection : periodReflection })] }));
    return (_jsxs("div", { className: "space-y-5", children: [summaryCard, verdictCard, rowsCard, reflectionCard] }));
}