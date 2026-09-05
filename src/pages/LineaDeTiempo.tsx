import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles, Flame, GraduationCap, Briefcase, FolderKanban, ListTodo,
  BookOpen, Music, Globe, Dumbbell, Crown, Gamepad2, CheckCircle2, Circle,
  CalendarDays, CalendarRange, Calendar, Target, Eye, Clock,
} from 'lucide-react';
import { format, startOfWeek, startOfMonth, startOfQuarter, endOfWeek, endOfMonth, endOfQuarter, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useRoutineBlocks } from '@/hooks/useRoutineBlocks';
import { useSystemsTracking } from '@/hooks/useSystemsTracking';
import { usePersonalLists } from '@/hooks/usePersonalLists';
import { useHabitHistory } from '@/hooks/useHabitHistory';
import {
  getDayGoalEffective, getWeekGoalEffective, getMonthGoalsSummary, getQuarterGoal,
  getQuarterFromDate, getMonthKeyOf, AREA_LABELS,
} from '@/lib/hierarchy';
import { getAreasByGroup } from '@/data/pointB2027';
import { cn } from '@/lib/utils';
import { TablaProcesosMetas } from '@/components/linea-de-tiempo/TablaProcesosMetas';
import { useProcesosMatriz } from '@/hooks/useProcesosMatriz';
import { ChipMetaComodidad, type MetaComodidadChip } from '@/components/linea-de-tiempo/ChipMetaComodidad';
import { MapaDeBloquesDeHoy, toBlockSnapshots } from '@/components/linea-de-tiempo/MapaDeBloquesDeHoy';

const AREA_ICONS: Record<string, React.ReactNode> = {
  universidad: <GraduationCap className="h-4 w-4" />,
  emprendimiento: <Briefcase className="h-4 w-4" />,
  proyectos: <FolderKanban className="h-4 w-4" />,
  tareas: <ListTodo className="h-4 w-4" />,
  lectura: <BookOpen className="h-4 w-4" />,
  musica: <Music className="h-4 w-4" />,
  idiomas: <Globe className="h-4 w-4" />,
  gym: <Dumbbell className="h-4 w-4" />,
  ajedrez: <Crown className="h-4 w-4" />,
  game: <Gamepad2 className="h-4 w-4" />,
};

const CENTRALES = [
  { id: 'universidad', label: 'Universidad' },
  { id: 'emprendimiento', label: 'Emprendimiento' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'tareas', label: 'Tareas' },
];

const DESARROLLO = [
  { id: 'lectura', label: 'Lectura' },
  { id: 'musica', label: 'Música' },
  { id: 'idiomas', label: 'Idiomas' },
  { id: 'gym', label: 'Gym' },
  { id: 'ajedrez', label: 'Ajedrez' },
  { id: 'game', label: 'Game' },
];

const ALL_AREAS = [...CENTRALES, ...DESARROLLO];

interface AreaStats {
  minutos: number;
  completado: boolean;
  dias: number;
}

const ESTRUCTURALES = getAreasByGroup('cimientos');

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function LineaDeTiempo() {
  const { blocks } = useRoutineBlocks();
  const { data, loading: trackingLoading } = useSystemsTracking();
  const { lists, tasks, isLoading: listsLoading } = usePersonalLists();
  const { habitHistory, isLoading: habitLoading } = useHabitHistory();

  const hoyMinutos = data.timeData || {};
  const { rows: procesoRows, loading: matrizLoading } = useProcesosMatriz(hoyMinutos as Record<string, number>);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const [statsByArea, setStatsByArea] = useState<Record<string, { semana: AreaStats; mes: AreaStats }>>({});
  const [estructuralStats, setEstructuralStats] = useState<Record<string, { consistencia: number; minutos: number; dias: number; diasVerdes: number }>>({});

  // Consultar daily_area_stats acumulado por ventanas (semana / mes)
  useEffect(() => {
    let active = true;
    const wk = startOfWeek(today, { weekStartsOn: 1 });
    const wkEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const load = async () => {
      const [weekRows, monthRows] = await Promise.all([
        supabase.from('daily_area_stats')
          .select('area_id, time_spent_minutes, completed, stat_date')
          .gte('stat_date', format(wk, 'yyyy-MM-dd'))
          .lte('stat_date', format(wkEnd, 'yyyy-MM-dd')),
        supabase.from('daily_area_stats')
          .select('area_id, time_spent_minutes, completed, stat_date')
          .gte('stat_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('stat_date', format(monthEnd, 'yyyy-MM-dd')),
      ]);

      const agg = (rows: any[]) => {
        const map: Record<string, AreaStats> = {};
        (rows || []).forEach((r: any) => {
          const cur = map[r.area_id] || { minutos: 0, completado: false, dias: 0 };
          cur.minutos += r.time_spent_minutes || 0;
          if (r.completed) cur.completado = true;
          cur.dias += 1;
          map[r.area_id] = cur;
        });
        return map;
      };

      const weekMap = agg(weekRows.data);
      const monthMap = agg(monthRows.data);

      if (active) {
        const out: Record<string, { semana: AreaStats; mes: AreaStats }> = {};
        ALL_AREAS.forEach(a => {
          out[a.id] = {
            semana: weekMap[a.id] || { minutos: 0, completado: false, dias: 0 },
            mes: monthMap[a.id] || { minutos: 0, completado: false, dias: 0 },
          };
        });
        setStatsByArea(out);
      }
    };
    load();
    return () => { active = false; };
  }, [todayStr, today]);

  // Constancia de las áreas estructurales (cimientos) en el mes actual
  useEffect(() => {
    let active = true;
    const ids = ESTRUCTURALES.flatMap(a => a.effortTrackingIds);
    if (ids.length === 0) return;

    const ms = format(startOfMonth(today), 'yyyy-MM-dd');
    const me = format(endOfMonth(today), 'yyyy-MM-dd');
    const monthDays = endOfMonth(today).getDate();

    const load = async () => {
      const { data } = await supabase
        .from('daily_area_stats')
        .select('area_id, stat_date, time_spent_minutes, time_goal_minutes, completed')
        .in('area_id', ids)
        .gte('stat_date', ms)
        .lte('stat_date', me);

      const byId: Record<string, { rates: number[]; minutos: number; dias: number; verdes: number }> = {};
      const seen = new Set<string>();
      (data || []).forEach((r: any) => {
        const key = `${r.area_id}|${r.stat_date}`;
        if (seen.has(key)) return;
        seen.add(key);
        const cur = byId[r.area_id] || { rates: [], minutos: 0, dias: 0, verdes: 0 };
        cur.minutos += r.time_spent_minutes || 0;
        cur.dias += 1;
        if (r.completed) cur.verdes += 1;
        const goal = r.time_goal_minutes || 30;
        cur.rates.push(Math.min(100, Math.round(((r.time_spent_minutes || 0) / goal) * 100)));
        byId[r.area_id] = cur;
      });

      const out: Record<string, { consistencia: number; minutos: number; dias: number; diasVerdes: number }> = {};
      ESTRUCTURALES.forEach(area => {
        const rows = area.effortTrackingIds.map(id => byId[id]).filter(Boolean);
        if (rows.length === 0) {
          out[area.id] = { consistencia: 0, minutos: 0, dias: 0, diasVerdes: 0 };
          return;
        }
        const minutos = rows.reduce((s, x) => s + x.minutos, 0);
        const dias = Math.max(...rows.map(x => x.dias));
        const verdes = rows.reduce((s, x) => s + x.verdes, 0);
        const totalRates = rows.reduce((s, x) => s + x.rates.length, 0);
        const avgRate = totalRates > 0
          ? rows.reduce((s, x) => s + x.rates.reduce((a, b) => a + b, 0), 0) / totalRates
          : 0;
        const consistencia = Math.min(100, Math.round(avgRate * (totalRates / monthDays)));
        out[area.id] = { consistencia, minutos, dias, diasVerdes: verdes };
      });

      if (active) setEstructuralStats(out);
    };
    load();
    return () => { active = false; };
  }, [todayStr, today]);

  // Bloques de trabajo de hoy (deep/focus) para el mapa
  const focusBlockIds = useMemo(() => {
    const set = new Set<string>();
    blocks.forEach(b => { if (b.isFocusBlock) set.add(b.id); });
    return set;
  }, [blocks]);

  const bloqueSnapshots = useMemo(
    () => toBlockSnapshots(blocks, data.workAssignments, data.blockCompletions, data.skipped, focusBlockIds),
    [blocks, data, focusBlockIds]
  );

  const doneToday = useMemo(() => bloqueSnapshots.filter(b => b.state === 'done').length, [bloqueSnapshots]);

  // Constancia por área estructural (racha + consistencia del mes)
  const estructurales = ESTRUCTURALES.map(area => {
    const stat = estructuralStats[area.id] || { consistencia: 0, minutos: 0, dias: 0, diasVerdes: 0 };
    const streaks = area.effortTrackingIds
      .map(id => habitHistory[id])
      .filter((h): h is NonNullable<typeof h> => !!h);
    const racha = streaks.length ? Math.max(...streaks.map(h => h.currentStreak || 0)) : 0;
    const maxRacha = streaks.length ? Math.max(...streaks.map(h => h.longestStreak || 0)) : 0;
    return { ...area, ...stat, racha, maxRacha };
  });

  // Metas de comodidad por área (listas vinculadas por system_key)
  const metasPorArea = useMemo(() => {
    const map: Record<string, MetaComodidadChip[]> = {};
    lists.forEach(l => {
      const areaId = l.system_key || '';
      if (!areaId) return;
      const rootTasks = tasks.filter(t => t.list_id === l.id && !t.parent_id);
      const done = rootTasks.filter(t => t.completed).length;
      if (!map[areaId]) map[areaId] = [];
      map[areaId].push({
        id: l.id,
        title: l.title,
        description: l.description,
        dueDate: null,
        done: rootTasks.length > 0 && done === rootTasks.length,
        total: rootTasks.length,
        completedTasks: done,
      });
    });
    return map;
  }, [lists, tasks]);

  const metasDelMes = useMemo(() => {
    const now = today;
    const s = format(startOfMonth(now), 'yyyy-MM-dd');
    const e = format(endOfMonth(now), 'yyyy-MM-dd');
    const map: Record<string, MetaComodidadChip[]> = {};
    lists.forEach(l => {
      const areaId = l.system_key || '';
      if (!areaId) return;
      const roots = tasks.filter(t => t.list_id === l.id && !t.parent_id);
      const inRange = roots.filter(t => t.due_date && t.due_date >= s && t.due_date <= e);
      if (inRange.length === 0) return;
      const done = inRange.filter(t => t.completed).length;
      if (!map[areaId]) map[areaId] = [];
      map[areaId].push({
        id: l.id,
        title: l.title,
        description: l.description,
        dueDate: null,
        done: inRange.length > 0 && done === inRange.length,
        total: inRange.length,
        completedTasks: done,
      });
    });
    return map;
  }, [lists, tasks, today]);

  const metasDelTrimestre = useMemo(() => {
    const now = today;
    const s = format(startOfQuarter(now), 'yyyy-MM-dd');
    const e = format(endOfQuarter(now), 'yyyy-MM-dd');
    const map: Record<string, MetaComodidadChip[]> = {};
    lists.forEach(l => {
      const areaId = l.system_key || '';
      if (!areaId) return;
      const roots = tasks.filter(t => t.list_id === l.id && !t.parent_id);
      const inRange = roots.filter(t => t.due_date && t.due_date >= s && t.due_date <= e);
      if (inRange.length === 0) return;
      const done = inRange.filter(t => t.completed).length;
      if (!map[areaId]) map[areaId] = [];
      map[areaId].push({
        id: l.id,
        title: l.title,
        description: l.description,
        dueDate: null,
        done: inRange.length > 0 && done === inRange.length,
        total: inRange.length,
        completedTasks: done,
      });
    });
    return map;
  }, [lists, tasks, today]);

  );

  const loading = trackingLoading || listsLoading || habitLoading;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />Línea de Tiempo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tus decisiones de hoy, tu destino mañana. Cada área es un proceso vivo con dirección y velocidad.
          </p>
        </header>

        {/* Banner anti-ansiedad */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">Tú controlas la dirección</span> (hacer cada día lo que toca). La velocidad depende de factores.
              Si hoy siembras, llegar a tu meta de comodidad es <span className="font-semibold">cuestión de tiempo</span>.
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            {/* El poder de hoy */}
            <Card>
              <CardContent className="p-4">
                <MapaDeBloquesDeHoy blocks={bloqueSnapshots} totalToday={bloqueSnapshots.length} doneToday={doneToday} />
              </CardContent>
            </Card>

            {/* Sostén */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                <h2 className="font-bold">Áreas estructurales · Tu base (constancia)</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {estructurales.map(a => (
                  <div key={a.id} className="rounded-xl border bg-card p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl shrink-0">{a.icon}</span>
                      <p className="font-semibold flex-1 min-w-0">{a.label}</p>
                      {a.racha > 0 && <Badge variant="secondary" className="shrink-0">{a.racha} 🔥 seguidos</Badge>}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Constancia este mes</span>
                        <span className={cn('font-bold tabular-nums', getScoreColor(a.consistencia))}>{a.consistencia}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all duration-500', getScoreBg(a.consistencia))} style={{ width: `${a.consistencia}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.minutos} min este mes · {a.dias} día(s) con datos · {a.diasVerdes} día(s) verde(s) · máx. racha {a.maxRacha}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Son el cimiento que sostiene todo lo demás: tu constancia diaria aquí define la base sobre la que se mueve toda la línea.
              </p>
            </div>

            {/* Tabla de procesos → resultados */}
            {matrizLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <TablaProcesosMetas
                  titulo="Áreas centrales · Profesional / Académico"
                  rows={procesoRows.filter(r => r.config.grupo === 'centrales')}
                />
                <TablaProcesosMetas
                  titulo="Desarrollo personal"
                  rows={procesoRows.filter(r => r.config.grupo === 'desarrollo')}
                />
                <p className="text-xs text-muted-foreground">
                  Cada fila es un proceso activo: lo que inviertes hoy se acumula a la derecha y se convierte en resultados.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
