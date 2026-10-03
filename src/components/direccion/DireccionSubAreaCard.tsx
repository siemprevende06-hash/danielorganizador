import { Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AreaCover, getCoverGradient } from '@/components/areas/AreaCover';
import { MetricTile, ScoreBar, WeekStreak, scoreColor } from '@/components/direccion/DireccionCardParts';
import { formatMinutes, type DireccionSubAxisSeries } from '@/hooks/useDireccionData';

/** "0 → 24 libros/año", la meta del Punto B de la sub-área. */
function pointBGoal(sub: DireccionSubAxisSeries): string {
  const range = `${sub.start} → ${sub.target}`;
  return sub.unit ? `${range} ${sub.unit}` : range;
}

export function DireccionSubAreaCard({
  sub,
  icon,
  coverUrl,
  uploading,
  onUploadCover,
}: {
  sub: DireccionSubAxisSeries;
  /** Emoji del área padre: las sub-áreas no tienen icono propio. */
  icon?: string;
  coverUrl?: string | null;
  uploading?: boolean;
  onUploadCover?: (file: File) => void;
}) {
  const advancing = sub.weekDelta >= 0 && sub.weekMinutes > 0;

  return (
    <Card className="overflow-hidden border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-xl hover:shadow-md transition-shadow">
      <AreaCover
        cover={coverUrl ?? null}
        gradient={getCoverGradient(sub.areaId)}
        label={sub.label}
        icon={icon}
        showCamera
        uploading={uploading}
        onUpload={onUploadCover}
        className="h-16"
      />

      <CardContent className="p-3 space-y-2.5">
        <div className="grid grid-cols-4 gap-1">
          <MetricTile
            label="Hoy"
            value={formatMinutes(sub.todayMinutes)}
            sub={`${sub.todayRate}% meta`}
            tone={sub.todayMinutes > 0 ? 'text-primary' : undefined}
          />
          <MetricTile label="7 días" value={formatMinutes(sub.weekMinutes)} sub={`${sub.weekRate}% meta`} />
          <MetricTile
            label="Racha"
            value={`${sub.streakDays}d`}
            sub={`máx ${sub.bestStreakDays}d`}
            tone={sub.streakDays > 0 ? 'text-orange-600' : undefined}
          />
          <MetricTile
            label="Avance"
            value={`${sub.weekDelta >= 0 ? '+' : ''}${sub.weekDelta}%`}
            sub="vs 7 días previos"
            tone={advancing ? 'text-emerald-600' : 'text-rose-600'}
          />
        </div>

        <WeekStreak area={sub} />

        <div className="space-y-1">
          <ScoreBar label="Esfuerzo" value={sub.esfuerzo} />
          <ScoreBar label="Resultados" value={sub.resultados} />
        </div>

        <div className="pt-1.5 border-t border-border/40 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground min-w-0">
            <Target className="h-3 w-3 shrink-0" />
            <span className="truncate">Meta Punto B</span>
          </span>
          <span className={`text-[10px] font-bold tabular-nums shrink-0 ${scoreColor(sub.resultados)}`}>
            {pointBGoal(sub)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default DireccionSubAreaCard;