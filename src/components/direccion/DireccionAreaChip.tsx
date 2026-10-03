import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { scoreBg, scoreColor } from '@/components/direccion/DireccionCardParts';
import { DIRECCION_AREA_LINKS } from '@/data/lifeAreaSections';
import { formatMinutes, type DireccionAreaSeries } from '@/hooks/useDireccionData';

/**
 * Resumen de un área que Dirección no despliega: icono, % de esfuerzo y lo que
 * hiciste hoy. Enlaza a la página del área para no perder el atajo.
 */
export function DireccionAreaChip({ area }: { area: DireccionAreaSeries }) {
  const to = DIRECCION_AREA_LINKS[area.areaId];
  const inner = (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base leading-none shrink-0 drop-shadow-sm">{area.icon}</span>
        <span className="text-[11px] font-semibold truncate">{area.label}</span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className={cn('text-sm font-bold tabular-nums', scoreColor(area.esfuerzo))}>
          {area.esfuerzo}%
        </span>
        <span className="text-[9px] text-muted-foreground tabular-nums shrink-0">
          {area.todayMinutes > 0 ? `hoy ${formatMinutes(area.todayMinutes)}` : 'sin registro hoy'}
        </span>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, area.esfuerzo))}%`, backgroundColor: scoreBg(area.esfuerzo) }}
        />
      </div>
    </>
  );

  const className =
    'block space-y-1.5 rounded-xl border border-border/50 bg-white/70 dark:bg-zinc-950/70 p-2.5 text-left transition-colors';

  if (!to) {
    return <div className={className}>{inner}</div>;
  }

  return (
    <Link to={to} className={cn(className, 'hover:border-primary/40 hover:bg-primary/5')}>
      {inner}
    </Link>
  );
}

export default DireccionAreaChip;