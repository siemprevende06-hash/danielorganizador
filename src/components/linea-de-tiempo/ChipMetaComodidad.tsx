import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetaComodidadChip {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string | null;
  done: boolean;
  total: number;
  completedTasks: number;
}

interface Props {
  meta: MetaComodidadChip;
  active?: boolean;
}

export function ChipMetaComodidad({ meta, active }: Props) {
  const pct = meta.total > 0 ? Math.round((meta.completedTasks / meta.total) * 100) : 0;

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-colors',
        meta.done ? 'border-success/30 bg-success/5' : 'border-border bg-card',
        active && 'border-primary/40 ring-1 ring-primary/20'
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">
          {meta.done ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-medium leading-snug', meta.done && 'text-muted-foreground')}>
            {meta.title}
          </p>
          {meta.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{meta.description}</p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full', meta.done ? 'bg-success' : 'bg-primary')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold tabular-nums">
              {meta.completedTasks}/{meta.total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
