import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { format, startOfWeek, startOfMonth, startOfQuarter, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AreaChart, Area, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MEJORA_AREAS, getAreaMinutes, getExtraMinutes, type MejoraAreaId } from './mejoraAreas';
import { ProgressRing } from '@/components/monthly-planning/ProgressRing';
import { getDayGoalEffective, getWeekGoalEffective, getMonthGoal, getQuarterGoal, getQuarterBookGoal, getWeekId } from '@/lib/hierarchy';
import { Activity, AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, Dumbbell, Flame, Gamepad2, Globe, Music2, Sparkles, Target, TrendingUp, Trophy, FileText, Flame as FlameIcon, CalendarDays, BarChart3 } from 'lucide-react';
import { useReadingSessions } from '@/hooks/useReadingSessions';

const FireIcon = FlameIcon;

const PERIODS = [
  { id: 'dia', label: 'Día', days: 1, span: (d: Date) => format(d, 'yyyy-MM-dd') },
  { id: 'semana', label: 'Semana', days: 7, span: (d: Date) => format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd') },
  { id: 'mes', label: 'Mes', days: 30, span: (d: Date) => format(startOfMonth(d), 'yyyy-MM-dd') },
  { id: 'trimestre', label: 'Trimestre', days: 90, span: (d: Date) => format(startOfQuarter(d), 'yyyy-MM-dd') },
] as const;

const STATE_INFO = {
  fuera: {
    label: 'Fuera de control',
    desc: 'Hay días fuera de los límites o rachas largas de un lado. Eso indica causas especiales de variación: algo extraordinario pasó. Se requiere acción inmediata para investigar y corregir.',
    text: 'text-red-500',
    card: 'border-red-500/30 bg-red-500/5',
    icon: AlertTriangle,
  },
  control: {
    label: 'En control',
    desc: 'Todos los días están dentro de los límites. El proceso solo presenta causas comunes de variación: es estable y predecible. Tu constancia está en zona de control.',
    text: 'text-blue-500',
    card: 'border-blue-500/30 bg-blue-500/5',
    icon: Activity,
  },
  mejora: {
    label: 'Mejora del proceso',
    desc: 'La variación de los últimos días es menor que la del inicio. Se han reducido las causas de variación logrando un proceso más consistente y capaz.',
    text: 'text-green-500',
    card: 'border-green-500/30 bg-green-500/5',
    icon: TrendingUp,
  },
} as const;

const AREA_LABELS: Record<string, string> = {
  lectura: 'Lectura', musica: 'Música', ajedrez: 'Ajedrez', idiomas: 'Idiomas', game: 'Game', gym: 'Gym',
};

interface Props {
  todayMinutes?: Record<MejoraAreaId, number>;
  anchorDate?: Date;
  children?: ReactNode;
}

export function MejoraProcessPanel({ todayMinutes, anchorDate, children }: Props) {
  const [selected, setSelected] = useState<MejoraAreaId | null>(null);
  const [history, setHistory] = useState<any[] | null>(null);
  const [areaStats, setAreaStats] = useState<any[] | null>(null);
  const anchor = anchorDate ?? new Date();
  const anchorStr = format(anchor, 'yyyy-MM-dd');

  useEffect(() => {
    let active = true;
    const start = format(subDays(anchor, 119), 'yyyy-MM-dd');
    const fetchData = async () => {
      const [tracking, stats, sessions] = await Promise.allSettled([
        supabase.from('daily_systems_tracking').select('tracking_date, time_data, workout_duration, completions, skipped, active_focus_areas').gte('tracking_date', start).order('tracking_date', { ascending: true }),
        supabase.from('daily_area_stats').select('area_id, stat_date, time_spent_minutes, pages_done').gte('stat_date', start),
        supabase.from('reading_sessions').select('session_date, pages_read, minutes').gte('session_date', start),
      ]);
      if (!active) return;
      setHistory(tracking.status === 'fulfilled' ? tracking.value.data || [] : []);
      setAreaStats(stats.status === 'fulfilled' ? stats.value.data || [] : []);
    };
    fetchData();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorStr]);

  return (
    <div className="space-y-3">
      <AreaSelector selected={selected} onSelect={setSelected} />
      {selected ? (
        <AreaDetail area={selected} todayMinutes={todayMinutes} anchor={anchor} history={history} areaStats={areaStats} onBack={() => setSelected(null)} />
      ) : (
        <>
          <MejoraOverview anchor={anchor} history={history} areaStats={areaStats} />
          {children}
        </>
      )}
    </div>
  );
}

function AreaSelector({ selected, onSelect }: { selected: MejoraAreaId | null; onSelect: (id: MejoraAreaId | null) => void }) {
  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
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
                <span className={cn("text-[9px] font-mono", isActive ? "text-white/80" : "text-muted-foreground")}>{area.min}–{area.max} min</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Plan trimestral: metas de minutos y libros ============

function getPlanAreaKeys(area: MejoraAreaId): string[] {
  if (area === 'idiomas') return ['italiano', 'ingles'];
  return [area];
}

function getPlannedMinutes(area: MejoraAreaId, period: (typeof PERIODS)[number], date: Date): number {
  const keys = getPlanAreaKeys(area);
  if (period.id === 'dia') return keys.reduce((s, k) => s + getDayGoalEffective(date, k), 0);
  if (period.id === 'semana') return keys.reduce((s, k) => s + getWeekGoalEffective(startOfWeek(date, { weekStartsOn: 1 }), k), 0);
  const { quarter, year } = getQuarter(date);
  const monthKey = `month${date.getMonth() - (quarter - 1) * 3 + 1}`;
  if (period.id === 'mes') return keys.reduce((s, k) => s + (getMonthGoal(quarter, year, monthKey, k) || 0), 0);
  return keys.reduce((s, k) => s + (getQuarterGoal(quarter, year, k) || 0), 0);
}

function getQuarter(date: Date) {
  return { quarter: Math.ceil((date.getMonth() + 1) / 3), year: date.getFullYear() };
}

// ============ Carta de control (XmR) ============

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

// ============ Resultados reales por área ============

interface ResultsData {
  books: any[];
  chessSessions: any[];
  musicSessions: any[];
  langSessions: any[];
  songs: any[];
}

function sumInRange(rows: any[], dateField: string, from: string, to: string, valueField: string): number {
  return (rows || []).filter(r => r[dateField] && r[dateField] >= from && r[dateField] <= to).reduce((s, r) => s + (Number(r[valueField]) || 0), 0);
}

function AreaDetail({ area, todayMinutes, anchor, history, areaStats, onBack }: { area: MejoraAreaId; todayMinutes?: Record<MejoraAreaId, number>; anchor: Date; history: any[] | null; areaStats: any[] | null; onBack: () => void }) {
  const meta = MEJORA_AREAS.find((a) => a.id === area)!;
  const anchorStr = format(anchor, 'yyyy-MM-dd');
  const isTodayAnchor = anchorStr === format(new Date(), 'yyyy-MM-dd');
  const [results, setResults] = useState<ResultsData | null>(null);
  const { perDayPages } = useReadingSessions();

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      const [books, chess, musicSessions, langSessions, songs] = await Promise.allSettled([
        supabase.from('reading_library').select('title, author, status, finish_date, pages_read, pages_total'),
        supabase.from('chess_sessions').select('session_date, games_played, current_elo'),
        supabase.from('music_practice_sessions').select('practice_date, duration_minutes'),
        supabase.from('language_sessions').select('session_date, total_duration'),
        supabase.from('music_repertoire').select('status'),
      ]);
      if (!active) return;
      setResults({
        books: books.status === 'fulfilled' ? books.value.data || [] : [],
        chessSessions: chess.status === 'fulfilled' ? chess.value.data || [] : [],
        musicSessions: musicSessions.status === 'fulfilled' ? musicSessions.value.data || [] : [],
        langSessions: langSessions.status === 'fulfilled' ? langSessions.value.data || [] : [],
        songs: songs.status === 'fulfilled' ? songs.value.data || [] : [],
      });
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const series = useMemo(() => {
    if (!history) return null;
    const map = new Map<string, number>();
    history.forEach((row) => map.set(row.tracking_date, getAreaMinutes(row, area)));
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
  }, [history, areaStats, area, todayMinutes, anchorStr, anchor]);

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

  const trend30 = useMemo(() => {
    if (!series) return null;
    return series.slice(-30).map((d) => ({ ...d, target: meta.dailyTarget, min: meta.min, max: meta.max, extra: getExtraMinutes(d.minutes, meta) }));
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

  // Resultados de lectura: páginas
  const readingResult = useMemo(() => {
    if (area !== 'lectura' || !results) return null;
    const fromW = format(startOfWeek(anchor, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const fromM = format(startOfMonth(anchor), 'yyyy-MM-dd');
    const fromQ = format(startOfQuarter(anchor), 'yyyy-MM-dd');
    const completed = (results.books || []).filter(b => b.status === 'completed');
    const currentBook = (results.books || []).find(b => b.status === 'reading');
    const completedWeek = completed.filter(b => b.finish_date && b.finish_date >= fromW).length;
    const completedMonth = completed.filter(b => b.finish_date && b.finish_date >= fromM).length;
    const completedQuarter = completed.filter(b => b.finish_date && b.finish_date >= fromQ).length;
    const { quarter, year } = getQuarter(anchor);
    const bookGoal = getQuarterBookGoal(quarter, year);
    const readingStats = (areaStats || []).filter((s) => s.area_id === 'lectura');
    const pages = (from: string) => readingStats.filter(s => s.stat_date >= from && s.stat_date <= anchorStr).reduce((a, s) => a + (Number(s.pages_done) || 0), 0);
    const viaSessions = (from: string) => Object.entries(perDayPages).filter(([d]) => d >= from && d <= anchorStr).reduce((a, [, v]) => a + v, 0);
    const pagesTodaySaved = perDayPages[anchorStr] || 0;
    return {
      currentBook,
      pagesToday: Math.max(pages(anchorStr), pagesTodaySaved),
      pagesWeek: viaSessions(fromW),
      pagesMonth: viaSessions(fromM),
      pagesQuarter: viaSessions(fromQ),
      completedWeek, completedMonth, completedQuarter, bookGoal,
    };
  }, [area, results, anchorStr, perDayPages]);

  if (!history || !results) {
    return (
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Cargando datos reales de {meta.label}...</p>
        </CardContent>
      </Card>
    );
  }

  const stateInfo = spc ? STATE_INFO[spc.state] : null;
  const StateIcon = stateInfo?.icon || Activity;
  const todayMin = todayMinutes?.[area] || series?.find((s) => s.date === anchorStr)?.minutes || 0;
  const todayExtra = getExtraMinutes(todayMin, meta);
  const withinTarget = todayMin >= meta.min && todayMin <= meta.max;

  return (
    <div className="space-y-3">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a vista general
      </button>

      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", meta.gradient)}>
                <meta.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  {meta.label}
                  {todayExtra > 0 && (
                    <Badge className="text-[9px] gap-1 bg-amber-500/20 text-amber-600 border-amber-500/40">
                      <Sparkles className="h-2.5 w-2.5" /> +{todayExtra} min extra
                    </Badge>
                  )}
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  Zona objetivo: {meta.min}–{meta.max} min · Control de proceso
                </p>
              </div>
            </div>
            <Badge variant="outline" className={cn("text-[10px] font-mono", todayMin >= meta.max ? "text-amber-600" : "" )}>{format(anchor, 'dd/MM')}: {todayMin} min</Badge>
          </div>

          {/* Indicadores circulares: objetivos del plan (día · semana · mes · trimestre) */}
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
            {readingResult?.currentBook && (
              <span className="flex items-center gap-1.5 not-italic font-medium">
                <BookOpen className="h-3 w-3 text-purple-500" />
                {readingResult.currentBook.title}: {readingResult.currentBook.pages_read}/{readingResult.currentBook.pages_total || '?'} pág
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados reales por área */}
      <ResultSection
        area={area}
        anchor={anchor}
        results={results}
        readingResult={readingResult}
        series={series}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard icon={Flame} label="Racha actual" value={`${consistency?.streak ?? 0} días`} color="text-orange-500" />
        <StatCard icon={CheckCircle2} label="Días en zona (30d)" value={`${consistency?.met ?? 0}/30`} color="text-green-500" />
        <StatCard icon={TrendingUp} label="Media diaria (30d)" value={`${Math.round(consistency?.avg ?? 0)} min`} color="text-primary" />
        <StatCard icon={Activity} label="Mejor día (30d)" value={`${consistency?.best ?? 0} min`} color="text-purple-500" />
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
                  <linearGradient id="gradMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
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
                        {getExtraMinutes(d.minutes, meta) > 0 && <p className="text-[9px] text-amber-600">+{getExtraMinutes(d.minutes, meta)} extra</p>}
                      </div>
                    );
                  }}
                />
                <ReferenceArea y1={meta.min} y2={meta.max} fill="#10b981" fillOpacity={0.06} />
                <ReferenceLine y={meta.max} stroke="#f59e0b" strokeDasharray="6 3" strokeOpacity={0.6} label={{ value: 'Máx', position: 'insideTopRight', fontSize: 8, fill: '#f59e0b' }} />
                <ReferenceLine y={meta.min} stroke="#10b981" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: 'Mín', position: 'insideBottomRight', fontSize: 8, fill: '#10b981' }} />
                <Area type="monotone" dataKey="minutes" stroke="#a855f7" strokeWidth={2} fill="url(#gradMin)" />
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
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Resumen de mejora/ esfuerzo (vista general, con todos los datos del esfuerzo) ============

function MejoraOverview({ anchor, history, areaStats }: { anchor: Date; history: any[] | null; areaStats: any[] | null }) {
  const anchorStr = format(anchor, 'yyyy-MM-dd');
  const isTodayAnchor = anchorStr === format(new Date(), 'yyyy-MM-dd');

  const daily = useMemo(() => {
    if (!history) return null;
    const arr: { date: string; min: number; focus: number; pages: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(anchor, i);
      const key = format(d, 'yyyy-MM-dd');
      const row = history.find((r) => r.tracking_date === key);
      let total = 0;
      if (row) MEJORA_AREAS.forEach((a) => { total += getAreaMinutes(row, a.id); });
      const focus = (areaStats || []).filter((s) => s.stat_date === key && ['universidad', 'emprendimiento', 'proyectos'].includes(s.area_id)).reduce((acc, s) => acc + (Number(s.time_spent_minutes) || 0), 0);
      const pages = (areaStats || []).filter((s) => s.stat_date === key && s.area_id === 'lectura').reduce((acc, s) => acc + (Number(s.pages_done) || 0), 0);
      arr.push({ date: key, total, focus, pages });
    }
    return arr;
  }, [history, areaStats, anchorStr]);

  const stats = useMemo(() => {
    if (!daily) return null;
    const activeDays = daily.filter((d) => d.total > 0).length;
    const totalMejora = daily.reduce((a, d) => a + d.total, 0);
    const totalFocus = daily.reduce((a, d) => a + d.focus, 0);
    const totalPages = daily.reduce((a, d) => a + d.pages, 0);
    const goalPerDay = MEJORA_AREAS.reduce((a, m) => a + m.dailyTarget, 0);
    return { activeDays, totalMejora, totalFocus, totalPages, goalPerDay };
  }, [daily]);

  const weeklyChart = useMemo(() => {
    if (!daily) return null;
    const weeks: { label: string; total: number; goal: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const end = subDays(anchor, w * 7);
      const start = subDays(end, 6);
      const sKey = format(start, 'yyyy-MM-dd');
      const eKey = format(end, 'yyyy-MM-dd');
      const total = daily.filter((d) => d.date >= sKey && d.date <= eKey).reduce((a, d) => a + d.total + d.focus, 0);
      const weeklyGoal = MEJORA_AREAS.reduce((a, m) => a + (getWeekGoalEffective(start, m.id) || 0), 0);
      weeks.push({
        label: getWeekId(start),
        total,
        goal: weeklyGoal,
      });
    }
    return weeks;
  }, [daily, anchor]);

  const topArea = useMemo(() => {
    if (!history) return null;
    const totals: Record<string, number> = {};
    history.slice(-30).forEach((row) => {
      MEJORA_AREAS.forEach((a) => {
        const v = getAreaMinutes(row, a.id);
        if (v > 0) totals[a.id] = (totals[a.id] || 0) + v;
      });
    });
    const best = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
    if (!best) return null;
    const meta = MEJORA_AREAS.find((m) => m.id === best[0]);
    return meta ? { meta, total: best[1] } : null;
  }, [history]);

  if (!daily || !stats) return null;

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-purple-500 to-indigo-400" />
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-500" />
          <h2 className="text-sm font-bold">Resumen Esfuerzo · {format(anchor, 'MMMM yyyy', { locale: es })}</h2>
          <Badge variant="outline" className="text-[10px] font-mono ml-auto">últimos 30 días</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-xl bg-purple-500/10 p-3 text-center">
            <p className="text-xl font-extrabold text-purple-500">{stats.totalMejora}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Min Mejora 30d</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-3 text-center">
            <p className="text-xl font-extrabold text-amber-500">{stats.totalFocus}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Min Enfoque 30d</p>
          </div>
          <div className="rounded-xl bg-indigo-500/10 p-3 text-center">
            <p className="text-xl font-extrabold text-indigo-500">{stats.totalPages}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Páginas 30d</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
            <p className="text-xl font-extrabold text-emerald-500">{stats.activeDays}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Días activos 30d</p>
          </div>
        </div>

        {topArea && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-2.5 text-xs">
            <topArea.meta.icon className={cn("h-4 w-4", topArea.meta.color)} />
            <span className="text-muted-foreground">Top mejora: <b className="text-foreground">{topArea.meta.label}</b> · {Math.round(topArea.total)} min en 30d</span>
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tendencia diaria — mejora vs objetivo</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradEffort" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.14)" />
              <XAxis dataKey="date" tick={{ fontSize: 7, fill: 'currentColor' }} interval={4} tickFormatter={(v) => format(new Date(v), 'dd/MM')} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: 'currentColor' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v} min`]} labelFormatter={(d: string) => format(new Date(d), 'EEEE dd/MM', { locale: es })} />
              <ReferenceLine y={stats.goalPerDay} stroke="#10b981" strokeDasharray="5 4" strokeOpacity={0.6} />
              <Area type="monotone" dataKey="total" stroke="#a855f7" strokeWidth={2} fill="url(#gradEffort)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Semanas vs objetivo (mejora + enfoque, min)</p>
          {weeklyChart ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.14)" />
                <XAxis dataKey="label" tick={{ fontSize: 7, fill: 'currentColor' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(-2)} />
                <YAxis tick={{ fontSize: 8, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="total" radius={[5, 5, 0, 0]}>
                  {weeklyChart.map((w: any, i: number) => (
                    <Cell key={i} fill={w.total >= w.goal && w.goal > 0 ? '#10b981' : w.total >= (w.goal || 0) * 0.6 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Sección de resultados reales por área ============

function AreaResult({ icon: Icon, label, value, sub, color = "text-primary" }: { icon: any; label: string; value: ReactNode; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl bg-muted/30 p-3 flex items-center gap-2">
      <Icon className={cn("h-4 w-4 shrink-0", color)} />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
        {sub && <p className="text-[9px] text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  );
}

function ResultSection({ area, anchor, results, readingResult, series }: { area: MejoraAreaId; anchor: Date; results: ResultsData; readingResult: any; series: any[] | null }) {
  const anchorStr = format(anchor, 'yyyy-MM-dd');
  const fromW = format(startOfWeek(anchor, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const fromM = format(startOfMonth(anchor), 'yyyy-MM-dd');
  const fromQ = format(startOfQuarter(anchor), 'yyyy-MM-dd');

  const render = () => {
    if (area === 'lectura') {
      const current = readingResult?.currentBook;
      const vb = readingResult || {};
      return (
        <>
          <AreaResult icon={FileText} label="Páginas hoy" value={vb.pagesToday ?? '—'} sub={current ? `${current.title.slice(0, 18)}` : 'sin libro activo'} color="text-purple-500" />
          <AreaResult icon={FileText} label="Páginas semana" value={vb.pagesWeek ?? 0} color="text-purple-500" />
          <AreaResult icon={FileText} label="Páginas mes" value={vb.pagesMonth ?? 0} color="text-purple-500" />
          <AreaResult icon={Trophy} label="Libros trimestre" value={`${vb.completedQuarter ?? 0}/${vb.bookGoal || 0}`} sub={vb.bookGoal ? `meta: ${vb.bookGoal} libros` : 'sin meta trimestral'} color="text-emerald-500" />
        </>
      );
    }
    if (area === 'ajedrez') {
      const gamesToday = sumInRange(results.chessSessions, 'session_date', anchorStr, anchorStr, 'games_played');
      const gamesWeek = sumInRange(results.chessSessions, 'session_date', fromW, anchorStr, 'games_played');
      const gamesMonth = sumInRange(results.chessSessions, 'session_date', fromM, anchorStr, 'games_played');
      const gamesQuarter = sumInRange(results.chessSessions, 'session_date', fromQ, anchorStr, 'games_played');
      const lastSession = results.chessSessions[results.chessSessions.length - 1];
      return (
        <>
          <AreaResult icon={Gamepad2} label="Partidas hoy" value={gamesToday} color="text-indigo-500" />
          <AreaResult icon={Gamepad2} label="Partidas semana" value={gamesWeek} color="text-indigo-500" />
          <AreaResult icon={Gamepad2} label="Partidas mes" value={gamesMonth} color="text-indigo-500" />
          <AreaResult icon={Trophy} label="ELO" value={lastSession?.current_elo ?? '—'} sub="Elo más reciente" color="text-emerald-500" />
        </>
      );
    }
    if (area === 'gym') {
      const countedDays = (from: string) => {
        if (!series) return 0;
        return new Set(series.filter(s => s.date >= from && s.minutes > 0).map(s => s.date)).size;
      };
      const totalToday = series?.find(s => s.date === anchorStr)?.minutes || 0;
      return (
        <>
          <AreaResult icon={Dumbbell} label="Hoy" value={`${totalToday} min`} color="text-orange-500" />
          <AreaResult icon={FireIcon} label="Días entreno semana" value={countedDays(fromW)} color="text-orange-500" />
          <AreaResult icon={FireIcon} label="Días entreno mes" value={countedDays(fromM)} color="text-orange-500" />
          <AreaResult icon={Trophy} label="Días entreno trim" value={countedDays(fromQ)} color="text-emerald-500" />
        </>
      );
    }
    if (area === 'musica') {
      const minWeek = sumInRange(results.musicSessions, 'practice_date', fromW, anchorStr, 'duration_minutes');
      const minMonth = sumInRange(results.musicSessions, 'practice_date', fromM, anchorStr, 'duration_minutes');
      const mastered = (results.songs || []).filter(s => s.status === 'mastered').length;
      return (
        <>
          <AreaResult icon={Music2} label="Práctica semana" value={`${minWeek} min`} color="text-pink-500" />
          <AreaResult icon={Music2} label="Práctica mes" value={`${minMonth} min`} color="text-pink-500" />
          <AreaResult icon={Trophy} label="Canciones" value={mastered} sub="dominadas" color="text-emerald-500" />
          <AreaResult icon={Music2} label="Repertorio" value={(results.songs || []).length} sub="total en repertorio" color="text-pink-500" />
        </>
      );
    }
    if (area === 'idiomas') {
      const langByDay = new Map<string, number>();
      (results.langSessions || []).forEach((s) => {
        langByDay.set(s.session_date, (langByDay.get(s.session_date) || 0) + (Number(s.total_duration) || 0));
      });
      const langSum = (from: string) => Array.from(langByDay.entries()).filter(([d]) => d >= from && d <= anchorStr).reduce((a, [, v]) => a + v, 0);
      const langDays = (from: string) => Array.from(langByDay.keys()).filter((d) => d >= from && d <= anchorStr).length;
      return (
        <>
          <AreaResult icon={Globe} label="Minutos semana" value={`${langSum(fromW)}`} color="text-emerald-500" />
          <AreaResult icon={Globe} label="Minutos mes" value={`${langSum(fromM)}`} color="text-emerald-500" />
          <AreaResult icon={Globe} label="Días activos semana" value={`${langDays(fromW)}`} color="text-emerald-500" />
          <AreaResult icon={Trophy} label="Días activos trimestre" value={`${langDays(fromQ)}`} color="text-emerald-500" />
        </>
      );
    }
    if (area === 'game') {
      const gameDays = (from: string) => {
        if (!series) return 0;
        return new Set(series.filter(s => s.date >= from && s.minutes > 0).map(s => s.date)).size;
      };
      const gameToday = series?.find(s => s.date === anchorStr)?.minutes || 0;
      return (
        <>
          <AreaResult icon={Sparkles} label="Hoy" value={`${gameToday} min`} color="text-amber-500" />
          <AreaResult icon={Sparkles} label="Días activos semana" value={gameDays(fromW)} color="text-amber-500" />
          <AreaResult icon={Sparkles} label="Días activos mes" value={gameDays(fromM)} color="text-amber-500" />
          <AreaResult icon={Trophy} label="Días activos trim" value={gameDays(fromQ)} color="text-emerald-500" />
        </>
      );
    }
  };

  const r = () => {
    const content = render();
    if (!content) return null;
    return (
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Resultados reales de {AREA_LABELS[area]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{content}</div>
        </CardContent>
      </Card>
    );
  };

  return r();
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