import { useState, type FormEvent } from 'react';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { coverKey, useAreaCovers } from '@/hooks/useAreaCovers';
import {
  usePlanSystemMetrics,
  type PlanSystemMetricsResult,
} from '@/hooks/usePlanSystemMetrics';
import {
  useDayWeekSystemObjectives,
  useMonthSystemObjectives,
  useQuarterSystemObjectives,
  useYearSystemObjectives,
  type ExistingSystemObjectives,
} from '@/hooks/usePlanObjectivesBySystem';
import { useSomedayGoals } from '@/hooks/useSomedayGoals';
import { useSystemGoals } from '@/hooks/useSystemGoals';
import {
  PlanAreaCard,
  type PlanAreaCardData,
  type PlanObjectiveRow,
} from '@/components/planificacion/PlanAreaCard';
import { PhotoSectionsPanel } from '@/components/vision/PhotoSectionsPanel';
import { PronosticoSistemasPanel } from '@/components/metas/PronosticoSistemasPanel';
import {
  PLAN_SYSTEM_META,
  type PlanificationScope,
} from '@/lib/planSystems';
import {
  METAS_SYSTEM_BY_ID,
  METAS_SYSTEM_GROUPS,
  METAS_SYSTEMS,
  defaultGoalDate,
  formatGoalDate,
  goalPeriodLabel,
  goalPeriodRange,
  shiftGoalPeriod,
  type MetaSystemDef,
  type MetaSystemGroup,
  type MetasScope,
} from '@/lib/metasSistemas';
import {
  goalsInDateRange,
  type SystemGoal,
} from '@/lib/systemGoals';
import {
  categoryForSystem,
  type DreamItem,
  type DreamPriority,
} from '@/lib/somedayGoals';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Catálogo de la vista
// ---------------------------------------------------------------------------

const SCOPES: Array<{ id: MetasScope; label: string }> = [
  { id: 'day', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'year', label: 'Año' },
  { id: 'forecast', label: 'Pronóstico' },
  { id: 'someday', label: 'Algún día' },
  { id: 'vision', label: 'Visión' },
];

const DREAM_CATEGORIES = [
  { id: 'viajes', label: 'Viajar', emoji: '✈️' },
  { id: 'experiencias', label: 'Experiencias', emoji: '🏔️' },
  { id: 'aprender', label: 'Aprender', emoji: '📚' },
  { id: 'comprar', label: 'Tener / Comprar', emoji: '🎁' },
  { id: 'crear', label: 'Crear / Hacer', emoji: '🎨' },
  { id: 'comida', label: 'Probar / Comer', emoji: '🍜' },
  { id: 'musica', label: 'Música', emoji: '🎵' },
  { id: 'deportes', label: 'Deportes / Aventura', emoji: '🏄' },
  { id: 'otros', label: 'Otros', emoji: '💭' },
];

const DREAM_CATEGORY_BY_ID = Object.fromEntries(
  DREAM_CATEGORIES.map(category => [category.id, category]),
);

const DREAM_PRIORITIES: Array<{ id: DreamPriority; label: string }> = [
  { id: 'low', label: 'Normal' },
  { id: 'medium', label: 'Importante' },
  { id: 'high', label: 'Imprescindible' },
];

const GRID_CLASS = 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4';

const capitalizeFirst = (value: string) =>
  value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;

// ---------------------------------------------------------------------------
// Tipos de la página
// ---------------------------------------------------------------------------

type MetasDialogState =
  | { kind: 'goal'; mode: 'create'; systemId: string; date: string }
  | { kind: 'goal'; mode: 'edit'; goal: SystemGoal }
  | { kind: 'dream'; mode: 'create'; systemId: string | null }
  | { kind: 'dream'; mode: 'edit'; item: DreamItem };

interface SharedCardsProps {
  covers: Record<string, string>;
  onAdd: (systemId: string | null) => void;
  onToggleGoal: (id: string) => void;
  onEditGoal: (goal: SystemGoal) => void;
  onDeleteGoal: (goal: SystemGoal) => void;
}

interface DatedContentProps extends SharedCardsProps {
  scope: PlanificationScope;
  anchor: Date;
  goals: SystemGoal[];
}

interface DatedCardsProps extends DatedContentProps {
  objectives: ExistingSystemObjectives;
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function MetasSistemas() {
  const [scope, setScope] = useState<MetasScope>('month');
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [dialog, setDialog] = useState<MetasDialogState | null>(null);

  const { covers } = useAreaCovers();
  const { goals, addGoal, updateGoal, removeGoal, toggleGoal } = useSystemGoals();
  const {
    items: dreams,
    addItem: addDream,
    updateItem: updateDream,
    removeItem: removeDream,
    toggleItem: toggleDream,
  } = useSomedayGoals();

  const range = scope === 'someday' || scope === 'vision' || scope === 'forecast'
    ? null
    : goalPeriodRange(scope, anchor);
  const periodGoals = range ? goalsInDateRange(goals, range.startKey, range.endKey) : [];
  const completedGoals = periodGoals.filter(goal => goal.completed).length;
  const completedDreams = dreams.filter(item => item.completed).length;

  const openCreate = (systemId: string | null) => {
    if (scope === 'forecast') return;
    if (scope === 'someday' || scope === 'vision') {
      setDialog({ kind: 'dream', mode: 'create', systemId });
      return;
    }
    if (!systemId) return;
    setDialog({
      kind: 'goal',
      mode: 'create',
      systemId,
      date: defaultGoalDate(scope, anchor),
    });
  };

  const editGoal = (goal: SystemGoal) => setDialog({ kind: 'goal', mode: 'edit', goal });
  const deleteGoal = (goal: SystemGoal) => {
    if (!window.confirm(`¿Eliminar la meta "${goal.title}"?`)) return;
    removeGoal(goal.id);
    setDialog(null);
    toast.success('Meta eliminada');
  };

  const editDream = (item: DreamItem) => setDialog({ kind: 'dream', mode: 'edit', item });
  const deleteDream = (item: DreamItem) => {
    if (!window.confirm(`¿Eliminar "${item.title}" de Algún Día?`)) return;
    removeDream(item.id);
    setDialog(null);
    toast.success('Sueño eliminado');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 pt-20 pb-24 md:p-6 md:pt-20">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">Metas Sistemas</h1>
                <p className="text-xs text-muted-foreground">
                  Todas las metas y objetivos de tus sistemas, unificados por periodo.
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {scope === 'vision' ? (
                <>
                  <SummaryChip label="Secciones para fotos" tone="primary" />
                  <SummaryChip label="Compartido con Daily → Dirección" tone="green" />
                </>
              ) : scope === 'forecast' ? (
                <>
                  <SummaryChip label={`${METAS_SYSTEMS.length} sistemas`} tone="primary" />
                  <SummaryChip label="Pronóstico de resultados" tone="green" />
                  <SummaryChip label="Se recalcula solo" tone="amber" />
                </>
              ) : scope === 'someday' ? (
                <>
                  <SummaryChip label={`${dreams.length} sueños`} tone="primary" />
                  <SummaryChip label={`${completedDreams} cumplidos`} tone="green" />
                  <SummaryChip label={`${dreams.length - completedDreams} pendientes`} tone="amber" />
                </>
              ) : (
                <>
                  <SummaryChip label={`${periodGoals.length} metas`} tone="primary" />
                  <SummaryChip label={`${completedGoals} cumplidas`} tone="green" />
                  <SummaryChip
                    label={`${periodGoals.length - completedGoals} pendientes`}
                    tone="amber"
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end">
            <ScopeSwitch value={scope} onChange={setScope} />
            <p className="text-[11px] text-muted-foreground">
              {scope === 'vision'
                ? 'El mismo bloque de fotos que Daily → Dirección.'
                : scope === 'forecast'
                  ? 'Fecha estimada, rango y estado frente a la meta de cada sistema.'
                  : scope === 'someday'
                    ? 'Sueños sin fecha, compartidos con la página Algún Día.'
                    : 'Cada meta aparece solo en su fecha exacta.'}
            </p>
          </div>
        </header>

        <PeriodToolbar
          scope={scope}
          anchor={anchor}
          goalCount={periodGoals.length}
          completedCount={completedGoals}
          dreamCount={dreams.length}
          completedDreams={completedDreams}
          onShift={direction => setAnchor(previous => shiftGoalPeriod(scope, previous, direction))}
          onToday={() => setAnchor(new Date())}
        />

        {scope === 'someday' ? (
          <SomedayView
            items={dreams}
            covers={covers}
            onAdd={openCreate}
            onToggle={toggleDream}
            onEdit={editDream}
            onDelete={deleteDream}
          />
        ) : scope === 'vision' ? (
          <PhotoSectionsPanel />
        ) : scope === 'forecast' ? (
          <PronosticoSistemasPanel goals={goals} />
        ) : (
          <DatedMetasView
            scope={scope}
            anchor={anchor}
            goals={goals}
            covers={covers}
            onAdd={openCreate}
            onToggleGoal={toggleGoal}
            onEditGoal={editGoal}
            onDeleteGoal={deleteGoal}
          />
        )}
      </div>

      {dialog?.kind === 'goal' && (
        <SystemGoalDialog
          key={dialog.mode === 'edit'
            ? `goal-edit-${dialog.goal.id}`
            : `goal-new-${dialog.systemId}-${dialog.date}`}
          mode={dialog.mode}
          systemLabel={
            METAS_SYSTEM_BY_ID[dialog.mode === 'edit' ? dialog.goal.systemId : dialog.systemId]?.label
            ?? 'Sistema'
          }
          initialTitle={dialog.mode === 'edit' ? dialog.goal.title : ''}
          initialObjective={dialog.mode === 'edit' ? dialog.goal.objective ?? '' : ''}
          initialDate={dialog.mode === 'edit' ? dialog.goal.date : dialog.date}
          onClose={() => setDialog(null)}
          onDelete={dialog.mode === 'edit' ? () => deleteGoal(dialog.goal) : undefined}
          onSave={values => {
            if (dialog.mode === 'create') {
              addGoal({ systemId: dialog.systemId, ...values });
              toast.success('Meta añadida');
            } else {
              updateGoal(dialog.goal.id, values);
              toast.success('Meta actualizada');
            }
            setDialog(null);
          }}
        />
      )}

      {dialog?.kind === 'dream' && (
        <DreamDialog
          key={dialog.mode === 'edit' ? `dream-edit-${dialog.item.id}` : `dream-new-${dialog.systemId ?? 'general'}`}
          mode={dialog.mode}
          systemLabel={
            dialog.mode === 'edit'
              ? (dialog.item.systemId ? METAS_SYSTEM_BY_ID[dialog.item.systemId]?.label ?? 'Algún Día' : 'Algún Día')
              : (dialog.systemId ? METAS_SYSTEM_BY_ID[dialog.systemId]?.label ?? 'Algún Día' : 'Algún Día general')
          }
          initialTitle={dialog.mode === 'edit' ? dialog.item.title : ''}
          initialDescription={dialog.mode === 'edit' ? dialog.item.description : ''}
          initialCategory={
            dialog.mode === 'edit'
              ? dialog.item.category
              : categoryForSystem(dialog.systemId ?? '')
          }
          initialPriority={dialog.mode === 'edit' ? dialog.item.priority : 'medium'}
          onClose={() => setDialog(null)}
          onDelete={dialog.mode === 'edit' ? () => deleteDream(dialog.item) : undefined}
          onSave={values => {
            if (dialog.mode === 'create') {
              addDream({
                title: values.title,
                description: values.description,
                category: values.category,
                priority: values.priority,
                systemId: dialog.systemId,
              });
              toast.success('Sueño añadido a Algún Día');
            } else {
              updateDream(dialog.item.id, values);
              toast.success('Sueño actualizado');
            }
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cabecera y selector de periodo
// ---------------------------------------------------------------------------

function ScopeSwitch({
  value,
  onChange,
}: {
  value: MetasScope;
  onChange: (scope: MetasScope) => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-0.5 rounded-2xl border border-border/60 bg-muted/40 p-1">
      {SCOPES.map(scope => (
        <button
          key={scope.id}
          type="button"
          onClick={() => onChange(scope.id)}
          className={cn(
            'rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition-all',
            value === scope.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={value === scope.id}
        >
          {scope.label}
        </button>
      ))}
    </div>
  );
}

function SummaryChip({
  label,
  tone,
}: {
  label: string;
  tone: 'primary' | 'green' | 'amber';
}) {
  const toneClass = tone === 'green'
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    : tone === 'amber'
      ? 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
      : 'border-primary/25 bg-primary/10 text-primary';

  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums', toneClass)}>
      {label}
    </span>
  );
}

function PeriodToolbar({
  scope,
  anchor,
  goalCount,
  completedCount,
  dreamCount,
  completedDreams,
  onShift,
  onToday,
}: {
  scope: MetasScope;
  anchor: Date;
  goalCount: number;
  completedCount: number;
  dreamCount: number;
  completedDreams: number;
  onShift: (direction: -1 | 1) => void;
  onToday: () => void;
}) {
  if (scope === 'someday') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/50 bg-white/70 px-3 py-2 shadow-sm dark:bg-zinc-950/60">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">Sueños sin fecha</span>
          <span className="text-[10px] text-muted-foreground">
            {dreamCount} sueños · {completedDreams} cumplidos
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Los mismos registros de la página Algún Día
        </span>
      </div>
    );
  }

  if (scope === 'vision') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/50 bg-white/70 px-3 py-2 shadow-sm dark:bg-zinc-950/60">
        <div className="flex items-center gap-1.5">
          <ImagePlus className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">Visión</span>
          <span className="text-[10px] text-muted-foreground">Secciones para fotos</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Mismo contenido que Daily → Dirección
        </span>
      </div>
    );
  }

  if (scope === 'forecast') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/50 bg-white/70 px-3 py-2 shadow-sm dark:bg-zinc-950/60">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">Pronóstico</span>
          <span className="text-[10px] text-muted-foreground">
            Trimestre actual por defecto · cambia a año dentro del panel
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Basado en resultados reales, no solo en minutos
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/50 bg-white/70 px-3 py-2 shadow-sm dark:bg-zinc-950/60">
      <div className="flex min-w-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onShift(-1)}
          aria-label="Periodo anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 rounded-full px-2.5 text-[11px]"
          onClick={onToday}
        >
          Hoy
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onShift(1)}
          aria-label="Periodo siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="ml-1 truncate text-xs font-semibold">
          {capitalizeFirst(goalPeriodLabel(scope, anchor))}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] font-bold tabular-nums">
          <CalendarDays className="h-3 w-3 text-muted-foreground" />
          {goalCount} metas
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
          <Check className="h-3 w-3" />
          {completedCount}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-amber-600 dark:text-amber-400">
          {goalCount - completedCount} pendientes
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vista con fecha
// ---------------------------------------------------------------------------

function DatedMetasView(props: DatedContentProps) {
  switch (props.scope) {
    case 'day':
    case 'week':
      return <DayWeekMetas {...props} />;
    case 'month':
      return <MonthMetas {...props} />;
    case 'quarter':
      return <QuarterMetas {...props} />;
    case 'year':
      return <YearMetas {...props} />;
  }
}

function DayWeekMetas(props: DatedContentProps) {
  const objectives = useDayWeekSystemObjectives(
    props.scope === 'week' ? 'week' : 'day',
    props.anchor,
  );
  return <DatedMetasCards {...props} objectives={objectives} />;
}

function MonthMetas(props: DatedContentProps) {
  const objectives = useMonthSystemObjectives(props.anchor);
  return <DatedMetasCards {...props} objectives={objectives} />;
}

function QuarterMetas(props: DatedContentProps) {
  const objectives = useQuarterSystemObjectives(props.anchor);
  return <DatedMetasCards {...props} objectives={objectives} />;
}

function YearMetas(props: DatedContentProps) {
  const objectives = useYearSystemObjectives(props.anchor);
  return <DatedMetasCards {...props} objectives={objectives} />;
}

function DatedMetasCards({
  scope,
  anchor,
  goals,
  covers,
  objectives,
  onAdd,
  onToggleGoal,
  onEditGoal,
  onDeleteGoal,
}: DatedCardsProps) {
  const metrics = usePlanSystemMetrics(scope, anchor);
  const range = goalPeriodRange(scope, anchor);
  const periodGoals = goalsInDateRange(goals, range.startKey, range.endKey);

  const goalRowsById: Record<string, PlanObjectiveRow[]> = {};
  for (const goal of periodGoals) {
    (goalRowsById[goal.systemId] ??= []).push({
      id: `system-goal-${goal.id}`,
      title: goal.title,
      subtitle: goal.objective || undefined,
      meta: formatGoalDate(goal.date),
      emoji: '🎯',
      tag: goal.completed ? 'Hecha' : undefined,
      done: !!goal.completed,
      onToggle: () => onToggleGoal(goal.id),
      onEdit: () => onEditGoal(goal),
      onDelete: () => onDeleteGoal(goal),
    });
  }

  if (metrics.loading || objectives.loading) {
    return (
      <div className={GRID_CLASS}>
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl bg-muted/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {METAS_SYSTEM_GROUPS.map(group => {
        const groupGoalCount = periodGoals.filter(goal =>
          group.systems.some(system => system.id === goal.systemId),
        ).length;

        const cards = group.systems.flatMap(system => {
          const card = buildDatedCard({
            system,
            metrics,
            covers,
            objectives,
            goalRows: goalRowsById[system.id] ?? [],
            onAdd,
          });
          return card ? [card] : [];
        });

        return (
          <section
            key={group.id}
            id={`metas-group-${group.id}`}
            className="scroll-mt-24 space-y-3"
          >
            <GroupHeading group={group} extra={groupGoalCount > 0 ? `${groupGoalCount} metas` : undefined} />
            <div className={GRID_CLASS}>
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

function buildDatedCard({
  system,
  metrics,
  covers,
  objectives,
  goalRows,
  onAdd,
}: {
  system: MetaSystemDef;
  metrics: PlanSystemMetricsResult;
  covers: Record<string, string>;
  objectives: ExistingSystemObjectives;
  goalRows: PlanObjectiveRow[];
  onAdd: (systemId: string) => void;
}): PlanAreaCardData | null {
  const systemMeta = PLAN_SYSTEM_META[system.id];
  const cover = covers[coverKey('sub', system.id)]
    ?? covers[coverKey('area', system.id)]
    ?? (systemMeta ? covers[coverKey('area', systemMeta.areaId)] : undefined)
    ?? null;

  const base = {
    id: system.id,
    title: system.label,
    emoji: system.emoji,
    cover,
    onAdd: () => onAdd(system.id),
    emptyHint: 'Sin objetivos todavía',
    items: [...goalRows, ...(objectives.itemsById[system.id] ?? [])],
  };

  if (system.kind === 'area') {
    const area = metrics.areas[system.id];
    if (!area) return null;
    return { ...base, area };
  }

  const systemMetrics = metrics.systems[system.id];
  if (!systemMetrics) return null;

  const planned = objectives.plannedById[system.id];
  return {
    ...base,
    note: systemMeta?.role === 'ancla' ? 'ancla' : undefined,
    minutes: planned,
    minutesUnit: 'min',
    system: { ...systemMetrics, plannedMinutes: planned },
    onTargetChange: (pct: number) => metrics.setTarget(system.id, pct),
  };
}

// ---------------------------------------------------------------------------
// Vista Algún Día (mismo store que la página Algún Día)
// ---------------------------------------------------------------------------

function SomedayView({
  items,
  covers,
  onAdd,
  onToggle,
  onEdit,
  onDelete,
}: {
  items: DreamItem[];
  covers: Record<string, string>;
  onAdd: (systemId: string | null) => void;
  onToggle: (id: string) => void;
  onEdit: (item: DreamItem) => void;
  onDelete: (item: DreamItem) => void;
}) {
  const knownSystemIds = new Set(METAS_SYSTEMS.map(system => system.id));
  const general = items.filter(item => !item.systemId || !knownSystemIds.has(item.systemId));

  const rowFor = (item: DreamItem): PlanObjectiveRow => {
    const category = DREAM_CATEGORY_BY_ID[item.category];
    return {
      id: `someday-${item.id}`,
      title: item.title,
      subtitle: item.description || undefined,
      meta: category ? `${category.emoji} ${category.label}` : 'Algún día',
      emoji: category?.emoji ?? '💭',
      tag: item.completed ? 'Cumplido' : undefined,
      done: item.completed,
      onToggle: () => onToggle(item.id),
      onEdit: () => onEdit(item),
      onDelete: () => onDelete(item),
    };
  };

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <GroupHeading
          group={{
            id: 'general',
            title: 'Sueños generales',
            note: 'Creados desde la página Algún Día',
            dot: 'bg-primary',
            systems: [],
          }}
          extra={general.length > 0 ? `${general.length} sueños` : undefined}
        />
        <div className={GRID_CLASS}>
          <PlanAreaCard
            card={{
              id: 'someday-general',
              title: 'Algún Día',
              emoji: '💭',
              note: 'sin fecha',
              onAdd: () => onAdd(null),
              emptyHint: 'Sin sueños generales todavía',
              items: general.map(rowFor),
            }}
          />
        </div>
      </section>

      {METAS_SYSTEM_GROUPS.map(group => {
        const groupCount = items.filter(item =>
          item.systemId != null && group.systems.some(system => system.id === item.systemId),
        ).length;

        return (
          <section
            key={group.id}
            id={`someday-group-${group.id}`}
            className="scroll-mt-24 space-y-3"
          >
            <GroupHeading group={group} extra={groupCount > 0 ? `${groupCount} sueños` : undefined} />
            <div className={GRID_CLASS}>
              {group.systems.map(system => {
                const systemMeta = PLAN_SYSTEM_META[system.id];
                const cover = covers[coverKey('sub', system.id)]
                  ?? covers[coverKey('area', system.id)]
                  ?? (systemMeta ? covers[coverKey('area', systemMeta.areaId)] : undefined)
                  ?? null;

                return (
                  <PlanAreaCard
                    key={system.id}
                    card={{
                      id: system.id,
                      title: system.label,
                      emoji: system.emoji,
                      cover,
                      note: 'sin fecha',
                      onAdd: () => onAdd(system.id),
                      emptyHint: 'Sin sueños todavía',
                      items: items
                        .filter(item => item.systemId === system.id)
                        .map(rowFor),
                    }}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Encabezado de grupo
// ---------------------------------------------------------------------------

function GroupHeading({
  group,
  extra,
}: {
  group: MetaSystemGroup;
  extra?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-0.5">
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', group.dot)} />
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">
        {group.title}
      </h3>
      {group.note && (
        <span className="hidden text-[10px] text-muted-foreground sm:inline">{group.note}</span>
      )}
      {extra && (
        <span className="rounded-full border border-border/60 bg-background/60 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-muted-foreground">
          {extra}
        </span>
      )}
      <span className="h-px flex-1 bg-border/60" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diálogo de meta con fecha
// ---------------------------------------------------------------------------

function SystemGoalDialog({
  mode,
  systemLabel,
  initialTitle,
  initialObjective,
  initialDate,
  onClose,
  onSave,
  onDelete,
}: {
  mode: 'create' | 'edit';
  systemLabel: string;
  initialTitle: string;
  initialObjective: string;
  initialDate: string;
  onClose: () => void;
  onSave: (values: { title: string; objective: string; date: string }) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [objective, setObjective] = useState(initialObjective);
  const [date, setDate] = useState(initialDate);
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Escribe un título para la meta.');
      return;
    }
    if (!date) {
      setError('Elige una fecha exacta.');
      return;
    }
    onSave({ title: title.trim(), objective: objective.trim(), date });
  };

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} className="space-y-3">
          <DialogHeader>
            <DialogTitle className="text-base">
              {mode === 'create' ? 'Nueva meta' : 'Editar meta'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {systemLabel} · la meta aparece solo en su fecha exacta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="system-goal-title" className="text-xs">Título</Label>
            <Input
              id="system-goal-title"
              autoFocus
              value={title}
              onChange={event => { setTitle(event.target.value); setError(''); }}
              placeholder="Ej. Terminar el proyecto final"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="system-goal-objective" className="text-xs">
              Objetivo corto (opcional)
            </Label>
            <Textarea
              id="system-goal-objective"
              value={objective}
              onChange={event => setObjective(event.target.value)}
              placeholder="Ej. 2 libros, 1800 ELO, 10 temas"
              className="min-h-[58px] text-sm"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="system-goal-date" className="text-xs">Fecha exacta</Label>
            <Input
              id="system-goal-date"
              type="date"
              value={date}
              onChange={event => { setDate(event.target.value); setError(''); }}
              className="h-9 text-sm"
            />
          </div>

          {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}

          <DialogFooter className="gap-2 sm:justify-between">
            <div>
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-red-500 hover:text-red-600"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Eliminar
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs">
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Diálogo de Algún Día
// ---------------------------------------------------------------------------

function DreamDialog({
  mode,
  systemLabel,
  initialTitle,
  initialDescription,
  initialCategory,
  initialPriority,
  onClose,
  onSave,
  onDelete,
}: {
  mode: 'create' | 'edit';
  systemLabel: string;
  initialTitle: string;
  initialDescription: string;
  initialCategory: string;
  initialPriority: DreamPriority;
  onClose: () => void;
  onSave: (values: {
    title: string;
    description: string;
    category: string;
    priority: DreamPriority;
  }) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(initialCategory || 'otros');
  const [priority, setPriority] = useState<DreamPriority>(initialPriority);
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Escribe un título para el sueño.');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
    });
  };

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} className="space-y-3">
          <DialogHeader>
            <DialogTitle className="text-base">
              {mode === 'create' ? 'Nuevo sueño' : 'Editar sueño'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {systemLabel} · sin fecha. Se comparte con la página Algún Día.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="dream-title" className="text-xs">Título</Label>
            <Input
              id="dream-title"
              autoFocus
              value={title}
              onChange={event => { setTitle(event.target.value); setError(''); }}
              placeholder="Ej. Viajar a Japón"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dream-description" className="text-xs">
              Descripción corta (opcional)
            </Label>
            <Textarea
              id="dream-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="¿Cómo te gustaría que fuera?"
              className="min-h-[58px] text-sm"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DREAM_CATEGORIES.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.emoji} {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Prioridad</Label>
              <Select
                value={priority}
                onValueChange={value => setPriority(value as DreamPriority)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DREAM_PRIORITIES.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}

          <DialogFooter className="gap-2 sm:justify-between">
            <div>
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-red-500 hover:text-red-600"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Eliminar
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs">
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
