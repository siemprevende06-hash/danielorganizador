import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { habits } from '@/lib/data';
import { useDailyPlanData } from '@/hooks/useDailyPlanData';
import { useCombinedFocusTime } from '@/hooks/useCombinedFocusTime';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { useHabitHistory } from '@/hooks/useHabitHistory';
import { useFinance } from '@/hooks/useFinance';
import { formatTimeDisplay } from '@/hooks/useRoutineBlocksDB';

function ProgressBar({ value, color, showText = true }: { value: number; color: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold" style={{ color: '#1A2A3A' }}>{value}%</span>
      <div className="flex-1 h-2.5 rounded-full bg-[#E5E9F0] relative overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
        {showText && value > 25 && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-white leading-none">
            {value}%
          </span>
        )}
      </div>
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold mb-4" style={{ color: '#2D3E50' }}>
      {children}
    </h3>
  );
}

const EVENT_DOT_COLORS: Record<string, string> = {
  universidad: '#3B82F6',
  emprendimiento: '#8B5CF6',
  proyectos: '#F59E0B',
  lectura: '#06B6D4',
  musica: '#EC4899',
  gym: '#EF4444',
  salud: '#22C55E',
  idiomas: '#10B981',
  social: '#F97316',
  finanzas: '#EAB308',
  default: '#94A3B8',
};

const pad = (n: number) => String(n).padStart(2, '0');
const toHMS = (min: number) => {
  const safe = Math.max(0, Math.round(min));
  return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`;
};
const toHmm = (min: number) => {
  const safe = Math.max(0, Math.round(min));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};
const toHours1 = (min: number) => `${(Math.max(0, min) / 60).toFixed(1)}h`;

export default function Inicio2() {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Real data hooks
  const { blocks, tasks, completedBlocks, completedTasks, dayScore, isBlockCompleted } = useDailyPlanData();
  const { areas } = useCombinedFocusTime();
  const focus = useFocusSessions();
  const { habitHistory } = useHabitHistory();
  const finance = useFinance();

  const [profile, setProfile] = useState<{ name: string; email: string; initials: string }>({
    name: '',
    email: '',
    initials: 'US',
  });
  const [dayTotals, setDayTotals] = useState({ spent: 0, goal: 0 });
  const [monthly, setMonthly] = useState<{ current: number; previous: number; curName: string; prevName: string }>({
    current: 0,
    previous: 0,
    curName: '',
    prevName: '',
  });
  const [todayEvents, setTodayEvents] = useState<{ id: string; title: string; category: string }[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      const email = user?.email || '';
      const rawName = (user?.user_metadata?.name as string) || email.split('@')[0] || '';
      const name = rawName
        .split(/[\s.]+/)
        .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
        .join(' ');
      const initials = (rawName || 'Usuario').slice(0, 2).toUpperCase();
      setProfile({ name, email, initials });
    });

    // Totales del día (todas las áreas) y estadísticas mensuales de focus
    const now = new Date();
    const curStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    Promise.all([
      supabase
        .from('daily_area_stats')
        .select('time_spent_minutes, time_goal_minutes')
        .eq('stat_date', todayStr),
      supabase
        .from('focus_sessions')
        .select('duration_minutes, created_at')
        .gte('created_at', curStart.toISOString())
        .lt('created_at', new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()),
      supabase
        .from('focus_sessions')
        .select('duration_minutes, created_at')
        .gte('created_at', prevStart.toISOString())
        .lt('created_at', curStart.toISOString()),
      supabase.from('calendar_events').select('*').eq('event_date', todayStr),
    ]).then(([statsRes, curRes, prevRes, eventsRes]) => {
      const rows = statsRes.data || [];
      setDayTotals({
        spent: rows.reduce((s, r) => s + (r.time_spent_minutes || 0), 0),
        goal: rows.reduce((s, r) => s + (r.time_goal_minutes || 0), 0),
      });
      setMonthly({
        current: (curRes.data || []).reduce((s, r) => s + (r.duration_minutes || 0), 0),
        previous: (prevRes.data || []).reduce((s, r) => s + (r.duration_minutes || 0), 0),
        curName: now.toLocaleDateString('es-ES', { month: 'long' }),
        prevName: prevStart.toLocaleDateString('es-ES', { month: 'long' }),
      });
      setTodayEvents((eventsRes.data || []).map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category || 'default',
      })));
    });
  }, [todayStr]);

  const todayDate = new Date();

  // --- Tiempo por área (3 áreas principales) ---
  const effortBars = useMemo(() => areas.map(a => a.progress), [areas]);
  const timeBars = useMemo(() => {
    const max = Math.max(...areas.map(a => a.totalMinutes), 1);
    return areas.map(a => (a.totalMinutes > 0 ? Math.round((a.totalMinutes / max) * 100) : 0));
  }, [areas]);

  // --- Resultados del día ---
  const taskPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const blockPct = blocks.length > 0 ? Math.round((completedBlocks.length / blocks.length) * 100) : 0;

  // --- Hábitos de hoy ---
  const habitStates = useMemo(() => {
    return habits.map(h => {
      const entry = habitHistory[h.id]?.completedDates?.find(e => e.date === todayStr);
      if (!entry || entry.status === 'skipped') return 0; // sin dato
      return entry.status === 'completed' ? 1 : 2;
    });
  }, [habitHistory, todayStr]);
  const doneCount = habitStates.filter(s => s === 1).length;
  const failedCount = habitStates.filter(s => s === 2).length;
  const noneCount = habitStates.length - doneCount - failedCount;
  const donePct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;
  const failedPct = habits.length ? Math.round((failedCount / habits.length) * 100) : 0;
  const nonePct = Math.max(0, 100 - donePct - failedPct);

  // --- Foco de hoy y progreso ---
  const focusToday = focus.getTodayStats().totalMinutes;
  const focusWeek = focus.getWeekStats().totalMinutes;
  const remaining = Math.max(0, dayTotals.goal - dayTotals.spent);

  // --- Cartera ---
  const walletTotal = (finance.wallets || []).reduce((s, w) => s + (w.balance || 0), 0);
  const walletDisplay = walletTotal >= 1000
    ? `$${(walletTotal / 1000).toFixed(1)}k`
    : `$${walletTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  // --- Rutina de hoy (bloques) ---
  const routineBlocks = blocks.slice(0, 4);

  // --- Tareas de hoy ---
  const todayTasks = tasks.slice(0, 5);

  const headerDate = todayDate.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="min-h-screen p-4 md:p-6 pt-16 lg:pt-6" style={{ background: '#F4F6F9' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#1A2A3A' }}>
            {profile.name || 'Organizador'}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7A8F' }}>
            Bienvenido · {headerDate}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Fila 1 */}
          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Esfuerzo por área</CardTitle>
            <div className="space-y-3">
              <ProgressBar value={effortBars[0] || 0} color="#3B82F6" />
              <ProgressBar value={effortBars[1] || 0} color="#3B82F6" />
              <ProgressBar value={effortBars[2] || 0} color="#3B82F6" />
            </div>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Tiempo invertido</CardTitle>
            <div className="space-y-3">
              <ProgressBar value={timeBars[0] || 0} color="#3B82F6" />
              <ProgressBar value={timeBars[1] || 0} color="#3B82F6" />
              <ProgressBar value={timeBars[2] || 0} color="#3B82F6" />
            </div>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Resultados del día</CardTitle>
            <div className="space-y-3">
              <ProgressBar value={taskPct} color="#60A5FA" showText={false} />
              <ProgressBar value={blockPct} color="#60A5FA" showText={false} />
              <ProgressBar value={dayScore} color="#60A5FA" showText={false} />
            </div>
          </Card>

          {/* Fila 2 */}
          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Progreso del día</CardTitle>
            <p className="text-[32px] font-bold leading-none" style={{ color: '#1E3A5F' }}>
              {toHours1(dayTotals.spent)}
            </p>
            <p className="text-xs mt-1" style={{ color: '#6B7A8F' }}>Tiempo invertido hoy (todas las áreas)</p>
            <p className="text-[10px]" style={{ color: '#94A3B8' }}>Semana: {toHmm(focusWeek)} de focus</p>
            <p className="text-sm font-semibold mt-3" style={{ color: '#10B981' }}>
              {remaining > 0 ? `Meta restante: ${toHmm(remaining)}` : 'Meta superada ✓'}
            </p>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Focus de hoy</CardTitle>
            <p className="text-[28px] font-bold font-mono leading-none tabular-nums" style={{ color: '#1E3A5F' }}>
              {toHMS(focusToday)}
            </p>
            <p className="text-xs mt-1" style={{ color: '#6B7A8F' }}>Sesiones de focus ({focus.getTodayStats().sessionsCount})</p>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Hábitos de hoy</CardTitle>
            <div className="space-y-3">
              <ProgressBar value={donePct} color="#10B981" />
              <ProgressBar value={failedPct} color="#EF4444" />
              <ProgressBar value={nonePct} color="#94A3B8" />
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E5E9F0]">
              <div>
                <p className="text-xs" style={{ color: '#6B7A8F' }}>Completados hoy</p>
                <p className="text-xs font-medium" style={{ color: '#2D3E50' }}>Verde ✓ · Rojo ✗ · Gris sin dato</p>
              </div>
              <span className="text-sm font-semibold" style={{ color: '#1A2A3A' }}>{doneCount}/{habits.length}</span>
            </div>
          </Card>

          {/* Fila 3 */}
          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: '#94A3B8' }}
              >
                {profile.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold truncate" style={{ color: '#2D3E50' }}>
                  {profile.name || 'Usuario'}
                </p>
                <p className="text-xs" style={{ color: '#6B7A8F' }}>
                  {profile.email || 'Organizador'}
                </p>
              </div>
              <span className="text-sm font-bold shrink-0" style={{ color: '#10B981' }}>
                {walletDisplay}
              </span>
            </div>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Focus del mes</CardTitle>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  <span className="text-sm" style={{ color: '#2D3E50' }}>
                    {monthly.curName ? monthly.curName.charAt(0).toUpperCase() + monthly.curName.slice(1) : 'Este mes'}
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color: '#1A2A3A' }}>{toHmm(monthly.current)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]" />
                  <span className="text-sm" style={{ color: '#2D3E50' }}>
                    {monthly.prevName ? monthly.prevName.charAt(0).toUpperCase() + monthly.prevName.slice(1) : 'Mes anterior'}
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color: '#1A2A3A' }}>{toHmm(monthly.previous)}</span>
              </div>
            </div>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Rutina de hoy</CardTitle>
            {routineBlocks.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" style={{ color: '#94A3B8' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#2D3E50' }}>
                      {routineBlocks[0].title}
                    </p>
                    <p className="text-xs" style={{ color: '#6B7A8F' }}>
                      {formatTimeDisplay(routineBlocks[0].startTime)} — {formatTimeDisplay(routineBlocks[0].endTime)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#E5E9F0] pt-3">
                  {routineBlocks.map((b) => (
                    <div key={b.id} className="flex flex-col items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: isBlockCompleted(b.id) ? '#10B981' : '#3B82F6' }}
                      />
                      <span className="text-[9px]" style={{ color: '#94A3B8' }}>{formatTimeDisplay(b.startTime)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs" style={{ color: '#6B7A8F' }}>Sin bloques de rutina configurados.</p>
            )}
          </Card>

          {/* Fila 4 */}
          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] lg:col-span-2">
            <CardTitle>Eventos de hoy</CardTitle>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4" style={{ color: '#3B82F6' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#3B82F6' }}>
                  Hoy · {todayEvents.length} {todayEvents.length === 1 ? 'evento' : 'eventos'}
                </p>
                <p className="text-xs" style={{ color: '#6B7A8F' }}>Agenda del calendario</p>
              </div>
            </div>
            <div className="divide-y divide-[#E5E9F0]">
              {todayEvents.length > 0 ? (
                todayEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: EVENT_DOT_COLORS[e.category] || EVENT_DOT_COLORS.default }} />
                    <span className="text-sm flex-1" style={{ color: '#2D3E50' }}>{e.title}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 py-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: EVENT_DOT_COLORS.default }} />
                  <span className="text-sm flex-1" style={{ color: '#94A3B8' }}>No hay eventos programados para hoy</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Tareas de hoy</CardTitle>
            <div className="divide-y divide-[#E5E9F0]">
              {todayTasks.length > 0 ? (
                todayTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.completed ? '#10B981' : '#3B82F6' }} />
                    <span className="text-sm flex-1 truncate" style={{ color: t.completed ? '#94A3B8' : '#2D3E50' }}>
                      {t.title}
                    </span>
                    {t.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: '#10B981' }} />
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 py-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#94A3B8' }} />
                  <span className="text-sm flex-1" style={{ color: '#94A3B8' }}>Sin tareas de hoy</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="mt-6 text-[10px] flex items-center gap-1" style={{ color: '#94A3B8' }}>
          <TrendingUp className="h-3 w-3" />
          Dashboard Inicio 2.0 — datos en tiempo real
        </div>
      </div>
    </div>
  );
}