import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Activity, Gauge, Save, Scale, Target, Layers, TrendingUp, CalendarCheck, CheckCircle2, Timer, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { useResultadosPeriodo, EMPTY_RESULTADO, AREA_ORDER, type AreaKey } from '@/hooks/useResultadosPeriodo';
import { useDailyReview } from '@/hooks/useDailyReview';
import { usePeriodicReview, type ReviewType } from '@/hooks/usePeriodicReview';
import { getDayGoalEffective, getDayGoalTotal, getQuarterFromDate } from '@/lib/hierarchy';
import { ReflectionForm } from '@/components/self-review/ReflectionForm';
import { OverallRating } from '@/components/self-review/OverallRating';
import { EnergySleepCheckin } from '@/components/today/EnergySleepCheckin';
import { StreaksTendencias } from '@/components/autocritica/StreaksTendencias';
import { ComparativaTrimestres } from '@/components/control/ComparativaTrimestres';
import { AutocriticaAreaCards, type AutocriticaAreaRow } from '@/components/autocritica/AutocriticaAreaCards';
import { AutocriticaCoachCard } from '@/components/autocritica/AutocriticaCoachCard';
import { useAreaCovers } from '@/hooks/useAreaCovers';
import { cn } from '@/lib/utils';

const AREA_LABELS: Record<string, string> = {
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
const SCOPE_LABELS: Record<string, string> = { day: 'Hoy', week: 'Semana', month: 'Mes', quarter: 'Trimestre', year: 'Año' };

const verdictGlobal = (pct: number) =>
  pct >= 90
    ? { label: 'Excelente', cls: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' }
    : pct >= 75
      ? { label: 'Muy bien', cls: 'text-teal-600 bg-teal-500/10 border-teal-500/30' }
      : pct >= 60
        ? { label: 'Aceptable', cls: 'text-amber-600 bg-amber-500/10 border-amber-500/30' }
        : pct >= 40
          ? { label: 'Regular', cls: 'text-orange-600 bg-orange-500/10 border-orange-500/30' }
          : { label: 'Insuficiente', cls: 'text-destructive bg-destructive/10 border-destructive/30' };

const verdictColor = (pct: number) =>
  pct >= 90 ? '#10b981' : pct >= 75 ? '#14b8a6' : pct >= 60 ? '#f59e0b' : pct >= 40 ? '#f97316' : '#ef4444';

const verdictMsgFor = (pct: number, e: number | null, res: number | null, hasPlan: boolean) => {
  if (!hasPlan) return 'No hay plan planificado para este período. Define metas de minutos, tareas y sistemas para poder medir tu desempeño.';
  const base =
    pct >= 90
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

interface AutocriticaSectionProps {
  start?: Date;
  end?: Date;
  scope?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  planGoals?: Record<string, number> | null;
}

function ScoreRing({ value, color, size = 140, thickness = 13 }: { value: number; color: string; size?: number; thickness?: number }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(Math.max(value, 0), 100) / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className="stroke-white/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          className="transition-all duration-700"
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tabular-nums" style={{ color }}>{Math.round(value)}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">/100</span>
      </div>
    </div>
  );
}

export function AutocriticaSection({ start: startProp, end: endProp, scope = 'week', planGoals }: AutocriticaSectionProps) {
  const ref = startProp ?? new Date();
  const start = startProp ?? ref;
  const end = endProp ?? ref;
  const { data } = useResultadosPeriodo(start, end);
  const r = data ?? EMPTY_RESULTADO;
  const isDay = scope === 'day';
  const quarterRef = getQuarterFromDate(start);
  const dateStr = format(start, 'yyyy-MM-dd');
  const dayReview = useDailyReview(dateStr);
  const periodicType: ReviewType =
    scope === 'month' ? 'monthly' :
    scope === 'quarter' ? 'quarterly' : 'weekly';
  const periodic = usePeriodicReview(periodicType, start);
  const { covers } = useAreaCovers();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [ratingDraft, setRatingDraft] = useState<number | null>(null);
  const p = periodic.review;
  const field = (k: string) => (draft[k] !== undefined ? draft[k] : (p?.[k] || ''));
  const rating = ratingDraft ?? p?.overall_rating ?? 0;

  const savePeriodic = () => {
    if (!p) return;
    periodic.saveReview({
      wins: field('wins'),
      struggles: field('struggles'),
      lessons_learned: field('lessons_learned'),
      next_period_focus: field('next_period_focus'),
      overall_rating: ratingDraft ?? p.overall_rating ?? null,
    });
  };

  // Meta (plan) por área: para el día se usa el objetivo configurado en la
  // planificación (planGoals guardado o jerarquía de metas) en lugar de los
  // time_goal_minutes de daily_area_stats, que pueden quedar desactualizados.
  const dayGoalForArea = (k: AreaKey): number => {
    if (!isDay) return r.byArea[k].goalMinutes || 0;
    let g = 0;
    if (k === 'idiomas') {
      if (planGoals) g = (planGoals.italiano || 0) + (planGoals.ingles || 0);
      if (g <= 0) g = getDayGoalEffective(start, 'italiano') + getDayGoalEffective(start, 'ingles');
    } else if (planGoals && (planGoals[k] || 0) > 0) {
      g = planGoals[k]!;
    } else {
      g = getDayGoalEffective(start, k);
    }
    return g > 0 ? g : (r.byArea[k].goalMinutes || 0);
  };

  const rows: AutocriticaAreaRow[] = AREA_ORDER
    .map((k) => {
      const area = r.byArea[k];
      let resultDone = area?.done || 0;
      let resultTotal = area?.total || 0;
      let resultUnit = 'tareas';
      if (k === 'lectura' && r.lectura.pagesGoal > 0) {
        resultDone = r.lectura.pages;
        resultTotal = r.lectura.pagesGoal;
        resultUnit = 'páginas';
      } else if (resultTotal === 0 && k === 'idiomas' && r.idiomas.skillCoverage.length > 0) {
        resultDone = r.idiomas.skillCoverage.length;
        resultTotal = 6;
        resultUnit = 'habilidades';
      } else if (resultTotal === 0 && k === 'musica' && r.songs.length > 0) {
        resultDone = r.musica.songs;
        resultTotal = r.songs.length;
        resultUnit = 'canciones';
      }
      return {
        key: k,
        label: AREA_LABELS[k] || k,
        plan: dayGoalForArea(k),
        real: area?.minutes || 0,
        resultDone,
        resultTotal,
        resultUnit,
      };
    })
    .filter((x) => x.plan > 0 || x.real > 0 || x.resultTotal > 0);

  // Para el día, el plan total es el mismo total del recuadro "Metas de minutos
  // del día"; en scopes mayores se suma el plan de cada área del período.
  const planTotal = isDay ? getDayGoalTotal(start, planGoals) : rows.reduce((s, x) => s + x.plan, 0);
  const realTotal = rows.reduce((s, x) => s + x.real, 0);
  const overallPct = planTotal > 0 ? Math.round((realTotal / planTotal) * 100) : 0;
  const hasPlan = planTotal > 0 || r.globalTotal > 0 || r.systems.total > 0 || r.lectura.pagesGoal > 0 || r.books.length > 0;
  const minPct = planTotal > 0 ? Math.round((realTotal / planTotal) * 100) : null;
  const sysPct = r.systems.total > 0 ? Math.round((r.systems.done / r.systems.total) * 100) : null;
  const taskPct = r.globalTotal > 0 ? Math.round((r.globalDone / r.globalTotal) * 100) : null;
  const booksTotal = r.books.length;
  const booksDone = r.books.filter((b) => b.done).length;
  const bookPct = booksTotal > 0 ? Math.round((booksDone / booksTotal) * 100) : null;
  const pagePct = r.lectura.pagesGoal > 0 ? Math.round((r.lectura.pages / r.lectura.pagesGoal) * 100) : null;
  const avgPct = (list: (number | null)[]) => {
    const v = list.filter((x): x is number => x != null);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  };
  // Esfuerzo = % de minutos realizados vs planificados (misma lógica que el
  // Panel de control). Los sistemas solo se usan como respaldo cuando no hay plan de minutos.
  const esfuerzoPct = minPct ?? sysPct;
  const resultadosPct = avgPct([taskPct, bookPct, pagePct]);
  const scorePct = avgPct([esfuerzoPct, resultadosPct]) ?? 0;
  const verdict = verdictGlobal(scorePct);
  const verdictMsg = verdictMsgFor(scorePct, esfuerzoPct, resultadosPct, hasPlan);
  const scopeLabel = SCOPE_LABELS[scope] || scope;

  const scoredDays = r.perDay.filter((d) => d.score > 0);
  const bestDay = scoredDays.length ? Math.max(...scoredDays.map((d) => d.score)) : null;
  const worstDay = scoredDays.length ? Math.min(...scoredDays.map((d) => d.score)) : null;

  const areaSummary = rows
    .map((row) => {
      const effort = row.plan > 0
        ? `${row.real}/${row.plan} min (${Math.round((row.real / row.plan) * 100)}%)`
        : `${row.real} min`;
      const result = row.resultTotal > 0
        ? `${row.resultDone}/${row.resultTotal} ${row.resultUnit} (${Math.round((row.resultDone / row.resultTotal) * 100)}%)`
        : 'sin objetivo marcable';
      return `- ${row.label}: esfuerzo ${effort}; resultado ${result}`;
    })
    .join('\n');

  const reflectionSummary = (isDay
    ? [
        dayReview.review?.whatWentWell && `Qué salió bien: ${dayReview.review.whatWentWell}`,
        dayReview.review?.whatCouldBeBetter && `Qué puedo mejorar: ${dayReview.review.whatCouldBeBetter}`,
        dayReview.review?.tomorrowPlan && `Plan de mañana: ${dayReview.review.tomorrowPlan}`,
        dayReview.review?.overallRating ? `Valoración del día: ${dayReview.review.overallRating}/10` : null,
        dayReview.review?.energyRating ? `Energía: ${dayReview.review.energyRating}/10` : null,
        dayReview.review?.sleepRating ? `Sueño: ${dayReview.review.sleepRating}/10` : null,
      ]
    : [
        field('wins') && `Triunfos: ${field('wins')}`,
        field('struggles') && `Dificultades: ${field('struggles')}`,
        field('lessons_learned') && `Aprendizajes: ${field('lessons_learned')}`,
        field('next_period_focus') && `Foco del próximo período: ${field('next_period_focus')}`,
        rating > 0 ? `Valoración: ${rating}/10` : null,
      ])
    .filter(Boolean)
    .join('\n');

  const coachContext = [
    `Contexto de autocrítica (${scopeLabel.toLowerCase()}):`,
    `- Score: ${scorePct}/100 (${verdict.label})`,
    `- Esfuerzo: ${esfuerzoPct != null ? `${esfuerzoPct}%` : 'sin plan'} · ${realTotal}/${planTotal} min`,
    `- Resultados: ${resultadosPct != null ? `${resultadosPct}%` : 'sin datos'} · Tareas ${r.globalDone}/${r.globalTotal} · Sistemas ${r.systems.done}/${r.systems.total}`,
    pagePct != null ? `- Lectura: ${r.lectura.pages}/${r.lectura.pagesGoal} páginas` : null,
    booksTotal > 0 ? `- Libros: ${booksDone}/${booksTotal} completados` : null,
    bestDay != null && worstDay != null ? `- Mejor día: ${bestDay} · Peor día: ${worstDay}` : null,
    areaSummary ? `Áreas:\n${areaSummary}` : null,
    reflectionSummary ? `Reflexión:\n${reflectionSummary}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const kpi = (label: string, value: React.ReactNode, icon: React.ReactNode, tone: string, sub?: React.ReactNode) => (
    <div className="rounded-2xl border border-border/50 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-sm p-3.5 flex items-start gap-3 transition-all hover:shadow-md">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', tone)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-lg font-bold tabular-nums leading-tight truncate">{value}</p>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        {sub && <p className="text-[9px] text-muted-foreground/70 truncate">{sub}</p>}
      </div>
    </div>
  );

  const kpis = [
    kpi('Plan (min)', planTotal, <Timer className="h-4 w-4" />, 'bg-primary/10 text-primary'),
    kpi('Realizado (min)', realTotal, <Activity className="h-4 w-4" />, 'bg-indigo-500/10 text-indigo-500', `Cumplimiento ${overallPct}%`),
    kpi('Tareas', r.globalTotal > 0 ? `${r.globalDone}/${r.globalTotal}` : '—', <CheckCircle2 className="h-4 w-4" />, 'bg-emerald-500/10 text-emerald-600', taskPct != null ? `${taskPct}% completadas` : undefined),
    kpi('Sistemas', r.systems.total > 0 ? `${r.systems.done}/${r.systems.total}` : '—', <Scale className="h-4 w-4" />, 'bg-violet-500/10 text-violet-500', sysPct != null ? `${sysPct}% de días` : undefined),
    ...(booksTotal > 0 ? [kpi('Libros', `${booksDone}/${booksTotal}`, <BookOpen className="h-4 w-4" />, 'bg-rose-500/10 text-rose-500', bookPct != null ? `${bookPct}%` : undefined)] : []),
    ...(pagePct != null ? [kpi('Páginas', `${pagePct}%`, <BookOpen className="h-4 w-4" />, 'bg-cyan-500/10 text-cyan-600', `${r.lectura.pages} leídas`)] : []),
    ...(r.reviews.count > 0 ? [kpi('Rating', `${r.reviews.avgRating.toFixed(1)}/10`, <Gauge className="h-4 w-4" />, 'bg-amber-500/10 text-amber-600', `${r.reviews.count} revisiones`)] : []),
  ];

  const heroCard = (
    <Card className="border-0 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 text-white shadow-xl shadow-slate-900/10 relative">
      <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full" style={{ background: `radial-gradient(circle, ${verdictColor(scorePct)}33, transparent 70%)` }} />
      <div className="absolute -bottom-24 -left-12 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl" />
      <CardContent className="relative p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Autocrítica · {scopeLabel}</p>
            <h2 className="text-lg font-bold mt-0.5">Score del período</h2>
          </div>
          <Badge className="text-[11px] bg-white/10 border-white/20" style={{ color: verdictColor(scorePct) }}>
            {verdict.label}
          </Badge>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreRing value={scorePct} color={verdictColor(scorePct)} />
          <div className="flex-1 w-full space-y-3">
            <div className="rounded-2xl bg-white/10 p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-white/85"><Activity className="h-3.5 w-3.5 text-emerald-400" /> Esfuerzo</span>
                <span className="font-bold tabular-nums">{esfuerzoPct != null ? `${esfuerzoPct}%` : '—'}</span>
              </div>
              <Progress value={Math.min(esfuerzoPct ?? 0, 100)} className="h-2 bg-white/15" indicatorClassName="bg-gradient-to-r from-emerald-400 to-teal-300" />
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-white/85"><Target className="h-3.5 w-3.5 text-fuchsia-400" /> Resultados</span>
                <span className="font-bold tabular-nums">{resultadosPct != null ? `${resultadosPct}%` : '—'}</span>
              </div>
              <Progress value={Math.min(resultadosPct ?? 0, 100)} className="h-2 bg-white/15" indicatorClassName="bg-gradient-to-r from-fuchsia-400 to-pink-300" />
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span className="rounded-full bg-white/10 px-2.5 py-1 tabular-nums">Promedio diario <b>{r.score}%</b></span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 tabular-nums">Días activos <b>{scoredDays.length}</b></span>
              {bestDay != null && <span className="rounded-full bg-emerald-400/15 text-emerald-300 px-2.5 py-1 tabular-nums">Mejor día <b>{bestDay}</b></span>}
              {worstDay != null && <span className="rounded-full bg-rose-400/15 text-rose-300 px-2.5 py-1 tabular-nums">Peor día <b>{worstDay}</b></span>}
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2.5 text-[11px] leading-snug text-white/90 backdrop-blur-sm">
              {verdictMsg}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const kpiGrid = kpis.length > 0 && (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {kpis}
    </div>
  );

  const chartData = r.perDay;

  const trendCard = !isDay && (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-sky-500 to-indigo-500" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sky-500" />
            <h2 className="text-sm font-semibold">Evolución del score diario</h2>
          </div>
          {scoredDays.length >= 2 && bestDay != null && worstDay != null && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <Badge variant="outline" className="text-emerald-600 text-[10px]">▲ {bestDay}</Badge>
              <Badge variant="outline" className="text-destructive text-[10px]">▼ {worstDay}</Badge>
            </div>
          )}
        </div>
        {chartData.length > 1 ? (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="acScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid hsl(var(--border))' }}
                  formatter={(v) => [`${v}`, 'Score']}
                  labelFormatter={(l) => `Día ${l}`}
                  cursor={{ stroke: 'rgba(0,0,0,0.15)' }}
                />
                <ReferenceLine y={r.score} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#acScoreGrad)" dot={{ r: 2.5, fill: '#0ea5e9', strokeWidth: 0 }} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-10">
            Registra actividad en más días de la semana para ver la tendencia.
          </p>
        )}
      </CardContent>
    </Card>
  );

  const consAreas = periodic.consistency.filter((c) => c.daysActive > 0);
  const consistencyCard = !isDay && consAreas.length > 0 && (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
      <CardContent className="p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold">Consistencia por área</h2>
          <Badge variant="secondary" className="text-[10px] ml-auto">días activos</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {consAreas.map((c) => (
            <div key={c.area} className="rounded-xl bg-muted/30 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate">{c.label}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{c.daysActive}/{c.totalDays} · <b className={cn(c.percentage >= 60 ? 'text-emerald-600' : c.percentage >= 40 ? 'text-amber-600' : 'text-destructive')}>{c.percentage}%</b></span>
              </div>
              <Progress value={Math.min(c.percentage, 100)} className="h-1.5"
                indicatorClassName={cn(c.percentage >= 60 ? 'bg-emerald-500' : c.percentage >= 40 ? 'bg-amber-500' : 'bg-destructive')} />
              {c.totalMinutes != null && c.totalMinutes > 0 && (
                <p className="text-[9px] text-muted-foreground tabular-nums">{c.totalMinutes} min</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const indicator = (label: string, icon: React.ReactNode, pct: number | null, sub?: React.ReactNode) => (
    <div className="rounded-xl bg-muted/30 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
        <span className="text-lg font-bold tabular-nums">{pct != null ? `${pct}%` : '—'}</span>
      </div>
      <Progress value={Math.min(pct ?? 0, 100)} className="h-1.5" />
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  );

  const fieldRow = (label: string, k: string, placeholder: string) => (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <Textarea
        value={field(k)}
        onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
        placeholder={placeholder}
        className="min-h-[64px] text-xs"
      />
    </div>
  );

  const rowsContent = rows.length === 0
    ? (
        <p className="text-xs text-muted-foreground text-center py-6 rounded-2xl border border-dashed border-border/60">
          Sin metas planificadas ni actividad registrada para este período.
        </p>
      )
    : (
        <AutocriticaAreaCards rows={rows} covers={covers} />
      );

  const rowsCard = (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold">Áreas — Esfuerzo + objetivos</h2>
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {rows.length} {rows.length === 1 ? 'área' : 'áreas'}
          </Badge>
        </div>
        {rowsContent}
      </CardContent>
    </Card>
  );

  const dayReflection = (
    <>
      <EnergySleepCheckin
        energyRating={dayReview.review?.energyRating || 0}
        sleepRating={dayReview.review?.sleepRating || 0}
        sleepHours={dayReview.review?.sleepHours || 0}
        onEnergyChange={(v) => dayReview.saveReview({ energyRating: v })}
        onSleepChange={(v) => dayReview.saveReview({ sleepRating: v })}
        onSleepHoursChange={(v) => dayReview.saveReview({ sleepHours: v })}
      />
      <ReflectionForm
        whatWentWell={dayReview.review?.whatWentWell || ''}
        whatCouldBeBetter={dayReview.review?.whatCouldBeBetter || ''}
        tomorrowPlan={dayReview.review?.tomorrowPlan || ''}
        onWhatWentWellChange={(v) => dayReview.saveReview({ whatWentWell: v })}
        onWhatCouldBeBetterChange={(v) => dayReview.saveReview({ whatCouldBeBetter: v })}
        onTomorrowPlanChange={(v) => dayReview.saveReview({ tomorrowPlan: v })}
      />
      <OverallRating
        rating={dayReview.review?.overallRating || 0}
        onRatingChange={(v) => dayReview.saveReview({ overallRating: v })}
      />
    </>
  );

  const periodReflection = (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reflexión del período</h3>
        <Button onClick={savePeriodic} disabled={periodic.saving} size="sm" className="gap-1.5 h-7 text-[10px]">
          <Save className="h-3 w-3" />
          {periodic.saving ? 'Guardando...' : 'Guardar Autocrítica'}
        </Button>
      </div>
      {fieldRow('Triunfos', 'wins', '¿Qué salió bien?')}
      {fieldRow('Dificultades', 'struggles', '¿Qué no salió como planeaste?')}
      {fieldRow('Aprendizajes', 'lessons_learned', '¿Qué aprendiste?')}
      {fieldRow('Foco del próximo período', 'next_period_focus', '¿En qué te vas a enfocar ahora?')}
      <OverallRating rating={rating} onRatingChange={setRatingDraft} />
    </>
  );

  const reflectionCard = (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
      <CardContent className="p-4 space-y-4">
        {isDay ? dayReflection : periodReflection}
      </CardContent>
    </Card>
  );

  const coachSuggestions = isDay
    ? [
        'Analiza mi día y dime qué mejorar.',
        '¿Qué debería priorizar mañana?',
        'Dame un plan concreto para recuperar lo pendiente.',
        '¿Cómo convierto mi esfuerzo en resultados?',
      ]
    : [
        `Analiza mi ${scopeLabel.toLowerCase()} y dime qué ajustar.`,
        '¿Qué debería priorizar el próximo período?',
        'Dame un plan concreto para recuperar lo pendiente.',
        '¿Cómo convierto mi esfuerzo en resultados?',
      ];

  const coachCard = (
    <AutocriticaCoachCard
      context={coachContext}
      scopeLabel={scopeLabel}
      suggestions={coachSuggestions}
    />
  );

  return (
    <div className="space-y-5">
      {heroCard}
      {kpiGrid}
      {trendCard}
      {consistencyCard}
      {scope === 'week' && <StreaksTendencias weekStart={start} />}
      {scope === 'quarter' && <ComparativaTrimestres quarter={quarterRef.quarter} year={quarterRef.year} />}
      {rowsCard}
      {reflectionCard}
      {coachCard}
    </div>
  );
}
