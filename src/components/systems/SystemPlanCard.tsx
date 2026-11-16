import type { ReactNode } from 'react';
import { getCoverGradient } from '@/components/areas/AreaCover';
import { planSystemEmoji } from '@/lib/planMananaTasks';
import { cn } from '@/lib/utils';

interface SystemPlanCardProps {
  /** Id del sistema: define el degradado de la portada y el emoji por defecto. */
  systemId: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  cover?: string | null;
  /** Dato superior izquierdo de la portada (minutos, XP, ELO…). */
  metric?: ReactNode;
  /** Etiqueta superior derecha de la portada (periodo, estado…). */
  badge?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * Tarjeta visual de sistema para las páginas de planificación.
 * Reutiliza la portada compacta de las tarjetas de /plan-manana para que la
 * planificación semanal y mensual hable el mismo idioma visual.
 */
export function SystemPlanCard({
  systemId,
  title,
  subtitle,
  emoji,
  cover,
  metric,
  badge,
  className,
  bodyClassName,
  children,
}: SystemPlanCardProps) {
  return (
    <section
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl bg-white/85 shadow-sm ring-2 ring-border/40 dark:bg-zinc-950/80',
        className,
      )}
    >
      <div className={cn('relative h-14 w-full shrink-0 overflow-hidden bg-gradient-to-br', getCoverGradient(systemId))}>
        {cover ? (
          <img src={cover} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-2xl drop-shadow-sm">{emoji ?? planSystemEmoji(systemId)}</span>
          </div>
        )}
        {metric !== undefined && metric !== null && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-white backdrop-blur-sm">
            {metric}
          </span>
        )}
        {badge !== undefined && badge !== null && (
          <span className="absolute right-1.5 top-1.5 max-w-[70%] truncate rounded-full bg-black/45 px-1.5 py-0.5 text-[8px] font-bold text-white backdrop-blur-sm">
            {badge}
          </span>
        )}
      </div>

      <div className={cn('flex flex-1 flex-col gap-2 p-2.5', bodyClassName)}>
        <div className="min-w-0">
          <h3 className="truncate text-[11px] font-bold leading-tight">{title}</h3>
          {subtitle && (
            <p className="truncate text-[8px] leading-tight text-muted-foreground" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export default SystemPlanCard;
