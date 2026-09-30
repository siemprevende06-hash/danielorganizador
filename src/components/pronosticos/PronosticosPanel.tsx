import { useEffect, useMemo, useState } from 'react';
import { addWeeks, differenceInCalendarWeeks, endOfQuarter, format, startOfWeek, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, Label } from 'recharts';
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Compass, Gauge, Lightbulb, Rocket, Target } from 'lucide-react';

type AreaDef = { id: string; label: string; daily: number; days: number; weight: number; get: (r: any) => number };
const td = (r: any, k: string) => Number(r?.time_data?.[k]) || 0;

const AREAS: AreaDef[] = [
  { id: 'universidad', label: 'Universidad', daily: 120, days: 6, weight: 3, get: r => td(r, 'universidad') },
  { id: 'emprendimiento', label: 'Emprendimiento', daily: 60, days: 6, weight: 2.5, get: r => td(r, 'emprendimiento') },
  { id: 'proyectos', label: 'Proyectos', daily: 60, days: 5, weight: 2, get: r => td(r, 'proyectos') },
  { id: 'gym', label: 'Gym', daily: 60, days: 5, weight: 2.5, get: r => Number(r?.workout_duration) || 0 },
  { id: 'idiomas', label: 'Idiomas', daily: 30, days: 7, weight: 2, get: r => td(r, 'idiomas') + td(r, 'italiano') + td(r, 'ingles') },
  { id: 'lectura', label: 'Lectura', daily: 20, days: 7, weight: 1.5, get: r => td(r, 'lectura') },
  { id: 'musica', label: 'Música', daily: 30, days: 6, weight: 1, get: r => td(r, 'musica') + td(r, 'piano') + td(r, 'guitarra') },
  { id: 'ajedrez', label: 'Ajedrez', daily: 15, days: 7, weight: 0.5, get: r => td(r, 'ajedrez') },
];

const HIST_WEEKS = 12;

function linreg(ys: number[]) {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 0, sd: 0 };
  const xm = (n - 1) / 2, ym = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  ys.forEach((y, x) => { num += (x - xm) * (y - ym); den += (x - xm) ** 2; });
  const slope = den ? num / den : 0, intercept = ym - slope * xm;
  const sd = Math.sqrt(ys.reduce((a, y, x) => a + (y - (intercept + slope * x)) ** 2, 0) / Math.max(1, n - 2));
  return { slope, intercept, sd };
}
const erf = (x: number) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
const probAbove = (mean: number, goal: number, sd: number) => sd <= 0 ? (mean >= goal ? 95 : 5) : Math.round(Math.min(97, Math.max(3, 50 * (1 + erf((mean - goal) / (sd * Math.SQRT2))))));
const h = (m: number) => m >= 60 ? `${(m / 60).toFixed(1)} h` : `${Math.round(m)} min`;

function light(pct: number) {
  if (pct >= 85) return { dot: '🟢', cls: 'text-green-600 dark:text-green-400', label: 'En ruta' };
  if (pct >= 55) return { dot: '🟡', cls: 'text-amber-600 dark:text-amber-400', label: 'En riesgo' };
  return { dot: '🔴', cls: 'text-red-600 dark:text-red-400', label: 'Fuera de ruta' };
}

export function PronosticosPanel({ anchorDate }: { anchorDate?: Date }) {
  const anchor = anchorDate ?? new Date();
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    let alive = true;
    const start = format(startOfWeek(subDays(anchor, HIST_WEEKS * 7), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    supabase.from('daily_systems_tracking').select('tracking_date, time_data, workout_duration')
      .gte('tracking_date', start).lte('tracking_date', format(anchor, 'yyyy-MM-dd'))
      .then(({ data }) => { if (alive) setRows(data || []); }, () => alive && setRows([]));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format(anchor, 'yyyy-MM-dd')]);

  const model = useMemo(() => {
    if (!rows) return null;
    const week0 = startOfWeek(subDays(anchor, (HIST_WEEKS - 1) * 7), { weekStartsOn: 1 });
    const curWeekStart = startOfWeek(anchor, { weekStartsOn: 1 });
    // fracción transcurrida de la semana actual para no penalizarla
    const elapsed = Math.min(7, Math.max(1, Math.round((anchor.getTime() - curWeekStart.getTime()) / 86400000) + 1)) / 7;
    const weekly: Record<string, number[]> = Object.fromEntries(AREAS.map(a => [a.id, Array(HIST_WEEKS).fill(0)]));
    rows.forEach(r => {
      const d = new Date(r.tracking_date + 'T12:00:00');
      const w = differenceInCalendarWeeks(d, week0, { weekStartsOn: 1 });
      if (w < 0 || w >= HIST_WEEKS) return;
      AREAS.forEach(a => { weekly[a.id][w] += a.get(r); });
    });
    AREAS.forEach(a => { weekly[a.id][HIST_WEEKS - 1] = weekly[a.id][HIST_WEEKS - 1] / elapsed; });

    const qEnd = endOfQuarter(anchor);
    const horizon = Math.max(1, differenceInCalendarWeeks(qEnd, curWeekStart, { weekStartsOn: 1 }));
    const weightSum = AREAS.reduce((s, a) => s + a.weight, 0);

    const areas = AREAS.map(a => {
      const ys = weekly[a.id];
      const goal = a.daily * a.days;
      const recent = ys.slice(-4).reduce((s, v) => s + v, 0) / 4;
      const prev = ys.slice(-8, -4).reduce((s, v) => s + v, 0) / 4;
      const { slope, intercept, sd } = linreg(ys);
      const projEnd = Math.max(0, intercept + slope * (HIST_WEEKS - 1 + horizon));
      const pct = goal ? Math.round((recent / goal) * 100) : 0;
      const delta = prev > 0 ? (recent - prev) / prev : recent > 0 ? 1 : 0;
      const gap = Math.max(0, goal - recent);
      const mean = ys.reduce((s, v) => s + v, 0) / ys.length;
      const std = Math.sqrt(ys.reduce((s, v) => s + (v - mean) ** 2, 0) / ys.length);
      const last = ys[ys.length - 1];
      const alert = last < mean - 1.5 * std && mean > 0 ? 'Caída anómala esta semana' : pct < 40 ? 'Muy por debajo del mínimo' : delta < -0.25 ? `Bajó ${Math.round(-delta * 100)}% vs 4 sem. previas` : null;
      // impacto: peso × brecha relativa ; esfuerzo: minutos extra/día necesarios
      const impact = Math.round((a.weight / weightSum) * 100 * (gap / Math.max(goal, 1)) * 10) / 10 + (a.weight / weightSum) * 20;
      const effort = Math.round(gap / a.days);
      return { ...a, ys, goal, recent, slope, sd, projEnd, pct, delta, gap, alert, impact: Math.round(impact * 10) / 10, effort, minPerDay: Math.ceil(gap / a.days) };
    });

    const totalHist = Array.from({ length: HIST_WEEKS }, (_, i) => areas.reduce((s, a) => s + a.ys[i], 0));
    const totalGoal = areas.reduce((s, a) => s + a.goal, 0);
    const reg = linreg(totalHist);
    const recentTotal = totalHist.slice(-4).reduce((s, v) => s + v, 0) / 4;
    const baseAt = (k: number) => Math.max(0, reg.intercept + reg.slope * (HIST_WEEKS - 1 + k));
    const accelStep = (totalGoal - recentTotal) > 0 ? 0.08 : 0;
    const aggrStep = (totalGoal - recentTotal) > 0 ? 0.15 : 0;
    const scen = (step: number) => (k: number) => Math.min(totalGoal * 1.15, recentTotal * Math.pow(1 + step, k));

    const chart = [
      ...totalHist.map((v, i) => ({ label: format(addWeeks(week0, i), 'd MMM', { locale: es }), real: Math.round(v), meta: totalGoal, ...(i === HIST_WEEKS - 1 ? { base: Math.round(v), acelerado: Math.round(v), agresivo: Math.round(v) } : {}) })),
      ...Array.from({ length: horizon }, (_, j) => {
        const k = j + 1;
        return { label: format(addWeeks(curWeekStart, k), 'd MMM', { locale: es }), meta: totalGoal, base: Math.round(baseAt(k)), acelerado: Math.round(scen(accelStep)(k)), agresivo: Math.round(scen(aggrStep)(k)) };
      }),
    ];
    const baseEnd = baseAt(horizon), accEnd = scen(accelStep)(horizon), aggEnd = scen(aggrStep)(horizon);
    const sd = Math.max(reg.sd, recentTotal * 0.1);
    const scenarios = [
      { id: 'Base', desc: 'Sin cambios: sigues la tendencia de las últimas 12 semanas.', end: baseEnd, prob: probAbove(baseEnd, totalGoal, sd), actions: ['Mantener rutina actual', 'Sin nuevas palancas'] },
      { id: 'Acelerado', desc: '+8% de minutos por semana, sostenible.', end: accEnd, prob: probAbove(accEnd, totalGoal, sd * 1.1), actions: [] as string[] },
      { id: 'Agresivo', desc: '+15% por semana, máximo realista.', end: aggEnd, prob: probAbove(aggEnd, totalGoal, sd * 1.3), actions: [] as string[] },
    ];
    const levers = [...areas].filter(a => a.gap > 0).sort((a, b) => (b.impact / Math.max(1, b.effort)) - (a.impact / Math.max(1, a.effort))).slice(0, 5);
    scenarios[1].actions = levers.slice(0, 2).map(l => `${l.label}: +${Math.ceil(l.minPerDay / 2)} min/día`);
    scenarios[2].actions = levers.slice(0, 3).map(l => `${l.label}: +${l.minPerDay} min/día (cerrar brecha)`);
    const weeklyNeeded = horizon > 0 ? Math.max(0, (totalGoal - recentTotal) / horizon) : 0;

    return { areas, chart, totalGoal, recentTotal, baseEnd, scenarios, levers, horizon, qEnd, weeklyNeeded, slope: reg.slope };
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!model) return <div className="h-64 grid place-items-center text-sm text-muted-foreground">Calculando pronóstico…</div>;

  const { areas, chart, totalGoal, recentTotal, baseEnd, scenarios, levers, horizon, qEnd, weeklyNeeded, slope } = model;
  const gapPct = totalGoal ? Math.round((baseEnd / totalGoal) * 100) : 0;
  const g = light(gapPct);
  const worst = [...areas].sort((a, b) => a.pct * a.weight - b.pct * b.weight)[0];
  const falling = areas.filter(a => a.delta < -0.1);
  const working = [...areas].filter(a => a.pct >= 85 || a.delta > 0.15);
  const alerts = areas.filter(a => a.alert);
  const quadrant = (l: typeof areas[number]) => l.effort <= 20 ? (l.impact >= 8 ? 'Victoria rápida' : 'Relleno') : (l.impact >= 8 ? 'Proyecto clave' : 'Evitar');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Compass className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold tracking-tight">Tablero de dirección</h2>
        <Badge variant="outline" className="ml-auto text-[10px] font-mono">Meta: {format(qEnd, "d MMM yyyy", { locale: es })} · {horizon} sem</Badge>
      </div>

      {/* Panel de brecha */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { l: 'Ritmo actual', v: h(recentTotal) + '/sem', s: 'Promedio últimas 4 semanas' },
          { l: 'Meta semanal', v: h(totalGoal) + '/sem', s: 'Suma de mínimos diarios' },
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

      {/* Línea de tiempo */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Histórico, predicción y escenarios <span className="ml-auto text-xs font-normal">{g.dot} {g.label}</span></CardTitle></CardHeader>
        <CardContent className="h-72 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${Math.round(v / 60)}h`} />
              <Tooltip formatter={(v: any, n: any) => [h(Number(v)), n]} contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <ReferenceLine x={chart[HIST_WEEKS - 1]?.label} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2"><Label value="hoy" position="top" fontSize={9} /></ReferenceLine>
              <Line dataKey="meta" name="Meta" stroke="hsl(142 70% 40%)" strokeDasharray="6 3" dot={false} strokeWidth={1.5} />
              <Line dataKey="real" name="Real" stroke="hsl(var(--foreground))" strokeWidth={2.5} dot={{ r: 2 }} />
              <Line dataKey="base" name="Base" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 3" dot={false} strokeWidth={2} />
              <Line dataKey="acelerado" name="Acelerado" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
              <Line dataKey="agresivo" name="Agresivo" stroke="hsl(38 92% 50%)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tendencias por área */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" />Tendencia por sistema (minutos/semana)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {areas.map(a => {
            const l = light(a.pct);
            const Dir = a.delta > 0.08 ? ArrowUpRight : a.delta < -0.08 ? ArrowDownRight : ArrowRight;
            const data = [...a.ys.map(v => ({ v: Math.round(v) })), ...Array.from({ length: 4 }, (_, k) => ({ f: Math.max(0, Math.round(a.ys[a.ys.length - 1] + a.slope * (k + 1))) }))];
            data[a.ys.length - 1] = { ...data[a.ys.length - 1], f: data[a.ys.length - 1].v } as any;
            return (
              <div key={a.id} className="rounded-xl border border-border/60 p-2.5">
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
                      <Line dataKey="v" stroke="hsl(var(--foreground))" dot={false} strokeWidth={1.5} />
                      <Line dataKey="f" stroke="hsl(var(--primary))" strokeDasharray="3 2" dot={false} strokeWidth={1.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted-foreground">{a.pct}% de la meta · {a.delta >= 0 ? '+' : ''}{Math.round(a.delta * 100)}% vs mes previo</p>
              </div>
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
          <p><b>Ritmo mínimo:</b> la tendencia total es {slope >= 0 ? '+' : ''}{Math.round(slope)} min/sem por semana; necesitas +{Math.round(weeklyNeeded)} min/sem cada semana durante {horizon} semanas (≈ {h(weeklyNeeded * 4)} más al mes).</p>
        </CardContent>
      </Card>

      {/* Escenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {scenarios.map(s => {
          const l = light(s.prob);
          return (
            <Card key={s.id}><CardContent className="p-3 space-y-1.5">
              <div className="flex items-center gap-1.5"><Rocket className="h-3.5 w-3.5 text-primary" /><span className="text-sm font-bold">{s.id}</span><span className={cn('ml-auto text-xs font-mono', l.cls)}>{l.dot} {s.prob}%</span></div>
              <p className="text-[11px] text-muted-foreground">{s.desc}</p>
              <p className="text-xs">Cierre: <b className="font-mono">{h(s.end)}/sem</b> ({Math.round((s.end / Math.max(1, totalGoal)) * 100)}%)</p>
              <ul className="text-[11px] list-disc pl-4 space-y-0.5">{s.actions.map(a => <li key={a}>{a}</li>)}</ul>
            </CardContent></Card>
          );
        })}
      </div>

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
              <Tooltip content={({ payload }) => payload?.[0] ? <div className="rounded-md border bg-card px-2 py-1 text-[11px]"><b>{(payload[0].payload as any).label}</b><br />+{(payload[0].payload as any).effort} min/día · impacto {(payload[0].payload as any).impact}</div> : null} />
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
                  <td className="py-1.5 font-semibold">{l.label}</td>
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

      {/* Resumen */}
      <Card className="border-primary/30">
        <CardContent className="p-3 space-y-1 text-xs">
          <p>🟢 <b>Funciona:</b> {working.map(w => w.label).join(', ') || 'aún ninguna área sostiene su meta'}.</p>
          <p>🔴 <b>Frena:</b> {worst?.label} ({worst?.pct}%){falling.length ? ` y la caída en ${falling.map(f => f.label).join(', ')}` : ''}.</p>
          <p>🎯 <b>Esta semana:</b> {levers[0] ? `${levers[0].label} +${Math.ceil(levers[0].minPerDay / 2)} min/día en bloque fijo` : 'mantener el ritmo'}; meta total {h(Math.min(totalGoal, recentTotal + weeklyNeeded))}.</p>
          <p className="text-[10px] text-muted-foreground pt-1">Supuestos: meta = mínimos diarios de cada sistema al cierre del trimestre; pesos por prioridad del área; modelo = tendencia lineal de 12 semanas reales.</p>
        </CardContent>
      </Card>
    </div>
  );
}
