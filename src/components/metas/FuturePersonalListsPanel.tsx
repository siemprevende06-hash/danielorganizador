import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  LIFE_AREAS,
  usePersonalLists,
  type PersonalList,
} from '@/hooks/usePersonalLists';

function areaLabel(id: string) {
  return LIFE_AREAS.find(area => area.id === id)?.label || id;
}

function formatTargetDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Copia visual de las metas de "Mi Lista Personal" (sección Todas).
 * No se conecta con los sistemas ni con el motor de metas: solo tarjetas.
 */
export function FuturePersonalListsPanel() {
  const { lists, tasks, isLoading } = usePersonalLists();

  const grouped = useMemo(() => {
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
    <div className="space-y-5">
      {[...grouped.entries()].map(([areaId, subs]) => (
        <section key={areaId} className="space-y-3">
          <h2 className="border-b border-border pb-1 text-lg font-semibold">
            {areaLabel(areaId)}
          </h2>
          {[...subs.entries()].map(([sub, items]) => (
            <div key={sub} className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{sub}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(list => {
                  const listTasks = tasks.filter(task => task.list_id === list.id);
                  const roots = listTasks.filter(task => !task.parent_id);
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
  );
}
