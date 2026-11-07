import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format, startOfMonth, startOfWeek, endOfMonth, endOfWeek, isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowDown, Building2, Layers, Pencil, Sparkles, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { coverKey, useAreaCovers } from '@/hooks/useAreaCovers';
import { useDailyPlanData } from '@/hooks/useDailyPlanData';
import {
  usePlanSystemMetrics,
  type PlanSystemMetricsResult,
} from '@/hooks/usePlanSystemMetrics';
import { useMonthlyPlan } from '@/hooks/useMonthlyPlan';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import { usePeriodPlanTasks } from '@/hooks/usePeriodPlanTasks';
import { usePlanLibraryToggles, type SongPlanTypeLite } from '@/hooks/usePlanLibraryToggles';
import { useSystemGoals } from '@/hooks/useSystemGoals';
import { goalsInDateRange, type SystemGoal } from '@/lib/systemGoals';
import { GROUP_CONFIG } from '@/lib/areaSystemsMap';
import { doseLabel, summarizeSpeedPlan } from '@/lib/speedPlan';
import {
  ALL_HIERARCHY_AREAS, AREA_LABELS,
  getDayGoalEffective, getDayGoalTotal, getMonthGoalsSummary, getWeekGoalEffective,
} from '@/lib/hierarchy';
import { LANGUAGE_IDS, LANGUAGE_LABELS, readLanguageMonthPlans, readLanguageWeekPlans } from '@/lib/languagePlan';
import { readGameMonthPlan, readGameWeekPlan } from '@/lib/game';
import {
  PLAN_CENTRAL_AREAS,
  PLAN_STRUCTURAL_AREAS,
  PLAN_SYSTEM_META,
  type PlanAreaDef,
  type PlanAreaMetrics,
  type PlanificationScope,
} from '@/lib/planSystems';
import { cn } from '@/lib/utils';
import {
  PlanAreaCard,
  PlanAreaHeader,
  ObjectiveRow,
  StructuralSystemRow,
  type PlanAreaCardData,
  type PlanObjectiveRow,
} from './PlanAreaCard';

export type { PlanificationScope } from '@/lib/planSystems';

interface PeriodPlanificationSectionProps {
  scope: PlanificationScope;
  anchorDate: Date;
  /**
   * Muestra solo las tarjetas de sistemas (estructurales y centrales), sin la
   * cabecera de Planificación ni el plan del periodo. Se usa para replicar las
   * tarjetas dentro de Autocrítica.
   */
  onlySystems?: boolean;
}

export function PeriodPlanificationSection({ scope, anchorDate, onlySystems = false }: PeriodPlanificationSectionProps) {
  if (scope === 'day') return <DayPlanification anchorDate={anchorDate} onlySystems={onlySystems} />;
  if (scope === 'week') return <WeekPlanification anchorDate={anchorDate} onlySystems={onlySystems} />;
  return <MonthPlanification anchorDate={anchorDate} onlySystems={onlySystems} />;
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const minutesLabel = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `${min} min`;

const dateLabel = (value?: string | null) => {
  if (!value) return undefined;
  // Se toma solo la fecha (yyyy-MM-dd) para evitar saltos de día por zona horaria.
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (isNaN(date.getTime())) return undefined;
  return format(date, 'EEE d MMM', { locale: es });
};

/** Fila visual de una meta creada desde Metas Sistemas. */
function systemGoalRow(goal: SystemGoal, onToggle: () => void): PlanObjectiveRow {
  return {
    id: `system-goal-${goal.id}`,
    title: goal.title,
    subtitle: goal.objective || undefined,
    meta: dateLabel(goal.date),
    emoji: '🎯',
    tag: goal.completed ? 'Hecha' : undefined,
    done: !!goal.completed,
    onToggle,
  };
}

/**
 * Reparte las metas con fecha de un periodo entre sistemas y áreas
 * estructurales. Así una meta de diciembre solo aparece en diciembre.
 */
function splitSystemGoals(
  goals: SystemGoal[],
  startKey: string,
  endKey: string,
  onToggle: (id: string) => void,
): {
  systems: Record<string, PlanObjectiveRow[]>;
  areas: Record<string, PlanObjectiveRow[]>;
} {
  const areaIds = new Set<string>(PLAN_STRUCTURAL_AREAS.map(area => area.id));
  const systems: Record<string, PlanObjectiveRow[]> = {};
  const areas: Record<string, PlanObjectiveRow[]> = {};

  for (const goal of goalsInDateRange(goals, startKey, endKey)) {
    const target = areaIds.has(goal.systemId) ? areas : systems;
    (target[goal.systemId] ??= []).push(systemGoalRow(goal, () => onToggle(goal.id)));
  }

  return { systems, areas };
}

function mergeRows(
  base: Record<string, PlanObjectiveRow[]>,
  extra: Record<string, PlanObjectiveRow[]>,
): Record<string, PlanObjectiveRow[]> {
  if (Object.keys(extra).length === 0) return base;
  const out = { ...base };
  Object.entries(extra).forEach(([id, rows]) => {
    out[id] = [...(out[id] ?? []), ...rows];
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Rendimiento de los sistemas dentro de Planificación                 */
/* ------------------------------------------------------------------ */

interface PlanAreaSectionData {
  area: PlanAreaMetrics;
  /** Metas con fecha que pertenecen al área (Salud, Fuerza Mental, Apariencia). */
  items?: PlanObjectiveRow[];
  sections: Array<{
    id: string;
    title: string;
    emoji?: string;
    cards: PlanAreaCardData[];
  }>;
}

/**
 * Construye las secciones de un grupo (estructural o central) con TODAS las
 * tarjetas de sistema, aunque todavía no tengan datos. Cada sistema recibe sus
 * métricas del periodo, sus objetivos y la meta de minutos que le corresponde.
 */
function buildPlanAreas(
  defs: PlanAreaDef[],
  metrics: PlanSystemMetricsResult,
  covers: Record<string, string>,
  itemsById: Record<string, PlanObjectiveRow[]>,
  plannedById: Record<string, number | undefined>,
  unit: string,
  areaItemsById: Record<string, PlanObjectiveRow[]> = {},
): PlanAreaSectionData[] {
  return defs.flatMap(areaDef => {
    const area = metrics.areas[areaDef.id];
    if (!area) return [];

    const sections = areaDef.sections.flatMap(section => {
      const cards = section.systems.flatMap(id => {
        const meta = PLAN_SYSTEM_META[id];
        const system = metrics.systems[id];
        if (!meta || !system) return [];

        const planned = plannedById[id];
        const card: PlanAreaCardData = {
          id,
          title: meta.name,
          emoji: meta.emoji,
          note: meta.role === 'ancla' ? 'ancla' : undefined,
          cover: covers[coverKey('sub', id)]
            ?? covers[coverKey('area', id)]
            ?? covers[coverKey('area', areaDef.id)]
            ?? null,
          minutes: planned,
          minutesUnit: unit,
          system: { ...system, plannedMinutes: planned },
          onTargetChange: (pct: number) => metrics.setTarget(id, pct),
          items: itemsById[id] ?? [],
        };
        return [card];
      });
      return cards.length > 0 ? [{ ...section, cards }] : [];
    });

    return sections.length > 0
      ? [{ area, items: areaItemsById[areaDef.id] ?? [], sections }]
      : [];
  });
}

/** Suma las metas de minutos de varias áreas de la jerarquía. */
function minutesFrom(goals: Record<string, number>, ids: string[]): number {
  return ids.reduce((sum, id) => sum + Math.max(0, Math.round(Number(goals[id]) || 0)), 0);
}

/**
 * Libros de la semana: reparto explícito o, si la semana aún no tiene reparto,
 * el mismo libro que muestra la planificación semanal (lectura actual o el
 * primero planificado del mes).
 */
function effectiveWeekBookIds(
  weekIds: string[] | undefined,
  weekBookId: string | undefined,
  monthSelected: string[],
  booksById: Map<string, { status?: string | null }>,
): string[] {
  const ids = [...(weekIds || [])];
  if (weekBookId && !ids.includes(weekBookId)) ids.unshift(weekBookId);
  if (ids.length > 0) return ids;
  const current = monthSelected.find(id => booksById.get(id)?.status === 'reading');
  return current ? [current] : monthSelected.slice(0, 1);
}

const PRIORITY_TAG: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' };

const INTENSITY_LABEL: Record<string, string> = { minimo: 'Mín', maximo: 'Máx', extra: 'Extra' };
const INTENSITY_MULT: Record<string, number> = { minimo: 0.5, maximo: 1, extra: 1.5 };
const INTENSITY_BASE_MIN: Record<string, number> = { lectura: 30, ajedrez: 20, game: 20, idiomas: 30, gym: 60, musica: 30 };
const SYSTEM_NAMES: Record<string, string> = { lectura: 'Lectura', ajedrez: 'Ajedrez', game: 'Game', idiomas: 'Idiomas', gym: 'Gym', musica: 'Música' };

function intensityRows(planIntensity?: Record<string, string> | null): PlanObjectiveRow[] {
  return Object.entries(planIntensity || {})
    .filter(([, value]) => value === 'minimo' || value === 'maximo' || value === 'extra')
    .map(([id, value]) => ({
      id,
      title: SYSTEM_NAMES[id] || id,
      tag: INTENSITY_LABEL[value],
      meta: `~${Math.round((INTENSITY_BASE_MIN[id] || 30) * (INTENSITY_MULT[value] ?? 1))} min`,
      emoji: '⚡',
    }));
}

function songTag(plan?: SongPlanTypeLite) {
  if (plan === 'mastered') return 'Dominar';
  if (plan === 'recorded') return 'Grabar';
  return 'Aprender';
}

/** Nombres y portadas de emprendimientos para el foco semanal por área. */
function useEntrepreneurshipMeta(ids: string[]) {
  const [meta, setMeta] = useState<Record<string, { name: string; cover: string | null }>>({});
  const key = ids.join(',');

  useEffect(() => {
    let alive = true;
    if (ids.length === 0) {
      setMeta({});
      return () => { alive = false; };
    }
    (async () => {
      const { data } = await supabase.from('entrepreneurships').select('id, name, cover_image').in('id', ids);
      if (!alive) return;
      const rows = (data || []) as { id: string; name: string; cover_image?: string | null }[];
      setMeta(Object.fromEntries(rows.map(row => [row.id, { name: row.name, cover: row.cover_image ?? null }])));
    })();

    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return meta;
}

/* ------------------------------------------------------------------ */
/* Tarjetas por área (mismo lenguaje visual que Sistemas)               */
/* ------------------------------------------------------------------ */

interface PlanGroup {
  key: string;
  title: string;
  note?: string;
  dot: string;
  /** Áreas con sus subsecciones y tarjetas de sistema (estructural/central). */
  areas?: PlanAreaSectionData[];
  /** Tarjetas sueltas del plan del periodo. */
  cards?: PlanAreaCardData[];
}

const STRUCTURAL_GROUP = {
  key: 'estructural',
  title: GROUP_CONFIG.cimientos.sectionTitle,
  note: 'Salud · Fuerza mental · Apariencia',
  dot: 'bg-blue-500',
} as const;

const CENTRAL_GROUP = {
  key: 'central',
  title: GROUP_CONFIG.construccion.sectionTitle,
  note: 'Desarrollo · Profesional · Finanzas',
  dot: 'bg-sky-500',
} as const;

function periodGroup(title: string, note: string, cards: PlanAreaCardData[]): PlanGroup {
  return { key: 'periodo', title, note, dot: 'bg-indigo-500', cards };
}

/** Tarjeta para bloques del plan que no son un área de vida (tareas, eventos…). */
function plainCard(args: {
  id: string;
  title: string;
  emoji: string;
  note?: string;
  items: PlanObjectiveRow[];
}): PlanAreaCardData {
  return {
    id: args.id,
    title: args.title,
    note: args.note,
    emoji: args.emoji,
    cover: null,
    items: args.items,
  };
}

const isCardVisible = (card: PlanAreaCardData) =>
  !!card.system
  || card.items.length > 0
  || (card.minutes ?? 0) > 0;

const QUICK_NAV_META: Record<'estructural' | 'central', {
  label: string;
  hint: string;
  icon: typeof Layers;
  tone: string;
}> = {
  estructural: {
    label: 'Estructurales',
    hint: 'Salud · Fuerza mental · Apariencia',
    icon: Layers,
    tone: 'hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400',
  },
  central: {
    label: 'Centrales',
    hint: 'Desarrollo · Profesional · Finanzas',
    icon: Building2,
    tone: 'hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400',
  },
};

/** Grupos que tienen algo que mostrar (evita saltar a secciones vacías). */
const groupHasContent = (group: PlanGroup) =>
  (group.areas?.some(area => area.sections.some(section => section.cards.length > 0)) ?? false)
  || ((group.cards ?? []).some(isCardVisible));

const groupAreaCount = (group: PlanGroup) =>
  group.areas?.filter(area => area.sections.some(section => section.cards.length > 0)).length ?? 0;

/** Cumplimiento agregado de los sistemas del grupo para el acceso rápido. */
function groupProgress(group: PlanGroup): number | null {
  const cards = [
    ...(group.areas?.flatMap(area => area.sections.flatMap(section => section.cards)) ?? []),
    ...(group.cards ?? []),
  ].filter(card => card.system);
  if (cards.length === 0) return null;
  const done = cards.reduce((sum, card) => sum + (card.system?.daysDone ?? 0), 0);
  const total = cards.reduce((sum, card) => sum + (card.system?.daysTotal ?? 0), 0);
  return total > 0 ? Math.round((done / total) * 100) : null;
}

function scrollToGroup(key: string) {
  document
    .getElementById(`planification-group-${key}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function taskRows(
  tasks: { id: string; title: string; completed: boolean; due_date: string | null; area_id: string | null }[],
  onToggle: (id: string) => void,
  showDate: boolean,
): PlanObjectiveRow[] {
  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    subtitle: [
      showDate ? dateLabel(task.due_date) : undefined,
      task.area_id ? (AREA_LABELS[task.area_id] || task.area_id) : undefined,
    ].filter(Boolean).join(' · ') || undefined,
    emoji: '✅',
    done: task.completed,
    onToggle: () => onToggle(task.id),
  }));
}

/* ------------------------------------------------------------------ */
/* Estructura visual                                                   */
/* ------------------------------------------------------------------ */

function PlanShell({
  title, subtitle, editUrl, empty, loading, totalMinutes, children,
}: {
  title: string;
  subtitle: string;
  editUrl: string;
  empty: boolean;
  loading?: boolean;
  totalMinutes?: number;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {(totalMinutes ?? 0) > 0 && (
            <span className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 sm:flex">
              <Timer className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold tabular-nums text-primary">{minutesLabel(totalMinutes ?? 0)}</span>
              <span className="text-[10px] text-muted-foreground">planificados</span>
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 rounded-full text-xs"
            onClick={() => navigate(editUrl)}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Editar
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : empty ? (
        <div className="rounded-2xl border border-dashed border-border/60 py-10 text-center">
          <Sparkles className="mx-auto mb-2 h-5 w-5 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Sin objetivos planificados para este periodo.</p>
          <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={() => navigate(editUrl)}>
            Abrir planificación
          </Button>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function GroupHeading({ group }: { group: PlanGroup }) {
  return (
    <div className="flex items-center gap-2 px-0.5">
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', group.dot)} />
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">{group.title}</h3>
      {group.note && (
        <span className="hidden text-[10px] text-muted-foreground sm:inline">{group.note}</span>
      )}
      <span className="h-px flex-1 bg-border/60" />
    </div>
  );
}

function SectionHeading({
  section,
  boxed = false,
}: {
  section: PlanAreaSectionData['sections'][number];
  boxed?: boolean;
}) {
  const done = section.cards.reduce((sum, card) => sum + (card.system?.daysDone ?? 0), 0);
  const total = section.cards.reduce((sum, card) => sum + (card.system?.daysTotal ?? 0), 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : null;

  return (
    <div className={cn(
      'flex items-center gap-1.5',
      boxed ? 'border-b border-border/40 bg-muted/30 px-2.5 py-1' : 'px-0.5',
    )}>
      {section.emoji && <span className="text-[11px] leading-none">{section.emoji}</span>}
      <h5 className="text-[10px] font-bold uppercase tracking-wide text-foreground/70">
        {section.title}
      </h5>
      <span className="text-[8px] font-semibold text-muted-foreground">
        {section.cards.length} sistemas
      </span>
      {pct != null && (
        <span className={cn(
          'text-[8px] font-bold tabular-nums',
          pct >= 80 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 50 ? 'text-amber-600' : 'text-red-500'
        )}>
          {pct}%
        </span>
      )}
      <span className="h-px flex-1 bg-border/50" />
    </div>
  );
}

function PlanAreaSection({ data, scope }: { data: PlanAreaSectionData; scope: PlanificationScope }) {
  // Las áreas estructurales se muestran como una tabla compacta sin portadas:
  // una fila por sistema y todas las subáreas dentro del mismo bloque.
  if (data.area.kind === 'estructural') {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-white/80 dark:bg-zinc-950/80">
        <PlanAreaHeader area={data.area} scope={scope} embedded />
        {(data.items?.length ?? 0) > 0 && (
          <div className="space-y-1 border-b border-border/50 px-2.5 py-1.5">
            {data.items!.map(item => (
              <ObjectiveRow key={item.id} item={item} />
            ))}
          </div>
        )}
        {data.sections.map((section, index) => (
          <div key={section.id} className={cn(index > 0 && 'border-t border-border/50')}>
            <SectionHeading section={section} boxed />
            <div className="divide-y divide-border/40">
              {section.cards.map(card => (
                <StructuralSystemRow key={card.id} card={card} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-2.5">
      <PlanAreaHeader area={data.area} scope={scope} />
      {(data.items?.length ?? 0) > 0 && (
        <div className="space-y-1">
          {data.items!.map(item => (
            <ObjectiveRow key={item.id} item={item} />
          ))}
        </div>
      )}
      {data.sections.map(section => (
        <div key={section.id} className="space-y-1.5">
          <SectionHeading section={section} />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
            {section.cards.map(card => (
              <PlanAreaCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function PlanQuickNav({ groups }: { groups: PlanGroup[] }) {
  const targets = groups.filter(
    (group): group is PlanGroup & { key: 'estructural' | 'central' } =>
      (group.key === 'estructural' || group.key === 'central') && groupHasContent(group),
  );
  if (targets.length === 0) return null;

  return (
    <nav
      aria-label="Accesos rápidos de planificación"
      className="sticky top-2 z-20 flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-white/90 px-2 py-1.5 shadow-sm backdrop-blur-md dark:bg-zinc-950/90"
    >
      <span className="px-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        Ir a
      </span>
      {targets.map(group => {
        const meta = QUICK_NAV_META[group.key];
        const Icon = meta.icon;
        const areas = groupAreaCount(group);
        const pct = groupProgress(group);

        return (
          <button
            key={group.key}
            type="button"
            onClick={() => scrollToGroup(group.key)}
            title={meta.hint}
            className={cn(
              'group inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-foreground/80 transition-colors',
              meta.tone,
            )}
          >
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', group.dot)} />
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[11px] font-bold leading-none">{meta.label}</span>
            {areas > 0 && (
              <span className="text-[9px] font-medium text-muted-foreground">{areas} áreas</span>
            )}
            {pct != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums',
                  pct >= 80
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : pct >= 50
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-red-500/15 text-red-500',
                )}
                title="Cumplimiento agregado de los sistemas del grupo"
              >
                {pct}%
              </span>
            )}
            <ArrowDown className="h-3 w-3 shrink-0 opacity-50 transition-transform group-hover:translate-y-0.5" />
          </button>
        );
      })}
    </nav>
  );
}

function PlanGroups({
  groups,
  scope,
  showQuickNav = true,
}: {
  groups: PlanGroup[];
  scope: PlanificationScope;
  showQuickNav?: boolean;
}) {
  return (
    <div className="space-y-5">
      {showQuickNav && <PlanQuickNav groups={groups} />}
      {groups.map(group => {
        if (group.areas && group.areas.length > 0) {
          return (
            <section
              key={group.key}
              id={`planification-group-${group.key}`}
              className="scroll-mt-24 space-y-3"
            >
              <GroupHeading group={group} />
              <div className={group.key === 'estructural' ? 'space-y-2.5' : 'space-y-4'}>
                {group.areas.map(area => (
                  <PlanAreaSection key={area.area.id} data={area} scope={scope} />
                ))}
              </div>
            </section>
          );
        }

        const cards = (group.cards ?? []).filter(isCardVisible);
        if (cards.length === 0) return null;

        return (
          <section
            key={group.key}
            id={`planification-group-${group.key}`}
            className="scroll-mt-24 space-y-2.5"
          >
            <GroupHeading group={group} />
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
              {cards.map(card => (
                <PlanAreaCard key={card.id} card={card} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Vista de solo sistemas para Autocrítica: reutiliza EXACTAMENTE las tarjetas
 * de la pestaña Planificación (mismas portadas, métricas y objetivos), pero sin
 * la cabecera de planificación ni los bloques de tareas del periodo.
 */
function PlanSystemCardsOnly({
  groups,
  scope,
  loading,
}: {
  groups: PlanGroup[];
  scope: PlanificationScope;
  loading: boolean;
}) {
  const systemGroups = groups.filter(
    group => group.key === 'estructural' || group.key === 'central',
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl bg-muted/40" />
        ))}
      </div>
    );
  }

  if (!systemGroups.some(groupHasContent)) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 py-8 text-center">
        <Sparkles className="mx-auto mb-2 h-5 w-5 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">
          Sin sistemas con datos para este periodo.
        </p>
      </div>
    );
  }

  return <PlanGroups groups={systemGroups} scope={scope} showQuickNav={false} />;
}

/* ------------------------------------------------------------------ */
/* MES                                                                 */
/* ------------------------------------------------------------------ */

function MonthPlanification({ anchorDate, onlySystems = false }: { anchorDate: Date; onlySystems?: boolean }) {
  const month = startOfMonth(anchorDate);
  const {
    planData, books, songs, projects, subjects, topics, events, loading, patchPlan,
  } = useMonthlyPlan(month);
  const { tasks, toggleTask, loading: tasksLoading } = usePeriodPlanTasks(month, endOfMonth(month));
  const { isBookDone, isSongDone, toggleBook, toggleSong } = usePlanLibraryToggles(books, songs);
  const { covers } = useAreaCovers();
  const metrics = usePlanSystemMetrics('month', month);
  const { goals: systemGoals, toggleGoal } = useSystemGoals();

  const goals = useMemo(() => getMonthGoalsSummary(month), [month]);
  const minutesOf = (ids: string[]) => minutesFrom(goals, ids);
  const unit = 'min mes';

  const booksById = useMemo(() => new Map(books.map(b => [b.id, b])), [books]);
  const songsById = useMemo(() => new Map(songs.map(s => [s.id, s])), [songs]);
  const projectsById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const subjectsById = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const topicsById = useMemo(() => new Map(topics.map(t => [t.id, t])), [topics]);
  const eventsById = useMemo(() => new Map(events.map(e => [e.id, e])), [events]);

  const bookRows: PlanObjectiveRow[] = (planData.books?.selected || []).flatMap(id => {
    const book = booksById.get(id);
    if (!book) return [];
    const done = isBookDone(id);
    return [{
      id,
      title: book.title,
      subtitle: book.author || undefined,
      cover: book.cover_image_url,
      emoji: '📖',
      tag: done ? 'Leído' : book.status === 'reading' ? 'Leyendo' : undefined,
      done,
      onToggle: () => toggleBook(id),
      createdAt: book.start_date,
      completedAt: book.finish_date,
      createdLabel: 'Inicio',
      completedLabel: 'Fin',
    }];
  });

  const songRows: PlanObjectiveRow[] = (planData.songs?.selected || []).flatMap(id => {
    const song = songsById.get(id);
    if (!song) return [];
    const plan = planData.songs_plan?.[id];
    return [{
      id,
      title: song.title,
      subtitle: [song.artist, song.instrument].filter(Boolean).join(' · ') || undefined,
      cover: song.cover_image_url,
      emoji: '🎹',
      tag: songTag(plan),
      done: isSongDone(id, plan),
      onToggle: () => toggleSong(id, plan),
      completedAt: plan === 'mastered'
        ? song.mastered_at
        : plan === 'recorded'
          ? song.recorded_at
          : song.learned_at,
      completedLabel: plan === 'mastered' ? 'Dominada' : plan === 'recorded' ? 'Grabada' : 'Aprendida',
    }];
  });

  const subjectRows: PlanObjectiveRow[] = (planData.subjects || []).flatMap(entry => {
    const subject = subjectsById.get(entry.subject_id);
    if (!subject) return [];
    const topicNames = (entry.topics || [])
      .map(id => topicsById.get(id)?.title)
      .filter(Boolean) as string[];
    return [{
      id: entry.subject_id,
      title: subject.name,
      subtitle: topicNames.slice(0, 3).join(' · ') || undefined,
      meta: topicNames.length > 0 ? `${topicNames.length} temas` : undefined,
      cover: subject.cover,
      emoji: '🎓',
    }];
  });

  const projectRows: PlanObjectiveRow[] = (planData.projects || []).flatMap(id => {
    const project = projectsById.get(id);
    return project ? [{ id, title: project.name, cover: project.cover_image, emoji: '📦' }] : [];
  });

  const eloGoal = Number(planData.chess?.elo_goal) || 0;
  const chessRows: PlanObjectiveRow[] = eloGoal > 0
    ? [{ id: 'elo-mes', title: `${eloGoal} ELO`, subtitle: 'Objetivo al cerrar el mes', emoji: '♟️' }]
    : [];

  const languageMonth = useMemo(() => readLanguageMonthPlans(planData.languages), [planData.languages]);
  const languageRows: PlanObjectiveRow[] = LANGUAGE_IDS.flatMap(lang => {
    const plan = languageMonth[lang];
    const hasContent = plan.milestone || plan.monthMinutes > 0 || plan.level;
    if (!hasContent) return [];
    return [{
      id: lang,
      title: LANGUAGE_LABELS[lang],
      subtitle: [plan.level, plan.milestone].filter(Boolean).join(' · ') || undefined,
      meta: plan.monthMinutes > 0 ? minutesLabel(plan.monthMinutes) : undefined,
      emoji: '🌍',
    }];
  });

  const gameMonth = useMemo(() => readGameMonthPlan(planData.game), [planData.game]);
  const gameRows: PlanObjectiveRow[] = (gameMonth.milestone || gameMonth.xpGoal > 0)
    ? [{
        id: 'game-mes',
        title: gameMonth.milestone || 'XP del mes',
        meta: gameMonth.xpGoal > 0 ? `${gameMonth.xpGoal} XP` : undefined,
        emoji: '🎮',
      }]
    : [];

  const personalGoalRows: PlanObjectiveRow[] = (planData.personal_goals || []).map((goal, index) => ({
    id: `goal-${index}`,
    title: goal.title,
    meta: goal.target || undefined,
    emoji: '🎯',
    createdAt: goal.createdAt,
    completedAt: goal.completedAt,
    done: !!goal.completedAt,
    onToggle: () => patchPlan(prev => {
      const now = new Date().toISOString();
      return {
        ...prev,
        personal_goals: (prev.personal_goals || []).map((g, i) =>
          i === index ? { ...g, completedAt: g.completedAt ? null : now } : g
        ),
      };
    }),
  }));

  const eventRows: PlanObjectiveRow[] = (planData.events || []).flatMap(id => {
    const event = eventsById.get(id);
    if (!event) return [];
    return [{
      id: event.id,
      title: event.title,
      subtitle: event.category || undefined,
      meta: dateLabel(event.event_date),
      emoji: '📅',
    }];
  });

  const taskList = taskRows(tasks, toggleTask, true);

  const itemsById: Record<string, PlanObjectiveRow[]> = {
    lectura: bookRows,
    musica: songRows,
    idiomas: languageRows,
    ajedrez: chessRows,
    game: gameRows,
    universidad: subjectRows,
    emprendimiento: [],
    proyectos: projectRows,
  };

  const plannedById: Record<string, number | undefined> = {
    lectura: minutesOf(['lectura']),
    musica: minutesOf(['musica']),
    idiomas: minutesOf(['ingles', 'italiano']),
    ajedrez: minutesOf(['ajedrez']),
    game: minutesOf(['game']),
    gym: minutesOf(['gym']),
    universidad: minutesOf(['universidad']),
    emprendimiento: minutesOf(['emprendimiento']),
    proyectos: minutesOf(['proyectos']),
  };

  const goalSplit = splitSystemGoals(
    systemGoals,
    format(month, 'yyyy-MM-dd'),
    format(endOfMonth(month), 'yyyy-MM-dd'),
    toggleGoal,
  );
  const mergedItemsById = mergeRows(itemsById, goalSplit.systems);

  const structuralAreas = buildPlanAreas(
    PLAN_STRUCTURAL_AREAS, metrics, covers, mergedItemsById, plannedById, unit, goalSplit.areas,
  );
  const centralAreas = buildPlanAreas(
    PLAN_CENTRAL_AREAS, metrics, covers, mergedItemsById, plannedById, unit, goalSplit.areas,
  );

  const periodo: PlanAreaCardData[] = [
    plainCard({ id: 'tareas', title: 'Tareas del mes', emoji: '✅', items: taskList }),
    plainCard({ id: 'metas', title: 'Metas personales', emoji: '🎯', items: personalGoalRows }),
    plainCard({ id: 'eventos', title: 'Eventos', emoji: '📅', items: eventRows }),
  ];

  const groups: PlanGroup[] = [
    { ...STRUCTURAL_GROUP, areas: structuralAreas },
    { ...CENTRAL_GROUP, areas: centralAreas },
    periodGroup('Plan del periodo', 'Tareas · metas personales · eventos', periodo),
  ];

  const empty = !groups.some(group =>
    (group.areas?.some(area => area.sections.some(section => section.cards.length > 0)) ?? false)
    || (group.cards?.some(isCardVisible) ?? false)
  );
  const monthTotal = ALL_HIERARCHY_AREAS.reduce((sum, area) => sum + (goals[area] || 0), 0);
  const loadingAll = loading || tasksLoading || metrics.loading;

  if (onlySystems) {
    return <PlanSystemCardsOnly groups={groups} scope="month" loading={loadingAll} />;
  }

  return (
    <PlanShell
      title="Planificación"
      subtitle={`Mes de ${format(month, 'MMMM yyyy', { locale: es })}`}
      editUrl={`/monthly-planning?month=${format(month, 'yyyy-MM')}`}
      empty={empty}
      loading={loadingAll}
      totalMinutes={monthTotal}
    >
      <PlanGroups groups={groups} scope="month" />
    </PlanShell>
  );
}

/* ------------------------------------------------------------------ */
/* SEMANA                                                              */
/* ------------------------------------------------------------------ */

function WeekPlanification({ anchorDate, onlySystems = false }: { anchorDate: Date; onlySystems?: boolean }) {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekKey = format(weekStart, 'yyyy-MM-dd');

  const { planData, patchPlan, loading } = useWeeklyPlan(weekStart);
  const month = startOfMonth(weekStart);
  const { planData: monthPlan, books, songs, projects, subjects } = useMonthlyPlan(month);
  const { tasks, toggleTask, loading: tasksLoading } = usePeriodPlanTasks(weekStart, weekEnd);
  const { isBookDone, isSongDone, toggleBook, toggleSong } = usePlanLibraryToggles(books, songs);
  const { covers } = useAreaCovers();
  const metrics = usePlanSystemMetrics('week', weekStart);
  const { goals: systemGoals, toggleGoal } = useSystemGoals();
  const entrepreneurshipIds = planData.areaFocus?.emprendimiento || [];
  const entrepreneurshipMeta = useEntrepreneurshipMeta(entrepreneurshipIds);

  const weekDist = monthPlan.week_distribution?.[weekKey];

  const weekGoals = useMemo(() => {
    const out: Record<string, number> = {};
    ALL_HIERARCHY_AREAS.forEach(area => { out[area] = getWeekGoalEffective(weekStart, area); });
    return out;
  }, [weekStart]);

  const minutesOf = (ids: string[]) => minutesFrom(weekGoals, ids);
  const unit = 'min sem.';

  const outcomesById = useMemo(
    () => new Map((planData.outcomes || []).map(o => [o.id, o])),
    [planData.outcomes],
  );

  const objectiveRows: PlanObjectiveRow[] = (planData.objectives || []).map((objective, index) => ({
    id: `objetivo-${index}`,
    title: objective,
    emoji: '🎯',
  }));

  const personalGoalRows: PlanObjectiveRow[] = (planData.personal_goals || []).map((goal, index) => ({
    id: `meta-${index}`,
    title: goal.title,
    meta: goal.target || undefined,
    emoji: '🎯',
    createdAt: goal.createdAt,
    completedAt: goal.completedAt,
    done: !!goal.completedAt,
    onToggle: () => patchPlan(prev => {
      const now = new Date().toISOString();
      return {
        ...prev,
        personal_goals: (prev.personal_goals || []).map((g, i) =>
          i === index ? { ...g, completedAt: g.completedAt ? null : now } : g
        ),
      };
    }),
  }));

  const outcomeRows: PlanObjectiveRow[] = (planData.outcomes || []).map(outcome => ({
    id: outcome.id,
    title: outcome.title,
    subtitle: outcome.successCriteria || undefined,
    tag: outcome.priority ? PRIORITY_TAG[outcome.priority] : undefined,
    emoji: '🏁',
    done: outcome.completed,
    createdAt: outcome.createdAt,
    completedAt: outcome.completedAt,
    onToggle: () => patchPlan(prev => {
      const now = new Date().toISOString();
      return {
        ...prev,
        outcomes: (prev.outcomes || []).map(o => {
          if (o.id !== outcome.id) return o;
          const completed = !o.completed;
          return { ...o, completed, completedAt: completed ? now : null };
        }),
      };
    }),
  }));

  const actionRows: PlanObjectiveRow[] = (planData.actions || []).map(action => ({
    id: action.id,
    title: action.title,
    subtitle: [
      action.assignedDay ? dateLabel(action.assignedDay) : undefined,
      action.area || undefined,
    ].filter(Boolean).join(' · ') || undefined,
    meta: action.estimatedMinutes ? minutesLabel(action.estimatedMinutes) : undefined,
    emoji: '⚡',
    done: action.completed,
    createdAt: action.createdAt,
    completedAt: action.completedAt,
    onToggle: () => patchPlan(prev => {
      const now = new Date().toISOString();
      return {
        ...prev,
        actions: (prev.actions || []).map(a => {
          if (a.id !== action.id) return a;
          const completed = !a.completed;
          return { ...a, completed, completedAt: completed ? now : null };
        }),
      };
    }),
  }));

  /** Focos semanales + resultado al que apunta un área de construcción. */
  const focusRows = (
    areaId: string,
    ids: string[],
    resolve: (id: string) => { title: string; cover?: string | null } | undefined,
    emoji: string,
  ): PlanObjectiveRow[] => {
    const rows: PlanObjectiveRow[] = ids.flatMap(id => {
      const info = resolve(id);
      return info ? [{ id: `${areaId}-focus-${id}`, title: info.title, cover: info.cover, emoji }] : [];
    });
    const rawResult = planData.areaResults?.[areaId];
    if (rawResult) {
      const outcome = outcomesById.get(rawResult);
      rows.unshift({
        id: `${areaId}-result`,
        title: outcome?.title ?? rawResult,
        subtitle: 'Resultado de la semana',
        emoji: '🏁',
        // Marcar el resultado en Planificación cuenta como objetivo del sistema.
        done: outcome?.completed,
        createdAt: outcome?.createdAt,
        completedAt: outcome?.completedAt,
        onToggle: outcome
          ? () => patchPlan(prev => {
              const now = new Date().toISOString();
              return {
                ...prev,
                outcomes: (prev.outcomes || []).map(o => {
                  if (o.id !== rawResult) return o;
                  const completed = !o.completed;
                  return { ...o, completed, completedAt: completed ? now : null };
                }),
              };
            })
          : undefined,
      });
    }
    return rows;
  };

  const subjectsById = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const projectsById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const universityRows = focusRows(
    'universidad',
    planData.areaFocus?.universidad || [],
    id => {
      const subject = subjectsById.get(id);
      return subject ? { title: subject.name, cover: subject.cover } : undefined;
    },
    '🎓',
  );
  const entrepreneurshipNamesRows = focusRows(
    'emprendimiento',
    entrepreneurshipIds,
    id => {
      const item = entrepreneurshipMeta[id];
      return item ? { title: item.name, cover: item.cover } : undefined;
    },
    '🚀',
  );
  const projectRows = focusRows(
    'proyectos',
    planData.areaFocus?.proyectos || [],
    id => {
      const project = projectsById.get(id);
      return project ? { title: project.name, cover: project.cover_image } : undefined;
    },
    '📦',
  );

  const booksById = useMemo(() => new Map(books.map(b => [b.id, b])), [books]);
  const songsById = useMemo(() => new Map(songs.map(s => [s.id, s])), [songs]);

  // Solo los objetivos de ESTA semana (el reparto semanal), no los del mes.
  const weekBookIds = useMemo(
    () => effectiveWeekBookIds(weekDist?.books, planData.weekBookId, monthPlan.books?.selected || [], booksById),
    [weekDist, planData.weekBookId, monthPlan.books, booksById],
  );

  const weekSongIds = useMemo(() => {
    const ids = [...(weekDist?.songs || [])];
    const extras = [weekDist?.learning_song_id, weekDist?.mastering_song_id, planData.learningSongId, planData.masteringSongId];
    extras.forEach(id => { if (id && !ids.includes(id)) ids.unshift(id); });
    return ids;
  }, [weekDist, planData]);

  const planTypeFor = (id: string): SongPlanTypeLite => {
    if (id === weekDist?.learning_song_id) return 'learned';
    if (id === weekDist?.mastering_song_id) return 'mastered';
    return monthPlan.songs_plan?.[id];
  };

  const bookRows: PlanObjectiveRow[] = weekBookIds.flatMap(id => {
    const book = booksById.get(id);
    if (!book) return [];
    const done = isBookDone(id);
    return [{
      id,
      title: book.title,
      subtitle: book.author || undefined,
      cover: book.cover_image_url,
      emoji: '📖',
      tag: done ? 'Leído' : book.status === 'reading' ? 'Leyendo' : undefined,
      done,
      onToggle: () => toggleBook(id),
      createdAt: book.start_date,
      completedAt: book.finish_date,
      createdLabel: 'Inicio',
      completedLabel: 'Fin',
    }];
  });

  const songRows: PlanObjectiveRow[] = weekSongIds.flatMap(id => {
    const song = songsById.get(id);
    if (!song) return [];
    const plan = planTypeFor(id);
    return [{
      id,
      title: song.title,
      subtitle: [song.artist, song.instrument].filter(Boolean).join(' · ') || undefined,
      cover: song.cover_image_url,
      emoji: '🎹',
      tag: songTag(plan),
      done: isSongDone(id, plan),
      onToggle: () => toggleSong(id, plan),
      completedAt: plan === 'mastered'
        ? song.mastered_at
        : plan === 'recorded'
          ? song.recorded_at
          : song.learned_at,
      completedLabel: plan === 'mastered' ? 'Dominada' : plan === 'recorded' ? 'Grabada' : 'Aprendida',
    }];
  });

  const eloStart = Number(planData.chessEloStart) || Number(weekDist?.elo_start) || 0;
  const eloTarget = Number(planData.chessEloTarget) || Number(weekDist?.elo_target) || 0;
  const chessRows: PlanObjectiveRow[] = eloTarget > 0
    ? [{
        id: 'elo-sem',
        title: `${eloTarget} ELO`,
        subtitle: eloStart > 0 && eloStart !== eloTarget ? `${eloStart} → ${eloTarget}` : 'Objetivo de la semana',
        emoji: '♟️',
      }]
    : [];

  const languageWeek = useMemo(() => readLanguageWeekPlans(planData.languages), [planData.languages]);
  const languageRows: PlanObjectiveRow[] = LANGUAGE_IDS.flatMap(lang => {
    const plan = languageWeek[lang];
    if (!plan.focusSkill && !plan.challenge && !plan.minutesTarget) return [];
    return [{
      id: lang,
      title: LANGUAGE_LABELS[lang],
      subtitle: [plan.focusSkill, plan.challenge].filter(Boolean).join(' · ') || undefined,
      meta: plan.minutesTarget > 0 ? minutesLabel(plan.minutesTarget) : undefined,
      emoji: '🌍',
    }];
  });

  const gameWeek = useMemo(() => readGameWeekPlan(planData.game), [planData.game]);
  const gameRows: PlanObjectiveRow[] = (gameWeek.focusSkill || gameWeek.challenge || gameWeek.xpTarget > 0)
    ? [{
        id: 'game-sem',
        title: gameWeek.focusSkill || 'Game',
        subtitle: gameWeek.challenge || undefined,
        meta: gameWeek.xpTarget > 0 ? `${gameWeek.xpTarget} XP` : undefined,
        emoji: '🎮',
      }]
    : [];

  const taskList = taskRows(tasks, toggleTask, true);

  const itemsById: Record<string, PlanObjectiveRow[]> = {
    lectura: bookRows,
    musica: songRows,
    idiomas: languageRows,
    ajedrez: chessRows,
    game: gameRows,
    universidad: universityRows,
    emprendimiento: entrepreneurshipNamesRows,
    proyectos: projectRows,
  };

  const plannedById: Record<string, number | undefined> = {
    lectura: minutesOf(['lectura']),
    musica: minutesOf(['musica']),
    idiomas: minutesOf(['ingles', 'italiano']),
    ajedrez: minutesOf(['ajedrez']),
    game: minutesOf(['game']),
    gym: minutesOf(['gym']),
    universidad: minutesOf(['universidad']),
    emprendimiento: minutesOf(['emprendimiento']),
    proyectos: minutesOf(['proyectos']),
  };

  const goalSplit = splitSystemGoals(
    systemGoals,
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd'),
    toggleGoal,
  );
  const mergedItemsById = mergeRows(itemsById, goalSplit.systems);

  const structuralAreas = buildPlanAreas(
    PLAN_STRUCTURAL_AREAS, metrics, covers, mergedItemsById, plannedById, unit, goalSplit.areas,
  );
  const centralAreas = buildPlanAreas(
    PLAN_CENTRAL_AREAS, metrics, covers, mergedItemsById, plannedById, unit, goalSplit.areas,
  );

  const periodo: PlanAreaCardData[] = [
    plainCard({ id: 'objetivos', title: 'Objetivos', emoji: '🎯', items: objectiveRows }),
    plainCard({ id: 'resultados', title: 'Resultados', emoji: '🏁', items: outcomeRows }),
    plainCard({ id: 'acciones', title: 'Acciones', emoji: '⚡', items: actionRows }),
    plainCard({ id: 'metas', title: 'Metas personales', emoji: '🎯', items: personalGoalRows }),
    plainCard({ id: 'tareas', title: 'Tareas de la semana', emoji: '✅', items: taskList }),
  ];

  const groups: PlanGroup[] = [
    { ...STRUCTURAL_GROUP, areas: structuralAreas },
    { ...CENTRAL_GROUP, areas: centralAreas },
    periodGroup('Plan del periodo', 'Objetivos · resultados · acciones · metas · tareas', periodo),
  ];

  const empty = !groups.some(group =>
    (group.areas?.some(area => area.sections.some(section => section.cards.length > 0)) ?? false)
    || (group.cards?.some(isCardVisible) ?? false)
  );
  const weekTotal = ALL_HIERARCHY_AREAS.reduce((sum, area) => sum + (weekGoals[area] || 0), 0);
  const loadingAll = loading || tasksLoading || metrics.loading;

  if (onlySystems) {
    return <PlanSystemCardsOnly groups={groups} scope="week" loading={loadingAll} />;
  }

  return (
    <PlanShell
      title="Planificación"
      subtitle={`Semana del ${format(weekStart, 'd MMM', { locale: es })} al ${format(weekEnd, 'd MMM', { locale: es })}`}
      editUrl={`/weekly-planning?week=${weekKey}`}
      empty={empty}
      loading={loadingAll}
      totalMinutes={weekTotal}
    >
      <PlanGroups groups={groups} scope="week" />
    </PlanShell>
  );
}

/* ------------------------------------------------------------------ */
/* DÍA                                                                 */
/* ------------------------------------------------------------------ */

function DayPlanification({ anchorDate, onlySystems = false }: { anchorDate: Date; onlySystems?: boolean }) {
  const {
    blocks, tasks, tasksByBlock, planGoals, planIntensity, planSpeedPlan,
    planRoutineType, planLoaded, tasksLoading,
    toggleTaskDone, toggleBlockComplete, isBlockCompleted,
  } = useDailyPlanData(anchorDate);

  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekKey = format(weekStart, 'yyyy-MM-dd');
  const { planData: weekPlan, patchPlan, loading: weekLoading } = useWeeklyPlan(weekStart);
  // El reparto semanal vive en el mes de la semana, no en el mes del día.
  const { planData: monthPlan, books, songs, projects, subjects, loading: monthLoading } = useMonthlyPlan(startOfMonth(weekStart));
  const { isBookDone, isSongDone, toggleBook, toggleSong } = usePlanLibraryToggles(books, songs);
  const { covers } = useAreaCovers();
  const metrics = usePlanSystemMetrics('day', anchorDate);
  const { goals: systemGoals, toggleGoal } = useSystemGoals();

  const dayGoals = useMemo(() => {
    const out: Record<string, number> = {};
    ALL_HIERARCHY_AREAS.forEach(area => {
      out[area] = Math.max(0, planGoals?.[area] || getDayGoalEffective(anchorDate, area));
    });
    return out;
  }, [anchorDate, planGoals]);

  const minutesOf = (id: string) => Math.max(0, Math.round(Number(dayGoals[id]) || 0));
  const unit = 'min día';
  const dayTotal = getDayGoalTotal(anchorDate, planGoals);
  const speedRows: PlanObjectiveRow[] = planSpeedPlan
    ? summarizeSpeedPlan(planSpeedPlan, blocks).doses
        .filter(dose => dose.plannedMinutes > 0)
        .map(dose => ({
          id: dose.systemId,
          title: dose.name,
          tag: doseLabel(dose),
          meta: `${dose.plannedMinutes} min`,
          emoji: '⚡',
        }))
    : [];
  const intensity = speedRows.length > 0 ? speedRows : intensityRows(planIntensity);

  const blockTitleByTaskId = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(tasksByBlock || {}).forEach(([blockId, blockTasks]) => {
      const title = blocks.find(b => b.id === blockId)?.title;
      if (!title) return;
      blockTasks.forEach(t => map.set(t.id, title));
    });
    return map;
  }, [tasksByBlock, blocks]);

  const blockRows: PlanObjectiveRow[] = blocks.map(block => {
    const blockTasks = tasksByBlock[block.id] || [];
    const done = blockTasks.filter(t => t.completed).length;
    return {
      id: block.id,
      title: block.title,
      subtitle: [block.startTime, block.endTime].filter(Boolean).join(' – ') || undefined,
      meta: blockTasks.length > 0 ? `${done}/${blockTasks.length} tareas` : undefined,
      emoji: '🕒',
      done: isBlockCompleted(block.id),
      onToggle: () => toggleBlockComplete(block.id, blockTasks.length),
    };
  });

  const dayTaskRows: PlanObjectiveRow[] = tasks.map(task => ({
    id: task.id,
    title: task.title,
    subtitle: blockTitleByTaskId.get(task.id) || task.sourceName || undefined,
    emoji: '✅',
    done: task.completed,
    onToggle: () => toggleTaskDone(task.id),
  }));

  // El día se trabaja con el objetivo de la SEMANA (no con el del mes).
  const weekDist = monthPlan.week_distribution?.[weekKey];

  const booksById = useMemo(() => new Map(books.map(b => [b.id, b])), [books]);
  const songsById = useMemo(() => new Map(songs.map(s => [s.id, s])), [songs]);
  const subjectsById = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const projectsById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const outcomesById = useMemo(
    () => new Map((weekPlan.outcomes || []).map(o => [o.id, o])),
    [weekPlan.outcomes],
  );

  const entrepreneurshipIds = weekPlan.areaFocus?.emprendimiento || [];
  const entrepreneurshipMeta = useEntrepreneurshipMeta(entrepreneurshipIds);

  const weekBookIds = useMemo(
    () => effectiveWeekBookIds(weekDist?.books, weekPlan.weekBookId, monthPlan.books?.selected || [], booksById),
    [weekDist, weekPlan.weekBookId, monthPlan.books, booksById],
  );

  const weekSongIds = useMemo(() => {
    const ids = [...(weekDist?.songs || [])];
    const extras = [weekDist?.learning_song_id, weekDist?.mastering_song_id, weekPlan.learningSongId, weekPlan.masteringSongId];
    extras.forEach(id => { if (id && !ids.includes(id)) ids.unshift(id); });
    return ids;
  }, [weekDist, weekPlan]);

  const planTypeFor = (id: string): SongPlanTypeLite => {
    if (id === weekDist?.learning_song_id) return 'learned';
    if (id === weekDist?.mastering_song_id) return 'mastered';
    return monthPlan.songs_plan?.[id];
  };

  const readingRows: PlanObjectiveRow[] = weekBookIds.flatMap(id => {
    const book = booksById.get(id);
    if (!book) return [];
    const done = isBookDone(id);
    return [{
      id,
      title: book.title,
      subtitle: book.author || undefined,
      cover: book.cover_image_url,
      emoji: '📖',
      tag: done ? 'Leído' : book.status === 'reading' ? 'Leyendo' : undefined,
      done,
      onToggle: () => toggleBook(id),
      createdAt: book.start_date,
      completedAt: book.finish_date,
      createdLabel: 'Inicio',
      completedLabel: 'Fin',
    }];
  });

  const musicRows: PlanObjectiveRow[] = weekSongIds.flatMap(id => {
    const song = songsById.get(id);
    if (!song) return [];
    const plan = planTypeFor(id);
    return [{
      id,
      title: song.title,
      subtitle: [song.artist, song.instrument].filter(Boolean).join(' · ') || undefined,
      cover: song.cover_image_url,
      emoji: '🎹',
      tag: songTag(plan),
      done: isSongDone(id, plan),
      onToggle: () => toggleSong(id, plan),
      completedAt: plan === 'mastered'
        ? song.mastered_at
        : plan === 'recorded'
          ? song.recorded_at
          : song.learned_at,
      completedLabel: plan === 'mastered' ? 'Dominada' : plan === 'recorded' ? 'Grabada' : 'Aprendida',
    }];
  });

  /** Focos de la semana en un área + resultado al que apunta. */
  const focusRows = (
    areaId: string,
    ids: string[],
    resolve: (id: string) => { title: string; cover?: string | null } | undefined,
    emoji: string,
  ): PlanObjectiveRow[] => {
    const rows: PlanObjectiveRow[] = ids.flatMap(id => {
      const info = resolve(id);
      return info ? [{ id: `${areaId}-focus-${id}`, title: info.title, cover: info.cover, emoji }] : [];
    });
    const rawResult = weekPlan.areaResults?.[areaId];
    if (rawResult) {
      const outcome = outcomesById.get(rawResult);
      rows.unshift({
        id: `${areaId}-result`,
        title: outcome?.title ?? rawResult,
        subtitle: 'Resultado de la semana',
        emoji: '🏁',
        // Marcar el resultado en Planificación cuenta como objetivo del sistema.
        done: outcome?.completed,
        createdAt: outcome?.createdAt,
        completedAt: outcome?.completedAt,
        onToggle: outcome
          ? () => patchPlan(prev => {
              const now = new Date().toISOString();
              return {
                ...prev,
                outcomes: (prev.outcomes || []).map(o => {
                  if (o.id !== rawResult) return o;
                  const completed = !o.completed;
                  return { ...o, completed, completedAt: completed ? now : null };
                }),
              };
            })
          : undefined,
      });
    }
    return rows;
  };

  const subjectRows = focusRows(
    'universidad',
    weekPlan.areaFocus?.universidad || [],
    id => {
      const subject = subjectsById.get(id);
      return subject ? { title: subject.name, cover: subject.cover } : undefined;
    },
    '🎓',
  );
  const entrepreneurshipRows = focusRows(
    'emprendimiento',
    entrepreneurshipIds,
    id => {
      const item = entrepreneurshipMeta[id];
      return item ? { title: item.name, cover: item.cover } : undefined;
    },
    '🚀',
  );
  const projectRows = focusRows(
    'proyectos',
    weekPlan.areaFocus?.proyectos || [],
    id => {
      const project = projectsById.get(id);
      return project ? { title: project.name, cover: project.cover_image } : undefined;
    },
    '📦',
  );

  const eloStart = Number(weekPlan.chessEloStart) || Number(weekDist?.elo_start) || 0;
  const eloTarget = Number(weekPlan.chessEloTarget) || Number(weekDist?.elo_target) || 0;
  const chessRows: PlanObjectiveRow[] = eloTarget > 0
    ? [{
        id: 'elo-sem',
        title: `${eloTarget} ELO`,
        subtitle: eloStart > 0 && eloStart !== eloTarget ? `${eloStart} → ${eloTarget}` : 'Objetivo de la semana',
        emoji: '♟️',
      }]
    : [];

  const languageWeek = useMemo(() => readLanguageWeekPlans(weekPlan.languages), [weekPlan.languages]);
  const languageRows: PlanObjectiveRow[] = LANGUAGE_IDS.flatMap(lang => {
    const plan = languageWeek[lang];
    if (!plan.focusSkill && !plan.challenge && !plan.minutesTarget) return [];
    return [{
      id: lang,
      title: LANGUAGE_LABELS[lang],
      subtitle: [plan.focusSkill, plan.challenge].filter(Boolean).join(' · ') || undefined,
      meta: plan.minutesTarget > 0 ? minutesLabel(plan.minutesTarget) : undefined,
      emoji: '🌍',
    }];
  });

  const gameWeek = useMemo(() => readGameWeekPlan(weekPlan.game), [weekPlan.game]);
  const gameRows: PlanObjectiveRow[] = (gameWeek.focusSkill || gameWeek.challenge || gameWeek.xpTarget > 0)
    ? [{
        id: 'game-sem',
        title: gameWeek.focusSkill || 'Game',
        subtitle: gameWeek.challenge || undefined,
        meta: gameWeek.xpTarget > 0 ? `${gameWeek.xpTarget} XP` : undefined,
        emoji: '🎮',
      }]
    : [];

  const itemsById: Record<string, PlanObjectiveRow[]> = {
    lectura: readingRows,
    musica: musicRows,
    idiomas: languageRows,
    ajedrez: chessRows,
    game: gameRows,
    universidad: subjectRows,
    emprendimiento: entrepreneurshipRows,
    proyectos: projectRows,
  };

  const plannedById: Record<string, number | undefined> = {
    lectura: minutesOf('lectura'),
    musica: minutesOf('musica'),
    idiomas: minutesOf('ingles') + minutesOf('italiano'),
    ajedrez: minutesOf('ajedrez'),
    game: minutesOf('game'),
    gym: minutesOf('gym'),
    universidad: minutesOf('universidad'),
    emprendimiento: minutesOf('emprendimiento'),
    proyectos: minutesOf('proyectos'),
  };

  const goalSplit = splitSystemGoals(
    systemGoals,
    format(anchorDate, 'yyyy-MM-dd'),
    format(anchorDate, 'yyyy-MM-dd'),
    toggleGoal,
  );
  const mergedItemsById = mergeRows(itemsById, goalSplit.systems);

  const structuralAreas = buildPlanAreas(
    PLAN_STRUCTURAL_AREAS, metrics, covers, mergedItemsById, plannedById, unit, goalSplit.areas,
  );
  const centralAreas = buildPlanAreas(
    PLAN_CENTRAL_AREAS, metrics, covers, mergedItemsById, plannedById, unit, goalSplit.areas,
  );

  const periodo: PlanAreaCardData[] = [
    plainCard({ id: 'bloques', title: 'Bloques del día', emoji: '🕒', items: blockRows }),
    plainCard({ id: 'tareas', title: 'Tareas del día', emoji: '✅', items: dayTaskRows }),
    plainCard({ id: 'intensidad', title: 'Intensidad de sistemas', emoji: '⚡', items: intensity }),
  ];

  const groups: PlanGroup[] = [
    { ...STRUCTURAL_GROUP, areas: structuralAreas },
    { ...CENTRAL_GROUP, areas: centralAreas },
    periodGroup('Plan del día', 'Bloques · tareas · intensidad', periodo),
  ];

  const empty = !groups.some(group =>
    (group.areas?.some(area => area.sections.some(section => section.cards.length > 0)) ?? false)
    || (group.cards?.some(isCardVisible) ?? false)
  );

  const routineLabel = planRoutineType ? ` · Rutina: ${planRoutineType}` : '';
  const editUrl = isToday(anchorDate) ? '/plan-manana?mode=hoy' : '/plan-manana';
  const loadingAll = tasksLoading || weekLoading || monthLoading || !planLoaded || metrics.loading;

  if (onlySystems) {
    return <PlanSystemCardsOnly groups={groups} scope="day" loading={loadingAll} />;
  }

  return (
    <PlanShell
      title="Planificación"
      subtitle={`${format(anchorDate, "EEEE d 'de' MMMM", { locale: es })}${routineLabel}`}
      editUrl={editUrl}
      empty={empty}
      loading={loadingAll}
      totalMinutes={dayTotal}
    >
      <PlanGroups groups={groups} scope="day" />
    </PlanShell>
  );
}
