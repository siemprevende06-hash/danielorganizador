import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCoverGradient } from '@/components/areas/AreaCover';
import {
  AREA_STATE_COLOR,
  DIAGNOSIS_TONE,
  areaStateColor,
  diagnoseArea,
} from '@/lib/areaSystemsMap';
import {
  PLAN_TARGET_STEPS,
  type PlanAreaMetrics,
  type PlanAreaStatus,
  type PlanDayStatus,
  type PlanificationScope,
  type PlanSystemMetrics,
  type PlanTaskMetrics,
} from '@/lib/planSystems';
import { cn } from '@/lib/utils';

export type { PlanAreaMetrics, PlanDayStatus, PlanSystemMetrics } from '@/lib/planSystems';

export interface PlanObjectiveRow {
  id: string;
  title: string;
  subtitle?: string;
  /** Etiqueta corta a la derecha (ej. "Leyendo", "Dominar"). */
  tag?: string;
  /** Dato extra bajo el título (ej. "4 temas", "120 XP"). */
  meta?: string;
  /** Miniatura (portada de libro o canción). */
  cover?: string | null;
  /** Emoji de respaldo cuando no hay portada. */
  emoji?: string;
  done?: boolean;
  onToggle?: () => void;
  /** ISO de creación/planificación del objetivo. */
  createdAt?: string | null;
  /** ISO de realización del objetivo. */
  completedAt?: string | null;
  /** Etiqueta de la fecha de creación (por defecto "Creado"). */
  createdLabel?: string;
  /** Etiqueta de la fecha de realización (por defecto "Hecho"). */
  completedLabel?: string;
  /** No cuenta para pintar la tarjeta como completada (ej. hábitos de hoy). */
  ignoreForCompletion?: boolean;
  /** Acciones opcionales para metas creadas desde Metas Sistemas. */
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface PlanAreaCardData {
  /** Id del área: define el degradado de la portada. */
  id: string;
  title: string;
  /** Línea corta a la derecha del título. */
  note?: string;
  emoji: string;
  /** Portada del área (area_covers). Si falta, se usa el emoji sobre degradado. */
  cover?: string | null;
  /** Meta de minutos del área en el periodo. */
  minutes?: number;
  minutesUnit?: string;
  /** Rendimiento real del sistema durante el periodo. */
  system?: PlanSystemMetrics;
  /** Métricas del área (para las tarjetas Salud, Fuerza Mental y Apariencia). */
  area?: PlanAreaMetrics;
  /** Métricas de la tarjeta sintética "Tareas generales". */
  tasks?: PlanTaskMetrics;
  /**
   * `stability` prioriza racha, brecha, recuperaciones y tendencia sobre los
   * minutos. Se usa en la sección de tendencia de Inicio 2.0.
   */
  view?: 'plan' | 'stability';
  /**
   * En la vista "Hoy", colorea la tarjeta según el estado del día
   * (cumplido, parcial, saltado o descanso).
   */
  dayStatus?: PlanDayStatus;
  /** Añade la franja compacta de estabilidad bajo las métricas del sistema. */
  showStability?: boolean;
  /** Cambia la meta de cumplimiento del sistema (clic en la tarjeta). */
  onTargetChange?: (pct: number) => void;
  /** Abre el formulario de nueva meta para esta tarjeta. */
  onAdd?: () => void;
  /** Texto cuando no hay objetivos (sustituye a "Solo meta de minutos"). */
  emptyHint?: string;
  items: PlanObjectiveRow[];
}

const STATUS_LABEL: Record<PlanDayStatus, string> = {
  done: 'Cumplido',
  partial: 'Parcial',
  skip: 'Saltado',
  rest: 'Descanso',
  none: 'No cumplido',
  nodata: 'Sin datos',
};

const STATUS_COLOR: Record<PlanDayStatus, string> = {
  done: 'bg-emerald-500',
  partial: 'bg-blue-500',
  skip: 'bg-red-500',
  rest: 'bg-sky-500/50',
  none: 'bg-red-500/25',
  nodata: 'bg-muted-foreground/25',
};

/** Colores de la tarjeta completa cuando la vista es "Hoy". */
const DAY_CARD_TONE: Partial<Record<PlanDayStatus, { ring: string; bg: string }>> = {
  done: { ring: 'ring-emerald-500/40', bg: 'bg-emerald-500/5' },
  partial: { ring: 'ring-blue-500/40', bg: 'bg-blue-500/5' },
  skip: { ring: 'ring-red-500/40', bg: 'bg-red-500/5' },
  rest: { ring: 'ring-sky-500/40', bg: 'bg-sky-500/5' },
};

const shortDate = (value?: string | null): string | null => {
  if (!value) return null;
  const raw = String(value);
  // Fechas puras (yyyy-MM-dd) se anclan al mediodía; los ISO completos se
  // interpretan en la zona horaria local para no saltar de día.
  const date = new Date(raw.length === 10 ? `${raw}T12:00:00` : raw);
  return isNaN(date.getTime()) ? null : format(date, 'd MMM', { locale: es });
};

const rowDateText = (item: PlanObjectiveRow): string | null => {
  const created = shortDate(item.createdAt);
  const completed = shortDate(item.completedAt);
  if (!created && !completed) return null;
  const parts: string[] = [];
  if (created) parts.push(`${item.createdLabel ?? 'Creado'} ${created}`);
  if (completed) parts.push(`${item.completedLabel ?? 'Hecho'} ${completed}`);
  return parts.join(' · ');
};

function nextTarget(current: number): number {
  const step = PLAN_TARGET_STEPS.find(value => value > current + 0.5);
  return step ?? PLAN_TARGET_STEPS[0];
}

/**
 * Tarjeta de área con el mismo lenguaje visual que las tarjetas de Sistemas:
 * portada arriba, rendimiento real del sistema, objetivos dentro y los minutos
 * del periodo al pie.
 */
export function PlanAreaCard({ card }: { card: PlanAreaCardData }) {
  const toggleable = card.items.filter(i => i.onToggle && !i.ignoreForCompletion);
  const doneCount = toggleable.filter(i => i.done).length;
  // Objetivos con estado de cumplimiento: alimentan la barra "Res" del sistema.
  const measurable = card.items.filter(i => i.done !== undefined && !i.ignoreForCompletion);
  const complete = toggleable.length > 0 && doneCount === toggleable.length;
  const structural = card.system?.kind === 'estructural';
  const systemComplete = structural && card.system?.targetMet === true;
  const areaComplete = card.area?.compliance != null && card.area.compliance >= 80;
  const stabilityComplete = card.view === 'stability'
    && card.system?.compliance != null
    && card.system.compliance >= 80;
  const dayTone = card.dayStatus ? DAY_CARD_TONE[card.dayStatus] : undefined;
  const completedTone = complete || systemComplete || areaComplete || stabilityComplete;

  const counter = card.tasks
    ? card.tasks.total > 0
      ? `${card.tasks.done}/${card.tasks.total}`
      : ''
    : card.view === 'stability'
      ? card.system?.compliance != null
        ? `${card.system.compliance}%`
        : ''
      : card.area
        ? card.area.compliance != null
          ? `${card.area.compliance}%`
          : ''
        : structural
          ? card.system?.compliance != null
            ? `${card.system.compliance}%`
            : ''
          : toggleable.length > 0
            ? `${doneCount}/${toggleable.length}`
            : card.items.length > 0
              ? `${card.items.length}`
              : '';

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl ring-2 transition-colors',
        dayTone
          ? cn(dayTone.ring, dayTone.bg)
          : completedTone
            ? 'ring-emerald-500/40 bg-emerald-500/5'
            : 'ring-border/40 bg-white/80 dark:bg-zinc-950/80'
      )}
    >
      <div className={cn('relative h-14 w-full shrink-0 overflow-hidden bg-gradient-to-br', getCoverGradient(card.id))}>
        {card.cover ? (
          <img src={card.cover} alt={card.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-2xl drop-shadow-sm">{card.emoji}</span>
          </div>
        )}
        {counter && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
            {counter}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <div className="flex items-baseline gap-1.5">
          <h4 className="truncate text-[11px] font-bold leading-tight">{card.title}</h4>
          {card.note && (
            <span className="ml-auto shrink-0 text-[8px] font-medium text-muted-foreground">{card.note}</span>
          )}
          {card.onAdd && (
            <button
              type="button"
              onClick={card.onAdd}
              title={`Nueva meta para ${card.title}`}
              aria-label={`Nueva meta para ${card.title}`}
              className={cn(
                'grid h-4 w-4 shrink-0 place-items-center rounded-full border border-border/60 bg-foreground/5 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary',
                !card.note && 'ml-auto',
              )}
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
        </div>

        {card.tasks ? (
          <TaskMetricsBlock tasks={card.tasks} />
        ) : card.area && !card.system ? (
          <AreaMetricsBlock area={card.area} />
        ) : null}

        {card.system && (
          card.view === 'stability' ? (
            <StabilityMetrics system={card.system} minutesUnit={card.minutesUnit} />
          ) : card.system.kind === 'estructural' ? (
            <StructuralMetrics
              system={card.system}
              onTargetChange={card.onTargetChange}
            />
          ) : (
            <SystemMetrics
              system={card.system}
              minutesUnit={card.minutesUnit}
              objectivesDone={measurable.filter(item => item.done === true).length}
              objectivesTotal={measurable.length}
            />
          )
        )}

        {card.showStability && card.system && card.system.kind !== 'estructural' && card.view !== 'stability' && (
          <StabilityStats system={card.system} />
        )}

        {card.items.length > 0 ? (
          <div className="space-y-1">
            {card.items.map(item => (
              <ObjectiveRow key={item.id} item={item} />
            ))}
          </div>
        ) : card.emptyHint ? (
          <p className="text-[9px] leading-tight text-muted-foreground/80">{card.emptyHint}</p>
        ) : !card.system && !card.area && !card.tasks ? (
          <p className="text-[9px] leading-tight text-muted-foreground/80">Solo meta de minutos</p>
        ) : null}

        {!card.system && !card.area && (card.minutes ?? 0) > 0 && (
          <div className="mt-auto flex items-baseline gap-1 pt-0.5">
            <span className="text-xl font-extrabold leading-none tabular-nums">{card.minutes}</span>
            <span className="text-[9px] text-muted-foreground">{card.minutesUnit ?? 'min'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Meter({
  label,
  value,
  bar,
  hint,
}: {
  label: string;
  value?: number | null;
  bar: string;
  hint?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return (
    <div className="min-w-0" title={hint}>
      <div className="flex items-baseline justify-between gap-0.5">
        <span className="text-[7px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-[9px] font-bold leading-none tabular-nums">
          {value == null ? '—' : `${pct}%`}
        </span>
      </div>
      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <span className="flex items-baseline justify-between gap-1" title={hint}>
      <span className="text-[7px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn('text-[8px] font-bold tabular-nums', tone ?? 'text-foreground/80')}>{value}</span>
    </span>
  );
}

function trendLabel(trend: number | null): string {
  if (trend == null) return '—';
  if (trend > 0) return `↑${trend}`;
  if (trend < 0) return `↓${Math.abs(trend)}`;
  return '=0';
}

function trendTone(trend: number | null): string {
  if (trend == null) return 'text-muted-foreground';
  if (trend > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (trend < 0) return 'text-red-500';
  return 'text-muted-foreground';
}

/**
 * Franja compacta de estabilidad para las tarjetas centrales de Inicio 2.0:
 * integra racha/brecha/recuperaciones/tendencia/semanas verdes sin duplicar
 * una sección aparte.
 */
function StabilityStats({ system }: { system: PlanSystemMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 rounded-lg bg-foreground/[0.04] p-1.5">
      <Stat
        label="Mejor"
        value={`${system.bestStreak}d`}
        hint="Mejor racha histórica"
        tone="text-orange-500"
      />
      <Stat
        label="Brecha"
        value={`${system.maxGap}d`}
        hint="Mayor cantidad de días seguidos sin cumplir"
      />
      <Stat
        label="Recup."
        value={`${system.recoveries}`}
        hint="Veces que retomaste el sistema después de una brecha"
      />
      <Stat
        label="Tend."
        value={trendLabel(system.trend)}
        hint="Cumplimiento vs periodo anterior"
        tone={trendTone(system.trend)}
      />
      <Stat
        label="Verde"
        value={`${system.greenWeeks}/${system.totalWeeks}`}
        hint="Semanas con ≥80% de cumplimiento"
      />
      <Stat
        label="Últ."
        value={system.lastDone ? shortDate(system.lastDone) ?? '—' : '—'}
        hint="Último día cumplido"
      />
    </div>
  );
}

/**
 * Métricas de la tarjeta "Tareas generales": progreso de las tareas del
 * periodo y cumplimiento por día (días en los que se completaron todas).
 */
function TaskMetricsBlock({ tasks }: { tasks: PlanTaskMetrics }) {
  const pct = tasks.completion;
  const state = pct == null
    ? {
        label: 'Sin tareas',
        text: 'text-muted-foreground',
        dot: 'bg-muted-foreground/60',
        bar: 'bg-muted-foreground/40',
      }
    : pct >= 100
      ? {
          label: 'Completado',
          text: 'text-emerald-600 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          bar: 'bg-emerald-500',
        }
      : pct >= 50
        ? {
            label: 'En marcha',
            text: 'text-amber-600 dark:text-amber-400',
            dot: 'bg-amber-500',
            bar: 'bg-amber-500',
          }
        : {
            label: 'Pendiente',
            text: 'text-red-500',
            dot: 'bg-red-500',
            bar: 'bg-red-500',
          };

  return (
    <div className="space-y-1 rounded-lg bg-foreground/[0.04] p-1.5">
      <div className="flex items-center gap-1">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', state.dot)} />
        <span className={cn('truncate text-[8px] font-semibold leading-tight', state.text)}>
          {state.label}
        </span>
        {(tasks.streak ?? 0) > 0 && (
          <span
            className="ml-auto shrink-0 text-[8px] font-bold text-orange-500"
            title={`Días seguidos completando todas las tareas${tasks.bestStreak ? ` · mejor ${tasks.bestStreak}` : ''}`}
          >
            🔥 {tasks.streak}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold leading-none tabular-nums">{tasks.done}</span>
          <span className="text-sm font-bold leading-none text-muted-foreground">/{tasks.total}</span>
          <span className="text-[9px] text-muted-foreground">tareas</span>
        </div>
        <span className={cn('text-[11px] font-extrabold leading-none tabular-nums', state.text)}>
          {pct == null ? '—' : `${pct}%`}
        </span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', state.bar)} style={{ width: `${pct ?? 0}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        <Stat
          label="Días"
          value={`${tasks.daysDone}/${tasks.daysWithTasks}`}
          hint="Días con todas las tareas completadas"
        />
        <Stat
          label="Brecha"
          value={`${tasks.maxGap}d`}
          hint="Días seguidos con tareas sin completar"
        />
        <Stat
          label="Recup."
          value={`${tasks.recoveries}`}
          hint="Veces que retomaste las tareas después de una brecha"
        />
        <Stat
          label="Verde"
          value={`${tasks.greenWeeks}/${tasks.totalWeeks}`}
          hint="Semanas con ≥80% de días completados"
        />
      </div>

      {tasks.days.length > 1 && (
        <div className="flex gap-px">
          {tasks.days.map((day, index) => {
            const status = tasks.status[index] ?? 'none';
            return (
              <span
                key={day}
                title={`${STATUS_LABEL[status]} · ${shortDate(day) ?? day}`}
                className={cn('h-1.5 flex-1 rounded-[1px]', STATUS_COLOR[status])}
              />
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-1 text-[8px] text-muted-foreground">
        <span className="tabular-nums">{tasks.pending} pendientes</span>
        <span className={cn('tabular-nums', trendTone(tasks.trend))}>
          Tend. {trendLabel(tasks.trend)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Series largas (trimestre / año)                                     */
/* ------------------------------------------------------------------ */

const MAX_SERIES_BARS = 40;

interface SeriesBucket {
  key: string;
  dayKeys: string[];
  statuses: PlanDayStatus[];
  minutes: number;
  future: boolean;
  single: boolean;
}

/**
 * En día/semana/mes se conserva una barra por día. En trimestre/año se agrupan
 * los días en bloques de como máximo 40 barras para que la tarjeta no se rompa
 * y siga siendo legible.
 */
function seriesBuckets(system: PlanSystemMetrics, todayKey: string): SeriesBucket[] {
  const statuses = system.status ?? [];
  const days = system.days ?? [];
  const spark = system.spark ?? [];
  const length = Math.max(statuses.length, days.length, spark.length);
  if (length === 0) return [];

  const size = Math.max(1, Math.ceil(length / MAX_SERIES_BARS));
  const out: SeriesBucket[] = [];

  for (let index = 0; index < length; index += size) {
    const dayKeys = days.slice(index, index + size);
    const chunkStatuses = statuses.slice(index, index + size);
    const minutes = spark
      .slice(index, index + size)
      .reduce((sum, value) => sum + (Number(value) || 0), 0);
    const future = dayKeys.length > 0 && dayKeys.every(day => day > todayKey);
    out.push({
      key: `${index}-${dayKeys[0] ?? ''}`,
      dayKeys,
      statuses: chunkStatuses,
      minutes,
      future,
      single: size === 1,
    });
  }

  return out;
}

function bucketRangeLabel(bucket: SeriesBucket): string {
  const first = bucket.dayKeys[0];
  const last = bucket.dayKeys[bucket.dayKeys.length - 1];
  const firstLabel = first ? shortDate(first) ?? first : '';
  const lastLabel = last ? shortDate(last) ?? last : '';
  if (!firstLabel && !lastLabel) return '';
  if (firstLabel === lastLabel || !lastLabel) return firstLabel;
  return `${firstLabel} → ${lastLabel}`;
}

function bucketCompliance(bucket: SeriesBucket, todayKey: string): number | null {
  if (bucket.future) return null;
  const evaluated = bucket.statuses.filter((status, index) => {
    const day = bucket.dayKeys[index];
    if (day && day > todayKey) return false;
    return status !== 'rest' && status !== 'nodata';
  });
  if (evaluated.length === 0) return null;
  const done = evaluated.filter(status => status === 'done').length;
  return Math.round((done / evaluated.length) * 100);
}

function bucketStatusColor(bucket: SeriesBucket, todayKey: string): string {
  if (bucket.future) return 'bg-muted-foreground/20';
  if (bucket.single) {
    return STATUS_COLOR[bucket.statuses[0] ?? 'nodata'];
  }
  if (bucket.statuses.length > 0 && bucket.statuses.every(status => status === 'rest')) {
    return STATUS_COLOR.rest;
  }
  if (bucket.statuses.length > 0 && bucket.statuses.every(status => status === 'nodata' || status === 'rest')) {
    return STATUS_COLOR.nodata;
  }
  const pct = bucketCompliance(bucket, todayKey);
  if (pct == null) return 'bg-muted-foreground/20';
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function bucketStatusTitle(bucket: SeriesBucket, todayKey: string): string {
  const range = bucketRangeLabel(bucket);
  if (bucket.future) return `${range || 'Pendiente'} · Pendiente`;
  if (bucket.single) {
    const status = bucket.statuses[0] ?? 'nodata';
    return `${STATUS_LABEL[status]}${range ? ` · ${range}` : ''}`;
  }
  const pct = bucketCompliance(bucket, todayKey);
  if (pct == null) return `${range} · Sin datos`;
  return `${range} · ${pct}% cumplido`;
}

function bucketSparkColor(bucket: SeriesBucket, todayKey: string): string {
  if (bucket.future) return 'bg-muted-foreground/20';
  if (bucket.single) return STATUS_COLOR[bucket.statuses[0] ?? 'nodata'];
  if (bucket.statuses.some(status => status === 'done')) return 'bg-emerald-500';
  if (bucket.statuses.some(status => status === 'partial')) return 'bg-blue-500';
  if (bucket.statuses.some(status => status === 'skip' || status === 'none')) return 'bg-red-500';
  return 'bg-muted-foreground/40';
}

function bucketSparkHeight(bucket: SeriesBucket, max: number): number {
  const hasProgress = bucket.statuses.some(status => status === 'done' || status === 'partial');
  const hasFailure = bucket.statuses.some(status => status === 'skip' || status === 'none');
  const floor = !bucket.future && !hasProgress && hasFailure ? 16 : 8;
  return Math.max(floor, (bucket.minutes / Math.max(1, max)) * 100);
}

function bucketSparkTitle(bucket: SeriesBucket): string {
  const range = bucketRangeLabel(bucket);
  return `${bucket.minutes} min${range ? ` · ${range}` : ''}`;
}

/**
 * Métricas compactas de un área estructural (Salud, Fuerza Mental,
 * Apariencia). Usa el mismo lenguaje visual que las tarjetas de sistema.
 */
function AreaMetricsBlock({ area }: { area: PlanAreaMetrics }) {
  const status = AREA_STATUS_META[area.status];
  const compliance = area.compliance;

  return (
    <div className="space-y-1 rounded-lg bg-foreground/[0.04] p-1.5">
      <div className="flex items-center gap-1">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', status.dot)} />
        <span className={cn('truncate text-[8px] font-semibold leading-tight', status.text)}>
          {status.label}
        </span>
        <span
          className={cn('ml-auto shrink-0 text-[8px] font-bold tabular-nums', trendTone(area.trend))}
          title="Cumplimiento vs periodo anterior"
        >
          {trendLabel(area.trend)}
        </span>
      </div>

      <div className="flex items-end justify-between gap-1">
        <div className="flex items-baseline gap-1">
          <span className={cn('text-2xl font-extrabold leading-none tabular-nums', status.text)}>
            {compliance == null ? '—' : compliance}
          </span>
          {compliance != null && (
            <span className="text-sm font-bold leading-none text-muted-foreground">%</span>
          )}
        </div>
        <span className="text-[8px] text-muted-foreground">
          {area.activeSystems}/{area.totalSystems} activos
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Meter
          label="Anclas"
          value={area.anchorCompliance}
          bar="bg-sky-500"
          hint="Cumplimiento de los sistemas ancla del área"
        />
        <Meter
          label="Mant."
          value={area.maintenanceCompliance}
          bar="bg-violet-500"
          hint="Cumplimiento de los sistemas de mantenimiento"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-1.5 gap-y-0.5 text-[8px] text-muted-foreground">
        <span className="truncate">
          {area.weakestAnchor
            ? `Ancla débil: ${area.weakestAnchor.name} ${area.weakestAnchor.compliance}%`
            : 'Sin anclas con datos'}
        </span>
        <span className="shrink-0 tabular-nums">Verde {area.greenWeeks}/{area.totalWeeks}</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Meter label="Esf" value={area.effort} bar="bg-violet-500" hint="Esfuerzo del área (Punto B)" />
        <Meter label="Res" value={area.results} bar="bg-emerald-500" hint="Resultados del área (Punto B)" />
      </div>
    </div>
  );
}

/** Estado visual compartido por la tarjeta y la fila compacta estructural. */
function structuralTone(system: PlanSystemMetrics) {
  const tone: 'green' | 'amber' | 'red' | 'grey' =
    system.compliance == null
      ? 'grey'
      : system.targetMet === true || system.compliance >= 80
        ? 'green'
        : system.compliance >= 50
          ? 'amber'
          : 'red';

  return {
    tone,
    palette: DIAGNOSIS_TONE[tone],
    dot: tone === 'green'
      ? 'bg-emerald-500'
      : tone === 'amber'
        ? 'bg-amber-500'
        : tone === 'red'
          ? 'bg-red-500'
          : 'bg-muted-foreground/60',
    barColor: tone === 'green'
      ? 'bg-emerald-500'
      : tone === 'amber'
        ? 'bg-amber-500'
        : tone === 'red'
          ? 'bg-red-500'
          : 'bg-muted-foreground/40',
    stateLabel: tone === 'green'
      ? 'Cumpliendo'
      : tone === 'amber'
        ? 'Irregular'
        : tone === 'red'
          ? 'Roto'
          : 'Sin datos',
    pct: Math.max(0, Math.min(100, system.compliance ?? 0)),
  };
}

/**
 * Sistema estructural: el dato grande son los días cumplidos sobre los días
 * disponibles. Debajo se mide dosis mínima, racha, brecha, recuperación,
 * tendencia y semanas verdes. Los minutos solo aparecen si el sistema es de
 * tiempo (gym).
 */
function StructuralMetrics({
  system,
  onTargetChange,
}: {
  system: PlanSystemMetrics;
  onTargetChange?: (pct: number) => void;
}) {
  const { palette, dot, barColor, stateLabel, pct } = structuralTone(system);
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const buckets = seriesBuckets(system, todayKey);
  const sparkMax = Math.max(1, ...buckets.map(bucket => bucket.minutes));
  const targetLabel = system.daysTotal > 0
    ? `${system.targetDays}d · ${system.targetPct}%`
    : `${system.targetPct}%`;

  return (
    <div className="space-y-1 rounded-lg bg-foreground/[0.04] p-1.5">
      <div className="flex items-center gap-1">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} />
        <span className={cn('truncate text-[8px] font-semibold leading-tight', palette.text)}>
          {stateLabel}
        </span>
        {(system.streak ?? 0) > 0 && (
          <span
            className="ml-auto shrink-0 text-[8px] font-bold text-orange-500"
            title={`Racha actual${system.bestStreak ? ` · mejor ${system.bestStreak}` : ''}`}
          >
            🔥 {system.streak}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold leading-none tabular-nums">{system.daysDone}</span>
          <span className="text-sm font-bold leading-none text-muted-foreground">/{system.daysTotal}</span>
          <span className="text-[9px] text-muted-foreground">días</span>
        </div>
        <span className={cn('text-[11px] font-extrabold leading-none tabular-nums', palette.text)}>
          {system.compliance == null ? '—' : `${system.compliance}%`}
        </span>
      </div>

      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
        <span
          className="absolute inset-y-0 w-px bg-foreground/60"
          style={{ left: `${Math.max(0, Math.min(100, system.targetPct))}%` }}
          title={`Meta: ${system.targetPct}%`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onTargetChange?.(nextTarget(system.targetPct))}
          disabled={!onTargetChange}
          title={`Meta ${system.targetPct}% (${system.targetDays} de ${system.daysTotal} días). Clic para cambiarla.`}
          className={cn(
            'rounded border px-1 py-0.5 text-[8px] font-bold tabular-nums transition-colors',
            system.targetMet
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-border/50 bg-foreground/5 text-muted-foreground',
            onTargetChange && 'hover:bg-foreground/10'
          )}
        >
          Meta {targetLabel}
        </button>
        <span className="rounded border border-border/50 bg-foreground/5 px-1 py-0.5 text-[8px] font-semibold text-muted-foreground">
          Dosis {system.timed ? `${system.minimumDose}m` : '✓'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        <Stat
          label="Brecha"
          value={`${system.maxGap}d`}
          hint="Mayor cantidad de días seguidos sin cumplir"
        />
        <Stat
          label="Recup."
          value={`${system.recoveries}`}
          hint="Veces que retomaste el sistema después de una brecha"
        />
        <Stat
          label="Tend."
          value={trendLabel(system.trend)}
          hint="Cumplimiento vs periodo anterior"
          tone={trendTone(system.trend)}
        />
        <Stat
          label="Verde"
          value={`${system.greenWeeks}/${system.totalWeeks}`}
          hint="Semanas con ≥80% de cumplimiento"
        />
      </div>

      {system.status && system.status.length > 1 && (
        <div className="flex gap-px">
          {buckets.map(bucket => (
            <span
              key={bucket.key}
              title={bucketStatusTitle(bucket, todayKey)}
              className={cn(
                'h-1.5 flex-1 rounded-[1px]',
                bucketStatusColor(bucket, todayKey),
              )}
            />
          ))}
        </div>
      )}

      {system.timed && buckets.some(bucket => bucket.minutes > 0) && (
        <div className="flex h-3.5 items-end gap-px">
          {buckets.map(bucket => (
            <span
              key={bucket.key}
              title={bucketSparkTitle(bucket)}
              className={cn('flex-1 rounded-sm', bucketSparkColor(bucket, todayKey))}
              style={{ height: `${bucketSparkHeight(bucket, sparkMax)}%` }}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-1.5 gap-y-0.5 text-[8px] text-muted-foreground">
        {system.timed && (
          <span className="tabular-nums">
            ⏱ {system.actualMinutes} min
            {(system.plannedMinutes ?? 0) > 0 ? ` / ${system.plannedMinutes}` : ''}
          </span>
        )}
        <span className="tabular-nums">
          Últ. {system.lastDone ? shortDate(system.lastDone) : '—'}
        </span>
        {(system.daysSkipped > 0 || system.restDays > 0) && (
          <span className="tabular-nums">
            {system.daysSkipped > 0 ? `${system.daysSkipped} salt.` : ''}
            {system.daysSkipped > 0 && system.restDays > 0 ? ' · ' : ''}
            {system.restDays > 0 ? `${system.restDays} desc.` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Vista de estabilidad: lo importante no es cuánto avanzó la meta, sino si el
 * sistema se está cumpliendo día a día. El dato grande es la racha actual y el
 * mapa de días del periodo; brecha, recuperaciones, tendencia y semanas verdes
 * explican si el sistema es estable o se está rompiendo.
 */
function StabilityMetrics({
  system,
  minutesUnit,
}: {
  system: PlanSystemMetrics;
  minutesUnit?: string;
}) {
  const { palette, dot, barColor, stateLabel, pct } = structuralTone(system);
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const buckets = seriesBuckets(system, todayKey);
  const todayIndex = system.days?.indexOf(todayKey) ?? -1;
  const todayStatus = todayIndex >= 0 ? system.status?.[todayIndex] : undefined;
  const targetLabel = system.daysTotal > 0
    ? `${system.targetDays}d`
    : `${system.targetPct}%`;

  return (
    <div className="space-y-1 rounded-lg bg-foreground/[0.04] p-1.5">
      <div className="flex items-center gap-1">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} />
        <span className={cn('truncate text-[8px] font-semibold leading-tight', palette.text)}>
          {stateLabel}
        </span>
        <span
          className={cn('ml-auto shrink-0 text-[8px] font-bold tabular-nums', trendTone(system.trend))}
          title="Cumplimiento vs periodo anterior"
        >
          {trendLabel(system.trend)}
        </span>
      </div>

      <div className="flex items-end justify-between gap-1">
        <div className="flex items-baseline gap-1" title="Días seguidos cumpliendo el sistema">
          <span className="text-2xl font-extrabold leading-none tabular-nums text-orange-500">
            {system.streak}
          </span>
          <span className="text-[9px] leading-tight text-muted-foreground">días<br />seguidos</span>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-extrabold leading-none tabular-nums">
            {system.daysDone}/{system.daysTotal}
          </div>
          <div className="text-[7px] uppercase tracking-wide text-muted-foreground">días cumplidos</div>
        </div>
      </div>

      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
        <span
          className="absolute inset-y-0 w-px bg-foreground/60"
          style={{ left: `${Math.max(0, Math.min(100, system.targetPct))}%` }}
          title={`Meta: ${system.targetPct}%`}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        <Stat
          label="Mejor"
          value={`${system.bestStreak}d`}
          hint="Mejor racha histórica"
          tone="text-orange-500"
        />
        <Stat
          label="Brecha"
          value={`${system.maxGap}d`}
          hint="Mayor cantidad de días seguidos sin cumplir"
        />
        <Stat
          label="Recup."
          value={`${system.recoveries}`}
          hint="Veces que retomaste el sistema después de una brecha"
        />
        <Stat
          label="Verde"
          value={`${system.greenWeeks}/${system.totalWeeks}`}
          hint="Semanas con ≥80% de cumplimiento"
        />
        <Stat
          label="Meta"
          value={targetLabel}
          hint={`Meta ${system.targetPct}% del periodo`}
        />
        <Stat
          label="Hoy"
          value={todayStatus === 'done'
            ? '✓'
            : todayStatus === 'skip'
              ? '✗'
              : todayStatus === 'rest'
                ? 'desc.'
                : todayStatus === 'partial'
                  ? 'parc.'
                  : '—'}
          hint="Estado del día de hoy"
        />
      </div>

      {system.status && system.status.length > 0 && (
        <div className="flex gap-px">
          {buckets.map(bucket => (
            <span
              key={bucket.key}
              title={bucketStatusTitle(bucket, todayKey)}
              className={cn('h-2 flex-1 rounded-[1px]', bucketStatusColor(bucket, todayKey))}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-1.5 gap-y-0.5 text-[8px] text-muted-foreground">
        <span className="tabular-nums">
          {system.compliance == null ? '—' : `${system.compliance}%`} cumplido
        </span>
        {(system.plannedMinutes ?? 0) > 0 && (
          <span
            className="tabular-nums"
            title="Minutos planificados y reales del periodo"
          >
            ⏱ {system.actualMinutes}/{system.plannedMinutes} {minutesUnit ?? 'min'}
          </span>
        )}
        <span className="tabular-nums">
          Últ. {system.lastDone ? shortDate(system.lastDone) : '—'}
        </span>
      </div>
    </div>
  );
}

function RowStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <span
      className="inline-flex items-baseline gap-1 rounded border border-border/40 bg-foreground/[0.03] px-1 py-0.5"
      title={hint}
    >
      <span className="text-[7px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn('text-[8px] font-bold tabular-nums', tone ?? 'text-foreground/80')}>{value}</span>
    </span>
  );
}

/**
 * Fila compacta de un sistema estructural. Sustituye la tarjeta con portada
 * por una línea de tabla: conserva días, meta, dosis, racha, brecha,
 * recuperación, tendencia, semanas verdes, último día, ajustes, minutos,
 * franja de estados y sparkline.
 */
export function StructuralSystemRow({ card }: { card: PlanAreaCardData }) {
  const system = card.system;
  if (!system) return null;

  const { palette, dot, barColor, stateLabel, pct } = structuralTone(system);
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const buckets = seriesBuckets(system, todayKey);
  const sparkMax = Math.max(1, ...buckets.map(bucket => bucket.minutes));
  const targetLabel = system.daysTotal > 0
    ? `${system.targetDays}d · ${system.targetPct}%`
    : `${system.targetPct}%`;
  const restText = [
    system.daysSkipped > 0 ? `${system.daysSkipped} salt.` : '',
    system.restDays > 0 ? `${system.restDays} desc.` : '',
  ].filter(Boolean).join(' · ');

  return (
    <div className="px-2.5 py-1.5 transition-colors hover:bg-foreground/[0.02]">
      <div className="flex items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} title={stateLabel} />
        <span className="shrink-0 text-[11px] leading-none">{card.emoji}</span>
        <span className="min-w-0 truncate text-[10px] font-bold leading-tight">{card.title}</span>
        {card.note && (
          <span className="shrink-0 rounded border border-border/50 bg-foreground/5 px-1 py-0.5 text-[7px] font-semibold uppercase text-muted-foreground">
            {card.note}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-baseline gap-0.5">
          <span className={cn('text-[13px] font-extrabold leading-none tabular-nums', palette.text)}>
            {system.daysDone}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground">/{system.daysTotal}</span>
          <span className="text-[8px] text-muted-foreground">días</span>
        </span>
        <span className={cn('w-8 shrink-0 text-right text-[10px] font-extrabold leading-none tabular-nums', palette.text)}>
          {system.compliance == null ? '—' : `${system.compliance}%`}
        </span>
        {system.streak > 0 && (
          <span
            className="shrink-0 text-[8px] font-bold text-orange-500"
            title={`Racha actual${system.bestStreak ? ` · mejor ${system.bestStreak}` : ''}`}
          >
            🔥 {system.streak}
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => card.onTargetChange?.(nextTarget(system.targetPct))}
          disabled={!card.onTargetChange}
          title={`Meta ${system.targetPct}% (${system.targetDays} de ${system.daysTotal} días). Clic para cambiarla.`}
          className={cn(
            'inline-flex items-baseline gap-1 rounded border px-1 py-0.5 text-[7px] font-bold uppercase tracking-wide transition-colors',
            system.targetMet
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-border/40 bg-foreground/[0.03] text-muted-foreground',
            card.onTargetChange && 'hover:bg-foreground/10',
          )}
        >
          Meta
          <span className="text-[8px] font-bold tabular-nums">{targetLabel}</span>
        </button>
        <RowStat
          label="Estado"
          value={stateLabel}
          hint="Estado del sistema según cumplimiento y meta"
          tone={palette.text}
        />
        <RowStat
          label="Dosis"
          value={system.timed ? `${system.minimumDose}m` : '✓'}
          hint="Dosis mínima para contar el día"
        />
        <RowStat label="Brecha" value={`${system.maxGap}d`} hint="Mayor cantidad de días seguidos sin cumplir" />
        <RowStat label="Recup." value={`${system.recoveries}`} hint="Veces que retomaste el sistema después de una brecha" />
        <RowStat
          label="Tend."
          value={trendLabel(system.trend)}
          hint="Cumplimiento vs periodo anterior"
          tone={trendTone(system.trend)}
        />
        <RowStat label="Verde" value={`${system.greenWeeks}/${system.totalWeeks}`} hint="Semanas con ≥80% de cumplimiento" />
        <RowStat
          label="Últ."
          value={system.lastDone ? shortDate(system.lastDone) ?? '—' : '—'}
          hint="Último día cumplido"
        />
        {restText && <RowStat label="Ajustes" value={restText} hint="Días saltados y descansos" />}
        {system.timed && (
          <RowStat
            label="Min"
            value={`${system.actualMinutes}${(system.plannedMinutes ?? 0) > 0 ? ` / ${system.plannedMinutes}` : ''}`}
            hint="Minutos reales del periodo y meta planificada"
          />
        )}
      </div>

      <div className="mt-1 flex items-center gap-2">
        <div className="relative h-1.5 min-w-[70px] flex-1 overflow-hidden rounded-full bg-muted">
          <div className={cn('h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
          <span
            className="absolute inset-y-0 w-px bg-foreground/60"
            style={{ left: `${Math.max(0, Math.min(100, system.targetPct))}%` }}
            title={`Meta: ${system.targetPct}%`}
          />
        </div>

        {system.status && system.status.length > 1 && (
          <div className="flex w-20 shrink-0 gap-px">
            {buckets.map(bucket => (
              <span
                key={bucket.key}
                title={bucketStatusTitle(bucket, todayKey)}
                className={cn(
                  'h-1.5 flex-1 rounded-[1px]',
                  bucketStatusColor(bucket, todayKey),
                )}
              />
            ))}
          </div>
        )}

        {system.timed && buckets.some(bucket => bucket.minutes > 0) && (
          <div className="flex h-3 w-16 shrink-0 items-end gap-px">
            {buckets.map(bucket => (
              <span
                key={bucket.key}
                title={bucketSparkTitle(bucket)}
                className={cn('flex-1 rounded-sm', bucketSparkColor(bucket, todayKey))}
                style={{ height: `${bucketSparkHeight(bucket, sparkMax)}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Sistema central: se conserva el detalle existente (Esf/Res, minutos
 * acumulados con /meta, días, racha, estados y sparkline). La barra "Res" se
 * calcula solo con los objetivos marcados en el periodo; si no hay objetivos
 * marcables se muestra "—". El Punto B queda como respaldo únicamente para el
 * diagnóstico del área.
 */
function SystemMetrics({
  system,
  minutesUnit,
  objectivesDone = 0,
  objectivesTotal = 0,
}: {
  system: PlanSystemMetrics;
  minutesUnit?: string;
  objectivesDone?: number;
  objectivesTotal?: number;
}) {
  const hasObjectives = objectivesTotal > 0;
  const objectivesPct = hasObjectives
    ? Math.round((objectivesDone / objectivesTotal) * 100)
    : undefined;
  // El diagnóstico sí puede apoyarse en el Punto B cuando el periodo no tiene
  // objetivos marcables; la barra "Res" nunca usa ese respaldo.
  const diagnosis = diagnoseArea(system.effort ?? 0, objectivesPct ?? system.results ?? 0);
  const objectivesBar =
    objectivesPct == null
      ? 'bg-muted-foreground/40'
      : objectivesPct >= 100
        ? 'bg-emerald-500'
        : objectivesPct >= 50
          ? 'bg-amber-500'
          : 'bg-red-500';
  const tone = DIAGNOSIS_TONE[diagnosis.tone];
  const state = AREA_STATE_COLOR[areaStateColor(diagnosis)];
  const planned = Math.max(0, Math.round(system.plannedMinutes ?? 0));
  const actual = Math.max(0, Math.round(system.actualMinutes ?? 0));
  const pct = planned > 0 ? Math.min(100, Math.round((actual / planned) * 100)) : null;
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const buckets = seriesBuckets(system, todayKey);
  const sparkMax = Math.max(1, ...buckets.map(bucket => bucket.minutes));

  return (
    <div className="space-y-1 rounded-lg bg-foreground/[0.04] p-1.5">
      <div className="flex items-center gap-1">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', state.dot)} />
        <span className={cn('truncate text-[8px] font-semibold leading-tight', tone.text)}>
          {diagnosis.short}
        </span>
        {(system.streak ?? 0) > 0 && (
          <span
            className="ml-auto shrink-0 text-[8px] font-bold text-orange-500"
            title={`Racha actual${system.bestStreak ? ` · mejor ${system.bestStreak}` : ''}`}
          >
            🔥 {system.streak}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Meter label="Esf" value={system.effort} bar="bg-violet-500" hint="Esfuerzo del área (Punto B)" />
        <Meter
          label={hasObjectives ? `Res ${objectivesDone}/${objectivesTotal}` : 'Res'}
          value={objectivesPct}
          bar={objectivesBar}
          hint={
            hasObjectives
              ? `Objetivos del periodo: ${objectivesDone}/${objectivesTotal} marcados`
              : 'Sin objetivos marcables en el periodo'
          }
        />
      </div>

      {/* Minutos acumulados + meta del periodo, igual que las tarjetas de Sistemas. */}
      <div className="flex items-end justify-between gap-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold leading-none tabular-nums">{actual}</span>
          <span className="text-[9px] text-muted-foreground">{minutesUnit ?? 'min'}</span>
        </div>
        {planned > 0 && (
          <span
            className="shrink-0 text-[9px] font-semibold text-muted-foreground tabular-nums"
            title={`Objetivo de minutos del periodo (${minutesUnit ?? 'min'})`}
          >
            /{planned}
          </span>
        )}
      </div>

      {system.pagesRead != null && (
        <div
          className="flex items-center justify-between gap-1 rounded-md bg-cyan-500/10 px-1.5 py-0.5"
          title="Páginas leídas en el periodo visible"
        >
          <span className="text-[8px] font-semibold text-cyan-700 dark:text-cyan-400">📖 Páginas leídas</span>
          <span className="text-[11px] font-extrabold leading-none tabular-nums text-cyan-700 dark:text-cyan-300">
            {system.pagesRead}
            <span className="ml-0.5 text-[7px] font-semibold">págs</span>
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-1 text-[8px] font-semibold tabular-nums">
        <span className={cn('truncate', pct != null && pct >= 100 ? 'text-emerald-500' : 'text-muted-foreground')}>
          {pct != null ? `${pct}% de la meta` : 'Sin meta de minutos'}
          {system.daysSkipped ? ` · ${system.daysSkipped} saltados` : ''}
        </span>
        <span
          className="shrink-0 text-muted-foreground"
          title={`${system.daysDone ?? 0} de ${system.daysTotal ?? 0} días cumplidos${system.daysSkipped ? ` · ${system.daysSkipped} saltados` : ''}${system.restDays ? ` · ${system.restDays} descansos` : ''}`}
        >
          {system.daysDone ?? 0}/{system.daysTotal ?? 0} días
        </span>
      </div>

      {pct != null && (
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full',
              pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {system.status && system.status.length > 1 && (
        <div className="flex gap-px">
          {buckets.map(bucket => (
            <span
              key={bucket.key}
              title={bucketStatusTitle(bucket, todayKey)}
              className={cn(
                'h-1.5 flex-1 rounded-[1px]',
                bucketStatusColor(bucket, todayKey),
              )}
            />
          ))}
        </div>
      )}

      {buckets.some(bucket => bucket.minutes > 0) && (
        <div className="flex h-3.5 items-end gap-px">
          {buckets.map(bucket => (
            <span
              key={bucket.key}
              title={bucketSparkTitle(bucket)}
              className={cn('flex-1 rounded-sm', bucketSparkColor(bucket, todayKey))}
              style={{ height: `${bucketSparkHeight(bucket, sparkMax)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const AREA_STATUS_META: Record<PlanAreaStatus, {
  label: string;
  dot: string;
  text: string;
  border: string;
}> = {
  green: {
    label: 'Dando resultados',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
  amber: {
    label: 'En ajuste',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  red: {
    label: 'Roto o abandonado',
    dot: 'bg-red-500',
    text: 'text-red-500',
    border: 'border-red-500/30',
  },
  grey: {
    label: 'Sin datos',
    dot: 'bg-muted-foreground/60',
    text: 'text-muted-foreground',
    border: 'border-border/60',
  },
};

const pctText = (value?: number | null): string =>
  value == null ? '—' : `${Math.round(value)}%`;

function HeaderChip({
  children,
  hint,
  tone,
}: {
  children: React.ReactNode;
  hint?: string;
  tone?: 'green' | 'red' | 'muted';
}) {
  return (
    <span
      title={hint}
      className={cn(
        'rounded-md border px-1.5 py-0.5 font-semibold',
        tone === 'green'
          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : tone === 'red'
            ? 'border-red-500/25 bg-red-500/10 text-red-500'
            : 'border-border/50 bg-foreground/5 text-muted-foreground'
      )}
    >
      {children}
    </span>
  );
}

/**
 * Cabecera del área: cumplimiento, sistemas activos, ancla más débil,
 * tendencia, semanas verdes, anclas vs mantenimiento y Esf/Res del Punto B.
 */
export function PlanAreaHeader({
  area,
  scope,
  embedded = false,
}: {
  area: PlanAreaMetrics;
  scope: PlanificationScope;
  /** Sin portada ni tarjeta propia: se integra como cabecera de la tabla. */
  embedded?: boolean;
}) {
  const status = AREA_STATUS_META[area.status];
  const trendToneValue = area.trend == null
    ? 'muted'
    : area.trend > 0
      ? 'green'
      : area.trend < 0
        ? 'red'
        : 'muted';

  return (
    <div className={cn(
      'overflow-hidden bg-white/80 dark:bg-zinc-950/80',
      embedded
        ? 'rounded-none border-b border-border/50'
        : cn('rounded-2xl border shadow-sm', status.border),
    )}>
      <div className="flex items-center gap-2 px-2.5 pt-2.5">
        <div className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg',
          embedded ? 'bg-muted' : cn('bg-gradient-to-br', getCoverGradient(area.id)),
        )}>
          {area.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', status.dot)} />
            <h4 className="truncate text-[13px] font-bold leading-tight">{area.label}</h4>
            <span className="shrink-0 rounded bg-foreground/5 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wide text-muted-foreground">
              {area.kind === 'estructural' ? 'Estructura' : 'Central'}
            </span>
          </div>
          <p className="truncate text-[9px] text-muted-foreground">
            {status.label} · {area.activeSystems}/{area.totalSystems} activos · {area.systemsOnTarget}/{area.totalSystems} en meta
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className={cn('text-2xl font-extrabold leading-none tabular-nums', status.text)}>
            {area.compliance == null ? '—' : `${area.compliance}%`}
          </span>
          <span className="block text-[7px] uppercase tracking-wide text-muted-foreground">cumplimiento</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-2.5 pt-2 text-[8px]">
        <HeaderChip hint="Cumplimiento de los sistemas ancla frente a los de mantenimiento">
          Anclas {pctText(area.anchorCompliance)} · Mant. {pctText(area.maintenanceCompliance)}
        </HeaderChip>
        <HeaderChip hint="El ancla con menor cumplimiento del periodo">
          {area.weakestAnchor
            ? `Ancla débil: ${area.weakestAnchor.name} ${area.weakestAnchor.compliance}%`
            : 'Sin anclas con datos'}
        </HeaderChip>
        <HeaderChip
          tone={trendToneValue}
          hint="Diferencia de cumplimiento contra el periodo anterior"
        >
          Tend. {trendLabel(area.trend)} pts
        </HeaderChip>
        <HeaderChip
          tone={area.greenWeeks > 0 ? 'green' : 'muted'}
          hint="Semanas con ≥80% de cumplimiento"
        >
          Verde {area.greenWeeks}/{area.totalWeeks} sem
        </HeaderChip>
        {scope !== 'month' && area.monthCompliance != null && (
          <HeaderChip hint="Cumplimiento del mes que contiene este periodo">
            Mes {area.monthCompliance}%
          </HeaderChip>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 px-2.5 py-2">
        <Meter
          label="Esf"
          value={area.effort}
          bar="bg-violet-500"
          hint="Esfuerzo del área (Punto B)"
        />
        <Meter
          label="Res"
          value={area.results}
          bar="bg-emerald-500"
          hint="Resultados del área (Punto B)"
        />
      </div>

      {area.weeks.length > 0 && (
        <div className="flex h-1.5 gap-0.5 px-2.5 pb-2.5">
          {area.weeks.map(week => {
            const value = week.compliance;
            const color = value == null
              ? 'bg-muted'
              : value >= 80
                ? 'bg-emerald-500'
                : value >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500';
            return (
              <span
                key={week.key}
                title={`Semana del ${week.key}: ${value == null ? '—' : `${value}%`}`}
                className={cn('flex-1 rounded-sm', color)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ObjectiveRow({ item }: { item: PlanObjectiveRow }) {
  const dateText = rowDateText(item);

  const body = (
    <>
      {item.cover ? (
        <img
          src={item.cover}
          alt={item.title}
          className="h-8 w-6 shrink-0 rounded border border-border/40 object-cover"
        />
      ) : (
        <span className="shrink-0 text-sm leading-none">{item.emoji ?? '•'}</span>
      )}

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-[9px] font-bold leading-tight',
            item.done && 'text-muted-foreground line-through'
          )}
        >
          {item.title}
        </span>
        {item.subtitle && (
          <span className="block truncate text-[8px] leading-tight text-muted-foreground">{item.subtitle}</span>
        )}
        {item.meta && (
          <span className="block truncate text-[8px] leading-tight text-muted-foreground/80">{item.meta}</span>
        )}
        {dateText && (
          <span className="block truncate text-[7px] leading-tight text-muted-foreground/80 tabular-nums">
            {dateText}
          </span>
        )}
      </span>

      {item.tag && (
        <span className="shrink-0 rounded border border-indigo-500/25 bg-indigo-500/10 px-1.5 py-0.5 text-[8px] font-bold text-indigo-600 dark:text-indigo-400">
          {item.tag}
        </span>
      )}

      {item.onToggle && (
        <span
          className={cn(
            'grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
            item.done
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-muted-foreground/30 group-hover/objective:border-emerald-400'
          )}
        >
          {item.done && <Check className="h-3 w-3" />}
        </span>
      )}
    </>
  );

  const hasActions = !!(item.onEdit || item.onDelete);

  if (!item.onToggle && !hasActions) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-foreground/5 px-1.5 py-1">{body}</div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-0.5">
      {item.onToggle ? (
        <button
          type="button"
          onClick={item.onToggle}
          className={cn(
            'group/objective flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1.5 py-1 text-left transition-colors transition-shadow',
            item.done ? 'bg-emerald-500/10 hover:bg-emerald-500/15' : 'bg-foreground/5 hover:bg-emerald-500/10'
          )}
        >
          {body}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-foreground/5 px-1.5 py-1">
          {body}
        </div>
      )}

      {hasActions && (
        <span className="flex shrink-0 flex-col gap-0.5">
          {item.onEdit && (
            <button
              type="button"
              onClick={item.onEdit}
              title="Editar meta"
              aria-label={`Editar ${item.title}`}
              className="grid h-3.5 w-3.5 place-items-center rounded text-muted-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>
          )}
          {item.onDelete && (
            <button
              type="button"
              onClick={item.onDelete}
              title="Eliminar meta"
              aria-label={`Eliminar ${item.title}`}
              className="grid h-3.5 w-3.5 place-items-center rounded text-muted-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          )}
        </span>
      )}
    </div>
  );
}
