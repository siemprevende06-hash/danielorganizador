import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Activity, Gauge, Save, Scale, Target, Layers, TrendingUp,
  CalendarCheck, CheckCircle2, BookOpen, NotebookPen,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
import { SystemDataCards } from '@/components/inicio2/SystemDataCards';
import { useAreaCovers } from '@/hooks/useAreaCovers';
import type { Timeframe } from '@/contexts/TimeframeContext';
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

function ScoreRing({ value, color, size = 136, thickness = 12 }: { value: number; color: string; size?: number; thickness?: number }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${Math.round(clamped)} de 100`}
    >
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
        <span className="text-4xl font-black tabular-nums" style={{ color }}>{Math.round(clamped)}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">/100</span>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {badge}
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={cn('grid h-8 w-8 place-items-center rounded-xl bg-muted', accent)}>{icon}</span>
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums leading-none">{value}</p>
      {sub && <p className="mt-1 truncate text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function AutocriticaSection({ start: startProp, end: endProp, scope = 'week', planGoals }: AutocriticaSectionProps) {
  // Fecha estable de respaldo: evita recrear `Date` en cada render cuando la
  // sección se usa sin props (por ejemplo, desde WeeklyView).
  const [fallbackDate] = useState(() => new Date());
  const ref = startProp ?? fallbackDate;
  const start = startProp ?? ref;
  const end = endProp ?? ref;
  const { data } = useResultadosPeriodo(start, end);
  const r = data ?? EMPTY_RESULTADO;
  const isDay = scope === 'day';
  const isYear = scope === 'year';
  const quarterRef = getQuarterFromDate(start);
  const dateStr = format(start, 'yyyy-MM-dd');
  // La reseña diaria solo se consulta/guarda cuando la vista es de un día.
  const dayReview = useDailyReview(dateStr, { enabled: isDay });
  const periodicType: ReviewType =
    scope === 'month' ? 'monthly' :
    scope === 'quarter' ? 'quarterly' : 'weekly';
  // El año no tiene tipo propio en periodic_reviews: se oculta la reseña y se
  // calcula consistencia con el rango completo del año.
  const periodic = usePeriodicReview(periodicType, start, {
    enabled: !isDay && !isYear,
    range: isYear ? { start, end } : undefined,
    includeConsistency: !isDay,
  });
  const { covers } = useAreaCovers();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [ratingDraft, setRatingDraft] = useState<number | null>(null);
  const p = periodic.review;
  const field = (k: string) => (draft[k] !== undefined ? draft[k] : (p?.[k] || ''));
  const rating = ratingDraft ?? p?.overall_rating ?? 0;

  // Al cambiar de período se descartan los borradores; si no, el texto de una
  // semana podía aparecer en otra hasta que terminara de cargar la reseña.
  const draftKey = `${scope}:${dateStr}:${periodic.periodStart}:${periodic.periodEnd}`;
  useEffect(() => {
    setDraft({});
    setRatingDraft(null);
  }, [draftKey]);

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
  const hasPlan = planTotal > 0 || r.globalTotal > 0 || r.systems.total > 0 || r.lectura.pagesGoal > 0 || r.books.length > 0;
  const minPct = planTotal > 0 ? Math.round((realTotal / planTotal) * 100) : null;
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
  // Panel de control). Los check-ins de sistemas no sirven como respaldo: no se
  // guardan las casillas no marcadas, así que siempre darían 100%.
  // Cada componente se acota a 0–100 antes de promediar: el score nunca supera
  // 100 aunque se hayan registrado más minutos o tareas de las planificadas.
  const clampPct = (value: number | null) =>
    value == null ? null : Math.max(0, Math.min(100, Math.round(value)));
  const esfuerzoPct = clampPct(minPct);
  const resultadosPct = clampPct(avgPct([taskPct, bookPct, pagePct]));
  const scorePct = clampPct(avgPct([esfuerzoPct, resultadosPct])) ?? 0;
  const verdict = verdictGlobal(scorePct);
  const verdictMsg = verdictMsgFor(scorePct, esfuerzoPct, resultadosPct, hasPlan);
  const scopeLabel = SCOPE_LABELS[scope] || scope;

  const periodRangeLabel = (() => {
    if (scope === 'day') return format(start, "EEEE d 'de' MMMM", { locale: es });
    if (scope === 'month') return format(start, "MMMM 'de' yyyy", { locale: es });
    if (scope === 'quarter') return `Q${quarterRef.quarter} ${quarterRef.year}`;
    if (scope === 'year') return format(start, 'yyyy');
    return `${format(start, 'd MMM', { locale: es })} – ${format(end, 'd MMM yyyy', { locale: es })}`;
  })();

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
    `- Resultados: ${resultadosPct != null ? `${resultadosPct}%` : 'sin datos'} · Tareas ${r.globalDone}/${r.globalTotal} · Sistemas activos ${r.systems.active} (${r.systems.total} marcas)`,
    pagePct != null ? `- Lectura: ${r.lectura.pages}/${r.lectura.pagesGoal} páginas` : null,
    booksTotal > 0 ? `- Libros: ${booksDone}/${booksTotal} completados` : null,
    bestDay != null && worstDay != null ? `- Mejor día: ${bestDay} · Peor día: ${worstDay}` : null,
    areaSummary ? `Áreas:\n${areaSummary}` : null,
    reflectionSummary ? `Reflexión:\n${reflectionSummary}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const kpiItems = [
    {
      label: 'Tareas',
      value: r.globalTotal > 0 ? `${r.globalDone}/${r.globalTotal}` : '—',
      sub: taskPct != null ? `${taskPct}% completadas` : 'Sin tareas planificadas',
      icon: <CheckCircle2 className="h-4 w-4" />,
      accent: 'text-emerald-600',
    },
    {
      label: 'Sistemas',
      // `completions` solo guarda los sistemas marcados; mostrar done/total
      // daría siempre 100%. Se muestran los sistemas distintos con actividad.
      value: r.systems.active > 0 ? `${r.systems.active}` : '—',
      sub: r.systems.total > 0 ? `${r.systems.total} marcas registradas` : 'Sin sistemas',
      icon: <Scale className="h-4 w-4" />,
      accent: 'text-violet-600',
    },
    ...(booksTotal > 0 ? [{
      label: 'Biblioteca',
      value: `${booksDone}/${booksTotal}`,
      sub: bookPct != null ? `${bookPct}% completados` : undefined,
      icon: <BookOpen className="h-4 w-4" />,
      accent: 'text-rose-600',
    }] : []),
    ...(pagePct != null ? [{
      label: 'Páginas',
      value: `${pagePct}%`,
      sub: `${r.lectura.pages} leídas`,
      icon: <BookOpen className="h-4 w-4" />,
      accent: 'text-cyan-600',
    }] : []),
    ...(r.reviews.count > 0 ? [{
      label: 'Valoración',
      value: `${r.reviews.avgRating.toFixed(1)}/10`,
      sub: `${r.reviews.count} ${r.reviews.count === 1 ? 'revisión' : 'revisiones'}`,
      icon: <Gauge className="h-4 w-4" />,
      accent: 'text-amber-600',
    }] : []),
  ];

  const heroCard = (
    <Card className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 text-white shadow-xl shadow-zinc-950/10">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
        style={{ background: `radial-gradient(circle, ${verdictColor(scorePct)}2e, transparent 70%)` }}
      />
      <CardContent className="relative p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
            <Gauge className="h-3.5 w-3.5" /> Autocrítica
          </span>
          <Badge className="border-white/15 bg-white/10 text-[10px] text-white/80">{scopeLabel}</Badge>
          <span className="text-[11px] capitalize text-white/50">{periodRangeLabel}</span>
          <Badge
            className="ml-auto border-white/15 bg-white/10 text-[11px]"
            style={{ color: verdictColor(scorePct) }}
          >
            {verdict.label}
          </Badge>
        </div>

        <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
          <ScoreRing value={scorePct} color={verdictColor(scorePct)} />

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Score del período</h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/60">{verdictMsg}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 font-medium text-white/75">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" /> Esfuerzo
                </span>
                <span className="font-bold tabular-nums text-white">
                  {esfuerzoPct != null ? `${esfuerzoPct}%` : '—'}
                </span>
              </div>
              <Progress
                value={Math.min(esfuerzoPct ?? 0, 100)}
                className="h-2 bg-white/10"
                indicatorClassName="bg-gradient-to-r from-emerald-400 to-teal-300"
                aria-label="Esfuerzo"
              />
              <p className="text-[10px] text-white/45">
                {planTotal > 0 ? `${realTotal} de ${planTotal} min planificados` : 'Sin plan de minutos'}
              </p>

              <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                <span className="flex items-center gap-1.5 font-medium text-white/75">
                  <Target className="h-3.5 w-3.5 text-sky-400" /> Resultados
                </span>
                <span className="font-bold tabular-nums text-white">
                  {resultadosPct != null ? `${resultadosPct}%` : '—'}
                </span>
              </div>
              <Progress
                value={Math.min(resultadosPct ?? 0, 100)}
                className="h-2 bg-white/10"
                indicatorClassName="bg-gradient-to-r from-sky-400 to-cyan-300"
                aria-label="Resultados"
              />
              <p className="text-[10px] text-white/45">
                {r.globalTotal > 0
                  ? `${r.globalDone} de ${r.globalTotal} tareas completadas`
                  : 'Sin objetivos marcables'}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span className="rounded-full bg-white/10 px-2.5 py-1 tabular-nums text-white/70">
                Días activos <b className="text-white">{scoredDays.length}</b>
              </span>
              {bestDay != null && (
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 tabular-nums text-emerald-300">
                  Mejor día <b>{bestDay}</b>
                </span>
              )}
              {worstDay != null && (
                <span className="rounded-full bg-rose-400/15 px-2.5 py-1 tabular-nums text-rose-300">
                  Peor día <b>{worstDay}</b>
                </span>
              )}
              {scoredDays.length === 0 && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/50">Sin días con score</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const kpiGrid = kpiItems.length > 0 && (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpiItems.map((item) => (
        <KpiTile key={item.label} {...item} />
      ))}
    </div>
  );

  // En el año se muestra el promedio mensual: 365 puntos diarios no se leen.
  const chartData = scope === 'year'
    ? (() => {
        const byMonth = new Map<string, { label: string; total: number; count: number }>();
        r.perDay.forEach((d) => {
          if (d.score <= 0) return;
          const key = d.date.slice(0, 7);
          const label = format(new Date(`${d.date}T12:00:00`), 'MMM', { locale: es });
          const current = byMonth.get(key) ?? { label, total: 0, count: 0 };
          byMonth.set(key, { label, total: current.total + d.score, count: current.count + 1 });
        });
        return Array.from(byMonth.values()).map((m) => ({
          date: '',
          label: m.label,
          score: Math.round(m.total / m.count),
        }));
      })()
    : r.perDay;

  const trendCard = !isDay && (
    <Card className="rounded-3xl border-border/60 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <SectionHeader
          icon={<TrendingUp className="h-4 w-4" />}
          title="Tendencia diaria"
          description={scope === 'year' ? 'Promedio mensual del score diario.' : 'Evolución del score objetivo en el período.'}
          badge={scoredDays.length >= 2 && bestDay != null && worstDay != null ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] text-emerald-600">▲ {bestDay}</Badge>
              <Badge variant="outline" className="text-[10px] text-destructive">▼ {worstDay}</Badge>
            </div>
          ) : undefined}
        />
        {chartData.length > 1 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="acScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 12,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--popover))',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  formatter={(v) => [`${v}`, 'Score']}
                  labelFormatter={(l) => (scope === 'year' ? `${l}` : `Día ${l}`)}
                  cursor={{ stroke: 'hsl(var(--border))' }}
                />
                <ReferenceLine
                  y={scorePct}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{
                    value: 'Score período',
                    position: 'insideTopRight',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#acScoreGrad)"
                  dot={{ r: 2.5, fill: '#6366f1', strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-medium">Aún no hay suficiente actividad</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Registra actividad en al menos dos días para ver la tendencia.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const consAreas = periodic.consistency.filter((c) => c.daysActive > 0);
  const consistencyCard = !isDay && consAreas.length > 0 && (
    <Card className="rounded-3xl border-border/60 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <SectionHeader
          icon={<CalendarCheck className="h-4 w-4" />}
          title="Consistencia por área"
          description="Días con actividad registrada en el período."
          badge={<Badge variant="secondary" className="shrink-0 text-[10px]">{consAreas.length} áreas</Badge>}
        />
        <div className="space-y-3">
          {consAreas.map((c) => (
            <div key={c.area} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium">{c.label}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {c.daysActive}/{c.totalDays} ·{' '}
                  <b className={cn(
                    c.percentage >= 60 ? 'text-emerald-600' : c.percentage >= 40 ? 'text-amber-600' : 'text-destructive',
                  )}>
                    {c.percentage}%
                  </b>
                </span>
              </div>
              <Progress
                value={Math.min(c.percentage, 100)}
                className="h-1.5"
                indicatorClassName={cn(
                  c.percentage >= 60 ? 'bg-emerald-500' : c.percentage >= 40 ? 'bg-amber-500' : 'bg-destructive',
                )}
                aria-label={`Consistencia de ${c.label}`}
              />
              {c.totalMinutes != null && c.totalMinutes > 0 && (
                <p className="text-[10px] tabular-nums text-muted-foreground">{c.totalMinutes} min</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const fieldRow = (label: string, k: string, placeholder: string) => {
    const id = `autocritica-${k}`;
    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {label}
        </label>
        <Textarea
          id={id}
          value={field(k)}
          onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
          placeholder={placeholder}
          className="min-h-[96px] resize-y bg-background text-sm leading-relaxed"
        />
      </div>
    );
  };

  const rowsContent = rows.length === 0
    ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
          <p className="text-sm font-medium">Sin áreas para revisar</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No hay metas ni actividad registrada para este período.
          </p>
        </div>
      )
    : (
        <AutocriticaAreaCards rows={rows} covers={covers} />
      );

  const rowsCard = (
    <Card className="rounded-3xl border-border/60 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <SectionHeader
          icon={<Layers className="h-4 w-4" />}
          title="Áreas"
          description="Esfuerzo invertido y avance de objetivos."
          badge={(
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {rows.length} {rows.length === 1 ? 'área' : 'áreas'}
            </Badge>
          )}
        />
        {rowsContent}
      </CardContent>
    </Card>
  );

  // Los sistemas usan las mismas tarjetas que la página Metas Sistemas
  // (PlanAreaCard): una tarjeta por sistema, con portada, regla, racha y metas.
  const systemsTimeframe: Record<string, Timeframe> = {
    day: 'today',
    week: 'week',
    month: 'month',
    quarter: 'quarter',
    year: 'year',
  };

  const systemsSection = (
    <SystemDataCards timeframe={systemsTimeframe[scope] ?? 'week'} anchor={start} />
  );

  const dayReflection = (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <EnergySleepCheckin
          embedded
          energyRating={dayReview.review?.energyRating || 0}
          sleepRating={dayReview.review?.sleepRating || 0}
          sleepHours={dayReview.review?.sleepHours || 0}
          onEnergyChange={(v) => dayReview.saveReview({ energyRating: v })}
          onSleepChange={(v) => dayReview.saveReview({ sleepRating: v })}
          onSleepHoursChange={(v) => dayReview.saveReview({ sleepHours: v })}
        />
        <OverallRating
          embedded
          title="Calificación del día"
          rating={dayReview.review?.overallRating || 0}
          onRatingChange={(v) => dayReview.saveReview({ overallRating: v })}
        />
      </div>
      <div className="border-t border-border/60 pt-5">
        <ReflectionForm
          embedded
          whatWentWell={dayReview.review?.whatWentWell || ''}
          whatCouldBeBetter={dayReview.review?.whatCouldBeBetter || ''}
          tomorrowPlan={dayReview.review?.tomorrowPlan || ''}
          onWhatWentWellChange={(v) => dayReview.saveReview({ whatWentWell: v })}
          onWhatCouldBeBetterChange={(v) => dayReview.saveReview({ whatCouldBeBetter: v })}
          onTomorrowPlanChange={(v) => dayReview.saveReview({ tomorrowPlan: v })}
        />
      </div>
    </div>
  );

  const periodReflection = (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {fieldRow('Triunfos', 'wins', '¿Qué salió bien?')}
        {fieldRow('Dificultades', 'struggles', '¿Qué no salió como planeaste?')}
        {fieldRow('Aprendizajes', 'lessons_learned', '¿Qué aprendiste?')}
        {fieldRow('Foco del próximo período', 'next_period_focus', '¿En qué te vas a enfocar ahora?')}
      </div>
      <OverallRating
        embedded
        title="Calificación del período"
        rating={rating}
        onRatingChange={setRatingDraft}
      />
    </div>
  );

  // El año no guarda reseña periódica (la tabla solo admite weekly/monthly/
  // quarterly), así que se oculta la tarjeta en lugar de fingir un guardado.
  const reflectionCard = !isYear && (
    <Card className="rounded-3xl border-border/60 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-5 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeader
            icon={<NotebookPen className="h-4 w-4" />}
            title={isDay ? 'Reflexión del día' : 'Reflexión del período'}
            description={isDay
              ? 'Cierra el día con claridad y una acción concreta.'
              : 'Qué funcionó, qué ajustar y en qué enfocarte.'}
          />
          {isDay ? (
            <Badge variant="secondary" className="shrink-0 text-[10px]">Autoguardado</Badge>
          ) : (
            <Button
              onClick={savePeriodic}
              disabled={periodic.saving || periodic.loading || !p}
              size="sm"
              className="h-8 shrink-0 gap-1.5 text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              {periodic.saving ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </div>
        {isDay
          ? dayReview.loading
            ? <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            : dayReflection
          : periodic.loading
            ? <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            : periodReflection}
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

      <div className={cn('grid gap-5', !isDay && 'xl:grid-cols-12')}>
        <div className={cn('space-y-5', !isDay && 'xl:col-span-7')}>
          {rowsCard}
          {reflectionCard}
          {isDay && coachCard}
        </div>

        {!isDay && (
          <div className="space-y-5 xl:col-span-5">
            {trendCard}
            {consistencyCard}
            {scope === 'week' && <StreaksTendencias weekStart={start} />}
            {scope === 'quarter' && <ComparativaTrimestres quarter={quarterRef.quarter} year={quarterRef.year} />}
            {coachCard}
          </div>
        )}
      </div>

      {systemsSection}
    </div>
  );
}
