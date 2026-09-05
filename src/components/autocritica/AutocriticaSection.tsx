import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Activity, Gauge, Save, Scale, Target, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { useResultadosPeriodo, EMPTY_RESULTADO, AREA_ORDER } from '@/hooks/useResultadosPeriodo';
import { useDailyReview } from '@/hooks/useDailyReview';
import { usePeriodicReview } from '@/hooks/usePeriodicReview';
import { ReflectionForm } from '@/components/self-review/ReflectionForm';
import { OverallRating } from '@/components/self-review/OverallRating';
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
const SCOPE_TYPES: Record<string, string> = { week: 'weekly', month: 'monthly', quarter: 'quarterly', year: 'yearly' };

const verdictFor = (pct: number) =>
  pct >= 100
    ? { label: 'Cumplido', cls: 'text-emerald-600 bg-emerald-500/10' }
    : pct >= 60
      ? { label: 'Parcial', cls: 'text-amber-600 bg-amber-500/10' }
      : { label: 'No cumplido', cls: 'text-destructive bg-destructive/10' };

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
  start: Date;
  end: Date;
  scope: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export function AutocriticaSection({ start, end, scope }: AutocriticaSectionProps) {
  const { data } = useResultadosPeriodo(start, end);
  const r = data ?? EMPTY_RESULTADO;
  const isDay = scope === 'day';
  const dateStr = format(start, 'yyyy-MM-dd');
  const dayReview = useDailyReview(dateStr);
  const periodic = usePeriodicReview(isDay ? 'weekly' : (SCOPE_TYPES[scope] || 'weekly'), start);
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

  const rows = AREA_ORDER
    .map((k) => ({
      key: k,
      label: AREA_LABELS[k] || k,
      plan: r.byArea[k].goalMinutes || 0,
      real: r.byArea[k].minutes || 0,
      done: r.byArea[k].done || 0,
      total: r.byArea[k].total || 0,
    }))
    .filter((x) => x.plan > 0 || x.real > 0 || x.total > 0);

  const planTotal = rows.reduce((s, x) => s + x.plan, 0);
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
  const esfuerzoPct = avgPct([minPct, sysPct]);
  const resultadosPct = avgPct([taskPct, bookPct, pagePct]);
  const scorePct = avgPct([esfuerzoPct, resultadosPct]) ?? 0;
  const verdict = verdictGlobal(scorePct);
  const verdictMsg = verdictMsgFor(scorePct, esfuerzoPct, resultadosPct, hasPlan);
  const scopeLabel = SCOPE_LABELS[scope] || scope;

  const stat = (label: string, value: React.ReactNode) => (
    <div className="p-2 rounded-lg bg-muted/30">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
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

  const rowElems = rows.map((row) => {
    const effortPct = row.plan > 0 ? Math.round((row.real / row.plan) * 100) : null;
    const resultsPct = row.total > 0 ? Math.round((row.done / row.total) * 100) : null;
    const combined = [effortPct, resultsPct].filter((x): x is number => x != null);
    const combinedPct = combined.length ? Math.round(combined.reduce((a, b) => a + b, 0) / combined.length) : null;
    const v = verdictFor(combinedPct ?? 0);
    return (
      <div key={row.key} className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold flex-1 truncate">{row.label}</span>
          {row.total > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {row.done}/{row.total} tareas
            </Badge>
          )}
          {row.plan > 0 && (
            <>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">Plan {row.plan} min</span>
              <span className={cn('text-[10px] whitespace-nowrap', (effortPct ?? 0) < 100 ? 'text-destructive' : 'text-emerald-600')}>
                {row.real} min
              </span>
            </>
          )}
          {combinedPct != null && (
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', v.cls)}>
              {v.label} {combinedPct}%
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/30 p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" /> Esfuerzo
              </span>
              <span className="text-xs font-bold tabular-nums">{effortPct != null ? `${effortPct}%` : '—'}</span>
            </div>
            <Progress value={Math.min(effortPct ?? 0, 100)} className="h-1.5" />
          </div>
          <div className="rounded-lg bg-muted/30 p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Resultados
              </span>
              <span className="text-xs font-bold tabular-nums">{resultsPct != null ? `${resultsPct}%` : '—'}</span>
            </div>
            <Progress value={Math.min(resultsPct ?? 0, 100)} className="h-1.5" />
          </div>
        </div>
      </div>
    );
  });

  const rowsContent = rows.length === 0
    ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Sin metas planificadas ni actividad registrada para este período.
        </p>
      )
    : (
        <div className="space-y-3">{rowElems}</div>
      );

  const summaryCard = (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Realizado vs Plan</h2>
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {scopeLabel} · {r.globalDone}/{r.globalTotal} tareas
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {stat('Plan (min)', planTotal)}
          {stat('Realizado (min)', realTotal)}
          {stat('Cumplimiento', `${overallPct}%`)}
        </div>
        <Progress value={Math.min(overallPct, 100)} className="h-2" />
      </CardContent>
    </Card>
  );

  const chips = [
    r.globalTotal > 0 && { label: 'Tareas', value: `${r.globalDone}/${r.globalTotal}` },
    r.systems.total > 0 && { label: 'Sistemas', value: `${r.systems.done}/${r.systems.total}` },
    booksTotal > 0 && { label: 'Libros', value: `${booksDone}/${booksTotal}` },
    pagePct != null && { label: 'Páginas', value: `${pagePct}%` },
  ].filter(Boolean) as { label: string; value: string }[];

  const verdictCard = (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-semibold">Esfuerzo y Resultados</h2>
          <Badge className={cn('text-[10px] ml-auto border', verdict.cls)}>
            {verdict.label} · {scorePct}%
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {indicator('Esfuerzo', <Activity className="h-3 w-3 text-violet-500" />, esfuerzoPct, `Plan ${planTotal} min · Real ${realTotal} min`)}
          {indicator('Resultados', <Target className="h-3 w-3 text-fuchsia-500" />, resultadosPct, `Tareas ${r.globalDone}/${r.globalTotal}`)}
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <Badge key={c.label} variant="secondary" className="text-[10px]">
                {c.value} {c.label}
              </Badge>
            ))}
          </div>
        )}
        <div className={cn('rounded-xl border p-2.5 text-[11px] leading-snug', verdict.cls)}>
          {verdictMsg}
        </div>
      </CardContent>
    </Card>
  );

  const rowsCard = (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold">Áreas — Esfuerzo + Resultados vs Plan</h2>
        </div>
        {rowsContent}
      </CardContent>
    </Card>
  );

  const dayReflection = (
    <>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reflexión del día</h3>
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

  return (
    <div className="space-y-5">
      {summaryCard}
      {verdictCard}
      {rowsCard}
      {reflectionCard}
    </div>
  );
}