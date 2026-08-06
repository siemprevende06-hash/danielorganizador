import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AreaChart, Area, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MEJORA_AREAS, getAreaMinutes, type MejoraAreaId } from './mejoraAreas';
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, Flame, Target, TrendingUp } from 'lucide-react';

const PERIODS = [
  { id: 'dia', label: 'Día', days: 1 },
  { id: 'semana', label: 'Semana', days: 7 },
  { id: 'mes', label: 'Mes', days: 30 },
  { id: 'trimestre', label: 'Trimestre', days: 90 },
] as const;

const STATE_INFO = {
  fuera: {
    label: 'Fuera de control',
    desc: 'El proceso presenta causas especiales de variación. Se requiere acción inmediata.',
    text: 'text-red-500',
    card: 'border-red-500/30 bg-red-500/5',
    icon: AlertTriangle,
  },
  control: {
    label: 'En control',
    desc: 'El proceso solo presenta causas comunes de variación. Es estable y predecible.',
    text: 'text-blue-500',
    card: 'border-blue-500/30 bg-blue-500/5',
    icon: Activity,
  },
  mejora: {
    label: 'Mejora del proceso',
    desc: 'Se han reducido las causas de variación logrando un proceso más consistente y capaz.',
    text: 'text-green-500',
    card: 'border-green-500/30 bg-green-500/5',
    icon: TrendingUp,
  },
} as const;

interface Props {
  todayMinutes: Record<MejoraAreaId, number>;
  children?: ReactNode;
}

export function MejoraProcessPanel({ todayMinutes, children }: Props) {
  const [selected, setSelected] = useState<MejoraAreaId | null>(null);

  return (
    <div className="space-y-3">
      <AreaSelector selected={selected} onSelect={setSelected} />
      {selected ? (
        <AreaDetail area={selected} todayMinutes={todayMinutes} onBack={() => setSelected(null)} />
      ) : (
        children
      )}
    </div>
  );
}

function AreaSelector({ selected, onSelect }: { selected: MejoraAreaId | null; onSelect: (id: MejoraAreaId | null) => void }) {
  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {MEJORA_AREAS.map((area) => {
            const Icon = area.icon;
            const isActive = selected === area.id;
            return (
              <button
                key={area.id}
                onClick={() => onSelect(isActive ? null : area.id)}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border-2 transition-all duration-300 min-w-[84px]",
                  isActive
                    ? cn("bg-gradient-to-br scale-[1.03] text-white shadow-lg", area.gradient)
                    : "bg-transparent border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-white" : area.color)} />
                <span className={cn("text-xs font-semibold whitespace-nowrap", isActive ? "text-white" : "text-foreground")}>{area.label}</span>
                <span className={cn("text-[9px] font-mono", isActive ? "text-white/80" : "text-muted-foreground")}>{area.dailyTarget} min</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AreaDetail({ area, todayMinutes, onBack }: { area: MejoraAreaId; todayMinutes: Record<MejoraAreaId, number>; onBack: () => void }) {
  const meta = MEJORA_AREAS.find((a) => a.id === area)!;
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const [history, setHistory] = useState<any[] | null>(null);

  useEffect(() => {
    let active = true;
    const start = format(subDays(today, 119), 'yyyy-MM-dd');
    supabase
      .from('daily_systems_tracking')
      .select('tracking_date, time_data, workout_duration')
      .gte('tracking_date', start)
      .order('tracking_date', { ascending: true })
      .then(({ data }) => {
        if (active) setHistory(data || []);
      });
    return () => {
      active = false;
    };
  }, []);

  const series = useMemo(() => {
    if (!history) return null;
    const map = new Map<string, number>();
    history.forEach((row) => map.set(row.tracking_date, getAreaMinutes(row, area)));
    map.set(todayStr, todayMinutes[area] || 0);
    const arr: { date: string; minutes: number }[] = [];
    for (let i = 119; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, 'yyyy-MM-dd');
      arr.push({ date: key, minutes: map.get(key) || 0 });
    }
    return arr;
  }, [history, area, todayMinutes, todayStr, today]);

  const periodStats = useMemo(() => {
    if (!series) return null;
    return PERIODS.map((p) => {
      const slice = p.id === 'dia' ? series.slice(-1) : series.slice(-p.days);
      const done = slice.reduce((a, b) => a + b.minutes, 0);
      const target = meta.dailyTarget * p.days;
      return { ...p, done, target, pct: Math.min(100, Math.round((done / target) * 100)) };
    });
  }, [series, meta.dailyTarget]);

  const controlData = useMemo(() => {
    if (!series) return null;
    return series.slice(-30);
  }, [series]);

  const spc = useMemo(() => {
    if (!controlData) return null;
    const values = controlData.map((d) => d.minutes);
    const n = values.length;
    if (n < 3) return null;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const mrs: number[] = [];
    for (let i = 1; i < n; i++) mrs.push(Math.abs(values[i] - values[i - 1]));
    const mrBar = mrs.reduce((a, b) => a + b, 0) / mrs.length;
    const ucl = mean + 2.66 * mrBar;
    const lcl = Math.max(0, mean - 2.66 * mrBar);
    const sigma = mrBar / 1.128;
    const outPoints: number[] = [];
    values.forEach((v, i) => {
      if (v > ucl || v < lcl) outPoints.push(i);
    });
    let runAbove = 0;
    let runBelow = 0;
    for (let i = 0; i < n; i++) {
      if (values[i] >= mean) {
        runAbove++;
        runBelow = 0;
      } else {
        runBelow++;
        runAbove = 0;
      }
      if ((runAbove >= 7 || runBelow >= 7) && !outPoints.includes(i)) outPoints.push(i);
    }
    const outOfControl = outPoints.length > 0;
    const third = Math.max(1, Math.floor(n / 3));
    const first = values.slice(0, third);
    const recent = values.slice(n - third);
    const std = (arr: number[]) => {
      const m = arr.reduce((a, b) => a + b, 0) / arr.length;
      return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
    };
    const firstStd = std(first);
    const recentStd = std(recent);
    const firstMean = first.reduce((a, b) => a + b, 0) / first.length;
    const recentMean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const reducedVariation = firstStd > 0 && recentStd < firstStd * 0.7;
    const meanImproved = !outOfControl && firstMean > 0 && recentMean > firstMean * 1.15;
    let state: 'fuera' | 'control' | 'mejora' = 'control';
    if (outOfControl) state = 'fuera';
    else if (reducedVariation || meanImproved) state = 'mejora';
    return { mean, mrBar, ucl, lcl, sigma, outPoints, state };
  }, [controlData]);

  const trend30 = useMemo(() => {
    if (!series) return null;
    return series.slice(-30).map((d) => ({ ...d, target: meta.dailyTarget }));
  }, [series, meta.dailyTarget]);

  const weekly = useMemo(() => {
    if (!series) return null;
    const weeks: { label: string; total: number; target: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const end = subDays(today, w * 7);
      const start = subDays(end, 6);
      const sKey = format(start, 'yyyy-MM-dd');
      const eKey = format(end, 'yyyy-MM-dd');
      const total = series.filter((s) => s.date >= sKey && s.date <= eKey).reduce((a, b) => a + b.minutes, 0);
      weeks.push({ label: format(start, 'dd/MM'), total, target: meta.dailyTarget * 7 });
    }
    return weeks;
  }, [series, meta.dailyTarget, today]);

  const consistency = useMemo(() => {
    if (!series) return null;
    const last30 = series.slice(-30);
    const met = last30.filter((d) => d.minutes >= meta.dailyTarget).length;
    const best = Math.max(...last30.map((d) => d.minutes));
    const avg = last30.reduce((a, b) => a + b.minutes, 0) / last30.length;
    let streak = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i].minutes >= meta.dailyTarget) streak++;
      else break;
    }
    return { met, best, avg, streak };
  }, [series, meta.dailyTarget]);

  if (!history) {
    return (
      <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Cargando datos reales de {meta.label}...</p>
        </CardContent>
      </Card>
    );
  }

  const stateInfo = spc ? STATE_INFO[spc.state] : null;
  const StateIcon = stateInfo?.icon || Activity;

  return (
    <div className="space-y-3">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a vista general
      </button>

      <Card className={cn("border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", meta.gradient)}>
                <meta.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">{meta.label}</h2>
                <p className="text-[10px] text-muted-foreground">Objetivo diario: {meta.dailyTarget} min · Análisis de proceso</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">hoy: {todayMinutes[area] || 0} min</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {periodStats?.map((p) => (
              <div key={p.id} className="rounded-xl bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{p.label}</span>
                  <Target className="h-3 w-3 text-muted-foreground/60" />
                </div>
                <p className="text-xl font-bold tabular-nums">
                  {p.done}
                  <span className="text-xs text-muted-foreground font-normal"> / {p.target} min</span>
                </p>
                <Progress value={p.pct} className={cn("h-1.5", p.pct >= 100 ? "[&>div]:bg-green-500" : p.pct >= 60 ? "[&>div]:bg-primary" : "[&>div]:bg-amber-500")} />
                <p className={cn("text-[10px] font-medium", p.pct >= 100 ? "text-green-500" : p.pct >= 60 ? "text-primary" : "text-amber-500")}>
                  {p.pct}% del objetivo
                </p>
              </div>
            ))}
          </div>

          {spc && stateInfo && (
            <div className={cn("mt-3 rounded-xl border p-3 flex flex-col md:flex-row md:items-center gap-2", stateInfo.card)}>
              <div className="flex items-center gap-2 md:w-56 shrink-0">
                <StateIcon className={cn("h-5 w-5 shrink-0", stateInfo.text)} />
                <div>
                  <p className={cn("text-sm font-bold", stateInfo.text)}>{stateInfo.label}</p>
                  <p className="text-[10px] text-muted-foreground">Estado del proceso</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{stateInfo.desc}</p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground/70 italic text-center mt-2">Lo que no se mide no se controla. Lo que no se controla, no se mejora.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard icon={Flame} label="Racha actual" value={`${consistency?.streak ?? 0} días`} color="text-orange-500" />
        <StatCard icon={CheckCircle2} label="Objetivo cumplido (30d)" value={`${consistency?.met ?? 0}/30 días`} color="text-green-500" />
        <StatCard icon={TrendingUp} label="Media diaria (30d)" value={`${Math.round(consistency?.avg ?? 0)} min`} color="text-primary" />
        <StatCard icon={Activity} label="Mejor día (30d)" value={`${consistency?.best ?? 0} min`} color="text-purple-500" />
      </div>

      <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Carta de Control (XmR) — últimos 30 días
          </CardTitle>
          {spc && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground font-mono">
              <span>Media: {Math.round(spc.mean)}</span>
              <span>σ: {Math.round(spc.sigma * 10) / 10}</span>
              <span>LCS: {Math.round(spc.ucl)}</span>
              <span>LCI: {Math.round(spc.lcl)}</span>
              {spc.outPoints.length > 0 && <span className="text-red-500 font-semibold">Puntos fuera: {spc.outPoints.length}</span>}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {controlData && spc ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={controlData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8, fill: 'currentColor' }}
                  interval={5}
                  tickFormatter={(v) => format(new Date(v), 'dd/MM')}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
                        <p className="font-mono text-muted-foreground">{format(new Date(d.date), 'EEEE dd/MM', { locale: es })}</p>
                        <p className="font-bold">{d.minutes} min</p>
                        {d.minutes >= meta.dailyTarget && <p className="text-[9px] text-green-500">Objetivo cumplido</p>}
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={spc.ucl} stroke="#ef4444" strokeDasharray="6 3" label={{ value: 'LCS', position: 'insideTopRight', fontSize: 9, fill: '#ef4444' }} />
                <ReferenceLine y={spc.lcl} stroke="#ef4444" strokeDasharray="6 3" label={{ value: 'LCI', position: 'insideBottomRight', fontSize: 9, fill: '#ef4444' }} />
                <ReferenceLine y={spc.mean} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Media', position: 'insideTopRight', fontSize: 9, fill: '#22c55e' }} />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, index } = props;
                    if (cx == null || cy == null) return null;
                    const out = spc.outPoints.includes(index);
                    return <circle cx={cx} cy={cy} r={out ? 5 : 2.5} fill={out ? '#ef4444' : '#6366f1'} stroke={out ? '#ffffff' : 'transparent'} strokeWidth={out ? 1.5 : 0} />;
                  }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-10">Se necesitan al menos 3 días de datos para calcular los límites de control.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            Tendencia diaria — últimos 30 días
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trend30 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend30} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="gradMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8, fill: 'currentColor' }}
                  interval={5}
                  tickFormatter={(v) => format(new Date(v), 'dd/MM')}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
                        <p className="font-mono text-muted-foreground">{format(new Date(d.date), 'EEEE dd/MM', { locale: es })}</p>
                        <p className="font-bold">{d.minutes} min</p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={meta.dailyTarget} stroke="#10b981" strokeDasharray="6 3" label={{ value: 'Objetivo', position: 'insideTopRight', fontSize: 9, fill: '#10b981' }} />
                <Area type="monotone" dataKey="minutes" stroke="#a855f7" strokeWidth={2} fill="url(#gradMin)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Tendencia semanal — últimos 8 semanas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weekly ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekly} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
                        <p className="font-mono text-muted-foreground">Semana del {d.label}</p>
                        <p className="font-bold">{d.total} min</p>
                        <p className="text-[9px] text-muted-foreground">Objetivo: {d.target} min</p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={meta.dailyTarget * 7} stroke="#10b981" strokeDasharray="6 3" label={{ value: 'Obj. semanal', position: 'insideTopRight', fontSize: 9, fill: '#10b981' }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {weekly.map((w, i) => (
                    <Cell key={i} fill={w.total >= w.target ? '#10b981' : w.total >= w.target * 0.5 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
      <CardContent className="p-3 flex items-center gap-2.5">
        <Icon className={cn("h-5 w-5 shrink-0", color)} />
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{value}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}