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

const STREAK_HABITS = [
  { id: 'estructurales', label: 'Estructurales', emoji: '🏗️' },
  { id: 'apariencia', label: 'Apariencia', emoji: '✨' },
];

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

  // Consistencia de Sostén
  const sustentos = STREAK_HABITS.map(h => {
    const hist = habitHistory[h.id];
    return {
      ...h,
      racha: hist?.currentStreak || 0,
      maxRacha: hist?.longestStreak || 0,
      diasVerdes: hist?.completedDates?.length || 0,
    };
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
                {sustentos.map(s => (
                  <div key={s.id} className="rounded-xl border bg-card p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{s.emoji}</span>
                      <p className="font-semibold">{s.label}</p>
                      <Badge variant="secondary" className="ml-auto">{s.racha} 🔥 seguidos</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {s.diasVerdes} días verdes de constancia · máxima racha {s.maxRacha}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Estos hábitos no tienen meta de comodidad: son el cimiento que sostiene todo lo demás.
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
