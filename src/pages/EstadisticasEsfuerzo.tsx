import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChevronLeft, ChevronRight, BarChart3, Shield, TrendingUp, Dumbbell, BookOpen, Music, Gamepad2, Globe, Clock, GraduationCap, Briefcase, FolderKanban, ListTodo, Target, TrendingDown, TrendingUp as TrendingUpIcon, Minus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------- Sostén ----------
const SOSTEN_GROUPS = [
  {
    label: 'Estructural', habits: [
      { id: 'rutina-activacion', label: 'Activación' },
      { id: 'alistamiento-desayuno', label: 'Alistamiento' },
      { id: 'horario-regular', label: 'Horario' },
      { id: 'rutina-desactivacion', label: 'Desactivación' },
    ],
  },
  {
    label: 'Apariencia', habits: [
      { id: 'skincare-manana', label: 'Skincare AM' },
      { id: 'skincare-noche', label: 'Skincare PM' },
      { id: 'banarme-vestirme', label: 'Bañarse' },
    ],
  },
  {
    label: 'Alimentación', habits: [
      { id: 'pre-entreno', label: 'Pre-entreno' },
      { id: 'desayuno', label: 'Desayuno' },
      { id: 'merienda-1', label: 'Merienda 1' },
      { id: 'almuerzo', label: 'Almuerzo' },
      { id: 'merienda-2', label: 'Merienda 2' },
      { id: 'comida', label: 'Comida' },
      { id: 'antes-dormir', label: 'Antes dormir' },
      { id: 'suplementos', label: 'Suplem.' },
    ],
  },
];
const ALL_SOSTEN_IDS = SOSTEN_GROUPS.flatMap(g => g.habits.map(h => h.id));

// ---------- Mejora ----------
const MEJORA_HABITS = [
  { id: 'lectura', label: 'Lectura', icon: BookOpen, hasTime: true },
  { id: 'musica', label: 'Música', icon: Music, hasTime: true },
  { id: 'ajedrez', label: 'Ajedrez', icon: Gamepad2, hasTime: true, hasCount: true, countLabel: 'part.' },
  { id: 'idiomas', label: 'Idiomas', icon: Globe, hasTime: true },
  { id: 'game', label: 'Game (Seducción)', icon: Gamepad2, hasTime: true },
  { id: 'entrenamiento-fisico', label: 'Entreno', icon: Dumbbell, hasTime: true },
];

// ---------- Focus ----------
const FOCUS_AREAS = [
  { id: 'universidad', label: 'Universidad', icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
  { id: 'emprendimiento', label: 'Emprendimiento', icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
  { id: 'proyectos', label: 'Proyectos', icon: FolderKanban, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  { id: 'tareas-generales', label: 'Tareas Grales.', icon: ListTodo, color: 'text-muted-foreground', bg: 'bg-muted/20' },
];

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function getMejoraTime(td: Record<string, any> | undefined | null, habitId: string): number {
  if (!td) return 0
  if (habitId === 'idiomas') return (Number(td.italiano) || 0) + (Number(td.ingles) || 0)
  return Number(td[habitId]) || 0
}

// ─── Utility: weekly buckets for trend analysis ───
function getWeekId(dateStr: string) {
  const d = parseISO(dateStr);
  const start = startOfWeek(d, { weekStartsOn: 1 });
  return format(start, 'yyyy-MM-dd');
}

export default function EstadisticasEsfuerzo() {
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [systemsData, setSystemsData] = useState<any[]>([]);
  const [areaStats, setAreaStats] = useState<any[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<any[]>([]);

  // ─── Load all data ───
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const [sysRes, areaRes, tasksRes] = await Promise.all([
        supabase.from('daily_systems_tracking').select('tracking_date, completions, time_data, count_data, block_completions, workout_duration').gte('tracking_date', startDate).lte('tracking_date', endDate).order('tracking_date', { ascending: true }),
        supabase.from('daily_area_stats').select('area_id, stat_date, time_spent_minutes').gte('stat_date', startDate).lte('stat_date', endDate).order('stat_date', { ascending: true }),
        supabase.from('tasks').select('id, completed, completed_at, source, due_date, area_id').or(`completed_at.gte.${startDate},due_date.gte.${startDate}`),
      ]);

      setSystemsData(sysRes.data || []);
      setAreaStats(areaRes.data || []);
      setTaskCompletions(tasksRes.data || []);
      setLoading(false);
    };
    load();
  }, [year]);

  const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

  // ─── Filtered days for the selected month ───
  const monthDays = useMemo(() => {
    return systemsData.filter(r => r.tracking_date.startsWith(monthKey));
  }, [systemsData, monthKey]);

  // ─── Focus data per day ───
  const focusPerDay = useMemo(() => {
    const areaMap: Record<string, Record<string, number>> = {};
    areaStats.forEach(a => {
      if (!a.stat_date.startsWith(monthKey)) return;
      if (!areaMap[a.stat_date]) areaMap[a.stat_date] = { universidad: 0, emprendimiento: 0, proyectos: 0 };
      if (a.area_id === 'universidad' || a.area_id === 'emprendimiento' || a.area_id === 'proyectos') {
        areaMap[a.stat_date][a.area_id] = (areaMap[a.stat_date][a.area_id] || 0) + (a.time_spent_minutes || 0);
      }
    });
    // Task completions per day (general tasks)
    const taskMap: Record<string, number> = {};
    taskCompletions.forEach(t => {
      if (t.completed && t.completed_at) {
        const d = t.completed_at.slice(0, 10);
        if (d.startsWith(monthKey)) {
          if (t.source === 'general' || (!t.source && !t.area_id)) {
            taskMap[d] = (taskMap[d] || 0) + 1;
          }
        }
      }
    });
    const dates = monthDays.map(d => d.tracking_date);
    return dates.map(date => ({
      date,
      universidad: areaMap[date]?.universidad || 0,
      emprendimiento: areaMap[date]?.emprendimiento || 0,
      proyectos: areaMap[date]?.proyectos || 0,
      tareasGenerales: taskMap[date] || 0,
    }));
  }, [monthDays, areaStats, taskCompletions, monthKey]);

  // ─── Weekly aggregated data for trends ───
  const weeklyTrends = useMemo(() => {
    const weeks: Record<string, {
      days: number;
      sosten: number; sostenTotal: number;
      mejoraMin: number;
      focus: Record<string, number>;
      tareas: number;
      habitCompletions: Record<string, number>;
      habitMinutes: Record<string, number>;
    }> = {};

    const allSystems = systemsData;
    const areaMapAll: Record<string, Record<string, number>> = {};
    areaStats.forEach(a => {
      if (!areaMapAll[a.stat_date]) areaMapAll[a.stat_date] = { universidad: 0, emprendimiento: 0, proyectos: 0 };
      if (a.area_id === 'universidad' || a.area_id === 'emprendimiento' || a.area_id === 'proyectos') {
        areaMapAll[a.stat_date][a.area_id] = (areaMapAll[a.stat_date][a.area_id] || 0) + (a.time_spent_minutes || 0);
      }
    });

    taskCompletions.forEach(t => {
      if (!t.completed || !t.completed_at) return;
      const d = t.completed_at.slice(0, 10);
      if (d < `${year}-01-01` || d > `${year}-12-31`) return;
      if (t.source === 'general' || (!t.source && !t.area_id)) {
        const wid = getWeekId(d);
        if (!weeks[wid]) weeks[wid] = { days: 0, sosten: 0, sostenTotal: 0, mejoraMin: 0, focus: { universidad: 0, emprendimiento: 0, proyectos: 0 }, tareas: 0, habitCompletions: {}, habitMinutes: {} };
        weeks[wid].tareas++;
      }
    });

    allSystems.forEach(row => {
      const wid = getWeekId(row.tracking_date);
      if (!weeks[wid]) weeks[wid] = { days: 0, sosten: 0, sostenTotal: 0, mejoraMin: 0, focus: { universidad: 0, emprendimiento: 0, proyectos: 0 }, tareas: 0, habitCompletions: {}, habitMinutes: {} };
      weeks[wid].days++;
      const c = row.completions || {};
      ALL_SOSTEN_IDS.forEach(h => {
        if (c[h]) weeks[wid].sosten++;
        if (c[h]) weeks[wid].habitCompletions[h] = (weeks[wid].habitCompletions[h] || 0) + 1;
      });
      weeks[wid].sostenTotal += ALL_SOSTEN_IDS.length;
      const td = row.time_data || {};
      MEJORA_HABITS.forEach(h => {
        const mins = getMejoraTime(td, h.id);
        weeks[wid].mejoraMin += mins;
        weeks[wid].habitMinutes[h.id] = (weeks[wid].habitMinutes[h.id] || 0) + mins;
      });
      weeks[wid].mejoraMin += (row.workout_duration || 0);
      weeks[wid].habitMinutes['entrenamiento-fisico'] = (weeks[wid].habitMinutes['entrenamiento-fisico'] || 0) + (row.workout_duration || 0);

      const f = areaMapAll[row.tracking_date];
      if (f) {
        weeks[wid].focus.universidad += f.universidad || 0;
        weeks[wid].focus.emprendimiento += f.emprendimiento || 0;
        weeks[wid].focus.proyectos += f.proyectos || 0;
      }
    });

    return Object.entries(weeks)
      .map(([weekId, data]) => {
        const daysCount = data.days || 1;
        const perHabitCompletions: Record<string, number> = {};
        ALL_SOSTEN_IDS.forEach(h => {
          perHabitCompletions[h] = Math.round(((data.habitCompletions[h] || 0) / daysCount) * 100);
        });
        return {
          weekId,
          label: `Sem ${weekId.slice(-5)}`,
          ...data,
          sostenPct: data.sostenTotal > 0 ? Math.round((data.sosten / data.sostenTotal) * 100) : 0,
          focusTotal: data.focus.universidad + data.focus.emprendimiento + data.focus.proyectos,
          perHabitCompletions,
        };
      })
      .sort((a, b) => a.weekId.localeCompare(b.weekId));
  }, [systemsData, areaStats, taskCompletions, year]);

  // ─── Stats for the current month ───
  const monthTotalSosten = ALL_SOSTEN_IDS.reduce((acc, h) => acc + monthDays.filter(d => d.completions?.[h]).length, 0);
  const monthMaxSosten = monthDays.length * ALL_SOSTEN_IDS.length;
  const monthSostenPct = monthMaxSosten > 0 ? Math.round((monthTotalSosten / monthMaxSosten) * 100) : 0;
  const monthMejoraMin = monthDays.reduce((s, d) => {
    const td = d.time_data || {};
    return s + MEJORA_HABITS.reduce((a, h) => a + getMejoraTime(td, h.id), 0) + (d.workout_duration || 0);
  }, 0);
  const monthFocusMin = focusPerDay.reduce((s, d) => s + d.universidad + d.emprendimiento + d.proyectos, 0);
  const monthTareas = focusPerDay.reduce((s, d) => s + d.tareasGenerales, 0);

  const bestDaySosten = monthDays.length > 0 ? Math.max(...monthDays.map(d => ALL_SOSTEN_IDS.filter(h => d.completions?.[h]).length)) : 0;
  const avgDaySosten = monthDays.length > 0 ? Math.round(monthTotalSosten / monthDays.length) : 0;

  const bestDayFocus = focusPerDay.length > 0 ? Math.max(...focusPerDay.map(d => d.universidad + d.emprendimiento + d.proyectos)) : 0;
  const avgDayFocus = focusPerDay.length > 0 ? Math.round(focusPerDay.reduce((s, d) => s + d.universidad + d.emprendimiento + d.proyectos, 0) / focusPerDay.length) : 0;

  // ─── Consistency: days with >= 80% sosten ───
  const consistentDays = monthDays.filter(d => ALL_SOSTEN_IDS.filter(h => d.completions?.[h]).length / ALL_SOSTEN_IDS.length >= 0.8).length;
  const consistencyPct = monthDays.length > 0 ? Math.round((consistentDays / monthDays.length) * 100) : 0;

  // ─── Top mejora habit ───
  const mejoraTotals = MEJORA_HABITS.map(h => ({
    ...h,
    total: monthDays.reduce((s, d) => s + getMejoraTime(d.time_data, h.id), 0),
  }));
  mejoraTotals.push({ id: 'entreno', label: 'Entreno', icon: Dumbbell, hasTime: true, total: monthDays.reduce((s, d) => s + (d.workout_duration || 0), 0) });
  const topMejora = [...mejoraTotals].sort((a, b) => b.total - a.total)[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Estadísticas de Esfuerzo</h1>
              <p className="text-sm text-muted-foreground">Sostén · Mejora · Enfoque</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <button onClick={() => setYear(y => y - 1)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold min-w-[60px] text-center">{year}</span>
            <button onClick={() => setYear(y => Math.min(y + 1, new Date().getFullYear()))} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── Month tabs ─── */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {MONTHS.map((name, i) => (
            <button key={i} onClick={() => setMonthIdx(i)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0",
                i === monthIdx ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}>{name}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : monthDays.length === 0 ? (
          <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Sin datos en {MONTHS[monthIdx]} {year}</p>
              <p className="text-xs text-muted-foreground">Registra actividad desde la página Hoy</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ════════════════════════════════════════ */}
            {/* KPI Cards */}
            {/* ════════════════════════════════════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { icon: CheckCircle2, label: 'Días registrados', value: monthDays.length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
                { icon: Shield, label: 'Sostén prom./día', value: `${avgDaySosten}/${ALL_SOSTEN_IDS.length}`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
                { icon: TrendingUp, label: 'Total mejora', value: `${monthMejoraMin}min`, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
                { icon: Target, label: 'Total enfoque', value: `${monthFocusMin}min`, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
              ].map((s, i) => (
                <Card key={i} className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
                  <CardContent className="p-3 text-center space-y-1">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mx-auto", s.bg)}>
                      <s.icon className={cn("h-3.5 w-3.5", s.color)} />
                    </div>
                    <div className="text-lg font-bold tabular-nums">{s.value}</div>
                    <div className="text-[9px] text-muted-foreground">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ════════════════════════════════════════ */}
            {/* TABLA SOSTÉN */}
            {/* ════════════════════════════════════════ */}
            <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              <CardContent className="p-0">
                <div className="flex items-center gap-2 p-3 border-b border-border/30">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-bold">Sostén</h2>
                  <span className="text-[10px] text-muted-foreground">✅ completado · ❌ pendiente</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="sticky left-0 bg-muted/20 text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[56px] z-10 border border-border/20">Día</th>
                        {SOSTEN_GROUPS.map(g => (
                          <th key={g.label} colSpan={g.habits.length} className="text-center px-1 py-1.5 font-medium text-muted-foreground/60 text-[9px] uppercase tracking-wider border border-border/20">
                            {g.label}
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-muted/10">
                        <th className="sticky left-0 bg-muted/10 px-2 py-1 z-10 border border-border/20" />
                        {SOSTEN_GROUPS.flatMap(g => g.habits).map(h => (
                          <th key={h.id} className="text-center px-1 py-1 font-medium text-muted-foreground/80 min-w-[40px] border border-border/20">{h.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthDays.map((day, idx) => (
                        <tr key={day.tracking_date} className={cn(idx % 2 === 0 ? "bg-white/50 dark:bg-zinc-900/50" : "bg-muted/5")}>
                          <td className="sticky left-0 z-10 px-2 py-1 font-medium whitespace-nowrap border border-border/20" style={{ background: 'inherit' }}>
                            {format(parseISO(day.tracking_date), 'EEE d', { locale: es })}
                          </td>
                          {SOSTEN_GROUPS.flatMap(g => g.habits).map(h => {
                            const done = day.completions?.[h.id] === true;
                            return (
                              <td key={h.id} className={cn("text-center px-1 py-1 border border-border/20", done ? "text-emerald-500" : "text-red-400/60")}>
                                {done ? '✅' : '❌'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {/* Summary row */}
                      <tr className="bg-muted/20 font-bold text-[9px]">
                        <td className="sticky left-0 bg-muted/20 px-2 py-1.5 z-10 border border-border/20">Completados</td>
                        {SOSTEN_GROUPS.flatMap(g => g.habits).map(h => {
                          const count = monthDays.filter(d => d.completions?.[h.id] === true).length;
                          const pct = Math.round((count / Math.max(monthDays.length, 1)) * 100);
                          return (
                            <td key={h.id} className={cn("text-center px-1 py-1.5 border border-border/20", pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-400")}>
                              {count}<span className="text-muted-foreground">/{monthDays.length}</span>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* ════════════════════════════════════════ */}
            {/* TABLA MEJORA */}
            {/* ════════════════════════════════════════ */}
            <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-400" />
              <CardContent className="p-0">
                <div className="flex items-center gap-2 p-3 border-b border-border/30">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <h2 className="text-sm font-bold">Mejora</h2>
                  <span className="text-[10px] text-muted-foreground">minutos por día</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="sticky left-0 bg-muted/20 text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[56px] z-10 border border-border/20">Día</th>
                        {MEJORA_HABITS.map(h => (
                          <th key={h.id} className="text-center px-2 py-1.5 font-medium text-muted-foreground min-w-[50px] border border-border/20">
                            <div className="flex items-center justify-center gap-1">
                              <h.icon className="h-3 w-3" /><span>{h.label}</span>
                            </div>
                          </th>
                        ))}
                        <th className="text-center px-2 py-1.5 font-medium text-muted-foreground min-w-[44px] border border-border/20">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthDays.map((day, idx) => {
                        const vals = MEJORA_HABITS.map(h => h.id === 'entrenamiento-fisico' ? (day.workout_duration || 0) : getMejoraTime(day.time_data, h.id));
                        const total = vals.reduce((s, v) => s + v, 0) + (day.workout_duration || 0);
                        return (
                          <tr key={day.tracking_date} className={cn(idx % 2 === 0 ? "bg-white/50 dark:bg-zinc-900/50" : "bg-muted/5")}>
                            <td className="sticky left-0 z-10 px-2 py-1 font-medium whitespace-nowrap border border-border/20" style={{ background: 'inherit' }}>
                              {format(parseISO(day.tracking_date), 'EEE d', { locale: es })}
                            </td>
                            {MEJORA_HABITS.map((h, i) => {
                              const v = vals[i];
                              return (
                                <td key={h.id} className="text-center px-2 py-1 border border-border/20">
                                  <span className={cn("tabular-nums",
                                    h.hasTime && v >= 30 && "text-emerald-500 font-medium",
                                    h.hasTime && v > 0 && v < 30 && "text-amber-500",
                                    v === 0 && "text-muted-foreground/30"
                                  )}>
                                    {v > 0 ? `${v}'` : '—'}
                                  </span>
                                  {h.hasCount && (day.count_data?.[h.id] as number || 0) > 0 && (
                                    <span className="text-[8px] text-muted-foreground ml-0.5">({day.count_data[h.id]})</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="text-center px-2 py-1 border border-border/20 tabular-nums font-medium">
                              {total > 0 ? `${total}'` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Summary row */}
                      <tr className="bg-muted/20 font-bold text-[9px]">
                        <td className="sticky left-0 bg-muted/20 px-2 py-1.5 z-10 border border-border/20">Total mes</td>
                        {MEJORA_HABITS.map(h => {
                          const total = h.id === 'entrenamiento-fisico'
                            ? monthDays.reduce((s, d) => s + (d.workout_duration || 0), 0)
                            : monthDays.reduce((s, d) => s + getMejoraTime(d.time_data, h.id), 0);
                          return (
                            <td key={h.id} className="text-center px-2 py-1.5 border border-border/20">{total > 0 ? `${total}'` : '—'}</td>
                          );
                        })}
                        <td className="text-center px-2 py-1.5 border border-border/20 text-purple-600">{monthMejoraMin}'</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* ════════════════════════════════════════ */}
            {/* TABLA ENFOQUE */}
            {/* ════════════════════════════════════════ */}
            <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
              <CardContent className="p-0">
                <div className="flex items-center gap-2 p-3 border-b border-border/30">
                  <Target className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-bold">Enfoque</h2>
                  <span className="text-[10px] text-muted-foreground">minutos de enfoque por área · tareas generales realizadas</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="sticky left-0 bg-muted/20 text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[56px] z-10 border border-border/20">Día</th>
                        {FOCUS_AREAS.map(a => (
                          <th key={a.id} className="text-center px-2 py-1.5 font-medium text-muted-foreground min-w-[60px] border border-border/20">
                            <div className="flex items-center justify-center gap-1">
                              <a.icon className={cn("h-3 w-3", a.color)} /><span>{a.label}</span>
                            </div>
                          </th>
                        ))}
                        <th className="text-center px-2 py-1.5 font-medium text-muted-foreground min-w-[44px] border border-border/20">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {focusPerDay.map((d, idx) => {
                        const total = d.universidad + d.emprendimiento + d.proyectos;
                        return (
                          <tr key={d.date} className={cn(idx % 2 === 0 ? "bg-white/50 dark:bg-zinc-900/50" : "bg-muted/5")}>
                            <td className="sticky left-0 z-10 px-2 py-1 font-medium whitespace-nowrap border border-border/20" style={{ background: 'inherit' }}>
                              {format(parseISO(d.date), 'EEE d', { locale: es })}
                            </td>
                            <td className="text-center px-2 py-1 border border-border/20 tabular-nums">
                              <span className={cn(d.universidad >= 60 ? "text-blue-500 font-medium" : d.universidad > 0 ? "text-blue-400" : "text-muted-foreground/30")}>
                                {d.universidad > 0 ? `${d.universidad}'` : '—'}
                              </span>
                            </td>
                            <td className="text-center px-2 py-1 border border-border/20 tabular-nums">
                              <span className={cn(d.emprendimiento >= 30 ? "text-purple-500 font-medium" : d.emprendimiento > 0 ? "text-purple-400" : "text-muted-foreground/30")}>
                                {d.emprendimiento > 0 ? `${d.emprendimiento}'` : '—'}
                              </span>
                            </td>
                            <td className="text-center px-2 py-1 border border-border/20 tabular-nums">
                              <span className={cn(d.proyectos >= 30 ? "text-amber-500 font-medium" : d.proyectos > 0 ? "text-amber-400" : "text-muted-foreground/30")}>
                                {d.proyectos > 0 ? `${d.proyectos}'` : '—'}
                              </span>
                            </td>
                            <td className="text-center px-2 py-1 border border-border/20 tabular-nums">
                              <span className={cn(d.tareasGenerales > 0 ? "text-foreground font-medium" : "text-muted-foreground/30")}>
                                {d.tareasGenerales > 0 ? d.tareasGenerales : '—'}
                              </span>
                            </td>
                            <td className="text-center px-2 py-1 border border-border/20 tabular-nums font-medium text-amber-600">
                              {total > 0 ? `${total}'` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Summary row */}
                      <tr className="bg-muted/20 font-bold text-[9px]">
                        <td className="sticky left-0 bg-muted/20 px-2 py-1.5 z-10 border border-border/20">Total mes</td>
                        {FOCUS_AREAS.map(a => {
                          const total = focusPerDay.reduce((s, d) => s + (a.id === 'tareas-generales' ? d.tareasGenerales : (d as any)[a.id]), 0);
                          return (
                            <td key={a.id} className={cn("text-center px-2 py-1.5 border border-border/20",
                              a.id === 'tareas-generales' ? "text-foreground" : "text-amber-600"
                            )}>{total}{a.id === 'tareas-generales' ? '' : "'"}</td>
                          );
                        })}
                        <td className="text-center px-2 py-1.5 border border-border/20 text-amber-600">{monthFocusMin}'</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* ════════════════════════════════════════ */}
            {/* TENDENCIAS */}
            {/* ════════════════════════════════════════ */}
            <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" />
              <CardContent className="p-4 space-y-5">
                <div className="flex items-center gap-2">
                  <TrendingUpIcon className="h-4 w-4 text-indigo-500" />
                  <h2 className="text-sm font-bold">Análisis de Tendencias</h2>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 text-center">
                    <p className="text-[9px] text-emerald-600 font-medium uppercase tracking-wider">Consistencia</p>
                    <p className="text-xl font-bold text-emerald-600">{consistencyPct}%</p>
                    <p className="text-[9px] text-muted-foreground">{consistentDays}/{monthDays.length} días ≥80%</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 text-center">
                    <p className="text-[9px] text-purple-600 font-medium uppercase tracking-wider">Top Mejora</p>
                    <p className="text-xl font-bold text-purple-600">{topMejora.total}min</p>
                    <p className="text-[9px] text-muted-foreground">{topMejora.label}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-center">
                    <p className="text-[9px] text-amber-600 font-medium uppercase tracking-wider">Mejor día enfoque</p>
                    <p className="text-xl font-bold text-amber-600">{bestDayFocus}'</p>
                    <p className="text-[9px] text-muted-foreground">promedio: {avgDayFocus}'/día</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 text-center">
                    <p className="text-[9px] text-blue-600 font-medium uppercase tracking-wider">Mejor día sostén</p>
                    <p className="text-xl font-bold text-blue-600">{bestDaySosten}/{ALL_SOSTEN_IDS.length}</p>
                    <p className="text-[9px] text-muted-foreground">promedio: {avgDaySosten}/{ALL_SOSTEN_IDS.length}</p>
                  </div>
                </div>

                    {/* Weekly trend — Line charts */}
                {weeklyTrends.length > 0 && (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Evolución semanal — Mejora (min)</h3>
                      </div>
                      <div className="w-full h-48 bg-muted/10 rounded-lg p-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weeklyTrends} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v} min`, 'Mejora']} />
                            <Line type="monotone" dataKey="mejoraMin" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-3.5 w-3.5 text-muted-foreground" />
                        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Evolución semanal — Enfoque (min)</h3>
                      </div>
                      <div className="w-full h-48 bg-muted/10 rounded-lg p-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weeklyTrends} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v} min`, 'Enfoque']} />
                            <Line type="monotone" dataKey="focusTotal" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Evolución semanal — Consistencia Sostén (%)</h3>
                      </div>
                      <div className="w-full h-48 bg-muted/10 rounded-lg p-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weeklyTrends} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                            <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v}%`, 'Sostén']} />
                            <Line type="monotone" dataKey="sostenPct" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* ─── Individual Habit Trends: Sostén ─── */}
                    <div className="pt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-3.5 w-3.5 text-emerald-500" />
                        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tendencias Individuales — Sostén (% cumplimiento semanal)</h3>
                      </div>
                      {SOSTEN_GROUPS.map(group => (
                        <div key={group.label} className="mb-6">
                          <p className="text-[10px] font-medium text-muted-foreground/70 mb-2 px-1">{group.label}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                            {group.habits.map(habit => {
                              const habitSeries = weeklyTrends.map(w => ({ label: w.label, value: w.perHabitCompletions[habit.id] || 0 }));
                              const lastVal = habitSeries.length > 0 ? habitSeries[habitSeries.length - 1].value : 0;
                              return (
                                <div key={habit.id} className="bg-muted/10 rounded-lg p-3">
                                  <p className="text-xs font-medium mb-2 text-center">{habit.label}</p>
                                  <div className="h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={habitSeries} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                                        <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                                        <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                        <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => [`${v}%`, habit.label]} />
                                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <p className="text-[9px] text-muted-foreground text-center mt-1 tabular-nums font-medium">Últ: {lastVal}%</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ─── Individual Habit Trends: Mejora ─── */}
                    <div className="pt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tendencias Individuales — Mejora (min/semana)</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {MEJORA_HABITS.map(habit => {
                          const habitSeries = weeklyTrends.map(w => ({ label: w.label, value: w.habitMinutes[habit.id] || 0 }));
                          const lastVal = habitSeries.length > 0 ? habitSeries[habitSeries.length - 1].value : 0;
                          return (
                            <div key={habit.id} className="bg-muted/10 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 mb-2 justify-center">
                                <habit.icon className="h-4 w-4 text-purple-500" />
                                <p className="text-xs font-medium">{habit.label}</p>
                              </div>
                              <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={habitSeries} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                                    <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${v}'`} />
                                    <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => [`${v} min`, habit.label]} />
                                    <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                              <p className="text-[9px] text-muted-foreground text-center mt-1 tabular-nums font-medium">Últ: {lastVal}min</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Weekly summary table */}
                    <div className="pt-2 border-t border-border/20">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Resumen semanal</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px]" style={{ borderCollapse: 'collapse' }}>
                          <thead>
                            <tr className="bg-muted/20">
                              <th className="text-left px-2 py-1 font-medium text-muted-foreground border border-border/20">Semana</th>
                              <th className="text-center px-2 py-1 font-medium text-muted-foreground border border-border/20">Días</th>
                              <th className="text-center px-2 py-1 font-medium text-muted-foreground border border-border/20">Sostén</th>
                              <th className="text-center px-2 py-1 font-medium text-muted-foreground border border-border/20">Mejora</th>
                              <th className="text-center px-2 py-1 font-medium text-muted-foreground border border-border/20">U</th>
                              <th className="text-center px-2 py-1 font-medium text-muted-foreground border border-border/20">E</th>
                              <th className="text-center px-2 py-1 font-medium text-muted-foreground border border-border/20">P</th>
                              <th className="text-center px-2 py-1 font-medium text-muted-foreground border border-border/20">Tareas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {weeklyTrends.map((w, idx) => (
                              <tr key={w.weekId} className={cn(idx % 2 === 0 ? "bg-white/50 dark:bg-zinc-900/50" : "bg-muted/5")}>
                                <td className="px-2 py-1 border border-border/20 font-medium">{w.label}</td>
                                <td className="text-center px-2 py-1 border border-border/20">{w.days}</td>
                                <td className={cn("text-center px-2 py-1 border border-border/20 font-medium", w.sostenPct >= 80 ? "text-emerald-500" : w.sostenPct >= 50 ? "text-amber-500" : "text-red-400")}>{w.sostenPct}%</td>
                                <td className="text-center px-2 py-1 border border-border/20 tabular-nums">{w.mejoraMin}'</td>
                                <td className="text-center px-2 py-1 border border-border/20 tabular-nums">{w.focus.universidad || '—'}</td>
                                <td className="text-center px-2 py-1 border border-border/20 tabular-nums">{w.focus.emprendimiento || '—'}</td>
                                <td className="text-center px-2 py-1 border border-border/20 tabular-nums">{w.focus.proyectos || '—'}</td>
                                <td className="text-center px-2 py-1 border border-border/20 tabular-nums">{w.tareas || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Trend indicators */}
                    {weeklyTrends.length >= 2 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-border/20">
                        {([
                          { label: 'Sostén', key: 'sostenPct' as const, color: 'emerald', inverse: false },
                          { label: 'Mejora', key: 'mejoraMin' as const, color: 'purple', inverse: false },
                          { label: 'Enfoque', key: 'focusTotal' as const, color: 'amber', inverse: false },
                          { label: 'Tareas', key: 'tareas' as const, color: 'blue', inverse: false },
                        ]).map(metric => {
                          const first = weeklyTrends[0][metric.key];
                          const last = weeklyTrends[weeklyTrends.length - 1][metric.key];
                          const mid = weeklyTrends[Math.floor(weeklyTrends.length / 2)][metric.key];
                          const trend = last - first;
                          const direction = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat';
                          const pctChange = first > 0 ? Math.round((trend / first) * 100) : 0;
                          return (
                            <div key={metric.label} className="p-2 rounded-lg bg-muted/20 text-center">
                              <p className="text-[9px] text-muted-foreground">{metric.label}</p>
                              <div className="flex items-center justify-center gap-1 mt-0.5">
                                {direction === 'up' && <TrendingUpIcon className={cn("h-3.5 w-3.5", `text-${metric.color}-500`)} />}
                                {direction === 'down' && <TrendingDown className={cn("h-3.5 w-3.5", "text-red-400")} />}
                                {direction === 'flat' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                                <span className={cn("text-sm font-bold tabular-nums", direction === 'up' && `text-${metric.color}-500`, direction === 'down' && "text-red-400")}>
                                  {pctChange > 0 ? '+' : ''}{pctChange}%
                                </span>
                              </div>
                              <p className="text-[8px] text-muted-foreground">{first} → {last}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}