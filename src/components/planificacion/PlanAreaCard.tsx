import { Check } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCoverGradient } from '@/components/areas/AreaCover';
import {
  AREA_STATE_COLOR,
  DIAGNOSIS_TONE,
  areaStateColor,
  diagnoseArea,
} from '@/lib/areaSystemsMap';
import { cn } from '@/lib/utils';

/** Estado de un día dentro del periodo (mismo lenguaje que la pestaña Sistemas). */
export type PlanDayStatus = 'done' | 'partial' | 'skip' | 'none';

/**
 * Rendimiento real de un sistema de vida durante el periodo. Se alimenta de
 * `daily_systems_tracking` (minutos, días cumplidos, racha y estados por día) y
 * de los scores de esfuerzo/resultados del Punto B.
 */
export interface PlanSystemMetrics {
  actualMinutes: number;
  /** Minutos planificados para el periodo (meta de la jerarquía). */
  plannedMinutes?: number;
  daysDone: number;
  daysTotal: number;
  daysSkipped?: number;
  /** % de esfuerzo del área a la que pertenece el sistema. */
  effort?: number;
  /**
   * % de resultados del Punto B. Se usa solo cuando el sistema no tiene
   * objetivos marcables en el periodo (la barra "Res" prioriza los objetivos).
   */
  results?: number;
  streak?: number;
  bestStreak?: number;
  status?: PlanDayStatus[];
  /** Minutos reales por día (para la mini tendencia). */
  spark?: number[];
  /** Fechas del periodo (yyyy-MM-dd) para distinguir días futuros. */
  days?: string[];
}

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
  items: PlanObjectiveRow[];
}

const STATUS_LABEL: Record<PlanDayStatus, string> = {
  done: 'Cumplido',
  partial: 'Parcial',
  skip: 'Saltado',
  none: 'Sin registro',
};

const STATUS_COLOR: Record<PlanDayStatus, string> = {
  done: 'bg-emerald-500',
  partial: 'bg-blue-500',
  skip: 'bg-red-500',
  none: 'bg-red-500/25',
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

/**
 * Tarjeta de área con el mismo lenguaje visual que las tarjetas de Sistemas:
 * portada arriba, rendimiento real del sistema, objetivos dentro y los minutos
 * del periodo al pie.
 */
export function PlanAreaCard({ card }: { card: PlanAreaCardData }) {
  const toggleable = card.items.filter(i => i.onToggle);
  const doneCount = toggleable.filter(i => i.done).length;
  // Objetivos con estado de cumplimiento: alimentan la barra "Res" del sistema.
  const measurable = card.items.filter(i => i.done !== undefined);
  const complete = toggleable.length > 0 && doneCount === toggleable.length;
  const counter = toggleable.length > 0
    ? `${doneCount}/${toggleable.length}`
    : card.items.length > 0
      ? `${card.items.length}`
      : '';

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl ring-2 transition-colors',
        complete
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
        </div>

        {card.system && (
          <SystemMetrics
            system={card.system}
            objectivesDone={measurable.filter(item => item.done === true).length}
            objectivesTotal={measurable.length}
          />
        )}

        {card.items.length > 0 ? (
          <div className="space-y-1">
            {card.items.map(item => (
              <ObjectiveRow key={item.id} item={item} />
            ))}
          </div>
        ) : !card.system ? (
          <p className="text-[9px] leading-tight text-muted-foreground/80">Solo meta de minutos</p>
        ) : null}

        {!card.system && (card.minutes ?? 0) > 0 && (
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

/**
 * Rendimiento del sistema: diagnóstico, esfuerzo/resultados, minutos, días y racha.
 * La barra "Res" se calcula solo con los objetivos marcados en el periodo; si no
 * hay objetivos marcables se muestra "—". El Punto B queda como respaldo únicamente
 * para el diagnóstico del área.
 */
function SystemMetrics({
  system,
  objectivesDone = 0,
  objectivesTotal = 0,
}: {
  system: PlanSystemMetrics;
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
  const spark = system.spark ?? [];
  const sparkMax = Math.max(1, ...spark);

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
          <span className="text-[9px] text-muted-foreground">min</span>
        </div>
        {planned > 0 && (
          <span
            className="shrink-0 text-[9px] font-semibold text-muted-foreground tabular-nums"
            title="Objetivo de minutos del periodo"
          >
            /{planned}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-1 text-[8px] font-semibold tabular-nums">
        <span className={cn('truncate', pct != null && pct >= 100 ? 'text-emerald-500' : 'text-muted-foreground')}>
          {pct != null ? `${pct}% de la meta` : 'Sin meta de minutos'}
          {system.daysSkipped ? ` · ${system.daysSkipped} saltados` : ''}
        </span>
        <span
          className="shrink-0 text-muted-foreground"
          title={`${system.daysDone ?? 0} de ${system.daysTotal ?? 0} días cumplidos${system.daysSkipped ? ` · ${system.daysSkipped} saltados` : ''}`}
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
          {system.status.map((status, index) => {
            const future = !!system.days?.[index] && system.days[index] > todayKey;
            return (
              <span
                key={index}
                title={future ? 'Pendiente' : STATUS_LABEL[status]}
                className={cn(
                  'h-1.5 flex-1 rounded-[1px]',
                  future ? 'bg-muted-foreground/20' : STATUS_COLOR[status]
                )}
              />
            );
          })}
        </div>
      )}

      {spark.some(value => value > 0) && (
        <div className="flex h-3.5 items-end gap-px">
          {spark.map((value, index) => {
            const status = system.status?.[index] ?? 'none';
            const future = !!system.days?.[index] && system.days[index] > todayKey;
            const missed = !future && status !== 'done' && status !== 'partial';
            return (
              <span
                key={index}
                title={`${value} min`}
                className={cn(
                  'flex-1 rounded-sm',
                  future ? 'bg-muted-foreground/20' : STATUS_COLOR[status]
                )}
                style={{ height: `${Math.max(missed ? 16 : 8, (value / sparkMax) * 100)}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ObjectiveRow({ item }: { item: PlanObjectiveRow }) {
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

  if (!item.onToggle) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-foreground/5 px-1.5 py-1">{body}</div>
    );
  }

  return (
    <button
      type="button"
      onClick={item.onToggle}
      className={cn(
        'group/objective flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-left transition-colors transition-shadow',
        item.done ? 'bg-emerald-500/10 hover:bg-emerald-500/15' : 'bg-foreground/5 hover:bg-emerald-500/10'
      )}
    >
      {body}
    </button>
  );
}
