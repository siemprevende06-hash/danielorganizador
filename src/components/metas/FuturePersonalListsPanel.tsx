import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ObjectiveRow, type PlanObjectiveRow } from '@/components/planificacion/PlanAreaCard';
import {
  DAILY_SYSTEMS,
  LIFE_AREAS,
  usePersonalLists,
  type PersonalList,
  type PersonalListTask,
} from '@/hooks/usePersonalLists';
import { cn } from '@/lib/utils';

const SYSTEM_EMOJI: Record<string, string> = {
  universidad: '🎓',
  emprendimiento: '🚀',
  proyectos: '📁',
  lectura: '📖',
  musica: '🎸',
  idiomas: '🌍',
  ajedrez: '♟️',
  gym: '💪',
  game: '🎮',
};

const VIEWS = [
  { id: 'todas', label: 'Todas' },
  { id: 'sistemas', label: 'Sistemas' },
] as const;

type FutureView = (typeof VIEWS)[number]['id'];

function areaLabel(id: string) {
  return LIFE_AREAS.find(area => area.id === id)?.label || id;
}

function formatTargetDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

function formatTargetTag(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'd MMM', { locale: es });
}

function rootsOf(list: PersonalList, tasks: PersonalListTask[]) {
  return tasks.filter(task => task.list_id === list.id && !task.parent_id);
}

function toObjectiveRow(list: PersonalList, tasks: PersonalListTask[]): PlanObjectiveRow {
  const roots = rootsOf(list, tasks);
  const done = roots.filter(task => task.completed).length;
  return {
    id: list.id,
    title: list.title,
    subtitle: [areaLabel(list.area_id), list.sub_area].filter(Boolean).join(' · ') || undefined,
    cover: list.cover_image_url,
    emoji: '🎯',
    tag: formatTargetTag(list.target_date) ?? undefined,
    meta: roots.length > 0
      ? `${done}/${roots.length} tareas`
      : list.description ?? undefined,
    createdAt: list.created_at,
    createdLabel: 'Creada',
  };
}

/**
 * Copia visual de las metas de "Mi Lista Personal" (sección Todas).
 * No se conecta con los sistemas ni con el motor de metas: solo tarjetas.
 */
export function FuturePersonalListsPanel() {
  const { lists, tasks, isLoading } = usePersonalLists();
  const [view, setView] = useState<FutureView>('todas');

  const groupedByArea = useMemo(() => {
    const byArea = new Map<string, Map<string, PersonalList[]>>();
    lists.forEach(list => {
      const sub = list.sub_area?.trim() || 'General';
      if (!byArea.has(list.area_id)) byArea.set(list.area_id, new Map());
      const subs = byArea.get(list.area_id)!;
      if (!subs.has(sub)) subs.set(sub, []);
      subs.get(sub)!.push(list);
    });
    return byArea;
  }, [lists]);

  const groupedBySystem = useMemo(() => {
    const bySystem = new Map<string, PersonalList[]>();
    lists.forEach(list => {
      const key = list.system_key?.trim() || 'sin-sistema';
      if (!bySystem.has(key)) bySystem.set(key, []);
      bySystem.get(key)!.push(list);
    });
    return bySystem;
  }, [lists]);

  const systemCards = useMemo(() => {
    const known = DAILY_SYSTEMS
      .filter(system => groupedBySystem.has(system.id))
      .map(system => ({
        id: system.id,
        label: system.label,
        emoji: SYSTEM_EMOJI[system.id] ?? '🎯',
        items: groupedBySystem.get(system.id)!,
      }));

    const custom = [...groupedBySystem.keys()]
      .filter(key => key !== 'sin-sistema' && !DAILY_SYSTEMS.some(system => system.id === key))
      .map(key => ({
        id: key,
        label: key,
        emoji: SYSTEM_EMOJI[key] ?? '🎯',
        items: groupedBySystem.get(key)!,
      }));

    const unassigned = groupedBySystem.has('sin-sistema')
      ? [{
          id: 'sin-sistema',
          label: 'Sin sistema asignado',
          emoji: '🎯',
          items: groupedBySystem.get('sin-sistema')!,
        }]
      : [];

    return [...known, ...custom, ...unassigned];
  }, [groupedBySystem]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Cargando metas de Mi Lista Personal...
        </CardContent>
      </Card>
    );
  }

  if (lists.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Todavía no hay metas en Mi Lista Personal. Créalas en la página Mi Lista Personal y aparecerán aquí.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
          {VIEWS.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => setView(option.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                view === option.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {lists.length} {lists.length === 1 ? 'meta' : 'metas'} · {systemCards.length} {systemCards.length === 1 ? 'sistema' : 'sistemas'}
        </span>
      </div>

      {view === 'todas' ? (
        <div className="space-y-5">
          {[...groupedByArea.entries()].map(([areaId, subs]) => (
            <section key={areaId} className="space-y-3">
              <h2 className="border-b border-border pb-1 text-lg font-semibold">
                {areaLabel(areaId)}
              </h2>
              {[...subs.entries()].map(([sub, items]) => (
                <div key={sub} className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{sub}</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map(list => {
                      const roots = rootsOf(list, tasks);
                      const done = roots.filter(task => task.completed).length;
                      const pct = roots.length ? Math.round((done / roots.length) * 100) : 0;
                      const targetDate = formatTargetDate(list.target_date);

                      return (
                        <Card
                          key={list.id}
                          className="overflow-hidden rounded-2xl border-border/60 bg-white/80 shadow-sm backdrop-blur-xl dark:bg-zinc-950/70"
                        >
                          {list.cover_image_url ? (
                            <img
                              src={list.cover_image_url}
                              alt={`Portada de ${list.title}`}
                              loading="lazy"
                              className="h-24 w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-24 w-full items-center justify-center bg-muted">
                              <ListChecks className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <CardContent className="space-y-2.5 p-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-base font-semibold leading-tight">
                                {list.title}
                              </h3>
                              <p className="text-[11px] text-muted-foreground">
                                {areaLabel(list.area_id)}
                                {list.sub_area ? ` · ${list.sub_area}` : ''}
                              </p>
                            </div>

                            {list.description && (
                              <p className="line-clamp-2 text-xs text-muted-foreground">
                                {list.description}
                              </p>
                            )}

                            {targetDate && (
                              <Badge variant="outline" className="gap-1 text-[10px] font-medium">
                                <CalendarDays className="h-3 w-3" />
                                {targetDate}
                              </Badge>
                            )}

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{roots.length > 0 ? 'Avance' : 'Sin tareas'}</span>
                                {roots.length > 0 && (
                                  <span className="tabular-nums">{done}/{roots.length}</span>
                                )}
                              </div>
                              <Progress value={pct} className="h-1.5" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {systemCards.map(system => (
            <div
              key={system.id}
              className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-2 ring-border/40 dark:bg-zinc-950/80"
            >
              <div className="flex items-center gap-2 border-b border-border/50 bg-foreground/[0.03] px-3 py-2">
                <span className="text-lg leading-none">{system.emoji}</span>
                <h3 className="truncate text-sm font-bold leading-tight">{system.label}</h3>
                <span className="ml-auto shrink-0 rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {system.items.length} {system.items.length === 1 ? 'meta' : 'metas'}
                </span>
              </div>
              <div className="space-y-1 p-2.5">
                {system.items.map(list => (
                  <ObjectiveRow key={list.id} item={toObjectiveRow(list, tasks)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
