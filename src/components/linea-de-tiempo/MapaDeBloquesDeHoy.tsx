import { CheckCircle2, Circle, MinusCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeDisplay, type RoutineBlock } from '@/hooks/useRoutineBlocks';
import { AREA_LABELS } from '@/lib/hierarchy';

export interface BlockSnapshot {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  area?: string;
  isExtra?: boolean;
  state: 'done' | 'pending' | 'skipped';
}

interface Props {
  blocks: BlockSnapshot[];
  totalToday: number;
  doneToday: number;
}

export function MapaDeBloquesDeHoy({ blocks, totalToday, doneToday }: Props) {
  const pct = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">El poder de hoy</p>
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">
          {doneToday}/{totalToday} bloques
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {blocks.map(b => {
          const Icon = b.state === 'done' ? CheckCircle2 : b.state === 'skipped' ? MinusCircle : Circle;
          return (
            <div
              key={b.id}
              className={cn(
                'rounded-xl border p-2.5 flex items-center gap-2',
                b.state === 'done' && 'border-success/30 bg-success/5',
                b.state === 'skipped' && 'border-border bg-muted/40 opacity-60',
                b.state === 'pending' && 'border-border bg-card'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  b.state === 'done' && 'text-success',
                  b.state === 'skipped' && 'text-destructive',
                  b.state === 'pending' && 'text-muted-foreground'
                )}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{b.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {formatTimeDisplay(b.startTime)} · {b.area ? AREA_LABELS[b.area] || b.area : 'Sin asignar'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function toBlockSnapshots(
  blocks: RoutineBlock[],
  workAssignments: Record<string, string>,
  blockCompletions: Record<string, boolean>,
  skipped: Record<string, boolean>,
  focusBlockIds: Set<string>
): BlockSnapshot[] {
  return blocks
    .filter(b => focusBlockIds.has(b.id))
    .map(b => {
      const s = skipped[b.id] || (blockCompletions[b.id] === false && workAssignments[b.id]);
      return {
        id: b.id,
        title: b.title,
        startTime: b.startTime,
        endTime: b.endTime,
        area: workAssignments[b.id],
        isExtra: b.id === 'd-bloque-extra',
        state: blockCompletions[b.id] ? 'done' : s ? 'skipped' : 'pending',
      };
    });
}
