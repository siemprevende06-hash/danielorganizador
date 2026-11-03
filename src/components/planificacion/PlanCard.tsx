import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlanItem {
  id: string;
  title: string;
  subtitle?: string;
  /** Etiqueta corta a la derecha (ej. "Aprender", "Leyendo"). */
  tag?: string;
  /** Dato numérico a la derecha (ej. "120 min", "800 ELO"). */
  meta?: string;
  /** Estado de completado. Solo se usa si hay `onToggle`. */
  done?: boolean;
  /** Si existe, la fila es interactiva (checkbox). */
  onToggle?: () => void;
}

interface PlanCardProps {
  icon: ReactNode;
  title: string;
  items: PlanItem[];
  /** Color suave del icono, ej. "bg-blue-500/10 text-blue-500". */
  accent?: string;
  hint?: string;
}

/**
 * Tarjeta minimalista de un bloque de planificación: icono, título, contador y
 * lista de filas. Devuelve `null` si no hay nada planificado, para que la vista
 * se quede limpia.
 */
export function PlanCard({ icon, title, items, accent, hint }: PlanCardProps) {
  if (items.length === 0) return null;

  const toggleable = items.filter(i => i.onToggle);
  const doneCount = toggleable.filter(i => i.done).length;

  return (
    <section className="rounded-2xl border border-border/60 bg-background/70 shadow-sm overflow-hidden">
      <header className="flex items-center gap-2 px-3 pt-3 pb-1.5">
        <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-lg', accent ?? 'bg-primary/10 text-primary')}>
          {icon}
        </span>
        <h3 className="flex-1 truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {toggleable.length > 0 ? `${doneCount}/${toggleable.length}` : items.length}
        </span>
      </header>

      <ul className="px-1.5 pb-1.5">
        {items.map(item => (
          <PlanRow key={item.id} item={item} />
        ))}
      </ul>

      {hint && <p className="px-3 pb-2 text-[10px] leading-tight text-muted-foreground/80">{hint}</p>}
    </section>
  );
}

function PlanRow({ item }: { item: PlanItem }) {
  const body = (
    <>
      {item.onToggle ? (
        <span
          className={cn(
            'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
            item.done
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-muted-foreground/30 group-hover/row:border-emerald-400'
          )}
        >
          {item.done && <Check className="h-3 w-3" />}
        </span>
      ) : (
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
      )}

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-xs font-medium leading-tight',
            item.done && 'text-muted-foreground line-through'
          )}
        >
          {item.title}
        </span>
        {item.subtitle && (
          <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted-foreground">
            {item.subtitle}
          </span>
        )}
      </span>

      {item.tag && (
        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
          {item.tag}
        </span>
      )}
      {item.meta && (
        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {item.meta}
        </span>
      )}
    </>
  );

  if (!item.onToggle) {
    return <li className="flex items-start gap-2 px-1.5 py-1">{body}</li>;
  }

  return (
    <li>
      <button
        type="button"
        onClick={item.onToggle}
        className="group/row flex w-full items-start gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-muted/40"
      >
        {body}
      </button>
    </li>
  );
}
