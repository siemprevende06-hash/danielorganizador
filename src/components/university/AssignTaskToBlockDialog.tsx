import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, GraduationCap, Briefcase, FolderKanban, Zap, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface RoutineBlockData {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  blockType: string;
  defaultFocus: string;
  currentFocus?: string;
}

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

export function AssignTaskToBlockDialog({ open, onOpenChange, task, onAssigned }: AssignTaskToBlockDialogProps) {
  const [blocks, setBlocks] = useState<RoutineBlockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');

  const dateKey = selectedDate === 'today'
    ? format(new Date(), 'yyyy-MM-dd')
    : format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  useEffect(() => {
    if (open) {
      loadBlocks();
      setSelectedBlockId(null);
    }
  }, [open]);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('routine_blocks')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      const mapped: RoutineBlockData[] = (data || []).map((row: any) => ({
        id: row.block_id,
        title: row.title,
        startTime: row.start_time,
        endTime: row.end_time,
        blockType: row.block_type || 'fijo',
        defaultFocus: row.default_focus || 'none',
        currentFocus: row.current_focus || undefined,
      }));

      setBlocks(mapped);
    } catch (error) {
      console.error('Error loading routine blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAssignedToCurrentTask = (blockId: string) => {
    if (!open || !task) return false;
    try {
      const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      const taskItem = (parsed.tasks || []).find((t: any) => t.id === task.id);
      return taskItem?.routine_block_id === blockId;
    } catch {
      return false;
    }
  };

  const getAssignedBlockId = (): string | null => {
    if (!task) return null;
    try {
      const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      const taskItem = (parsed.tasks || []).find((t: any) => t.id === task.id);
      return taskItem?.routine_block_id || null;
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    if (!task || !selectedBlockId) return;

    setSaving(true);
    try {
      const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
      let data: { tasks: any[]; completedIds: string[] } = stored
        ? JSON.parse(stored)
        : { tasks: [], completedIds: [] };

      const existingIndex = data.tasks.findIndex((t: any) => t.id === task.id);

      const taskEntry = {
        id: task.id,
        title: task.title,
        source: task.source as 'tasks' | 'university',
        sourceName: task.subjectName,
        routine_block_id: selectedBlockId,
        completed: false,
        dueDate: undefined,
      };

      if (existingIndex >= 0) {
        data.tasks[existingIndex] = { ...data.tasks[existingIndex], ...taskEntry };
      } else {
        data.tasks.push(taskEntry);
      }

      localStorage.setItem(`dailyPlanTasks_${dateKey}`, JSON.stringify(data));
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
      const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
      if (!stored) return;
      const data = JSON.parse(stored);
      data.tasks = (data.tasks || []).filter((t: any) => t.id !== task.id);
      localStorage.setItem(`dailyPlanTasks_${dateKey}`, JSON.stringify(data));
      onAssigned?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error removing task assignment:', error);
    } finally {
      setSaving(false);
    }
  };

  const alreadyAssignedBlockId = getAssignedBlockId();
  const alreadyAssignedBlock = alreadyAssignedBlockId
    ? blocks.find(b => b.id === alreadyAssignedBlockId)
    : null;

  const size = 'h-3.5 w-3.5';

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span className="font-medium">Asignado a:</span>
                <Badge variant="outline" className="text-xs">
                  {alreadyAssignedBlock.title}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {alreadyAssignedBlock.startTime} - {alreadyAssignedBlock.endTime}
                </span>
              </div>
              <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={handleRemoveAssignment} disabled={saving}>
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
                  const focus = block.currentFocus || block.defaultFocus;
                  const FocusIcon = FOCUS_ICONS[focus] || Zap;
                  const focusCfg = FOCUS_LABELS[focus] || FOCUS_LABELS.none;
                  const isSelected = selectedBlockId === block.id;
                  const alreadyAssigned = isAssignedToCurrentTask(block.id);
                  const canAssign = block.blockType !== 'fijo';

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
                        !canAssign && 'opacity-50 cursor-not-allowed'
                      )}
                      onClick={() => canAssign && setSelectedBlockId(block.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{block.title}</span>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5', focusCfg.color)}>
                            <FocusIcon className={cn('mr-0.5', size)} />
                            {focusCfg.label}
                          </Badge>
                          {block.blockType !== 'configurable' && block.blockType !== 'dinamico' && (
                            <Badge variant="secondary" className="text-[10px]">
                              {block.blockType}
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
