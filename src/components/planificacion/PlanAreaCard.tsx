import { Check } from 'lucide-react';
import { getCoverGradient } from '@/components/areas/AreaCover';
import { cn } from '@/lib/utils';

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
  items: PlanObjectiveRow[];
}

/**
 * Tarjeta de área con el mismo lenguaje visual que las tarjetas de Sistemas:
 * portada arriba, objetivos dentro y los minutos del periodo al pie.
 */
export function PlanAreaCard({ card }: { card: PlanAreaCardData }) {
  const toggleable = card.items.filter(i => i.onToggle);
  const doneCount = toggleable.filter(i => i.done).length;
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

        {card.items.length > 0 ? (
          <div className="space-y-1">
            {card.items.map(item => (
              <ObjectiveRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-[9px] leading-tight text-muted-foreground/80">Solo meta de minutos</p>
        )}

        {(card.minutes ?? 0) > 0 && (
          <div className="mt-auto flex items-baseline gap-1 pt-0.5">
            <span className="text-xl font-extrabold leading-none tabular-nums">{card.minutes}</span>
            <span className="text-[9px] text-muted-foreground">{card.minutesUnit ?? 'min'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ObjectiveRow({ item }: { item: PlanObjectiveRow }) {
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
