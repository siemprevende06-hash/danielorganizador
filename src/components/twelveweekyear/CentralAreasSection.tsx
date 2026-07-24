import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { format, eachDayOfInterval, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookOpen, Music, Globe, Gamepad2, Zap,
  GraduationCap, Briefcase, FolderKanban, DollarSign,
  TrendingUp, BarChart3, Clock, Target, Flame, Activity,
} from "lucide-react";

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

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

export interface SubAreaDef {
  id: string; label: string; icon: React.ReactNode; color: string;
  trackingSource: 'area_stats' | 'time_data' | 'both';
  trackingId: string | string[]; timeGoalKey?: string;
}

export interface CentralAreaDef {
  id: string; label: string; icon: React.ReactNode; gradient: string;
  subAreas: SubAreaDef[];
}

export const CENTRAL_AREAS: CentralAreaDef[] = [
  {
    id: 'desarrollo', label: 'Desarrollo Personal',
    icon: <BookOpen className="h-4 w-4" />, gradient: 'from-emerald-500 to-teal-400',
    subAreas: [
      { id: 'lectura', label: 'Lectura', icon: <BookOpen className="h-3 w-3" />, color: 'emerald', trackingSource: 'area_stats', trackingId: 'lectura', timeGoalKey: 'lectura' },
      { id: 'musica', label: 'Música', icon: <Music className="h-3 w-3" />, color: 'rose', trackingSource: 'time_data', trackingId: 'musica', timeGoalKey: 'musica' },
      { id: 'idiomas', label: 'Idiomas', icon: <Globe className="h-3 w-3" />, color: 'sky', trackingSource: 'time_data', trackingId: ['italiano', 'ingles'], timeGoalKey: 'italiano' },
      { id: 'ajedrez', label: 'Ajedrez', icon: <Gamepad2 className="h-3 w-3" />, color: 'teal', trackingSource: 'both', trackingId: 'ajedrez', timeGoalKey: 'ajedrez' },
      { id: 'gym', label: 'Gimnasio', icon: <Zap className="h-3 w-3" />, color: 'orange', trackingSource: 'area_stats', trackingId: 'gym', timeGoalKey: 'gym' },
    ],
  },
  {
    id: 'profesional', label: 'Profesional/Académico',
    icon: <GraduationCap className="h-4 w-4" />, gradient: 'from-sky-500 to-blue-400',
    subAreas: [
      { id: 'universidad', label: 'Universidad', icon: <GraduationCap className="h-3 w-3" />, color: 'blue', trackingSource: 'area_stats', trackingId: 'universidad', timeGoalKey: 'universidad' },
      { id: 'emprendimiento', label: 'Emprendimiento', icon: <Briefcase className="h-3 w-3" />, color: 'purple', trackingSource: 'area_stats', trackingId: 'emprendimiento', timeGoalKey: 'emprendimiento' },
      { id: 'proyectos', label: 'Proyectos', icon: <FolderKanban className="h-3 w-3" />, color: 'amber', trackingSource: 'area_stats', trackingId: 'proyectos', timeGoalKey: 'proyectos' },
    ],
  },
  {
    id: 'finanzas', label: 'Finanzas',
    icon: <DollarSign className="h-4 w-4" />, gradient: 'from-green-500 to-emerald-400',
    subAreas: [],
  },
];

interface StatBox { label: string; value: string; sub?: string; color: string }

function StatsRow({ stats }: { stats: StatBox[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {stats.map((s, i) => (
        <div key={i} className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-border/40 space-y-1">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          <p className="text-xs font-bold" style={{ color: s.color }}>{s.value}</p>
          {s.sub && <p className="text-[9px] text-muted-foreground">{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export function CentralAreasSection({
  selectedQuarter,
  activeCentral,
  onCentralChange,
}: {
  selectedQuarter: number;
  activeCentral: string;
  onCentralChange: (id: string) => void;
}) {
  const qDates = useMemo(() => getQuarterDates(selectedQuarter), [selectedQuarter]);
  const [activeSub, setActiveSub] = useState<string>('lectura');

  const plan = useMemo(() => loadPlanForQuarter(selectedQuarter), [selectedQuarter]);
  const activeDef = CENTRAL_AREAS.find(a => a.id === activeCentral);
  const activeSubDef = activeDef?.subAreas?.find(s => s.id === activeSub);

  const startStr = format(qDates.start, 'yyyy-MM-dd');
  const endStr = format(qDates.end, 'yyyy-MM-dd');

  const { data: areaStats } = useQuery({
    queryKey: ['qc-area', startStr, endStr],
    queryFn: async () => {
      const { data } = await supabase.from('daily_area_stats')
        .select('area_id, stat_date, time_spent_minutes')
        .gte('stat_date', startStr).lte('stat_date', endStr);
      return data || [];
    },
  });

  const { data: systems } = useQuery({
    queryKey: ['qc-sys', startStr, endStr],
    queryFn: async () => {
      const { data } = await supabase.from('daily_systems_tracking')
        .select('tracking_date, time_data')
        .gte('tracking_date', startStr).lte('tracking_date', endStr);
      return data || [];
    },
  });

  const handleCentral = (id: string) => {
    onCentralChange(id);
    const def = CENTRAL_AREAS.find(a => a.id === id);
    if (def?.subAreas?.length) setActiveSub(def.subAreas[0].id);
  };

  const stats = useMemo(() => {
    if (!activeSubDef) return null;
    const areaRows = areaStats || [];
    const sysRows = systems || [];
    const timeByDay: Record<string, number> = {};
    const ids = Array.isArray(activeSubDef.trackingId) ? activeSubDef.trackingId : [activeSubDef.trackingId];

    if (activeSubDef.trackingSource !== 'time_data') {
      areaRows.filter((r: any) => ids.includes(r.area_id)).forEach((r: any) => {
        timeByDay[r.stat_date] = (timeByDay[r.stat_date] || 0) + (r.time_spent_minutes || 0);
      });
    }
    if (activeSubDef.trackingSource !== 'area_stats' || activeSubDef.trackingSource === 'both') {
      sysRows.forEach((row: any) => {
        const td = row.time_data || {};
        let sum = 0;
        ids.forEach((id: string) => { sum += Number(td[id]) || 0; });
        if (sum > 0) timeByDay[row.tracking_date] = (timeByDay[row.tracking_date] || 0) + sum;
      });
    }

    const allDates = eachDayOfInterval({ start: qDates.start, end: qDates.end }).map(d => format(d, 'yyyy-MM-dd'));
    const totalDays = allDates.length;
    const activeDays = Object.values(timeByDay).filter(v => v > 0).length;
    const totalMinutes = Object.values(timeByDay).reduce((s, v) => s + v, 0);
    const avgMinutes = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;

    let streak = 0;
    for (let i = allDates.length - 1; i >= 0; i--) {
      if ((timeByDay[allDates[i]] || 0) > 0) streak++; else break;
    }

    let quarterlyGoal = 0;
    MONTH_KEYS.forEach(mk => {
      if (!plan) return;
      const g = plan.timeGoals?.[mk]?.[activeSubDef.timeGoalKey || activeSubDef.id] || plan.areaTimeGoals?.[mk]?.[activeSubDef.timeGoalKey || activeSubDef.id] || 0;
      quarterlyGoal += g;
    });
    const goalPct = quarterlyGoal > 0 ? Math.round((totalMinutes / quarterlyGoal) * 100) : 0;
    const consistency = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;

    return [
      { label: "DÍAS ACTIVOS", value: `${activeDays}/${totalDays}`, sub: `${Math.round((activeDays / Math.max(totalDays, 1)) * 100)}%`, color: "#10b981" },
      { label: "RACHA", value: `${streak} días`, color: streak >= 7 ? '#10b981' : streak >= 3 ? '#f59e0b' : '#6366f1' },
      { label: "TOTAL", value: formatMinutes(totalMinutes), color: "#6366f1" },
      { label: "PROMEDIO", value: `${avgMinutes}min/día`, color: "#6366f1" },
      { label: "VS META", value: quarterlyGoal > 0 ? `${goalPct}%` : '—', sub: quarterlyGoal > 0 ? `${formatMinutes(totalMinutes)} / ${formatMinutes(quarterlyGoal)}` : undefined, color: goalPct >= 100 ? '#10b981' : goalPct >= 50 ? '#f59e0b' : '#6366f1' },
      { label: "CONSISTENCIA", value: `${consistency}%`, color: consistency >= 70 ? '#10b981' : consistency >= 40 ? '#f59e0b' : '#ef4444' },
    ];
  }, [activeSubDef, areaStats, systems, plan, qDates]);

  const loading = !areaStats || !systems;
  const grad = activeDef?.gradient || 'from-primary to-primary/60';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Áreas Centrales</h2>
        <span className="text-[10px] text-muted-foreground">{format(qDates.start, 'd MMM', { locale: es })} – {format(qDates.end, 'd MMM yyyy', { locale: es })}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {CENTRAL_AREAS.map(area => {
          const active = activeCentral === area.id;
          return (
            <button key={area.id} onClick={() => handleCentral(area.id)}
              className={cn(
                "relative rounded-xl p-3 text-left transition-all border-0",
                active ? `bg-gradient-to-r ${area.gradient} text-white shadow-lg shadow-black/10 scale-[1.02]` : "bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:shadow-md border border-border/40"
              )}
            >
              <div className="flex items-center gap-2">{area.icon}<span className="text-xs font-semibold">{area.label}</span></div>
            </button>
          );
        })}
      </div>

      {activeCentral !== 'finanzas' && activeDef && activeDef.subAreas.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {activeDef.subAreas.map(sub => {
            const active = activeSub === sub.id;
            return (
              <button key={sub.id} onClick={() => setActiveSub(sub.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                  active ? `bg-gradient-to-r ${grad} text-white shadow-sm border-transparent` : "bg-white/70 dark:bg-zinc-900/70 border-border/40 hover:border-foreground/20 text-muted-foreground"
                )}
              >{sub.icon}{sub.label}</button>
            );
          })}
        </div>
      )}

      {activeCentral === 'finanzas' ? (
        <FinanceSummaryCard />
      ) : loading ? (
        <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 rounded-2xl overflow-hidden">
          <CardContent className="p-8 text-center text-muted-foreground">Cargando datos...</CardContent>
        </Card>
      ) : stats ? (
        <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <div className={cn("h-1 bg-gradient-to-r", grad)} />
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-muted">{activeSubDef?.icon}</div>
              <span className="text-sm font-semibold">{activeSubDef?.label}</span>
            </div>
            <StatsRow stats={stats} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function FinanceSummaryCard() {
  const today = useMemo(() => new Date(), []);

  const { data: wallets } = useQuery({
    queryKey: ['fin-w'],
    queryFn: async () => { const { data } = await supabase.from('wallets').select('*'); return data || []; },
    retry: 1, staleTime: 60000,
  });

  const { data: txs } = useQuery({
    queryKey: ['fin-t'],
    queryFn: async () => { const { data } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false }); return data || []; },
    retry: 1, staleTime: 60000,
  });

  const stats = useMemo(() => {
    const totalBalance = Math.round((wallets || []).reduce((s: number, w: any) => s + (w.balance || 0), 0));
    const list = (txs || []).map((t: any) => ({ ...t, date: new Date(t.transaction_date), type: t.transaction_type, categoryId: t.category_id }));
    const thisMonth = list.filter((t: any) => { const d = t.date; return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(); });
    const income = Math.round(thisMonth.filter((t: any) => t.type === 'income' && t.categoryId !== 'cat-transfer').reduce((s: number, t: any) => s + t.amount, 0));
    const expenses = Math.round(thisMonth.filter((t: any) => t.type === 'expense' && t.categoryId !== 'cat-transfer').reduce((s: number, t: any) => s + t.amount, 0));
    const balance = income - expenses;
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
    return { totalBalance, income, expenses, balance, savingsRate };
  }, [wallets, txs, today]);

  if (!wallets || !txs) {
    return (
      <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 rounded-2xl overflow-hidden">
        <CardContent className="p-8 text-center text-muted-foreground">Cargando finanzas...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span className="text-sm font-semibold">Resumen Financiero</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{format(today, "MMMM yyyy", { locale: es })}</span>
        </div>
        <StatsRow stats={[
          { label: "BALANCE TOTAL", value: `$${stats.totalBalance}`, color: "#10b981" },
          { label: "INGRESOS", value: `$${stats.income}`, color: "#3b82f6" },
          { label: "GASTOS", value: `$${stats.expenses}`, color: stats.expenses > stats.income ? '#ef4444' : '#f59e0b' },
          { label: "AHORRO", value: stats.savingsRate >= 0 ? `${stats.savingsRate}%` : '—', color: stats.savingsRate >= 20 ? '#10b981' : stats.savingsRate >= 10 ? '#f59e0b' : '#ef4444' },
        ]} />
      </CardContent>
    </Card>
  );
}
