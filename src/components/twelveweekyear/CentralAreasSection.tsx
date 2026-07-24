import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { format, eachDayOfInterval, startOfWeek, subMonths, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookOpen, Music, Globe, Gamepad2, Zap,
  GraduationCap, Briefcase, FolderKanban, DollarSign,
  TrendingUp, BarChart3, Clock, Target, Flame, Activity,
} from "lucide-react";
import {
  Area, Bar, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line,
  PieChart, Pie, Cell,
} from "recharts";
import { useFinance } from "@/hooks/useFinance";

const MONTH_KEYS = ["month1", "month2", "month3"] as const;

function getQuarterDates(quarter: number, year = 2026) {
  const startMonth = (quarter - 1) * 3;
  return {
    start: new Date(year, startMonth, 1),
    end: new Date(year, startMonth + 3, 0),
  };
}

function loadPlanForQuarter(quarter: number) {
  try {
    const raw = localStorage.getItem(`trimestral_plan_Q${quarter}_2026`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function getTotalDaysActive(timeByDay: Record<string, number>): number {
  return Object.values(timeByDay).filter(v => v > 0).length;
}

function computeStreak(timeByDay: Record<string, number>, allDates: string[]): number {
  let streak = 0;
  for (let i = allDates.length - 1; i >= 0; i--) {
    if ((timeByDay[allDates[i]] || 0) > 0) streak++;
    else break;
  }
  return streak;
}

function getMonthlyGoal(plan: any, monthKey: string, area: string): number {
  if (!plan) return 0;
  const fromTimeGoals = plan.timeGoals?.[monthKey]?.[area];
  if (fromTimeGoals && fromTimeGoals > 0) return fromTimeGoals;
  const fromAreaGoals = plan.areaTimeGoals?.[monthKey]?.[area];
  if (fromAreaGoals && fromAreaGoals > 0) return fromAreaGoals;
  return 0;
}

interface SubAreaDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  trackingSource: 'area_stats' | 'time_data' | 'both';
  trackingId: string | string[];
  timeGoalKey?: string;
}

interface CentralAreaDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  subAreas: SubAreaDef[];
}

const CENTRAL_AREAS: CentralAreaDef[] = [
  {
    id: 'desarrollo',
    label: 'Desarrollo Personal',
    icon: <BookOpen className="h-4 w-4" />,
    gradient: 'from-emerald-500 to-teal-400',
    subAreas: [
      { id: 'lectura', label: 'Lectura', icon: <BookOpen className="h-3 w-3" />, color: 'emerald', trackingSource: 'area_stats', trackingId: 'lectura', timeGoalKey: 'lectura' },
      { id: 'musica', label: 'Música', icon: <Music className="h-3 w-3" />, color: 'rose', trackingSource: 'time_data', trackingId: 'musica', timeGoalKey: 'musica' },
      { id: 'idiomas', label: 'Idiomas', icon: <Globe className="h-3 w-3" />, color: 'sky', trackingSource: 'time_data', trackingId: ['italiano', 'ingles'], timeGoalKey: 'italiano' },
      { id: 'ajedrez', label: 'Ajedrez', icon: <Gamepad2 className="h-3 w-3" />, color: 'teal', trackingSource: 'both', trackingId: 'ajedrez', timeGoalKey: 'ajedrez' },
      { id: 'gym', label: 'Gimnasio', icon: <Zap className="h-3 w-3" />, color: 'orange', trackingSource: 'area_stats', trackingId: 'gym', timeGoalKey: 'gym' },
    ],
  },
  {
    id: 'profesional',
    label: 'Profesional/Académico',
    icon: <GraduationCap className="h-4 w-4" />,
    gradient: 'from-sky-500 to-blue-400',
    subAreas: [
      { id: 'universidad', label: 'Universidad', icon: <GraduationCap className="h-3 w-3" />, color: 'blue', trackingSource: 'area_stats', trackingId: 'universidad', timeGoalKey: 'universidad' },
      { id: 'emprendimiento', label: 'Emprendimiento', icon: <Briefcase className="h-3 w-3" />, color: 'purple', trackingSource: 'area_stats', trackingId: 'emprendimiento', timeGoalKey: 'emprendimiento' },
      { id: 'proyectos', label: 'Proyectos', icon: <FolderKanban className="h-3 w-3" />, color: 'amber', trackingSource: 'area_stats', trackingId: 'proyectos', timeGoalKey: 'proyectos' },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: <DollarSign className="h-4 w-4" />,
    gradient: 'from-green-500 to-emerald-400',
    subAreas: [],
  },
];

const COLORS: Record<string, string> = {
  emerald: "#10b981", rose: "#f43f5e", teal: "#14b8a6",
  pink: "#ec4899", green: "#22c55e", blue: "#3b82f6",
  orange: "#f97316", sky: "#0ea5e9", purple: "#a855f7",
  amber: "#f59e0b",
};

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

export function CentralAreasSection({ selectedQuarter }: { selectedQuarter: number }) {
  const qDates = useMemo(() => getQuarterDates(selectedQuarter), [selectedQuarter]);
  const [activeCentral, setActiveCentral] = useState<string>('desarrollo');
  const [activeSub, setActiveSub] = useState<string>('lectura');

  const plan = useMemo(() => loadPlanForQuarter(selectedQuarter), [selectedQuarter]);
  const activeCentralDef = CENTRAL_AREAS.find(a => a.id === activeCentral);
  const activeSubDef = activeCentralDef?.subAreas?.find(s => s.id === activeSub);

  const startStr = format(qDates.start, 'yyyy-MM-dd');
  const endStr = format(qDates.end, 'yyyy-MM-dd');

  // Query daily_area_stats
  const { data: areaStatsData } = useQuery({
    queryKey: ['quarterAreaStats', startStr, endStr],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_area_stats')
        .select('area_id, stat_date, time_spent_minutes, completed')
        .gte('stat_date', startStr)
        .lte('stat_date', endStr);
      return data || [];
    },
  });

  // Query daily_systems_tracking for time_data
  const { data: timeDataRows } = useQuery({
    queryKey: ['quarterSystemsTime', startStr, endStr],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_systems_tracking')
        .select('tracking_date, time_data')
        .gte('tracking_date', startStr)
        .lte('tracking_date', endStr);
      return data || [];
    },
  });

  // Query area_streaks
  const { data: streaksData } = useQuery({
    queryKey: ['quarterStreaks'],
    queryFn: async () => {
      const { data } = await supabase.from('area_streaks').select('*');
      return data || [];
    },
  });

  // Build day-by-day time map for a given sub-area
  const buildTimeByDay = (sub: SubAreaDef): Record<string, number> => {
    const timeByDay: Record<string, number> = {};
    const areaStats = areaStatsData || [];
    const timeRows = timeDataRows || [];

    // From daily_area_stats
    if (sub.trackingSource === 'area_stats' || sub.trackingSource === 'both') {
      const ids = Array.isArray(sub.trackingId) ? sub.trackingId : [sub.trackingId];
      areaStats
        .filter((r: any) => ids.includes(r.area_id))
        .forEach((r: any) => {
          timeByDay[r.stat_date] = (timeByDay[r.stat_date] || 0) + (r.time_spent_minutes || 0);
        });
    }

    // From daily_systems_tracking.time_data
    if (sub.trackingSource === 'time_data' || sub.trackingSource === 'both') {
      const ids = Array.isArray(sub.trackingId) ? sub.trackingId : [sub.trackingId];
      timeRows.forEach((row: any) => {
        const td = row.time_data || {};
        let sum = 0;
        ids.forEach((id: string) => { sum += Number(td[id]) || 0; });
        if (sum > 0) {
          timeByDay[row.tracking_date] = (timeByDay[row.tracking_date] || 0) + sum;
        }
      });
    }

    return timeByDay;
  };

  const allDateStrings = useMemo(() => {
    return eachDayOfInterval({ start: qDates.start, end: qDates.end }).map(d => format(d, 'yyyy-MM-dd'));
  }, [qDates]);

  // Compute stats for a sub-area
  const computeStats = (sub: SubAreaDef) => {
    const timeByDay = buildTimeByDay(sub);
    const totalDays = allDateStrings.length;
    const activeDays = getTotalDaysActive(timeByDay);
    const totalMinutes = Object.values(timeByDay).reduce((s, v) => s + v, 0);
    const avgMinutes = activeDays > 0 ? totalMinutes / activeDays : 0;
    const streak = computeStreak(timeByDay, allDateStrings);

    // Goal from trimestral plan
    let quarterlyGoal = 0;
    MONTH_KEYS.forEach(mk => {
      quarterlyGoal += getMonthlyGoal(plan, mk, sub.timeGoalKey || sub.id);
    });
    const goalPct = quarterlyGoal > 0 ? Math.round((totalMinutes / quarterlyGoal) * 100) : 0;

    // Consistency: % of days with any time
    const consistency = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;

    // Streak from area_streaks (if available)
    let streakFromDb: number | null = null;
    if (sub.trackingSource === 'area_stats' || sub.trackingSource === 'both') {
      const ids = Array.isArray(sub.trackingId) ? sub.trackingId : [sub.trackingId];
      ids.forEach((id: string) => {
        const found = (streaksData || []).find((s: any) => s.area_id === id);
        if (found && found.current_streak > (streakFromDb || 0)) {
          streakFromDb = found.current_streak;
        }
      });
    }
    const displayStreak = streakFromDb !== null ? Math.max(streak, streakFromDb) : streak;

    return { timeByDay, activeDays, totalDays, totalMinutes, avgMinutes, streak: displayStreak, goalPct, consistency, quarterlyGoal };
  };

  const subStats = useMemo(() => {
    if (!activeSubDef) return null;
    return computeStats(activeSubDef);
  }, [activeSubDef, areaStatsData, timeDataRows, streaksData, plan]);

  // Build weekly chart data for the current sub-area
  const weeklyChartData = useMemo(() => {
    if (!activeSubDef || !subStats) return [];
    const weeks: { week: number; label: string; minutes: number; trend: number }[] = [];
    let weekNum = 1;
    for (let d = new Date(qDates.start); d <= qDates.end; d.setDate(d.getDate() + 7)) {
      const weekStart = new Date(d);
      const weekEnd = new Date(d);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > qDates.end) break;
      let total = 0;
      for (let day = new Date(weekStart); day <= weekEnd; day.setDate(day.getDate() + 1)) {
        const ds = format(day, 'yyyy-MM-dd');
        total += subStats.timeByDay[ds] || 0;
      }
      weeks.push({
        week: weekNum,
        label: `S${weekNum}`,
        minutes: total,
        trend: 0,
      });
      weekNum++;
    }
    // Simple moving average for trend line
    for (let i = 2; i < weeks.length - 1; i++) {
      weeks[i].trend = Math.round((weeks[i - 2].minutes + weeks[i - 1].minutes + weeks[i].minutes + weeks[i + 1].minutes) / 4);
    }
    if (weeks.length > 0) weeks[weeks.length - 1].trend = weeks[weeks.length - 1].minutes;
    return weeks;
  }, [activeSubDef, subStats, qDates]);

  // Change sub-area when central tab changes
  const handleCentralChange = (id: string) => {
    setActiveCentral(id);
    const def = CENTRAL_AREAS.find(a => a.id === id);
    if (def?.subAreas?.length) {
      setActiveSub(def.subAreas[0].id);
    }
  };

  const centralArea = CENTRAL_AREAS.find(a => a.id === activeCentral);
  const activeGradient = centralArea?.gradient || 'from-primary to-primary/60';

  if (!areaStatsData || !timeDataRows) {
    return (
      <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 text-center text-muted-foreground">Cargando datos de áreas...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section title */}
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Áreas Centrales</h2>
        <span className="text-[10px] text-muted-foreground">{format(qDates.start, 'd MMM', { locale: es })} – {format(qDates.end, 'd MMM yyyy', { locale: es })}</span>
      </div>

      {/* Central area tabs */}
      <div className="grid grid-cols-3 gap-2">
        {CENTRAL_AREAS.map(area => {
          const active = activeCentral === area.id;
          return (
            <button
              key={area.id}
              onClick={() => handleCentralChange(area.id)}
              className={cn(
                "relative rounded-xl p-3 text-left transition-all border-0",
                active
                  ? `bg-gradient-to-r ${area.gradient} text-white shadow-lg shadow-black/10 scale-[1.02]`
                  : "bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:shadow-md border border-border/40"
              )}
            >
              <div className="flex items-center gap-2">
                {area.icon}
                <span className="text-xs font-semibold">{area.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-area tabs (only for non-finance) */}
      {activeCentral !== 'finanzas' && activeCentralDef && activeCentralDef.subAreas.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {activeCentralDef.subAreas.map(sub => {
            const active = activeSub === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSub(sub.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                  active
                    ? `bg-gradient-to-r ${activeGradient} text-white shadow-sm border-transparent`
                    : "bg-white/70 dark:bg-zinc-900/70 border-border/40 hover:border-foreground/20 text-muted-foreground"
                )}
              >
                {sub.icon}
                {sub.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {activeCentral === 'finanzas' ? (
        <FinanceContent />
      ) : activeSubDef && subStats ? (
        <AreaContent
          sub={activeSubDef}
          stats={subStats}
          chartData={weeklyChartData}
          color={COLORS[activeSubDef.color] || "#6366f1"}
          gradient={activeGradient}
        />
      ) : null}
    </div>
  );
}

function AreaContent({
  sub, stats, chartData, color, gradient,
}: {
  sub: SubAreaDef;
  stats: ReturnType<typeof buildStats>;
  chartData: { week: number; label: string; minutes: number; trend: number }[];
  color: string;
  gradient: string;
}) {
  const maxMin = Math.max(...chartData.map(d => d.minutes), 1);

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className={cn("h-1 bg-gradient-to-r", gradient)} />
      <CardContent className="p-4 space-y-4">
        {/* Area header */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            {sub.icon}
          </div>
          <span className="text-sm font-semibold">{sub.label}</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <StatCard
            icon={<Calendar className="h-3 w-3" />}
            label="Días activos"
            value={`${stats.activeDays}/${stats.totalDays}`}
            sub={`${Math.round((stats.activeDays / Math.max(stats.totalDays, 1)) * 100)}%`}
            color={color}
          />
          <StatCard
            icon={<Flame className="h-3 w-3" />}
            label="Racha"
            value={`${stats.streak} días`}
            color={stats.streak >= 7 ? '#10b981' : stats.streak >= 3 ? '#f59e0b' : color}
          />
          <StatCard
            icon={<Clock className="h-3 w-3" />}
            label="Total"
            value={formatMinutes(stats.totalMinutes)}
            color={color}
          />
          <StatCard
            icon={<BarChart3 className="h-3 w-3" />}
            label="Promedio"
            value={`${Math.round(stats.avgMinutes)}min/día`}
            color={color}
          />
          <StatCard
            icon={<Target className="h-3 w-3" />}
            label="vs Meta"
            value={stats.quarterlyGoal > 0 ? `${stats.goalPct}%` : '—'}
            sub={stats.quarterlyGoal > 0 ? `${formatMinutes(stats.totalMinutes)} / ${formatMinutes(stats.quarterlyGoal)}` : undefined}
            color={stats.goalPct >= 100 ? '#10b981' : stats.goalPct >= 50 ? '#f59e0b' : color}
          />
          <StatCard
            icon={<Activity className="h-3 w-3" />}
            label="Consistencia"
            value={`${stats.consistency}%`}
            color={stats.consistency >= 70 ? '#10b981' : stats.consistency >= 40 ? '#f59e0b' : '#ef4444'}
          />
        </div>

        {/* Weekly chart */}
        {chartData.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tendencia semanal</span>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / (v >= 60 ? 60 : 1))}${v >= 60 ? 'h' : 'm'}`} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`${formatMinutes(value)}`, 'Tiempo']}
                  />
                  <defs>
                    <linearGradient id={`areaGrad-${sub.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="trend" stroke={color} fill={`url(#areaGrad-${sub.id})`} strokeWidth={2} dot={false} />
                  <Bar dataKey="minutes" fill={color} radius={[3, 3, 0, 0]} opacity={0.7} maxBarSize={24} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3 mt-1 text-[9px] text-muted-foreground/60 justify-center">
              <span className="flex items-center gap-1"><div className="w-3 h-1 rounded" style={{ backgroundColor: color, opacity: 0.7 }} /> Minutos por semana</span>
              <span className="flex items-center gap-1"><div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} /> Tendencia</span>
            </div>
          </div>
        )}

        {/* Progress to quarterly goal */}
        {stats.quarterlyGoal > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Progreso vs meta trimestral</span>
              <span>{stats.goalPct}%</span>
            </div>
            <Progress value={Math.min(stats.goalPct, 100)} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-border/40 space-y-1">
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
        {icon}
        <span className="uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function FinanceContent() {
  const { wallets, transactions, isLoading } = useFinance();

  const exchangeRate = 360;

  const currentMonth = useMemo(() => new Date(), []);

  const monthlyData = useMemo(() => {
    if (!transactions.length) return { income: 0, expenses: 0, balance: 0, savingsRate: 0, totalBalance: 0 };

    const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

    const thisMonth = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === currentMonth.getMonth() && td.getFullYear() === currentMonth.getFullYear();
    });

    const income = thisMonth
      .filter(t => t.type === 'income' && t.categoryId !== 'cat-transfer')
      .reduce((s, t) => s + t.amount, 0);
    const expenses = thisMonth
      .filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer')
      .reduce((s, t) => s + t.amount, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

    return { income: Math.round(income), expenses: Math.round(expenses), balance: Math.round(balance), savingsRate, totalBalance: Math.round(totalBalance) };
  }, [wallets, transactions, currentMonth]);

  // Last 6 months trend
  const monthlyTrend = useMemo(() => {
    const months: { month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(currentMonth, i);
      const label = format(d, 'MMM', { locale: es });
      const filtered = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      const income = Math.round(filtered.filter(t => t.type === 'income' && t.categoryId !== 'cat-transfer').reduce((s, t) => s + t.amount, 0));
      const expenses = Math.round(filtered.filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer').reduce((s, t) => s + t.amount, 0));
      months.push({ month: label, income, expenses });
    }
    return months;
  }, [transactions, currentMonth]);

  const maxFinanceValue = Math.max(...monthlyTrend.flatMap(m => [m.income, m.expenses]), 1);

  if (isLoading) {
    return (
      <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 text-center text-muted-foreground">Cargando finanzas...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
      <CardContent className="p-4 space-y-4">
        {/* Finances header */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span className="text-sm font-semibold">Resumen Financiero</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{format(currentMonth, "MMMM yyyy", { locale: es })}</span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard
            icon={<DollarSign className="h-3 w-3" />}
            label="Balance total"
            value={`$${monthlyData.totalBalance}`}
            color="#10b981"
          />
          <StatCard
            icon={<TrendingUp className="h-3 w-3" />}
            label="Ingresos"
            value={`$${monthlyData.income}`}
            color="#3b82f6"
          />
          <StatCard
            icon={<BarChart3 className="h-3 w-3" />}
            label="Gastos"
            value={`$${monthlyData.expenses}`}
            color={monthlyData.expenses > monthlyData.income ? '#ef4444' : '#f59e0b'}
          />
          <StatCard
            icon={<Activity className="h-3 w-3" />}
            label="Tasa de ahorro"
            value={monthlyData.savingsRate >= 0 ? `${monthlyData.savingsRate}%` : '—'}
            color={monthlyData.savingsRate >= 20 ? '#10b981' : monthlyData.savingsRate >= 10 ? '#f59e0b' : '#ef4444'}
          />
        </div>

        {/* Monthly trend chart */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Ingresos vs Gastos (6 meses)</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }} formatter={(value: number, name: string) => [`$${value}`, name === 'income' ? 'Ingresos' : 'Gastos']} />
                <Bar dataKey="income" name="income" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.8} maxBarSize={20} />
                <Bar dataKey="expenses" name="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.8} maxBarSize={20} />
                <Line type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 mt-1 text-[9px] text-muted-foreground/60 justify-center">
            <span className="flex items-center gap-1"><div className="w-3 h-1 rounded bg-blue-500" /> Ingresos</span>
            <span className="flex items-center gap-1"><div className="w-3 h-1 rounded bg-red-500" /> Gastos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function buildStats(sub: SubAreaDef): {
  timeByDay: Record<string, number>;
  activeDays: number;
  totalDays: number;
  totalMinutes: number;
  avgMinutes: number;
  streak: number;
  goalPct: number;
  consistency: number;
  quarterlyGoal: number;
} {
  return { timeByDay: {}, activeDays: 0, totalDays: 0, totalMinutes: 0, avgMinutes: 0, streak: 0, goalPct: 0, consistency: 0, quarterlyGoal: 0 };
}
