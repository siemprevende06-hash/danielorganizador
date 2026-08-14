import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, BookOpen, Music, Target, ClipboardList } from 'lucide-react';
export const AREA_COLORS = {
    universidad: 'from-blue-600 to-indigo-500',
    lectura: 'from-cyan-500 to-sky-500',
    tareas: 'from-emerald-500 to-teal-500',
    emprendimiento: 'from-purple-500 to-fuchsia-500',
    proyectos: 'from-amber-500 to-orange-500',
    musica: 'from-pink-500 to-rose-500',
    ajedrez: 'from-slate-600 to-zinc-600',
    gym: 'from-red-500 to-orange-500',
    game: 'from-rose-500 to-red-500',
    idiomas: 'from-teal-500 to-emerald-500',
};
export function AreaCard({ title, icon, color, children }) {
    return (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [color && _jsx("div", { className: cn('h-1 bg-gradient-to-r', color) }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-base leading-none", children: icon }), _jsx("h3", { className: "text-sm font-bold tracking-tight", children: title })] }), children] })] }));
}
export function AreaRow({ title, color, plan, result }) {
    return (_jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [_jsx(AreaCard, { title: `${title} — lo planificado`, color: color, children: plan }), _jsx(AreaCard, { title: `${title} — resultado`, color: color, children: result })] }));
}
/** Contenedor global de la sección de resultados: cabeceras de columna únicas arriba */
export function ResultadoColumnas({ children }) {
    return (_jsxs("div", { className: "rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm p-4 space-y-5", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 pb-2 border-b border-muted/40", children: [_jsxs("p", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5", children: [_jsx(ClipboardList, { className: "h-3.5 w-3.5 text-primary/70" }), " Planificaci\u00F3n"] }), _jsxs("p", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5", children: [_jsx(Target, { className: "h-3.5 w-3.5 text-primary/70" }), " Objetivos"] })] }), children] }));
}
export function GrupoResultados({ label, children }) {
    return (_jsxs("div", { className: "space-y-2.5", children: [_jsx("h3", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground px-1", children: label }), _jsx("div", { className: "space-y-4", children: children })] }));
}
/** Fila de área: título arriba y su contenido repartido en las 2 columnas (planificado | objetivos) */
export function AreaRowCols({ title, color, plan, objetivo }) {
    return (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [color && _jsx("div", { className: cn('h-1 bg-gradient-to-r', color) }), _jsxs(CardContent, { className: "p-4", children: [_jsx("h3", { className: "text-sm font-bold tracking-tight mb-3", children: title }), _jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [_jsx("div", { className: "space-y-2 min-w-0", children: plan }), _jsx("div", { className: "space-y-2 min-w-0", children: objetivo })] })] })] }));
}
export function OtherTasksList({ tasks, label = 'Tareas de la página Tareas' }) {
    if (!tasks || tasks.length === 0)
        return null;
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsx("p", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider", children: label }), _jsx(TaskPlanList, { area: { tasks } })] }));
}
/** Planificado de Universidad: asignaturas activas con sus temas y tareas */
export function UniversityPlan({ data }) {
    if (data.length === 0)
        return _jsx(AreaEmpty, { children: "Activa asignaturas desde la p\u00E1gina de Universidad" });
    return (_jsx("div", { className: "space-y-3", children: data.map(subj => (_jsxs("div", { className: "rounded-xl border border-muted/50 p-2.5 space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("p", { className: "text-xs font-semibold truncate", children: subj.name }), _jsxs(Badge, { variant: "outline", className: "text-[8px] shrink-0", children: [subj.topics.length, " temas"] })] }), subj.topics.length > 0 && (_jsx("ul", { className: "space-y-1", children: subj.topics.map(tp => (_jsxs("li", { className: "flex items-start gap-2 text-[11px] text-muted-foreground", children: [_jsx(BookOpen, { className: "h-3 w-3 text-blue-500 mt-0.5 shrink-0" }), _jsx("span", { children: tp.title })] }, tp.id))) })), subj.tasks.length > 0 && _jsx(TaskPlanList, { area: { tasks: subj.tasks } }), subj.topics.length === 0 && subj.tasks.length === 0 && (_jsx("p", { className: "text-[10px] italic text-muted-foreground", children: "Sin temas ni tareas" }))] }, subj.id))) }));
}
/** Objetivos de Universidad: exámenes, parciales y entregas de las asignaturas activas */
export function UniversityObjetivos({ data }) {
    const blocks = data.flatMap(subj => [
        ...subj.exams.map(e => ({ key: `e-${e.id}`, subject: subj.name, title: e.title, done: e.done, kind: 'Examen', date: e.date })),
        ...subj.partials.map(p => ({ key: `p-${p.id}`, subject: subj.name, title: p.title, done: p.done, kind: 'Parcial', date: p.date })),
        ...subj.deliveries.map(d => ({ key: `d-${d.id}`, subject: subj.name, title: d.title, done: d.completed, kind: 'Entrega', date: d.dueShort })),
    ]);
    if (blocks.length === 0)
        return _jsx(AreaEmpty, { children: "Sin ex\u00E1menes ni entregas en el per\u00EDodo" });
    return (_jsx("ul", { className: "space-y-1.5", children: blocks.map(b => (_jsxs("li", { className: "flex items-start gap-2 text-xs", children: [b.done
                    ? _jsx(CheckCircle2, { className: "h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" })
                    : _jsx(Circle, { className: "h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: cn('break-words leading-snug', b.done && 'line-through opacity-60'), children: b.title }), _jsxs("div", { className: "flex flex-wrap gap-1 mt-0.5", children: [_jsx(Badge, { variant: "secondary", className: "text-[8px] px-1 py-0 h-3.5", children: b.subject }), _jsx(Badge, { variant: "outline", className: cn('text-[8px] px-1 py-0 h-3.5', b.kind === 'Entrega' && 'text-amber-600'), children: b.kind }), b.date && _jsx(Badge, { variant: "outline", className: "text-[8px] px-1 py-0 h-3.5", children: String(b.date).slice(0, 10) })] })] })] }, b.key))) }));
}
/** Planificado de Emprendimiento: negocios activos con sus tareas */
export function EntPlan({ data }) {
    if (data.length === 0)
        return _jsx(AreaEmpty, { children: "Activa emprendimientos desde su p\u00E1gina" });
    return (_jsx("div", { className: "space-y-3", children: data.map(biz => (_jsxs("div", { className: "rounded-xl border border-muted/50 p-2.5 space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("p", { className: "text-xs font-semibold truncate", children: biz.name }), _jsxs(Badge, { variant: "outline", className: "text-[8px] shrink-0", children: [biz.tasksDone, "/", biz.tasksTotal, " tareas"] })] }), biz.tasks.length > 0 ? _jsx(TaskPlanList, { area: { tasks: biz.tasks } }) : (_jsx("p", { className: "text-[10px] italic text-muted-foreground", children: "Sin tareas en el per\u00EDodo" }))] }, biz.id))) }));
}
/** Objetivos de Emprendimiento: objetivos marcados de los negocios activos */
export function EntObjetivos({ data }) {
    const blocks = data.flatMap(biz => biz.goals.map(g => ({ key: g.id, subject: biz.name, ...g })));
    if (blocks.length === 0)
        return _jsx(AreaEmpty, { children: "Define objetivos en cada emprendimiento" });
    return (_jsx("ul", { className: "space-y-1.5", children: blocks.map(g => (_jsxs("li", { className: "flex items-start gap-2 text-xs", children: [g.completed
                    ? _jsx(CheckCircle2, { className: "h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" })
                    : _jsx(Target, { className: "h-3.5 w-3.5 text-purple-500 mt-0.5 shrink-0" }), _jsx("span", { className: cn('break-words leading-snug', g.completed && 'line-through opacity-60'), children: g.title }), _jsx(Badge, { variant: "secondary", className: "text-[8px] px-1 py-0 h-3.5 ml-auto shrink-0", children: g.subject })] }, g.key))) }));
}
/** Planificado de Proyectos: proyectos activos con sus tareas */
export function ProyectosPlan({ data }) {
    if (data.length === 0)
        return _jsx(AreaEmpty, { children: "Activa proyectos desde su p\u00E1gina" });
    return (_jsx("div", { className: "space-y-3", children: data.map(p => (_jsxs("div", { className: "rounded-xl border border-muted/50 p-2.5 space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("p", { className: "text-xs font-semibold truncate", children: p.name }), _jsxs(Badge, { variant: "outline", className: "text-[8px] shrink-0", children: [p.done, "/", p.total] })] }), p.tasks.length > 0 ? _jsx(TaskPlanList, { area: { tasks: p.tasks } }) : (_jsx("p", { className: "text-[10px] italic text-muted-foreground", children: "Sin tareas a\u00FAn" }))] }, p.id))) }));
}
/** Objetivos de Proyectos: conseguir el proyecto (progreso) */
export function ProyectosObjetivos({ data }) {
    if (data.length === 0)
        return _jsx(AreaEmpty, { children: "Sin proyectos activos" });
    return (_jsx("div", { className: "space-y-3", children: data.map(p => {
            const pct = p.total > 0 ? Math.min(100, Math.round((p.done / p.total) * 100)) : 0;
            return (_jsxs("div", { className: "rounded-xl border border-muted/50 p-2.5 space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("p", { className: "text-xs font-semibold truncate", children: p.name }), _jsxs(Badge, { variant: pct >= 100 ? 'secondary' : 'outline', className: "text-[8px] shrink-0", children: [pct, "%"] })] }), _jsx(Progress, { value: pct, className: cn('h-1.5', pct >= 100 && 'bg-emerald-500/20') }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [p.done, " de ", p.total, " tareas completadas"] })] }, p.id));
        }) }));
}
export function CheckItem({ done, children }) {
    return (_jsxs("li", { className: cn('flex items-start gap-2 text-xs', done && 'opacity-60'), children: [done
                ? _jsx(CheckCircle2, { className: "h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" })
                : _jsx(Circle, { className: "h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" }), _jsx("span", { className: cn(done && 'line-through'), children: children })] }));
}
export function ResultRow({ label, value, ok, pending }) {
    return (_jsxs("div", { className: "flex items-center justify-between text-xs py-1 border-b border-muted/50 last:border-0", children: [_jsx("span", { className: "text-muted-foreground", children: label }), _jsxs("span", { className: "flex items-center gap-1.5 font-semibold", children: [pending && _jsx(Circle, { className: "h-3 w-3 text-amber-500" }), ok && _jsx(CheckCircle2, { className: "h-3 w-3 text-emerald-500" }), value] })] }));
}
export function ResumenGeneral({ score, subtitle, badges, stats }) {
    return (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" }), _jsxs(CardContent, { className: "p-4 flex items-center gap-4 flex-wrap", children: [_jsxs("div", { className: "relative w-16 h-16 shrink-0", children: [_jsxs("svg", { className: "w-16 h-16 -rotate-90", viewBox: "0 0 40 40", children: [_jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "rgba(0,0,0,0.08)", strokeWidth: "4" }), _jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "currentColor", className: "text-primary", strokeWidth: "4", strokeDasharray: `${2 * Math.PI * 16}`, strokeDashoffset: `${2 * Math.PI * 16 * (1 - score / 100)}` })] }), _jsx("span", { className: "absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums", children: score })] }), _jsxs("div", { className: "flex-1 min-w-[220px]", children: [_jsx("p", { className: "text-sm font-semibold", children: subtitle }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Resultados alcanzados frente a lo planificado" }), _jsx("div", { className: "flex flex-wrap gap-1.5 mt-2", children: badges.map(b => (_jsx(Badge, { variant: "secondary", className: "text-[10px]", children: b }, b))) })] }), _jsx("div", { className: "grid grid-cols-4 gap-2 text-center", children: stats.map(([l, v]) => (_jsxs("div", { className: "rounded-xl bg-muted/40 px-2 py-2", children: [_jsx("p", { className: "text-sm font-bold tabular-nums", children: v }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: l })] }, l))) })] })] }));
}
export function BigNumber({ value, fraction, label, badge, accent, progress = 71 }) {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-end justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-2xl font-bold tabular-nums", children: [value, " ", fraction && _jsx("span", { className: "text-sm text-muted-foreground", children: fraction })] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: label })] }), badge && _jsx(Badge, { variant: "outline", className: cn('text-[10px]', accent), children: badge })] }), _jsx(Progress, { value: Math.min(progress, 100), className: "h-1.5" })] }));
}
export function TaskPlanList({ area }) {
    if (!area.tasks || area.tasks.length === 0) {
        return _jsx("p", { className: "text-[10px] text-muted-foreground italic", children: "Sin tareas planificadas" });
    }
    return (_jsx("ul", { className: "space-y-1.5", children: area.tasks.map((t) => (_jsx("li", { children: _jsxs("div", { className: "flex items-start gap-2 text-xs", children: [t.completed
                        ? _jsx(CheckCircle2, { className: "h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" })
                        : _jsx(Circle, { className: "h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: cn('break-words leading-snug', t.completed && 'line-through opacity-60'), children: t.title }), _jsxs("div", { className: "flex flex-wrap gap-1 mt-0.5", children: [t.entityName && (_jsx(Badge, { variant: "secondary", className: "text-[8px] px-1 py-0 h-3.5", children: t.entityName })), t.dueShort && (_jsx(Badge, { variant: "outline", className: "text-[8px] px-1 py-0 h-3.5", children: t.dueShort }))] })] })] }) }, t.id))) }));
}
export function BookCloud({ books }) {
    if (!books || books.length === 0) {
        return _jsx("p", { className: "text-[10px] text-muted-foreground italic", children: "Sin libros del plan para este per\u00EDodo" });
    }
    return (_jsx("div", { className: "flex flex-wrap gap-2", children: books.map(b => (_jsxs("div", { className: cn('flex items-center gap-2 rounded-xl border p-1.5 pr-2.5 max-w-[220px]', b.done ? 'border-emerald-300/60 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-border/50 bg-muted/20'), children: [b.cover ? (_jsx("img", { src: b.cover, alt: b.title, className: "w-8 h-11 rounded-md object-cover shrink-0 border border-border/40" })) : (_jsx("div", { className: "w-8 h-11 rounded-md bg-gradient-to-br from-cyan-500/30 to-sky-500/30 flex items-center justify-center shrink-0", children: _jsx(BookOpen, { className: "w-4 h-4 text-cyan-600" }) })), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-[10px] font-semibold leading-tight break-words", children: b.title }), _jsx("p", { className: "text-[8px] text-muted-foreground truncate", children: b.done ? 'Terminado' : b.pagesTotal > 0 ? `${b.pagesRead}/${b.pagesTotal} pág` : 'Pendiente' })] })] }, b.id))) }));
}
export function SongCloud({ songs }) {
    if (!songs || songs.length === 0) {
        return _jsx("p", { className: "text-[10px] text-muted-foreground italic", children: "Sin canciones del plan para este per\u00EDodo" });
    }
    return (_jsx("div", { className: "flex flex-wrap gap-1.5", children: songs.map(s => (_jsxs(Badge, { variant: "outline", className: "text-[10px] gap-1 py-1 max-w-full", children: [_jsx(Music, { className: "w-3 h-3 text-pink-500 shrink-0" }), _jsx("span", { className: "truncate max-w-[130px]", children: s.title }), _jsxs("span", { className: "text-[8px] text-muted-foreground", children: ["\u00B7 ", s.practiceMinutes, "m"] })] }, s.id))) }));
}
export function PlanDelMes({ books, songs, title = 'Plan trimestral del mes' }) {
    const hasBooks = books && books.length > 0;
    const hasSongs = songs && songs.length > 0;
    if (!hasBooks && !hasSongs)
        return null;
    return (_jsxs("div", { className: "rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm p-4", children: [_jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3", children: title }), _jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [hasBooks && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [_jsxs("p", { className: "text-[10px] text-muted-foreground flex items-center gap-1", children: [_jsx(BookOpen, { className: "w-3 h-3 text-cyan-600" }), " Libros a leer"] }), _jsxs(Badge, { variant: "outline", className: "text-[8px]", children: [books.filter(b => b.done).length, "/", books.length, " terminados"] })] }), _jsx(BookCloud, { books: books })] })), hasSongs && (_jsxs("div", { children: [_jsxs("p", { className: "text-[10px] text-muted-foreground flex items-center gap-1 mb-1.5", children: [_jsx(Music, { className: "w-3 h-3 text-pink-500" }), " Canciones a dominar"] }), _jsx(SongCloud, { songs: songs })] }))] })] }));
}
export function MinutesRow({ area, label = 'Minutos invertidos' }) {
    const goal = area.goalMinutes || 0;
    const ok = area.minutes > 0 && area.minutes >= goal;
    return (_jsx(ResultRow, { label: label, value: goal > 0 ? `${Math.round(area.minutes / 60 * 10) / 10}h / ${Math.round(goal / 60 * 10) / 10}h` : `${Math.round(area.minutes / 60 * 10) / 10}h`, ok: ok, pending: area.minutes > 0 && !ok }));
}
export function AreaEmpty({ children = 'Sin registro en el período' }) {
    return _jsx("p", { className: "text-[10px] text-muted-foreground italic", children: children });
}
export function MiniStat({ label, value, icon }) {
    return (_jsxs("div", { className: "rounded-xl border border-muted/50 p-2", children: [_jsx("div", { className: "flex items-center justify-center text-muted-foreground", children: icon }), _jsx("p", { className: "text-[11px] font-bold mt-0.5 text-center", children: value }), _jsx("p", { className: "text-[8px] text-muted-foreground text-center", children: label })] }));
}
export function StagesBar({ stages, current }) {
    return (_jsx("div", { className: "flex items-center gap-1 mt-2", children: stages.map((s, i) => (_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: cn('h-1 rounded-full', i <= current ? 'bg-rose-500' : 'bg-muted') }), _jsx("p", { className: cn('text-[8px] text-center mt-1', i === current && 'font-bold text-rose-500', i > current && 'text-muted-foreground'), children: s })] }, s))) }));
}
