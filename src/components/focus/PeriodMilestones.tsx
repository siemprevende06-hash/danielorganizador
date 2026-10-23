import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAreaCovers, coverKey } from '@/hooks/useAreaCovers';
import { getCoverGradient, AreaCover } from '@/components/areas/AreaCover';
import { useMonthlyPlan } from '@/hooks/useMonthlyPlan';
import { buildHabitPlanObjectives } from '@/lib/planObjectives';
import { AREA_LABELS } from '@/lib/hierarchy';
import { getPeriodTitle, type FocusPeriodType } from '@/lib/periodFocus';
import { cn } from '@/lib/utils';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Milestone,
  CalendarDays,
  GraduationCap,
  FileText,
  BookOpen,
  Music,
  FolderKanban,
  Check,
  Loader2,
} from 'lucide-react';

export type MilestoneScope = 'day' | 'week' | 'month';

interface HitoKind {
  icon: typeof CalendarDays;
  accent: string;
}

const KIND_ICON: Record<string, HitoKind> = {
  event: { icon: CalendarDays, accent: 'text-violet-500' },
  exam: { icon: GraduationCap, accent: 'text-blue-500' },
  delivery: { icon: FileText, accent: 'text-amber-500' },
  book: { icon: BookOpen, accent: 'text-cyan-500' },
  song: { icon: Music, accent: 'text-pink-500' },
  subject: { icon: GraduationCap, accent: 'text-blue-500' },
  project: { icon: FolderKanban, accent: 'text-amber-500' },
};

interface Hito {
  id: string;
  kind: keyof typeof KIND_ICON;
  title: string;
  subtitle?: string | null;
  date?: string | null;
  done?: boolean;
  tag?: string;
  areaId: string;
}

interface RawHitos {
  events: Hito[];
  exams: Hito[];
  tasks: Hito[];
}

const EMPTY_RAW: RawHitos = { events: [], exams: [], tasks: [] };

interface AreaMeta {
  label: string;
  emoji: string;
  order: number;
  coverFallback?: string;
}

const AREA_META: Record<string, AreaMeta> = {
  universidad: { label: 'Universidad', emoji: '🎓', order: 0, coverFallback: 'profesional' },
  emprendimiento: { label: 'Emprendimiento', emoji: '🚀', order: 1, coverFallback: 'profesional' },
  proyectos: { label: 'Proyectos', emoji: '📁', order: 2, coverFallback: 'profesional' },
  lectura: { label: 'Lectura', emoji: '📖', order: 3, coverFallback: 'desarrollo' },
  musica: { label: 'Música', emoji: '🎸', order: 4, coverFallback: 'desarrollo' },
  idiomas: { label: 'Idiomas', emoji: '🌍', order: 5, coverFallback: 'desarrollo' },
  ingles: { label: 'Inglés', emoji: '🇬🇧', order: 6, coverFallback: 'desarrollo' },
  italiano: { label: 'Italiano', emoji: '🇮🇹', order: 7, coverFallback: 'desarrollo' },
  ajedrez: { label: 'Ajedrez', emoji: '♟️', order: 8, coverFallback: 'desarrollo' },
  game: { label: 'Game', emoji: '🎮', order: 9, coverFallback: 'desarrollo' },
  gym: { label: 'Gym', emoji: '💪', order: 10, coverFallback: 'salud' },
  general: { label: 'General', emoji: '🗂️', order: 98 },
};

const EVENT_AREA: Record<string, string> = {
  universidad: 'universidad',
  emprendimiento: 'emprendimiento',
  proyectos: 'proyectos',
  idiomas: 'idiomas',
  lectura: 'lectura',
  musica: 'musica',
  gym: 'gym',
};

function sourceToArea(source?: string | null): string | null {
  switch (source) {
    case 'project':
      return 'proyectos';
    case 'university':
      return 'universidad';
    case 'entrepreneurship':
      return 'emprendimiento';
    default:
      return null;
  }
}

function metaFor(areaId: string): AreaMeta {
  return (
    AREA_META[areaId] ?? {
      label: AREA_LABELS[areaId] ?? areaId,
      emoji: '📌',
      order: 50,
    }
  );
}

function getRange(scope: MilestoneScope, anchor: Date): { start: Date; end: Date } {
  switch (scope) {
    case 'day':
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
    case 'week':
      return {
        start: startOfWeek(anchor, { weekStartsOn: 1 }),
        end: endOfWeek(anchor, { weekStartsOn: 1 }),
      };
    case 'month':
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
  }
}

export function PeriodMilestones({
  scope,
  anchorDate,
}: {
  scope: FocusPeriodType;
  anchorDate: Date;
}) {
  const milestoneScope: MilestoneScope =
    scope === 'week' ? 'week' : scope === 'month' ? 'month' : 'day';
  const { start, end } = useMemo(
    () => getRange(milestoneScope, anchorDate),
    [milestoneScope, anchorDate],
  );
  const startKey = format(start, 'yyyy-MM-dd');
  const endKey = format(end, 'yyyy-MM-dd');

  const { covers } = useAreaCovers();
  const monthDate = useMemo(() => startOfMonth(anchorDate), [anchorDate]);
  const { planData, books, songs, projects, subjects } = useMonthlyPlan(monthDate);

  const [raw, setRaw] = useState<RawHitos>(EMPTY_RAW);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [eventsRes, examsRes, tasksRes, subjectsRes] = await Promise.all([
        supabase
          .from('calendar_events')
          .select('id,title,event_date,category,description')
          .gte('event_date', startKey)
          .lte('event_date', endKey)
          .order('event_date'),
        supabase
          .from('exams')
          .select('id,title,exam_date,status,subject_id')
          .gte('exam_date', startKey)
          .lte('exam_date', endKey)
          .order('exam_date'),
        supabase
          .from('tasks')
          .select('id,title,due_date,completed,area_id,source')
          .gte('due_date', startKey)
          .lte('due_date', endKey)
          .order('due_date'),
        supabase.from('university_subjects').select('id,name'),
      ]);
      if (cancelled) return;

      const subjectNames = new Map<string, string>(
        (subjectsRes.data ?? []).map((s) => [s.id, s.name]),
      );

      const events: Hito[] = (eventsRes.data ?? []).map((e) => ({
        id: `ev-${e.id}`,
        kind: 'event',
        title: e.title,
        subtitle: e.description,
        date: e.event_date,
        areaId: EVENT_AREA[e.category] ?? 'general',
      }));

      const exams: Hito[] = (examsRes.data ?? []).map((e) => ({
        id: `ex-${e.id}`,
        kind: 'exam',
        title: e.title,
        subtitle: e.subject_id ? subjectNames.get(e.subject_id) : undefined,
        date: e.exam_date,
        done: e.status === 'done' || e.status === 'completed',
        tag: e.status === 'done' || e.status === 'completed' ? 'Hecho' : 'Examen',
        areaId: 'universidad',
      }));

      const tasks: Hito[] = (tasksRes.data ?? []).map((t) => ({
        id: `tk-${t.id}`,
        kind: 'delivery',
        title: t.title,
        date: t.due_date,
        done: !!t.completed,
        tag: t.completed ? 'Entregada' : 'Entrega',
        areaId: t.area_id ?? sourceToArea(t.source) ?? 'general',
      }));

      setRaw({ events, exams, tasks });
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [startKey, endKey]);

  const objectiveHitos = useMemo<Hito[]>(() => {
    const byHabit = buildHabitPlanObjectives(
      planData,
      { books, songs, projects, subjects },
      milestoneScope === 'week' ? { weekKey: startKey } : undefined,
    );
    const out: Hito[] = [];
    const push = (habit: string, kind: Hito['kind'], list: ReturnType<typeof buildHabitPlanObjectives>[string]) => {
      for (const o of list) {
        out.push({
          id: `ob-${habit}-${o.id}`,
          kind,
          title: o.title,
          subtitle: o.subtitle ?? null,
          tag: o.tag ?? (o.isCurrent ? 'Leyendo' : undefined),
          done: o.status === 'finished' || o.status === 'mastered',
          areaId: habit,
        });
      }
    };
    push('lectura', 'book', byHabit.lectura ?? []);
    push('musica', 'song', byHabit.musica ?? []);
    push('universidad', 'subject', byHabit.universidad ?? []);
    push('proyectos', 'project', byHabit.proyectos ?? []);
    return out;
  }, [planData, books, songs, projects, subjects, milestoneScope, startKey]);

  const grouped = useMemo(() => {
    const all = [...raw.events, ...raw.exams, ...raw.tasks, ...objectiveHitos];
    const map = new Map<string, Hito[]>();
    for (const hito of all) {
      const arr = map.get(hito.areaId) ?? [];
      arr.push(hito);
      map.set(hito.areaId, arr);
    }
    return [...map.entries()]
      .map(([areaId, items]) => ({
        areaId,
        meta: metaFor(areaId),
        items: [...items].sort((a, b) => {
          if (a.date && b.date) return a.date.localeCompare(b.date);
          if (a.date) return -1;
          if (b.date) return 1;
          return a.title.localeCompare(b.title);
        }),
      }))
      .sort((a, b) => a.meta.order - b.meta.order);
  }, [raw, objectiveHitos]);

  const total = grouped.reduce((sum, g) => sum + g.items.length, 0);

  const coverFor = (areaId: string): string | null => {
    const meta = AREA_META[areaId];
    return (
      covers[coverKey('area', areaId)] ??
      covers[coverKey('sub', areaId)] ??
      (meta?.coverFallback
        ? covers[coverKey('area', meta.coverFallback)] ?? covers[coverKey('sub', meta.coverFallback)]
        : undefined) ??
      null
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
          <Milestone className="h-4 w-4 text-violet-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-tight">Hitos del periodo</h3>
          <p className="truncate text-xs text-muted-foreground">
            {getPeriodTitle(scope, anchorDate)}
          </p>
        </div>
        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
          {total} hitos
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground">
          Sin hitos en este periodo. Agrega objetivos, eventos o entregas.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {grouped.map((group) => {
            const accent = group.items[0] ? KIND_ICON[group.items[0].kind].accent : 'text-muted-foreground';
            return (
              <div
                key={group.areaId}
                className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
              >
                <div className="relative">
                  <AreaCover
                    cover={coverFor(group.areaId)}
                    gradient={getCoverGradient(group.areaId)}
                    label={`${group.meta.emoji} ${group.meta.label}`}
                    className="h-14"
                  />
                  <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur-sm">
                    {group.items.length}
                  </span>
                </div>

                <div className="divide-y divide-border/50">
                  {group.items.map((item) => {
                    const cfg = KIND_ICON[item.kind];
                    const Icon = cfg.icon;
                    return (
                      <div key={item.id} className="flex items-start gap-2 px-3 py-2">
                        <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', cfg.accent)} />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'truncate text-xs font-medium leading-tight',
                              item.done && 'text-muted-foreground line-through',
                            )}
                          >
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {item.date && (
                            <span className="text-[10px] tabular-nums text-muted-foreground">
                              {(() => {
                                const d = new Date(`${String(item.date || '').slice(0, 10)}T12:00:00`);
                                return isNaN(d.getTime()) ? 'Sin fecha' : format(d, 'd MMM', { locale: es });
                              })()}
                            </span>
                          )}
                          {item.tag && (
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                                item.done
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-muted text-muted-foreground',
                              )}
                            >
                              {item.done && <Check className="mr-0.5 inline h-2.5 w-2.5" />}
                              {item.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
