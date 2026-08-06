import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { format, startOfWeek, startOfMonth, startOfQuarter, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AreaChart, Area, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ProgressRing } from '@/components/monthly-planning/ProgressRing';
import { getDayGoalEffective, getWeekGoalEffective, getMonthGoal, getQuarterGoal, getWeekId } from '@/lib/hierarchy';
import { AlertTriangle, ArrowLeft, Briefcase, FolderKanban, Clock, Flame, GraduationCap, Target, TrendingUp, Trophy, Activity, CheckCircle2, type LucideIcon } from 'lucide-react';

type FocusAreaId = 'universidad' | 'emprendimiento' | 'proyectos';

interface FocusAreaMeta {
  id: FocusAreaId;
  label: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  ring: string;
  dailyTarget: number;
  min: number;
  max: number;
}

const FOCUS_AREAS: FocusAreaMeta[] = [
  { id: 'universidad', label: 'Universidad', icon: GraduationCap, color: 'text-blue-500', gradient: 'from-blue-500 to-indigo-400', ring: 'blue', dailyTarget: 120, min: 60, max: 180 },
  { id: 'emprendimiento', label: 'Emprendimiento', icon: FolderKanban, color: 'text-amber-500', gradient: 'from-amber-500 to-orange-400', ring: 'amber', dailyTarget: 60, min: 30, max: 120 },
  { id: 'proyectos', label: 'Proyectos', icon: FolderKanban, color: 'text-emerald-500', gradient: 'from-emerald-500 to-teal-400', ring: 'emerald', dailyTarget: 60, min: 30, max: 120 },
];

const AREA_LABELS: Record<string, string> = {
  universidad: 'Universidad', emprendimiento: 'Emprendimiento', proyectos: 'Proyectos',
};

const PERIODS = [
  { id: 'dia', label: 'Día', days: 1, span: (d: Date) => format(d, 'yyyy-MM-dd') },
  { id: 'semana', label: 'Semana', days: 7, span: (d: Date) => format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd') },
  { id: 'mes', label: 'Mes', days: 30, span: (d: Date) => format(startOfMonth(d), 'yyyy-MM-dd') },
  { id: 'trimestre', label: 'Trimestre', days: 90, span: (d: Date) => format(startOfQuarter(d), 'yyyy-MM-dd') },
] as const;

const STATE_INFO = {
  fuera: {
    label: 'Fuera de control',
    desc: 'Hay días fuera de los límites o rachas largas de un lado. Eso indica causas especiales: algo extraordinario pasó. Se requiere acción para investigar y corregir.',
    text: 'text-red-500',
    card: 'border-red-500/30 bg-red-500/5',
    icon: AlertTriangle,
  },
  control: {
    label: 'En control',
    desc: 'Todos los días están dentro de los límites. El proceso solo presenta causas comunes de variación: es estable y predecible.',
    text: 'text-blue-500',
    card: 'border-blue-500/30 bg-blue-500/5',
    icon: Activity,
  },
  mejora: {
    label: 'Mejora del proceso',
    desc: 'La variación de los últimos días es menor que la del inicio. Se ha vuelto más consistente y capaz.',
    text: 'text-green-500',
    card: 'border-green-500/30 bg-green-500/5',
    icon: TrendingUp,
  },
} as const;

function getQuarter(date: Date) {
  return { quarter: Math.ceil((date.getMonth() + 1) / 3), year: date.getFullYear() };
}

function getPlannedMinutes(area: FocusAreaId, period: (typeof PERIODS)[number], date: Date): number {
  if (period.id === 'dia') return getDayGoalEffective(date, area);
  if (period.id === 'semana') return getWeekGoalEffective(startOfWeek(date, { weekStartsOn: 1 }), area);
  const { quarter, year } = getQuarter(date);
  const monthKey = `month${date.getMonth() - (quarter - 1) * 3 + 1}`;
  if (period.id === 'mes') return getMonthGoal(quarter, year, monthKey, area) || 0;
  return getQuarterGoal(quarter, year, area) || 0;
}

function computeSpc(values: number[]) {
  const n = values.length;
  if (n < 3) return null;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const mrs: number[] = [];
  for (let i = 1; i < n; i++) mrs.push(Math.abs(values[i] - values[i - 1]));
  const mrBar = mrs.reduce((a, b) => a + b, 0) / mrs.length;
  const sigma = mrBar / 1.128;
  const ucl = mean + 2.66 * mrBar;
  const lcl = Math.max(0, mean - 2.66 * mrBar);
  const outPoints: number[] = [];
  values.forEach((v, i) => {
    if (v > ucl || v < lcl) outPoints.push(i);
  });
  let runAbove = 0;
  let runBelow = 0;
  for (let i = 0; i < n; i++) {
    if (values[i] >= mean) { runAbove++; runBelow = 0; } else { runBelow++; runAbove = 0; }
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
}

function getFocusMinutes(row: any, area: FocusAreaId): number {
  const td = row?.time_data || {};
  return Number(td[area]) || 0;
}

interface Props {
  todayMinutes?: Record<FocusAreaId, number>;
  anchorDate?: Date;
  children?: ReactNode;
}

export function FocusProcessPanel({ todayMinutes, anchorDate, children }: Props) {
  const [selected, setSelected] = useState<FocusAreaId | null>(null);
  const anchor = anchorDate ?? new Date();

  return (
    <div className="space-y-3">
      <AreaSelector selected={selected} onSelect={setSelected} />
      {selected ? (
        <AreaDetail area={selected} todayMinutes={todayMinutes} anchor={anchor} onBack={() => setSelected(null)} />
      ) : (
        children
      )}
    </div>
  );
}

function AreaSelector({ selected, onSelect }: { selected: FocusAreaId | null; onSelect: (id: FocusAreaId | null) => void }) {
  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FOCUS_AREAS.map((area) => {
            const Icon = area.icon;
            const isActive = selected === area.id;
            return (
              <button
                key={area.id}
                onClick={() => onSelect(isActive ? null : area.id)}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border-2 transition-all duration-300 min-w-[110px]",
                  isActive
                    ? cn("bg-gradient-to-br scale-[1.03] text-white shadow-lg", area.gradient)
                    : "bg-transparent border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-white" : area.color)} />
                <span className={cn("text-xs font-semibold whitespace-nowrap", isActive ? "text-white" : "text-foreground")}>{area.label}</span>
                <span className={cn("text-[9px] font-mono", isActive ? "text-white/80" : "text-muted-foreground")}>{area.min}–{area.max} min</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AreaDetail({ area, todayMinutes, anchor, onBack }: { area: FocusAreaId; todayMinutes?: Record<FocusAreaId, number>; anchor: Date; onBack: () => void }) {
  const meta = FOCUS_AREAS.find((a) => a.id === area)!;
  const anchorStr = format(anchor, 'yyyy-MM-dd');
  const isTodayAnchor = anchorStr === format(new Date(), 'yyyy-MM-dd');
  const [history, setHistory] = useState<any[] | null>(null);

  useEffect(() => {
    let active = true;
    const start = format(subDays(anchor, 119), 'yyyy-MM-dd');
    const fetchData = async () => {
      const [tracking, stats] = await Promise.allSettled([
        supabase.from('daily_systems_tracking').select('tracking_date, time_data').gte('tracking_date', start).order('tracking_date', { ascending: true }),
        supabase.from('daily_area_stats').select('area_id, stat_date, time_spent_minutes').gte('stat_date', start),
      ]);
      if (!active) return;
      setHistory(tracking.status === 'fulfilled' ? tracking.value.data || [] : []);
      setAreaStats(stats.status === 'fulfilled' ? stats.value.data || [] : []);
    };
    fetchData();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorStr]);

  const [areaStats, setAreaStats] = useState<any[] | null>(null);

  const series = useMemo(() => {
    if (!history) return null;
    const map = new Map<string, number>();
    history.forEach((row) => map.set(row.tracking_date, getFocusMinutes(row, area)));
    if (areaStats) {
      areaStats.forEach((r) => {
        if (r.area_id === area) map.set(r.stat_date, Math.max(map.get(r.stat_date) || 0, Number(r.time_spent_minutes) || 0));
      });
    }
    if (isTodayAnchor) map.set(anchorStr, Math.max(map.get(anchorStr) || 0, todayMinutes?.[area] || 0));
    const arr: { date: string; minutes: number }[] = [];
    for (let i = 119; i >= 0; i--) {
      const d = subDays(anchor, i);
      const key = format(d, 'yyyy-MM-dd');
      arr.push({ date: key, minutes: map.get(key) || 0 });
    }
    return arr;
  }, [history, areaStats, area, todayMinutes, anchorStr, anchor, isTodayAnchor]);

  const periodStats = useMemo(() => {
    if (!series) return null;
    return PERIODS.map((p) => {
      const from = p.id === 'dia' ? anchorStr : format(p.id === 'semana' ? startOfWeek(anchor, { weekStartsOn: 1 }) : p.id === 'mes' ? startOfMonth(anchor) : startOfQuarter(anchor), 'yyyy-MM-dd');
      const done = series.filter(s => s.date >= from && s.date <= anchorStr).reduce((a, b) => a + b.minutes, 0);
      const planned = getPlannedMinutes(area, p, anchor);
      const goal = planned > 0 ? planned : Math.round(meta.dailyTarget * p.days);
      return { ...p, from, done, goal, pct: goal > 0 ? Math.round((done / goal) * 100) : 0, pctUncapped: goal > 0 ? Math.round((done / goal) * 100) : 0 };
    });
  }, [series, area, meta.dailyTarget, anchor, anchorStr]);

  const controlData = useMemo(() => (series ? series.slice(-30) : null), [series]);
  const spc = useMemo(() => (controlData ? computeSpc(controlData.map((d) => d.minutes)) : null), [controlData]);

  const todayMin = todayMinutes?.[area] || 0;
  const todayExtra = Math.max(0, todayMin - meta.max);
  const stateInfo = spc ? STATE_INFO[spc.state] : null;
  const StateIcon = stateInfo?.icon || Activity;

  const trend30 = useMemo(() => {
    if (!series) return null;
    return series.slice(-30).map((d) => ({ ...d, target: meta.dailyTarget, min: meta.min, max: meta.max }));
  }, [series, meta]);

  const weekly = useMemo(() => {
    if (!series) return null;
    const weeks: { label: string; total: number; goal: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const end = subDays(anchor, w * 7);
      const start = subDays(end, 6);
      const sKey = format(start, 'yyyy-MM-dd');
      const eKey = format(end, 'yyyy-MM-dd');
      const total = series.filter((s) => s.date >= sKey && s.date <= eKey).reduce((a, b) => a + b.minutes, 0);
      weeks.push({
        label: getWeekId(start),
        total,
        goal: getPlannedMinutes(area, PERIODS[1], start),
      });
    }
    return weeks;
  }, [series, area, anchor]);

  const consistency = useMemo(() => {
    if (!series) return null;
    const last30 = series.slice(-30);
    const met = last30.filter((d) => d.minutes >= meta.min).length;
    const best = Math.max(0, ...last30.map((d) => d.minutes));
    const avg = last30.reduce((a, b) => a + b.minutes, 0) / last30.length;
    let streak = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i].minutes >= meta.min) streak++;
      else break;
    }
    return { met, best, avg, streak };
  }, [series, meta.min]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </button>
      </div>

      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", meta.gradient)}>
                <meta.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  {meta.label}
                  {todayExtra > 0 && (
                    <Badge className="text-[9px] gap-1 bg-amber-500/20 text-amber-600 border-amber-500/40">
                      <Clock className="h-2.5 w-2.5" /> +{todayExtra} min extra
                    </Badge>
                  )}
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  Zona objetivo: {meta.min}–{meta.max} min · Control de proceso
                </p>
              </div>
            </div>
            <Badge variant="outline" className={cn("text-[10px] font-mono", todayMin >= meta.max ? "text-amber-600" : "")}>hoy: {todayMin} min</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {periodStats?.map((p) => {
              const extraZone = p.id === 'dia' && todayExtra > 0;
              return (
                <div key={p.id} className="rounded-xl bg-muted/30 p-3 flex flex-col items-center gap-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{p.label}</p>
                  <ProgressRing
                    progress={Math.min(100, p.pct)}
                    size={72}
                    strokeWidth={6}
                    strokeColor={p.pct >= 100 ? 'emerald' : p.pct >= 60 ? meta.ring : 'amber'}
                  >
                    <span className="text-xs font-bold tabular-nums">{p.pctUncapped >= 100 ? `+${p.pctUncapped - 100}` : p.pctUncapped}<span className="text-[9px] text-muted-foreground">%</span></span>
                  </ProgressRing>
                  <p className="text-xs font-bold tabular-nums">
                    {p.done}
                    <span className="text-[10px] text-muted-foreground font-normal"> / {p.goal} min</span>
                  </p>
                  {extraZone ? (
                    <p className="text-[9px] font-semibold text-amber-600">+{todayExtra} extra</p>
                  ) : (
                    <p className={cn("text-[9px] font-medium", p.pct >= 100 ? "text-green-500" : p.pct >= 60 ? "text-primary" : "text-amber-500")}>
                      {p.pct}% del objetivo
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {spc && stateInfo && (
            <div className={cn("mt-3 rounded-xl border p-3 flex flex-col md:flex-row md:items-center gap-2", stateInfo.card)}>
              <div className="flex items-center gap-2 md:w-52 shrink-0">
                <StateIcon className={cn("h-5 w-5 shrink-0", stateInfo.text)} />
                <div>
                  <p className={cn("text-sm font-bold", stateInfo.text)}>{stateInfo.label}</p>
                  <p className="text-[10px] text-muted-foreground">Estado del proceso</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{stateInfo.desc}</p>
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground italic items-center justify-between">
            <span>Lo que no se mide no se controla. Lo que no se controla, no se mejora.</span>
          </div>
        </CardContent>
      </Card>

      {/* Resultados reales */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Resultados reales de {AREA_LABELS[area]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <AreaResult icon={Clock} label="Hoy" value={`${todayMin} min`} color={meta.color} />
            <AreaResult icon={Flame} label="Días activos semana" value={activeDays(series, startOfWeek(anchor, { weekStartsOn: 1 }), anchorStr)} color={meta.color} />
            <AreaResult icon={Flame} label="Días activos mes" value={activeDays(series, startOfMonth(anchor), anchorStr)} color={meta.color} />
            <AreaResult icon={Trophy} label="Días activos trimestre" value={activeDays(series, startOfQuarter(anchor), anchorStr)} color="text-emerald-500" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard icon={Flame} label="Racha actual" value={`${consistency?.streak ?? 0} días`} color="text-orange-500" />
        <StatCard icon={CheckCircle2} label="Días en zona (30d)" value={`${consistency?.met ?? 0}/30`} color="text-green-500" />
        <StatCard icon={TrendingUp} label="Media diaria (30d)" value={`${Math.round(consistency?.avg ?? 0)} min`} color="text-primary" />
        <StatCard icon={Trophy} label="Mejor día (30d)" value={`${consistency?.best ?? 0} min`} color="text-purple-500" />
      </div>

      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Carta de Control (XmR) — últimos 30 días
          </CardTitle>
          {spc && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground font-mono">
              <span>Media (X̄): <b className="text-emerald-600">{Math.round(spc.mean)}</b></span>
              <span>σ: {Math.round(spc.sigma * 10) / 10}</span>
              <span>LCS: <b className="text-red-500">{Math.round(spc.ucl)}</b></span>
              <span>LCI: <b className="text-red-500">{Math.round(spc.lcl)}</b></span>
              {spc.outPoints.length > 0 && <span className="text-red-500 font-semibold">Puntos fuera: {spc.outPoints.length}</span>}
              {todayExtra > 0 && <span className="text-amber-600 font-semibold">Extra: ±{todayExtra} min</span>}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {controlData && spc ? (
            <>
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
                      const extra = Math.max(0, d.minutes - meta.max);
                      return (
                        <div className="bg-background border rounded-lg px-2.5 py-1.5 shadow-lg text-xs space-y-0.5">
                          <p className="font-mono text-muted-foreground">{format(new Date(d.date), 'EEEE dd/MM', { locale: es })}</p>
                          <p className="font-bold">{d.minutes} min{extra > 0 && <span className="text-amber-600"> · +{extra} extra</span>}</p>
                          <p className={cn("text-[9px]", d.minutes >= meta.max ? "text-amber-600" : d.minutes >= meta.min ? "text-green-500" : "text-red-500")}>
                            {d.minutes >= meta.max ? 'Extra (zona +)' : d.minutes >= meta.min ? 'En zona objetivo' : 'Bajo el mínimo'}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <ReferenceArea y1={meta.min} y2={meta.max} fill="#10b981" fillOpacity={0.08} />
                  <ReferenceLine y={meta.min} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Mín', position: 'insideBottomRight', fontSize: 8, fill: '#10b981' }} />
                  <ReferenceLine y={meta.max} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.7} label={{ value: 'Máx (extra)', position: 'insideTopRight', fontSize: 8, fill: '#f59e0b' }} />
                  <ReferenceLine y={spc.ucl} stroke="#ef4444" strokeDasharray="6 3" label={{ value: 'LCS', position: 'insideTopLeft', fontSize: 8, fill: '#ef4444' }} />
                  <ReferenceLine y={spc.lcl} stroke="#ef4444" strokeDasharray="6 3" label={{ value: 'LCI', position: 'insideBottomLeft', fontSize: 8, fill: '#ef4444' }} />
                  <ReferenceLine y={spc.mean} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Media', position: 'insideTopLeft', fontSize: 8, fill: '#22c55e' }} />
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, index, payload } = props;
                      if (cx == null || cy == null) return null;
                      const out = spc.outPoints.includes(index);
                      const extra = payload.minutes > meta.max;
                      const below = payload.minutes < meta.min;
                      const inZone = payload.minutes >= meta.min && payload.minutes <= meta.max;
                      let fill = '#6366f1';
                      if (out) fill = '#ef4444';
                      else if (below) fill = '#f59e0b';
                      else if (inZone) fill = '#10b981';
                      else if (extra) fill = '#f59e0b';
                      return <circle cx={cx} cy={cy} r={out ? 5 : 3} fill={fill} stroke={out ? '#ffffff' : 'transparent'} strokeWidth={out ? 1.5 : 0} />;
                    }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-muted-foreground mt-1 pt-2 border-t border-border">
                <span><b className="text-red-500">LCS / LCI</b> — límites de control (límites del proceso normal)</span>
                <span><b className="text-green-600">Media</b> — promedio de tus 30 días</span>
                <span><b className="text-emerald-600">Zona verde</b> — mínimo/máximo del objetivo del plan</span>
                <span><b className="text-amber-600">Dorado</b> — fuera de zona / esfuerzo extra</span>
                <span><b className="text-red-500">Punto rojo</b> — día fuera de control</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-10">Se necesitan al menos 3 días de datos para calcular los límites de control.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
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
                  <linearGradient id="gradFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'currentColor' }} interval={5} tickFormatter={(v) => format(new Date(v), 'dd/MM')} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-card border rounded-lg px-2.5 py-1.5 shadow-1g text-xs space-y-0.5">
                        <p className="font-mono text-muted-foreground">{format(new Date(d.date), 'EEEE dd/MM', { locale: es })}</p>
                        <p className="font-bold">{d.minutes} min</p>
                      </div>
                    );
                  }}
                />
                <ReferenceArea y1={meta.min} y2={meta.max} fill="#10b981" fillOpacity={0.06} />
                <ReferenceLine y={meta.max} stroke="#f59e0b" strokeDasharray="6 3" strokeOpacity={0.6} label={{ value: 'Máx', position: 'insideTopRight', fontSize: 8, fill: '#f59e0b' }} />
                <ReferenceLine y={meta.min} stroke="#10b981" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: 'Mín', position: 'insideBottomRight', fontSize: 8, fill: '#10b981' }} />
                <Area type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2} fill="url(#gradFocus)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Tendencia semanal vs objetivo del plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weekly ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekly} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="label" tick={{ fontSize: 8, fill: 'currentColor' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(-2)} />
                <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg px-2.5 py-1.5 shadow-xs text-xs space-y-0.5">
                        <p className="font-mono text-muted-foreground">Semana {d.label.slice(-2)}</p>
                        <p className="font-bold">{d.total} min</p>
                        <p className="text-[9px] text-muted-foreground">Objetivo: {d.goal} min</p>
                        {d.goal > 0 && <p className={cn("text-[9px] font-semibold", d.total >= d.goal ? "text-green-500" : "text-amber-500")}>{Math.round((d.total / d.goal) * 100)}% del objetivo</p>}
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={weekly[0]?.goal || meta.max * 7} stroke="#10b981" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: 'Obj. semanal', position: 'insideTopRight', fontSize: 8, fill: '#10b981' }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {weekly.map((w: any, i: number) => (
                    <Cell key={i} fill={w.total >= w.goal && w.goal > 0 ? '#10b981' : w.total >= (w.goal || 0) * 0.6 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Aún no hay datos para calcular la tendencia semanal.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function activeDays(series: { date: string; minutes: number }[] | null, from: Date, to: string): number {
  if (!series) return 0;
  const f = format(from as Date, 'yyyy-MM-dd');
  return new Set(series.filter((s) => s.date >= f && s.date <= to && s.minutes > 0).map((s) => s.date)).size;
}

function AreaResult({ icon: Icon, label, value, color = "text-primary" }: { icon: any; label: string; value: ReactNode; color?: string }) {
  return (
    <div className="rounded-xl bg-muted/30 p-3 flex items-center gap-2">
      <Icon className={cn("h-4 w-4 shrink-0", color)} />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
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