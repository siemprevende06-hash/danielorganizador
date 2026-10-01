import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Compass, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DireccionAreasGrid } from '@/components/direccion/DireccionAreaCard';
import { DireccionTrendChart } from '@/components/direccion/DireccionTrendChart';
import { DIRECCION_HORIZON_DAYS, formatMinutes, useDireccionData } from '@/hooks/useDireccionData';

const RANGES = [
  { days: 30, label: '30d' },
  { days: 60, label: '60d' },
  { days: 120, label: '120d' },
];

export function DireccionSection() {
  const data = useDireccionData('month');

  const summary = useMemo(() => {
    const totalMinutes = data.areas.reduce((a, x) => a + x.totalMinutes, 0);
    const best = [...data.areas].sort((a, b) => b.totalMinutes - a.totalMinutes)[0] ?? null;
    const lowest = [...data.areas].sort((a, b) => a.esfuerzo - b.esfuerzo)[0] ?? null;
    const avgEsfuerzo = data.areas.length
      ? Math.round(data.areas.reduce((a, x) => a + x.esfuerzo, 0) / data.areas.length)
      : 0;
    return { totalMinutes, best, lowest, avgEsfuerzo };
  }, [data.areas]);

  if (data.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56 rounded-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Dirección</h2>
          <Badge variant="outline" className="text-[10px]">
            <Sparkles className="h-3 w-3 mr-1" />
            Pronóstico a {DIRECCION_HORIZON_DAYS} días
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Dónde estás realmente y hacia dónde vas. Áreas centrales del modelo, tendencia de esfuerzo y pronóstico validado
          estadísticamente sobre los últimos {data.days} días.
        </p>
      </div>

      {!data.hasData && (
        <div className="rounded-xl border border-dashed border-border/60 p-6 text-center space-y-1">
          <p className="text-sm font-medium">Sin datos de esfuerzo registrados</p>
          <p className="text-xs text-muted-foreground">
            Registra minutos por área desde Esfuerzo o Sistemas para activar la tendencia y el pronóstico.
          </p>
        </div>
      )}

      {data.hasData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <HeadlineBox label="Esfuerzo medio" value={`${summary.avgEsfuerzo}%`} sub="áreas centrales" />
            <HeadlineBox label="Esfuerzo acumulado" value={formatMinutes(summary.totalMinutes)} sub={`${data.days} días`} />
            <HeadlineBox label="Área más activa" value={summary.best?.label ?? '—'} sub={summary.best ? formatMinutes(summary.best.totalMinutes) : undefined} />
            <HeadlineBox label="Área más débil" value={summary.lowest?.label ?? '—'} sub={summary.lowest ? `${summary.lowest.esfuerzo}% esfuerzo` : undefined} alert />
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Áreas centrales</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{data.areas.length} áreas</span>
            </div>
            <DireccionAreasGrid areas={data.areas} loading={data.loading} />
          </section>

          <section className="space-y-2">
            <DireccionTrendChart globalPoints={data.globalPoints} />
          </section>
        </>
      )}
    </div>
  );
}

function HeadlineBox({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className={cn("p-3 rounded-xl border space-y-0.5", alert ? "border-rose-500/30 bg-rose-500/5" : "border-border/50 bg-white/70 dark:bg-zinc-950/70")}>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-bold truncate", alert && "text-rose-600")}>{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default DireccionSection;