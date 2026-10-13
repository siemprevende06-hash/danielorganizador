import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Activity,
  GraduationCap,
  Briefcase,
  FolderKanban,
  BookOpen,
  Music,
  Crown,
  Gamepad2,
  Languages,
  Dumbbell,
  Coins,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { getAreaLabel } from '@/lib/periodFocus';
import { DEFAULT_GOALS, type AreaId } from '@/hooks/useDailyAreaStats';
import type { PeriodFocusRow } from '@/hooks/usePeriodFocus';

interface Props {
  focuses: PeriodFocusRow[];
  timeData?: Record<string, number>;
  workoutDuration?: number;
}

const AREA_ICONS: Record<string, LucideIcon> = {
  universidad: GraduationCap,
  emprendimiento: Briefcase,
  proyectos: FolderKanban,
  lectura: BookOpen,
  musica: Music,
  ajedrez: Crown,
  game: Gamepad2,
  idiomas: Languages,
  gym: Dumbbell,
  finanzas: Coins,
};

function areaMinutes(areaId: string, timeData: Record<string, number>, workoutDuration: number): number {
  switch (areaId) {
    case 'gym':
      return workoutDuration;
    case 'idiomas':
      return (timeData.idiomas ?? 0) + (timeData.italiano ?? 0) + (timeData.ingles ?? 0);
    default:
      return timeData[areaId] ?? 0;
  }
}

export function FocusSystemsSection({ focuses, timeData = {}, workoutDuration = 0 }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, PeriodFocusRow[]>();
    for (const focus of focuses) {
      if (!focus.area_id) continue;
      const list = map.get(focus.area_id) ?? [];
      list.push(focus);
      map.set(focus.area_id, list);
    }
    return Array.from(map.entries());
  }, [focuses]);

  if (groups.length === 0) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Activity className="h-4 w-4 text-primary" />
        Sistemas de tus focos
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {groups.map(([areaId, items]) => {
          const Icon = AREA_ICONS[areaId] ?? Target;
          const label = getAreaLabel(areaId) ?? areaId;
          const minutes = areaMinutes(areaId, timeData, workoutDuration);
          const goal = DEFAULT_GOALS[areaId as AreaId]?.time ?? 30;
          const pct = goal > 0 ? Math.min(100, Math.round((minutes / goal) * 100)) : 0;
          const reached = goal > 0 && minutes >= goal;

          return (
            <div key={areaId} className="rounded-xl border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="grid place-items-center size-8 shrink-0 rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</span>
                <span className={cn('shrink-0 text-xs font-bold tabular-nums', reached ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                  {minutes}
                  <span className="font-normal text-[10px]">/{goal} min</span>
                </span>
              </div>

              <Progress value={pct} className="h-1.5" />

              <div className="flex flex-wrap gap-1">
                {items.map((focus) => (
                  <span
                    key={focus.id}
                    className={cn(
                      'inline-flex max-w-full items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px]',
                      focus.status === 'done' && 'opacity-60 line-through',
                    )}
                  >
                    {focus.is_primary && <span className="text-amber-400">★</span>}
                    <span className="truncate">{focus.title}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
