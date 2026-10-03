import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, ImagePlus, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DireccionAreaChip } from '@/components/direccion/DireccionAreaChip';
import { DireccionSubAreaCard } from '@/components/direccion/DireccionSubAreaCard';
import { DireccionTrendChart } from '@/components/direccion/DireccionTrendChart';
import { scoreBg, scoreColor } from '@/components/direccion/DireccionCardParts';
import { isDireccionExpandedArea, LIFE_AREA_SECTIONS } from '@/data/lifeAreaSections';
import { coverKey, useAreaCovers } from '@/hooks/useAreaCovers';
import { useImageUpload } from '@/hooks/useImageUpload';
import { DIRECCION_HORIZON_DAYS, formatMinutes, useDireccionData } from '@/hooks/useDireccionData';

export function DireccionSection() {
  const data = useDireccionData('month');
  const { covers, saveCover } = useAreaCovers();
  const { uploadImage } = useImageUpload();
  const [busy, setBusy] = useState<string | null>(null);

  const handleUploadSubCover = async (id: string, file: File) => {
    setBusy(coverKey('sub', id));
    try {
      const url = await uploadImage(file, 'area-covers');
      if (url) await saveCover('sub', id, url);
    } finally {
      setBusy(null);
    }
  };

  // El resumen se calcula sobre las sub-áreas que se pintan como tarjetas, no
  // sobre las 10 áreas: si no, "más avanzada" elegiría siempre un área entera.
  const summary = useMemo(() => {
    const subs = data.subAreas;
    const best = [...subs].sort((a, b) => b.esfuerzo - a.esfuerzo)[0] ?? null;
    const lowest = [...subs].sort((a, b) => a.esfuerzo - b.esfuerzo)[0] ?? null;
    const avgEsfuerzo = subs.length
      ? Math.round(subs.reduce((a, x) => a + x.esfuerzo, 0) / subs.length)
      : 0;
    const avgWeekMinutes = subs.length
      ? Math.round(subs.reduce((a, x) => a + x.weekMinutes, 0) / subs.length)
      : 0;
    const weekDelta = subs.length
      ? Math.round(subs.reduce((a, x) => a + x.weekDelta, 0) / subs.length)
      : 0;
    return { best, lowest, avgEsfuerzo, avgWeekMinutes, weekDelta };
  }, [data.subAreas]);

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
          Esfuerzo de hoy y de la semana, racha diaria L M M J V S D y tendencia real sobre los últimos {data.days}{' '}
          días. Las áreas centrales se despliegan en sub-áreas; el resto se resume en un icono.
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
          {data.subAreas.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <HeadlineBox
                label="Esfuerzo medio"
                value={`${summary.avgEsfuerzo}%`}
                sub={`${data.subAreas.length} sub-áreas`}
              />
              <HeadlineBox
                label="Esfuerzo semanal"
                value={formatMinutes(summary.avgWeekMinutes)}
                sub={`${summary.weekDelta >= 0 ? '+' : ''}${summary.weekDelta}% vs 7 días previos`}
                tone={summary.weekDelta >= 0 ? 'good' : 'bad'}
              />
              <HeadlineBox
                label="Sub-área más avanzada"
                value={summary.best?.label ?? '—'}
                sub={summary.best ? `${summary.best.esfuerzo}% esfuerzo` : undefined}
              />
              <HeadlineBox
                label="Sub-área más débil"
                value={summary.lowest?.label ?? '—'}
                sub={summary.lowest ? `${summary.lowest.esfuerzo}% esfuerzo` : undefined}
                alert
              />
            </div>
          )}

          {LIFE_AREA_SECTIONS.map(section => {
            const sectionAreas = data.areas.filter(a => a.group === section.key);
            if (sectionAreas.length === 0) return null;
            const Icon = section.icon;
            const expandedAreas = sectionAreas.filter(a => isDireccionExpandedArea(a.areaId));
            const chipAreas = sectionAreas.filter(a => !isDireccionExpandedArea(a.areaId));

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

                {expandedAreas.map(area => {
                  const areaSubs = data.subAreas.filter(s => s.parentAreaId === area.areaId);
                  if (areaSubs.length === 0) return null;

                  return (
                    <div key={area.areaId} className="space-y-2 pt-1">
                      <AreaHeader area={area} subCount={areaSubs.length} />
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {areaSubs.map(sub => (
                          <DireccionSubAreaCard
                            key={sub.areaId}
                            sub={sub}
                            icon={area.icon}
                            coverUrl={covers[coverKey('sub', sub.areaId)] ?? null}
                            uploading={busy === coverKey('sub', sub.areaId)}
                            onUploadCover={(file) => handleUploadSubCover(sub.areaId, file)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {chipAreas.length > 0 && (
                  <div className="grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 pt-1">
                    {chipAreas.map(area => (
                      <DireccionAreaChip key={area.areaId} area={area} />
                    ))}
                  </div>
                )}
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

/** Cabecera del área desplegada: emoji, nombre, esfuerzo agregado y sus sub-áreas. */
function AreaHeader({
  area,
  subCount,
}: {
  area: { label: string; icon: string; esfuerzo: number; weekMinutes: number };
  subCount: number;
}) {
  return (
    <div className="flex items-center gap-2.5 pl-3 border-l-2 border-primary/40">
      <span className="text-base leading-none shrink-0">{area.icon}</span>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold tracking-tight truncate">{area.label}</h4>
        <p className="text-[10px] text-muted-foreground truncate">
          {subCount} sub-áreas · {formatMinutes(area.weekMinutes)} esta semana
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <span className={cn('text-xs font-bold tabular-nums', scoreColor(area.esfuerzo))}>{area.esfuerzo}%</span>
        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, area.esfuerzo))}%`,
              backgroundColor: scoreBg(area.esfuerzo),
            }}
          />
        </div>
      </div>
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