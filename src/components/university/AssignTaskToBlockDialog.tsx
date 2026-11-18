import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar, Clock, GraduationCap, Briefcase, FolderKanban, Zap, Check, Loader2, Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRoutineBlocks } from '@/hooks/useRoutineBlocks';
import { useDailyPlanData } from '@/hooks/useDailyPlanData';
import { applyDayBlockOverrides } from '@/lib/dayBlockOverrides';
import { loadDailyPlan, saveDailyPlan } from '@/lib/dailyPlanStorage';
import { isFreeBlock } from '@/lib/speedPlan';

interface TaskData {
  id: string;
  title: string;
  subjectName?: string;
  source: 'tasks' | 'university';
}

interface AssignTaskToBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskData | null;
  onAssigned?: () => void;
}

const FOCUS_LABELS: Record<string, { label: string; color: string }> = {
  universidad: { label: 'Universidad', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  emprendimiento: { label: 'Emprendimiento', color: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
  proyectos: { label: 'Proyectos', color: 'bg-green-500/20 text-green-600 border-green-500/30' },
  none: { label: 'Sin enfoque', color: 'bg-muted text-muted-foreground border-border' },
};

const FOCUS_ICONS: Record<string, typeof GraduationCap> = {
  universidad: GraduationCap,
  emprendimiento: Briefcase,
  proyectos: FolderKanban,
  none: Zap,
};

/** Copia las asignaciones guardadas, ignorando ids que no sean listas válidas. */
function normalizeAssignments(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, string[]> = {};
  for (const [blockId, ids] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(ids)) continue;
    result[blockId] = ids.filter((id): id is string => typeof id === 'string');
  }
  return result;
}

export function AssignTaskToBlockDialog({ open, onOpenChange, task, onAssigned }: AssignTaskToBlockDialogProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');

  const targetDate = useMemo(
    () => (selectedDate === 'today' ? new Date() : new Date(Date.now() + 86400000)),
    [selectedDate],
  );
  const dateKey = format(targetDate, 'yyyy-MM-dd');

  const { blocks: routineBlocks, isLoaded: routineLoaded, routineType } = useRoutineBlocks();
  const {
    tasks,
    planAssignments,
    planSkipGym,
    planLoaded,
    tasksLoading,
    refreshPlan,
    refreshTasks,
  } = useDailyPlanData(targetDate);

  const blocks = useMemo(
    () => applyDayBlockOverrides(routineBlocks, { skipGym: planSkipGym }),
    [routineBlocks, planSkipGym],
  );

  useEffect(() => {
    if (open) {
      setSelectedBlockId(null);
      void refreshPlan();
      void refreshTasks();
    }
  }, [open, dateKey, refreshPlan, refreshTasks]);

  const assignedFromPlan = useMemo(() => {
    if (!task || !planAssignments) return null;
    for (const [blockId, ids] of Object.entries(planAssignments)) {
      if (ids.includes(task.id)) return blockId;
    }
    return null;
  }, [planAssignments, task]);

  const assignedFromTask = task
    ? tasks.find(item => item.id === task.id)?.routine_block_id ?? null
    : null;
  const alreadyAssignedBlockId = assignedFromPlan ?? assignedFromTask;
  const alreadyAssignedBlock = alreadyAssignedBlockId
    ? blocks.find(block => block.id === alreadyAssignedBlockId)
    : null;

  const handleSave = async () => {
    if (!task || !selectedBlockId) return;

    setSaving(true);
    try {
      const existing = await loadDailyPlan(dateKey);
      const assignments = normalizeAssignments(existing?.block_assignments);

      for (const blockId of Object.keys(assignments)) {
        assignments[blockId] = assignments[blockId].filter(id => id !== task.id);
      }
      if (!assignments[selectedBlockId]) assignments[selectedBlockId] = [];
      assignments[selectedBlockId].push(task.id);

      await saveDailyPlan({
        plan_date: dateKey,
        routine_type: existing?.routine_type ?? routineType,
        block_assignments: assignments,
        notes: existing?.notes ?? null,
      });

      // El vínculo directo de la tarea se actualiza solo para hoy: la tarea
      // puede estar planificada para mañana y no debe moverse en el día actual.
      if (selectedDate === 'today') {
        await supabase.from('tasks').update({ routine_block_id: selectedBlockId }).eq('id', task.id);
      }

      await refreshPlan();
      await refreshTasks();
      window.dispatchEvent(new CustomEvent('taskAssignmentChanged'));
      onAssigned?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving task assignment:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!task) return;
    setSaving(true);
    try {
      const existing = await loadDailyPlan(dateKey);
      const assignments = normalizeAssignments(existing?.block_assignments);
      let changed = false;

      for (const blockId of Object.keys(assignments)) {
        const filtered = assignments[blockId].filter(id => id !== task.id);
        if (filtered.length !== assignments[blockId].length) changed = true;
        assignments[blockId] = filtered;
      }

      if (changed) {
        await saveDailyPlan({
          plan_date: dateKey,
          routine_type: existing?.routine_type ?? routineType,
          block_assignments: assignments,
          notes: existing?.notes ?? null,
        });
      }

      if (selectedDate === 'today') {
        await supabase.from('tasks').update({ routine_block_id: null }).eq('id', task.id);
      }

      await refreshPlan();
      await refreshTasks();
      window.dispatchEvent(new CustomEvent('taskAssignmentChanged'));
      onAssigned?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error removing task assignment:', error);
    } finally {
      setSaving(false);
    }
  };

  const size = 'h-3.5 w-3.5';
  const loading = !routineLoaded || !planLoaded || tasksLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Asignar a Bloque de Rutina
          </DialogTitle>
          <DialogDescription>
            {task?.title}
          </DialogDescription>
        </DialogHeader>

        {/* Date selector */}
        <div className="flex gap-2">
          <Button
            variant={selectedDate === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDate('today')}
          >
            Hoy ({format(new Date(), 'd MMM')})
          </Button>
          <Button
            variant={selectedDate === 'tomorrow' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDate('tomorrow')}
          >
            Mañana ({format(new Date(Date.now() + 86400000), 'd MMM')})
          </Button>
        </div>

        {/* Already assigned info */}
        {alreadyAssignedBlock && (
          <Card className="p-3 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0 text-green-600" />
                <span className="font-medium shrink-0">Asignado a:</span>
                <Badge variant="outline" className="truncate text-xs">
                  {alreadyAssignedBlock.title}
                </Badge>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {alreadyAssignedBlock.startTime} - {alreadyAssignedBlock.endTime}
                </span>
              </div>
              <Button variant="destructive" size="sm" className="h-7 shrink-0 text-xs" onClick={handleRemoveAssignment} disabled={saving}>
                Quitar
              </Button>
            </div>
          </Card>
        )}

        {/* Block list */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[350px] pr-2">
              <div className="space-y-1.5">
                {blocks.map(block => {
                  const focus = block.currentFocus || block.defaultFocus || 'none';
                  const FocusIcon = FOCUS_ICONS[focus] || Zap;
                  const focusCfg = FOCUS_LABELS[focus] || FOCUS_LABELS.none;
                  const isSelected = selectedBlockId === block.id;
                  const alreadyAssigned = alreadyAssignedBlockId === block.id;
                  const isFree = isFreeBlock(block);

                  return (
                    <div
                      key={block.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : alreadyAssigned
                            ? 'border-green-500/50 bg-green-500/5'
                            : 'hover:bg-accent/50 border-border',
                        isFree && !isSelected && !alreadyAssigned && 'border-emerald-500/30 bg-emerald-500/5',
                      )}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">{block.title}</span>
                          {isFree ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            >
                              <Unlock className="mr-0.5 h-2.5 w-2.5" />
                              Libre
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={cn('text-[10px] px-1.5', focusCfg.color)}>
                              <FocusIcon className={cn('mr-0.5', size)} />
                              {focusCfg.label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <Clock className={size} />
                          <span>{block.startTime} - {block.endTime}</span>
                        </div>
                      </div>
                      {alreadyAssigned && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          <Check className="h-3 w-3 mr-1" />
                          Asignada
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {selectedBlockId && (
            <Button onClick={handleSave} disabled={saving || !selectedBlockId}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Asignar a este bloque
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
