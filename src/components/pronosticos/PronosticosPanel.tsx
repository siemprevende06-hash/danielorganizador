import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, addWeeks, differenceInCalendarDays, differenceInCalendarWeeks, endOfQuarter, format, isToday, startOfWeek, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { getWeekGoalEffective } from '@/lib/hierarchy';
import { AREA_SYSTEMS } from '@/lib/areaSystemsMap';
import { forecastSeries, MODEL_LABELS, type ForecastResult } from '@/lib/forecasting/holtWinters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Area, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, Label } from 'recharts';
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Compass, Gauge, Info, Lightbulb, RefreshCw, Rocket, Target } from 'lucide-react';

// ---------------------------------------------------------------------------
// Configuración de áreas: metas dinámicas desde la jerarquía (hierarchy.ts),
// con fallback a los mínimos diarios por defecto cuando no hay plan cargado.
// ---------------------------------------------------------------------------
type AreaDef = {
  id: string;
  label: string;
  weight: number;
  /** Claves de time_data que componen el área. */
  keys: string[];
  /** true: el minutos del día viene de workout_duration, no de time_data. */
  useWorkout?: boolean;
  /** Claves de la jerarquía de metas (para getWeekGoalEffective). */
  goalKeys: string[];
  /** Minutos diarios de referencia cuando no hay plan (meta = daily × days). */
  fallbackDaily: number;
  /** Días por semana del mínimo de referencia. */
  days: number;
};

const AREAS: AreaDef[] = [
  { id: 'universidad', label: 'Universidad', weight: 3, keys: ['universidad'], goalKeys: ['universidad'], fallbackDaily: 120, days: 6 },
  { id: 'emprendimiento', label: 'Emprendimiento', weight: 2.5, keys: ['emprendimiento'], goalKeys: ['emprendimiento'], fallbackDaily: 60, days: 6 },
  { id: 'proyectos', label: 'Proyectos', weight: 2, keys: ['proyectos'], goalKeys: ['proyectos'], fallbackDaily: 60, days: 5 },
  { id: 'gym', label: 'Gym', weight: 2.5, keys: [], useWorkout: true, goalKeys: ['gym'], fallbackDaily: 60, days: 5 },
  { id: 'idiomas', label: 'Idiomas', weight: 2, keys: ['idiomas', 'italiano', 'ingles'], goalKeys: ['italiano', 'ingles'], fallbackDaily: 30, days: 7 },
  { id: 'lectura', label: 'Lectura', weight: 1.5, keys: ['lectura'], goalKeys: ['lectura'], fallbackDaily: 20, days: 7 },
  { id: 'musica', label: 'Música', weight: 1, keys: ['musica', 'piano', 'guitarra'], goalKeys: ['musica'], fallbackDaily: 30, days: 6 },
  { id: 'ajedrez', label: 'Ajedrez', weight: 0.5, keys: ['ajedrez'], goalKeys: ['ajedrez'], fallbackDaily: 15, days: 7 },
];

/** Días de historial diario (16 semanas: margen para el backtesting de HW). */
const HIST_DAYS = 112;
/** Semanas mostradas en el eje X del gráfico y en las tarjetas por área. */
const HIST_WEEKS = 12;
/** z de una cola del 10% (banda 80% ≈ ±1.2816·σ). */
const Z80 = 1.28155;

type TrackingRow = {
  tracking_date: string;
  time_data: Record<string, number> | null;
  workout_duration: number | null;
  skipped: Record<string, boolean> | null;
  rest: Record<string, boolean> | null;
};

const areaValue = (a: AreaDef, r?: TrackingRow): number => {
  if (!r) return 0;
  if (a.useWorkout) return Number(r.workout_duration) || 0;
  return a.keys.reduce((s, k) => s + (Number(r.time_data?.[k]) || 0), 0);
};

/** Página de detalle del sistema a partir de un área de la jerarquía. */
function sistemaPageFor(areaId: string): string {
  const keys = areaId === 'gym' ? ['gym'] : areaId === 'idiomas' ? ['idiomas', 'italiano', 'ingles'] : [areaId];
  for (const [pageId, cfg] of Object.entries(AREA_SYSTEMS)) {
    if (keys.some(k => cfg.hierarchyAreas.includes(k))) return `/sistemas/${pageId}`;
  }
  return '/systems';
}

// ---------------------------------------------------------------------------
// Helpers numéricos
// ---------------------------------------------------------------------------
const erf = (x: number) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
const probAbove = (mean: number, goal: number, sd: number) => sd <= 0 ? (mean >= goal ? 95 : 5) : Math.round(Math.min(97, Math.max(3, 50 * (1 + erf((mean - goal) / (sd * Math.SQRT2))))));
const h = (m: number) => m >= 60 ? `${(m / 60).toFixed(1)} h` : `${Math.round(m)} min`;

function light(pct: number) {
  if (pct >= 85) return { dot: '🟢', cls: 'text-green-600 dark:text-green-400', label: 'En ruta' };
  if (pct >= 55) return { dot: '🟡', cls: 'text-amber-600 dark:text-amber-400', label: 'En riesgo' };
  return { dot: '🔴', cls: 'text-red-600 dark:text-red-400', label: 'Fuera de ruta' };
}

/** Suma de los últimos `n` valores (ventana móvil final). */
const tailSum = (arr: number[], n = 7) => arr.slice(-Math.min(n, arr.length)).reduce((a, b) => a + b, 0);

/** σ semanal derivado de las bandas 80% del pronóstico (últimos 7 pasos). */
function tailSd(fc: ForecastResult): number {
  const idx = fc.forecast.map((_, i) => i).slice(-Math.min(7, fc.forecast.length));
  if (!idx.length) return 1;
  const widths = idx.map(i => (fc.bands[i].upper80 - fc.bands[i].lower80) / (2 * Z80));
  return Math.max(1, widths.reduce((a, b) => a + b, 0) / widths.length);
}

/** Agrupa la serie diaria del pronóstico en sumas semanales futuras (+bandas). */
function groupFutureWeeks(fc: ForecastResult, anchor: Date, curWeekStart: Date, weekCount: number) {
  const weekly = Array(weekCount).fill(0);
  const lo80 = Array(weekCount).fill(0);
  const hi80 = Array(weekCount).fill(0);
  const lo95 = Array(weekCount).fill(0);
  const hi95 = Array(weekCount).fill(0);
  for (let i = 0; i < fc.forecast.length; i++) {
    const w = differenceInCalendarWeeks(addDays(anchor, i + 1), curWeekStart, { weekStartsOn: 1 }) - 1;
    if (w < 0 || w >= weekCount) continue;
    weekly[w] += fc.forecast[i];
    lo80[w] += fc.bands[i].lower80;
    hi80[w] += fc.bands[i].upper80;
    lo95[w] += fc.bands[i].lower95;
    hi95[w] += fc.bands[i].upper95;
  }
  return { weekly, lo80, hi80, lo95, hi95 };
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export function PronosticosPanel({ anchorDate }: { anchorDate?: Date }) {
  const anchor = useMemo(() => anchorDate ?? new Date(), [anchorDate]);
  const anchorStr = format(anchor, 'yyyy-MM-dd');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [rows, setRows] = useState<TrackingRow[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    const start = format(subDays(anchor, HIST_DAYS - 1), 'yyyy-MM-dd');
    supabase.from('daily_systems_tracking')
      .select('tracking_date, time_data, workout_duration, skipped, rest')
      .gte('tracking_date', start).lte('tracking_date', anchorStr)
      .order('tracking_date', { ascending: true })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) { setRows([]); setStatus('error'); return; }
        setRows((data as unknown as TrackingRow[]) || []);
        setStatus('ready');
      }, () => { if (alive) { setRows([]); setStatus('error'); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorStr, reloadKey]);

  const retry = useCallback(() => setReloadKey(k => k + 1), []);

  const model = useMemo(() => {
    if (status !== 'ready') return null;

    const curWeekStart = startOfWeek(anchor, { weekStartsOn: 1 });
    const week0 = startOfWeek(subDays(anchor, (HIST_WEEKS - 1) * 7), { weekStartsOn: 1 });
    // fracción transcurrida de la semana actual para no penalizarla
    const elapsed = Math.min(7, Math.max(1, Math.round((anchor.getTime() - curWeekStart.getTime()) / 86400000) + 1)) / 7;
    const qEnd = endOfQuarter(anchor);
    const horizonWeeks = Math.max(1, differenceInCalendarWeeks(qEnd, curWeekStart, { weekStartsOn: 1 }));
    const horizonDays = Math.max(1, differenceInCalendarDays(qEnd, anchor));

    const byDate = new Map<string, TrackingRow>();
    rows.forEach(r => byDate.set(r.tracking_date, r));
    const dateKeys: string[] = [];
    for (let i = HIST_DAYS - 1; i >= 0; i--) dateKeys.push(format(subDays(anchor, i), 'yyyy-MM-dd'));

    const weightSum = AREAS.reduce((s, a) => s + a.weight, 0);

    // --- metas semanales dinámicas (plan jerárquico, con fallback) ---
    let usedFallback = false;
    const goalFor = (a: AreaDef, weekStart: Date): number => {
      const dyn = a.goalKeys.reduce((s, k) => s + (getWeekGoalEffective(weekStart, k) || 0), 0);
      if (dyn > 0) return dyn;
      usedFallback = true;
      return a.fallbackDaily * a.days;
    };
    const weeklyGoal: Record<string, number> = Object.fromEntries(AREAS.map(a => [a.id, goalFor(a, curWeekStart)]));
    const totalGoal = AREAS.reduce((s, a) => s + weeklyGoal[a.id], 0);

    // --- series diarias (densas) e históricos semanales ---
    const dailySeries: Record<string, number[]> = {};
    const weekly: Record<string, number[]> = {};
    AREAS.forEach(a => {
      dailySeries[a.id] = dateKeys.map(k => areaValue(a, byDate.get(k)));
      weekly[a.id] = Array(HIST_WEEKS).fill(0);
    });
    rows.forEach(r => {
      const d = new Date(r.tracking_date + 'T12:00:00');
      const w = differenceInCalendarWeeks(d, week0, { weekStartsOn: 1 });
      if (w < 0 || w >= HIST_WEEKS) return;
      AREAS.forEach(a => { weekly[a.id][w] += areaValue(a, r); });
    });
    AREAS.forEach(a => { weekly[a.id][HIST_WEEKS - 1] = weekly[a.id][HIST_WEEKS - 1] / elapsed; });

    // --- pronóstico Holt-Winters por área y total (serie diaria) ---
    const forecasts: Record<string, ForecastResult> = {};
    AREAS.forEach(a => { forecasts[a.id] = forecastSeries(dailySeries[a.id], { horizon: horizonDays, minObservations: 21 }); });
    const totalDaily = dateKeys.map((_, i) => AREAS.reduce((s, a) => s + dailySeries[a.id][i], 0));
    const totalFc = forecastSeries(totalDaily, { horizon: horizonDays, minObservations: 21 });

    const areaFuture: Record<string, ReturnType<typeof groupFutureWeeks>> = {};
    AREAS.forEach(a => { areaFuture[a.id] = groupFutureWeeks(forecasts[a.id], anchor, curWeekStart, horizonWeeks); });
    const totalFuture = groupFutureWeeks(totalFc, anchor, curWeekStart, horizonWeeks);

    // --- días de descanso marcados en la semana actual (por área) ---
    const restThisWeek = (a: AreaDef): number => {
      const restKeys = a.useWorkout ? ['gym'] : a.keys;
      let n = 0;
      rows.forEach(r => {
        if (r.tracking_date < format(curWeekStart, 'yyyy-MM-dd') || r.tracking_date > anchorStr) return;
        if (restKeys.some(k => r.rest?.[k])) n++;
      });
      return n;
    };

    // --- modelo por área ---
    const areas = AREAS.map(a => {
      const ys = weekly[a.id];
      const goal = weeklyGoal[a.id];
      const recent = ys.slice(-4).reduce((s, v) => s + v, 0) / 4;
      const prev = ys.slice(-8, -4).reduce((s, v) => s + v, 0) / 4;
      const pct = goal ? Math.round((recent / goal) * 100) : 0;
      const delta = prev > 0 ? (recent - prev) / prev : recent > 0 ? 1 : 0;
      const gap = Math.max(0, goal - recent);
      const fc = forecasts[a.id];
      const projEnd = tailSum(fc.forecast); // run-rate semanal al cierre del trimestre
      const sd = tailSd(fc);
      const prob = probAbove(projEnd, goal, sd);
      const mean = ys.reduce((s, v) => s + v, 0) / ys.length;
      const std = Math.sqrt(ys.reduce((s, v) => s + (v - mean) ** 2, 0) / ys.length);
      const last = ys[ys.length - 1];
      const rests = restThisWeek(a);
      const alert =
        last < mean - 1.5 * std && mean > 0 && rests === 0 ? 'Caída anómala esta semana'
        : pct < 40 ? 'Muy por debajo del mínimo'
        : delta < -0.25 ? `Bajó ${Math.round(-delta * 100)}% vs 4 sem. previas`
        : null;
      const impact = Math.round((a.weight / weightSum) * 100 * (gap / Math.max(goal, 1)) * 10) / 10 + (a.weight / weightSum) * 20;
      const effort = Math.round(gap / a.days);
      return {
        ...a, ys, goal, recent, projEnd, prob, pct, delta, gap, alert, rests,
        futureWeekly: areaFuture[a.id].weekly,
        impact: Math.round(impact * 10) / 10, effort, minPerDay: Math.ceil(gap / a.days),
      };
    });

    // --- totales, escenarios accionables y palancas ---
    const totalHist = Array.from({ length: HIST_WEEKS }, (_, i) => areas.reduce((s, a) => s + a.ys[i], 0));
    const recentTotal = totalHist.slice(-4).reduce((s, v) => s + v, 0) / 4;
    const baseEnd = tailSum(totalFc.forecast);
    const sdTotal = tailSd(totalFc);
    const levers = [...areas].filter(a => a.gap > 0).sort((a, b) => (b.impact / Math.max(1, b.effort)) - (a.impact / Math.max(1, a.effort))).slice(0, 5);
    const gapTop2 = levers.slice(0, 2).reduce((s, l) => s + l.gap, 0);
    const gapTop3 = levers.slice(0, 3).reduce((s, l) => s + l.gap, 0);
    const metaCierre = AREAS.reduce((s, a) => s + goalFor(a, addWeeks(curWeekStart, horizonWeeks)), 0);
    const cap = metaCierre * 1.15;
    const scenarios = [
      {
        id: 'Base', desc: 'El modelo seleccionado por validación proyecta el cierre sin cambios.',
        end: baseEnd, prob: probAbove(baseEnd, metaCierre, sdTotal),
        actions: ['Mantener rutina actual', 'Sin nuevas palancas'],
      },
      {
        id: 'Acelerado', desc: 'Cierras el 50% de la brecha de las 2 palancas principales en 4 semanas y la sostienes.',
        end: Math.min(cap, baseEnd + gapTop2 * 0.5), prob: probAbove(Math.min(cap, baseEnd + gapTop2 * 0.5), metaCierre, sdTotal * 1.1),
        actions: levers.slice(0, 2).map(l => `${l.label}: +${Math.ceil(l.minPerDay / 2)} min/día`),
      },
      {
        id: 'Agresivo', desc: 'Cierras el 100% de la brecha de las 3 palancas principales en 4 semanas.',
        end: Math.min(cap, baseEnd + gapTop3), prob: probAbove(Math.min(cap, baseEnd + gapTop3), metaCierre, sdTotal * 1.3),
        actions: levers.slice(0, 3).map(l => `${l.label}: +${l.minPerDay} min/día (cerrar brecha)`),
      },
    ];
    const weeklyNeeded = horizonWeeks > 0 ? Math.max(0, (totalGoal - recentTotal) / horizonWeeks) : 0;

    // --- datos del gráfico semanal (histórico + pronóstico con bandas) ---
    const chart: Array<Record<string, unknown>> = [
      ...totalHist.map((v, i) => ({
        label: format(addWeeks(week0, i), 'd MMM', { locale: es }),
        real: Math.round(v),
        meta: Math.round(AREAS.reduce((s, a) => s + goalFor(a, addWeeks(week0, i)), 0)),
        base: i === HIST_WEEKS - 1 ? Math.round(v) : null,
        acelerado: i === HIST_WEEKS - 1 ? Math.round(v) : null,
        agresivo: i === HIST_WEEKS - 1 ? Math.round(v) : null,
      })),
      ...Array.from({ length: horizonWeeks }, (_, j) => {
        const k = j + 1;
        const ramp = Math.min(1, k / 4);
        return {
          label: format(addWeeks(curWeekStart, k), 'd MMM', { locale: es }),
          meta: Math.round(AREAS.reduce((s, a) => s + goalFor(a, addWeeks(curWeekStart, k)), 0)),
          base: Math.round(totalFuture.weekly[j]),
          range95: [Math.round(totalFuture.lo95[j]), Math.round(totalFuture.hi95[j])] as [number, number],
          range80: [Math.round(totalFuture.lo80[j]), Math.round(totalFuture.hi80[j])] as [number, number],
          acelerado: Math.round(Math.min(cap, totalFuture.weekly[j] + gapTop2 * 0.5 * ramp)),
          agresivo: Math.round(Math.min(cap, totalFuture.weekly[j] + gapTop3 * ramp)),
        };
      }),
    ];

    return {
      areas, chart, totalGoal, metaCierre, recentTotal, baseEnd, scenarios, levers,
      horizonWeeks, qEnd, weeklyNeeded, usedFallback, totalFc,
      trendWeekly: totalFc.trend * 7,
    };
  }, [rows, status, anchor, anchorStr]);

  // -------------------------------------------------------------------------
  // Estados de carga y error
  // -------------------------------------------------------------------------
  if (status === 'loading') {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Calculando pronóstico">
        <Skeleton className="h-6 w-56" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (status === 'error' || !model) {
    return (
      <Card className="border-red-500/30">
        <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <p className="text-sm font-semibold">No se pudieron cargar los datos del pronóstico</p>
          <p className="text-xs text-muted-foreground">Revisa la conexión e inténtalo de nuevo.</p>
          <Button variant="outline" size="sm" onClick={retry}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { areas, chart, totalGoal, metaCierre, recentTotal, baseEnd, scenarios, levers, horizonWeeks, qEnd, weeklyNeeded, usedFallback, totalFc, trendWeekly } = model;
  const gapPct = metaCierre ? Math.round((baseEnd / metaCierre) * 100) : 0;
  const g = light(gapPct);
  const worst = [...areas].sort((a, b) => a.pct * a.weight - b.pct * b.weight)[0];
  const falling = areas.filter(a => a.delta < -0.1);
  const working = [...areas].filter(a => a.pct >= 85 || a.delta > 0.15);
  const alerts = areas.filter(a => a.alert);
  const quadrant = (l: typeof areas[number]) => l.effort <= 20 ? (l.impact >= 8 ? 'Victoria rápida' : 'Relleno') : (l.impact >= 8 ? 'Proyecto clave' : 'Evitar');
  const anchorLabel = isToday(anchor) ? 'hoy' : format(anchor, 'd MMM', { locale: es });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Compass className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold tracking-tight">Tablero de dirección</h2>
        <Badge variant="outline" className="text-[10px] font-mono">Meta: {format(qEnd, "d MMM yyyy", { locale: es })} · {horizonWeeks} sem</Badge>
        {usedFallback && (
          <Badge variant="secondary" className="text-[10px] gap-1" title="No hay plan de metas cargado; se usan los mínimos diarios por defecto.">
            <Info className="h-3 w-3" /> metas por defecto
          </Badge>
        )}
      </div>

      <Tabs defaultValue="resumen">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="resumen" className="text-xs">Resumen</TabsTrigger>
          <TabsTrigger value="escenarios" className="text-xs">Escenarios</TabsTrigger>
          <TabsTrigger value="palancas" className="text-xs">Palancas</TabsTrigger>
        </TabsList>

        {/* ===================== RESUMEN ===================== */}
        <TabsContent value="resumen" className="space-y-4 mt-3">
          {/* Panel de brecha */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { l: 'Ritmo actual', v: h(recentTotal) + '/sem', s: 'Promedio últimas 4 semanas' },
              { l: 'Meta semanal', v: h(totalGoal) + '/sem', s: usedFallback ? 'Mínimos por defecto (sin plan)' : 'Del plan jerárquico actual' },
              { l: 'Dónde estarás', v: h(baseEnd) + '/sem', s: `${gapPct}% de la meta al cierre`, cls: g.cls },
              { l: 'Ritmo mínimo', v: `+${h(weeklyNeeded)}`, s: 'a sumar cada semana' },
            ].map(k => (
              <Card key={k.l}><CardContent className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.l}</p>
                <p className={cn('text-xl font-bold font-mono mt-1', k.cls)}>{k.v}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{k.s}</p>
              </CardContent></Card>
            ))}
          </div>

          {/* Línea de tiempo con bandas de confianza */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                <Target className="h-4 w-4 text-primary" />Histórico, pronóstico y bandas de confianza
                <span className="ml-auto text-xs font-normal">{g.dot} {g.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${Math.round(v / 60)}h`} />
                    <Tooltip
                      formatter={(v: number | number[], n: string) => {
                        if (n === 'range95' || n === 'range80') {
                          const r = Array.isArray(v) ? v : null;
                          return r ? [`${h(r[0])} – ${h(r[1])}`, n === 'range80' ? 'Banda 80%' : 'Banda 95%'] : ['—', n];
                        }
                        return [h(Number(v)), n];
                      }}
                      contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <ReferenceLine x={chart[HIST_WEEKS - 1]?.label} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2"><Label value={anchorLabel} position="top" fontSize={9} /></ReferenceLine>
                    <Area dataKey="range95" name="range95" stroke="none" fill="#f59e0b" fillOpacity={0.12} isAnimationActive={false} />
                    <Area dataKey="range80" name="range80" stroke="none" fill="#f59e0b" fillOpacity={0.22} isAnimationActive={false} />
                    <Line dataKey="meta" name="Meta" stroke="hsl(142 70% 40%)" strokeDasharray="6 3" dot={false} strokeWidth={1.5} />
                    <Line dataKey="real" name="Real" stroke="hsl(var(--foreground))" strokeWidth={2.5} dot={{ r: 2 }} connectNulls={false} />
                    <Line dataKey="base" name="Pronóstico" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 3" dot={false} strokeWidth={2} connectNulls={false} />
                    <Line dataKey="acelerado" name="Acelerado" stroke="hsl(var(--primary))" dot={false} strokeWidth={1.5} connectNulls={false} />
                    <Line dataKey="agresivo" name="Agresivo" stroke="hsl(38 92% 50%)" dot={false} strokeWidth={1.5} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-3 flex-wrap px-1 text-[10px] text-muted-foreground">
                <Badge variant="outline" className="text-[9px] font-normal gap-1">Modelo: {MODEL_LABELS[totalFc.model]}</Badge>
                <span>MAPE validado: {Number.isFinite(totalFc.mape) ? `${totalFc.mape.toFixed(0)}%` : '—'}</span>
                <span>Confianza: <b className={totalFc.confidence === 'alta' ? 'text-green-600' : totalFc.confidence === 'media' ? 'text-amber-600' : 'text-red-500'}>{totalFc.confidence}</b></span>
                {totalFc.reason && <span className="text-amber-600 flex items-center gap-1"><Info className="h-3 w-3" />{totalFc.reason}</span>}
              </div>
              <p className="text-[10px] text-muted-foreground px-1 pb-1">
                Banda ámbar = intervalo de confianza del pronóstico (80% y 95%), derivado de los residuos reales del backtesting walk-forward, no de una fórmula asumida.
              </p>
            </CardContent>
          </Card>

          {/* Tendencias por área */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" />Tendencia por sistema (minutos/semana)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {areas.map(a => {
                const l = light(a.pct);
                const Dir = a.delta > 0.08 ? ArrowUpRight : a.delta < -0.08 ? ArrowDownRight : ArrowRight;
                const data = [
                  ...a.ys.map(v => ({ v: Math.round(v) })),
                  { v: Math.round(a.ys[a.ys.length - 1]), f: Math.round(a.ys[a.ys.length - 1]) },
                  ...a.futureWeekly.slice(0, 4).map(w => ({ f: Math.round(w) })),
                ];
                return (
                  <Link key={a.id} to={sistemaPageFor(a.id)} className="rounded-xl border border-border/60 p-2.5 hover:border-primary/50 hover:bg-muted/30 transition-colors block">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>{l.dot}</span><span className="font-semibold">{a.label}</span>
                      <Dir className={cn('h-3.5 w-3.5', l.cls)} />
                      <span className="ml-auto font-mono text-muted-foreground">{h(a.recent)} / {h(a.goal)}</span>
                    </div>
                    <div className="h-12 mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                          <ReferenceLine y={a.goal} stroke="hsl(142 70% 40%)" strokeDasharray="3 3" />
                          <YAxis hide domain={[0, (dMax: number) => Math.max(dMax, a.goal) * 1.1]} />
                          <Line dataKey="v" stroke="hsl(var(--foreground))" dot={false} strokeWidth={1.5} connectNulls={false} />
                          <Line dataKey="f" stroke="hsl(var(--primary))" strokeDasharray="3 2" dot={false} strokeWidth={1.5} connectNulls={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {a.pct}% de la meta · {a.delta >= 0 ? '+' : ''}{Math.round(a.delta * 100)}% vs mes previo
                      {a.rests > 0 && <span className="text-amber-600"> · {a.rests} día{a.rests > 1 ? 's' : ''} de descanso</span>}
                    </p>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Alertas */}
          {alerts.length > 0 && (
            <Card className="border-red-500/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />Alertas tempranas</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {alerts.map(a => <p key={a.id} className="text-xs">🔴 <b>{a.label}</b> — {a.alert}</p>)}
              </CardContent>
            </Card>
          )}

          {/* Diagnóstico */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Diagnóstico de la brecha</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed">
              <p><b>¿Qué te aleja de la meta?</b> {falling.length ? `${falling.map(f => f.label).join(', ')} van a la baja.` : 'Ninguna área cae; el problema es el nivel, no la dirección.'} La mayor brecha ponderada está en <b>{worst?.label}</b> ({worst?.pct}% de su meta).</p>
              <p><b>¿Qué cambiar y cuánto?</b> {worst?.label}: pasar de {h(worst?.recent || 0)} a {h(worst?.goal || 0)} por semana (≈ +{worst?.minPerDay} min en {worst?.days} días).</p>
              <p><b>Ritmo mínimo:</b> la tendencia total es {trendWeekly >= 0 ? '+' : ''}{Math.round(trendWeekly)} min/sem por semana; necesitas +{Math.round(weeklyNeeded)} min/sem cada semana durante {horizonWeeks} semanas (≈ {h(weeklyNeeded * 4)} más al mes).</p>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card className="border-primary/30">
            <CardContent className="p-3 space-y-1 text-xs">
              <p>🟢 <b>Funciona:</b> {working.map(w => w.label).join(', ') || 'aún ninguna área sostiene su meta'}.</p>
              <p>🔴 <b>Frena:</b> {worst?.label} ({worst?.pct}%){falling.length ? ` y la caída en ${falling.map(f => f.label).join(', ')}` : ''}.</p>
              <p>🎯 <b>Esta semana:</b> {levers[0] ? `${levers[0].label} +${Math.ceil(levers[0].minPerDay / 2)} min/día en bloque fijo` : 'mantener el ritmo'}; meta total {h(Math.min(totalGoal, recentTotal + weeklyNeeded))}.</p>
              <p className="text-[10px] text-muted-foreground pt-1">Supuestos: metas = plan jerárquico (fallback a mínimos diarios); modelo = Holt-Winters seleccionado por backtesting walk-forward sobre series diarias de 16 semanas.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== ESCENARIOS ===================== */}
        <TabsContent value="escenarios" className="space-y-4 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {scenarios.map(s => {
              const l = light(s.prob);
              return (
                <Card key={s.id}><CardContent className="p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5"><Rocket className="h-3.5 w-3.5 text-primary" /><span className="text-sm font-bold">{s.id}</span><span className={cn('ml-auto text-xs font-mono', l.cls)}>{l.dot} {s.prob}%</span></div>
                  <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                  <p className="text-xs">Cierre: <b className="font-mono">{h(s.end)}/sem</b> ({Math.round((s.end / Math.max(1, metaCierre)) * 100)}% de la meta al cierre)</p>
                  <ul className="text-[11px] list-disc pl-4 space-y-0.5">{s.actions.length ? s.actions.map(a => <li key={a}>{a}</li>) : <li className="text-muted-foreground">Sin acciones adicionales</li>}</ul>
                </CardContent></Card>
              );
            })}
          </div>

          {/* Plan 4 semanas */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Plan de aceleración · 4 semanas</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="font-semibold">Mantener</p><p className="text-muted-foreground">{working.map(w => w.label).join(', ') || '—'}</p></div>
                <div><p className="font-semibold">Aumentar</p><p className="text-muted-foreground">{levers.slice(0, 2).map(w => w.label).join(', ') || '—'}</p></div>
                <div><p className="font-semibold">Empezar</p><p className="text-muted-foreground">{areas.filter(a => a.recent === 0).map(a => a.label).join(', ') || 'Revisión semanal de 15 min el domingo'}</p></div>
                <div><p className="font-semibold">Eliminar</p><p className="text-muted-foreground">Tareas triviales que ocupen bloques de {levers[0]?.label || 'trabajo'}</p></div>
              </div>
              <table className="w-full">
                <thead className="text-muted-foreground text-[10px] uppercase"><tr className="text-left"><th className="py-1">Semana</th><th>Objetivo total</th><th>🟢 si ≥</th><th>🔴 si &lt;</th></tr></thead>
                <tbody>
                  {[1, 2, 3, 4].map(w => {
                    const target = Math.min(totalGoal, recentTotal + weeklyNeeded * w);
                    return <tr key={w} className="border-t border-border/50"><td className="py-1.5">S{w}</td><td className="font-mono">{h(target)}</td><td className="font-mono">{h(target)}</td><td className="font-mono">{h(target * 0.8)}</td></tr>;
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== PALANCAS ===================== */}
        <TabsContent value="palancas" className="space-y-4 mt-3">
          {/* Mapa de palancas */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Mapa de palancas: impacto vs esfuerzo</CardTitle></CardHeader>
            <CardContent className="h-56 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 16, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" dataKey="effort" name="Esfuerzo" unit=" min/día" tick={{ fontSize: 9 }} />
                  <YAxis type="number" dataKey="impact" name="Impacto" tick={{ fontSize: 9 }} />
                  <ZAxis range={[80, 80]} />
                  <ReferenceLine x={20} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                  <ReferenceLine y={8} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                  <Tooltip content={({ payload }) => {
                    const p = payload?.[0]?.payload as (typeof areas[number]) | undefined;
                    return p ? <div className="rounded-md border bg-card px-2 py-1 text-[11px]"><b>{p.label}</b><br />+{p.effort} min/día · impacto {p.impact}</div> : null;
                  }} />
                  <Scatter data={areas} fill="hsl(var(--primary))" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top 5 palancas */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">5 palancas de mayor apalancamiento</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground text-[10px] uppercase"><tr className="text-left"><th className="py-1">Área</th><th>Acción</th><th>Esfuerzo</th><th>Impacto</th><th>Respuesta</th><th>Cuadrante</th></tr></thead>
                <tbody>
                  {levers.length === 0 && <tr><td colSpan={6} className="py-2 text-muted-foreground">Todas las áreas cumplen su meta. 🟢</td></tr>}
                  {levers.map(l => (
                    <tr key={l.id} className="border-t border-border/50">
                      <td className="py-1.5 font-semibold"><Link to={sistemaPageFor(l.id)} className="hover:text-primary hover:underline">{l.label}</Link></td>
                      <td>+{l.minPerDay} min en {l.days} días/sem, en bloque fijo</td>
                      <td className="font-mono">{l.effort} min/día</td>
                      <td className="font-mono">{l.impact}</td>
                      <td>{l.effort <= 20 ? '1 semana' : '2–3 semanas'}</td>
                      <td>{quadrant(l)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
