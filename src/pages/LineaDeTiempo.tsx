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
import { EjeDeTiempoArea, type EjeAreaData } from '@/components/linea-de-tiempo/EjeDeTiempoArea';
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

  const buildEje = (area: { id: string; label: string }): EjeAreaData | null => {
    const invertidoHoy = data.timeData?.[area.id] || 0;
    const metaDiaria = getDayGoalEffective(today, area.id);
    const metaSemana = getWeekGoalEffective(startOfWeek(today, { weekStartsOn: 1 }), area.id);
    const { quarter, year } = getQuarterFromDate(today);
    const monthKey = getMonthKeyOf(today, quarter);
    const metaMes = getMonthGoalsSummary(today)[area.id] || 0;
    const metaTrimestre = getQuarterGoal(quarter, year, area.id);
    const cuatrimestre = statsByArea[area.id];

    const semanaStats = cuatrimestre?.semana || { minutos: 0, completado: false, dias: 0 };
    const mesStats = cuatrimestre?.mes || { minutos: 0, completado: false, dias: 0 };

    const ms = metasPorArea[area.id] || [];
    const mesa = metasDelMes[area.id] || [];
    const trim = metasDelTrimestre[area.id] || [];

    const metasText = ms.length
      ? `${ms.reduce((a, m) => a + m.completedTasks, 0)}/${ms.reduce((a, m) => a + m.total, 0)} pasos cumplidos`
      : 'Define tu meta de comodidad en Mi Lista Personal';

    const mensaje = ms.length > 0
      ? `Hoy ${invertidoHoy}' de ${metaDiaria}' · si mantienes el ritmo, tu meta de comodidad avanza: es cuestión de tiempo`
      : `Hoy ${invertidoHoy}' de ${metaDiaria}' · vincula una lista de Mi Lista Personal para ver tu meta de comodidad`;

    return {
      areaId: area.id,
      label: area.label,
      icon: AREA_ICONS[area.id] || <Sparkles className="h-4 w-4" />,
      metaDiaria,
      invertidoHoy,
      nivelHoy: {
        key: 'hoy',
        label: 'Hoy',
        icon: <Clock className="h-4 w-4" />,
        value: `${invertidoHoy}'/${metaDiaria}'`,
        detail: metaDiaria > 0 ? `${Math.round(Math.min(100, (invertidoHoy / metaDiaria) * 100))}% de tu meta diaria` : 'Sin meta diaria definida',
        pct: metaDiaria > 0 ? Math.round(Math.min(100, (invertidoHoy / metaDiaria) * 100)) : 0,
      },
      nivelSemana: {
        key: 'semana',
        label: 'Semana',
        icon: <CalendarDays className="h-4 w-4" />,
        value: `${semanaStats.minutos}'/${metaSemana}'`,
        detail: metaSemana > 0 ? `${Math.round(Math.min(100, (semanaStats.minutos / metaSemana) * 100))}% de tu meta semanal` : 'Sin meta semanal',
        pct: metaSemana > 0 ? Math.round(Math.min(100, (semanaStats.minutos / metaSemana) * 100)) : 0,
      },
      nivelMes: {
        key: 'mes',
        label: 'Mes',
        icon: <Calendar className="h-4 w-4" />,
        value: `${mesStats.minutos}'/${metaMes}'`,
        detail: mesa.length > 0 ? `${mesa.length} meta(s) tocan este mes` : (metaMes > 0 ? `${Math.round(Math.min(100, (mesStats.minutos / metaMes) * 100))}% de tu meta mensual` : 'Sin meta mensual'),
        pct: metaMes > 0 ? Math.round(Math.min(100, (mesStats.minutos / metaMes) * 100)) : 0,
      },
      nivelTrimestre: {
        key: 'trimestre',
        label: 'Trimestre',
        icon: <CalendarRange className="h-4 w-4" />,
        value: `${metaTrimestre}' meta`,
        detail: trim.length > 0 ? `${trim.length} meta(s) tocan este trimestre` : 'Sin meta trimestral',
        pct: metaTrimestre > 0 ? Math.round(Math.min(100, (mesStats.minutos / metaTrimestre) * 100)) : 0,
      },
      nivelComodidad: {
        key: 'comodidad',
        label: 'Comodidad',
        icon: <Target className="h-4 w-4" />,
        value: ms.length > 0 ? `${Math.round((ms.reduce((a, m) => a + m.completedTasks, 0) / Math.max(1, ms.reduce((a, m) => a + m.total, 0))) * 100)}%` : '—',
        detail: metasText,
        pct: ms.length ? Math.round((ms.reduce((a, m) => a + m.completedTasks, 0) / Math.max(1, ms.reduce((a, m) => a + m.total, 0))) * 100) : 0,
      },
      nivelVision: {
        key: 'vision',
        label: 'Visión',
        icon: <Eye className="h-4 w-4" />,
        value: 'Dirección',
        detail: 'Tu Point B: hacia dónde va este proceso en tu vida',
        pct: 0,
      },
      metasComodidad: ms,
      metaDelMes: mesa,
      metaDelTrimestre: trim,
      mensaje,
    };
  };

  const renderAreas = (grupo: { id: string; label: string }[]) => (
    <div className="space-y-3">
      {grupo.map(a => {
        const eje = buildEje(a);
        return eje ? <EjeDeTiempoArea key={a.id} data={eje} /> : null;
      })}
    </div>
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

            {/* Áreas centrales */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold border-b border-border pb-1">Áreas centrales · Profesional / Académico</h2>
              {renderAreas(CENTRALES)}
            </div>

            {/* Desarrollo personal */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold border-b border-border pb-1">Desarrollo personal</h2>
              {renderAreas(DESARROLLO)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
