import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, ImagePlus, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DireccionVisionCard } from '@/components/direccion/DireccionVisionCard';
import { DireccionTrendChart } from '@/components/direccion/DireccionTrendChart';
import { LIFE_AREA_SECTIONS } from '@/data/lifeAreaSections';
import { coverKey, useAreaCovers } from '@/hooks/useAreaCovers';
import { useImageUpload } from '@/hooks/useImageUpload';
import { DIRECCION_HORIZON_DAYS, formatMinutes, useDireccionData } from '@/hooks/useDireccionData';

export function DireccionSection() {
  const data = useDireccionData('month');
  const { covers, saveCover } = useAreaCovers();
  const { uploadImage } = useImageUpload();
  const [busy, setBusy] = useState<string | null>(null);

  const handleUploadCover = async (id: string, file: File) => {
    setBusy(coverKey('area', id));
    try {
      const url = await uploadImage(file, 'area-covers');
      if (url) await saveCover('area', id, url);
    } finally {
      setBusy(null);
    }
  };

  const summary = useMemo(() => {
    const active = data.areas.filter(a => a.totalMinutes > 0 || a.esfuerzo > 0);
    const totalMinutes = active.reduce((a, x) => a + x.totalMinutes, 0);
    const best = [...data.areas].sort((a, b) => b.esfuerzo - a.esfuerzo)[0] ?? null;
    const lowest = [...data.areas].sort((a, b) => a.esfuerzo - b.esfuerzo)[0] ?? null;
    const avgEsfuerzo = data.areas.length
      ? Math.round(data.areas.reduce((a, x) => a + x.esfuerzo, 0) / data.areas.length)
      : 0;
    const avgWeekMinutes = data.areas.length
      ? Math.round(data.areas.reduce((a, x) => a + x.weekMinutes, 0) / data.areas.length)
      : 0;
    const weekDelta = data.areas.length
      ? Math.round(data.areas.reduce((a, x) => a + x.weekDelta, 0) / data.areas.length)
      : 0;
    return { totalMinutes, best, lowest, avgEsfuerzo, avgWeekMinutes, weekDelta };
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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
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
          <Button asChild variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs text-muted-foreground">
            <Link to="/areas-de-vida">
              <ImagePlus className="h-3.5 w-3.5" />
              Portadas
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tu vision board de las {data.areas.length} áreas de vida. Esfuerzo de hoy y de la semana, racha diaria
          L M M J V S D y tendencia real sobre los últimos {data.days} días.
        </p>
      </div>

      {!data.hasData && (
        <div className="rounded-xl border border-dashed border-border/60 p-6 text-center space-y-1">
          <p className="text-sm font-medium">Sin datos de esfuerzo registrados</p>
          <p className="text-xs text-muted-foreground">
            Registra minutos por área desde Esfuerzo o Sistemas para activar la racha semanal y el pronóstico.
          </p>
        </div>
      )}

      {data.hasData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <HeadlineBox label="Esfuerzo medio" value={`${summary.avgEsfuerzo}%`} sub="todas las áreas" />
            <HeadlineBox
              label="Esfuerzo semanal"
              value={formatMinutes(summary.avgWeekMinutes)}
              sub={`${summary.weekDelta >= 0 ? '+' : ''}${summary.weekDelta}% vs 7 días previos`}
              tone={summary.weekDelta >= 0 ? 'good' : 'bad'}
            />
            <HeadlineBox
              label="Área más avanzada"
              value={summary.best?.label ?? '—'}
              sub={summary.best ? `${summary.best.esfuerzo}% esfuerzo` : undefined}
            />
            <HeadlineBox
              label="Área más débil"
              value={summary.lowest?.label ?? '—'}
              sub={summary.lowest ? `${summary.lowest.esfuerzo}% esfuerzo` : undefined}
              alert
            />
          </div>

          {LIFE_AREA_SECTIONS.map(section => {
            const sectionAreas = data.areas.filter(a => a.group === section.key);
            if (sectionAreas.length === 0) return null;
            const Icon = section.icon;

            return (
              <section key={section.key} className="space-y-2.5">
                <div className={cn('flex items-center gap-3 px-3 py-2 rounded-lg bg-gradient-to-r', section.color, section.border)}>
                  <div className={cn('p-2 rounded-full', section.badgeColor)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold tracking-wide truncate">{section.title}</h3>
                    <p className="text-[10px] text-muted-foreground truncate">{section.subtitle}</p>
                  </div>
                  <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                    {sectionAreas.length} {sectionAreas.length === 1 ? 'área' : 'áreas'}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {sectionAreas.map(area => (
                    <DireccionVisionCard
                      key={area.areaId}
                      area={area}
                      coverUrl={covers[coverKey('area', area.areaId)] ?? null}
                      uploading={busy === coverKey('area', area.areaId)}
                      onUploadCover={(file) => handleUploadCover(area.areaId, file)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          <section className="space-y-2">
            <DireccionTrendChart globalPoints={data.globalPoints} />
          </section>
        </>
      )}
    </div>
  );
}

function HeadlineBox({
  label,
  value,
  sub,
  alert,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  tone?: 'good' | 'bad';
}) {
  return (
    <div
      className={cn(
        'p-3 rounded-xl border space-y-0.5',
        alert
          ? 'border-rose-500/30 bg-rose-500/5'
          : 'border-border/50 bg-white/70 dark:bg-zinc-950/70',
      )}
    >
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-bold truncate', alert && 'text-rose-600', tone === 'good' && 'text-emerald-600', tone === 'bad' && 'text-rose-600')}>
        {value}
      </p>
      {sub && (
        <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 truncate">
          {tone && (tone === 'good' ? <TrendingUp className="h-2.5 w-2.5 shrink-0" /> : <TrendingDown className="h-2.5 w-2.5 shrink-0" />)}
          {sub}
        </p>
      )}
    </div>
  );
}

export default DireccionSection;