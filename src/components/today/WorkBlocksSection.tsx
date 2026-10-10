import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { TaskItem } from '@/hooks/useDailyPlanData';

export type WorkBlockType = 'focus' | 'deepWork' | 'extra';

export interface WorkBlockItem {
  id: string;
  type: WorkBlockType;
  areaId: string | null;
  taskId: string | null;
}

interface AreaOption {
  id: string;
  label: string;
}

interface WorkBlocksSectionProps {
  selectedDate: Date;
  tasks: TaskItem[];
  areas?: AreaOption[];
  className?: string;
}

const TYPE_LABELS: Record<WorkBlockType, string> = {
  focus: 'Focus',
  deepWork: 'Deep Work',
  extra: 'Bloque Extra',
};

const DEFAULT_AREAS: AreaOption[] = [
  { id: 'universidad', label: 'Universidad' },
  { id: 'emprendimiento', label: 'Emprendimiento' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'idiomas', label: 'Idiomas' },
  { id: 'general', label: 'General' },
];

const getStorageKey = (date: Date) => `workBlocks_${format(date, 'yyyy-MM-dd')}`;

export function WorkBlocksSection({ selectedDate, tasks, areas = DEFAULT_AREAS, className }: WorkBlocksSectionProps) {
  const [workBlocks, setWorkBlocks] = useState<WorkBlockItem[]>([
    { id: 'focus-1', type: 'focus', areaId: null, taskId: null },
    { id: 'deep-1', type: 'deepWork', areaId: null, taskId: null },
    { id: 'extra-1', type: 'extra', areaId: null, taskId: null },
  ]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey(selectedDate));
      if (raw) {
        const parsed = JSON.parse(raw) as WorkBlockItem[];
        if (Array.isArray(parsed)) {
          setWorkBlocks(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setWorkBlocks([
      { id: 'focus-1', type: 'focus', areaId: null, taskId: null },
      { id: 'deep-1', type: 'deepWork', areaId: null, taskId: null },
      { id: 'extra-1', type: 'extra', areaId: null, taskId: null },
    ]);
  }, [selectedDate]);

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(selectedDate), JSON.stringify(workBlocks));
    } catch {
      // ignore
    }
  }, [selectedDate, workBlocks]);

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);

  const updateBlock = (id: string, patch: Partial<WorkBlockItem>) => {
    setWorkBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium">Bloques de trabajo</h3>
      <div className="space-y-3">
        {workBlocks.map((block) => (
          <Card key={block.id} className="border-border/60 bg-background/80 shadow-sm">
            <CardContent className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
              <div className="min-w-[120px] text-sm font-medium">{TYPE_LABELS[block.type]}</div>
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="flex min-w-[180px] flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Área de Enfoque</Label>
                  <Select
                    value={block.areaId ?? 'none'}
                    onValueChange={(v) => updateBlock(block.id, { areaId: v === 'none' ? null : v })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Sin área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin área</SelectItem>
                      {areas.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Tarea</Label>
                  <Select
                    value={block.taskId ?? 'none'}
                    onValueChange={(v) => updateBlock(block.id, { taskId: v === 'none' ? null : v })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Sin tarea" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin tarea</SelectItem>
                      {pendingTasks.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
