import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, CheckCircle2, Circle, Play } from 'lucide-react';
import { useRoutineBlocksDB, formatTimeDisplay, parseTime } from '@/hooks/useRoutineBlocksDB';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface BlockTask {
  id: string;
  title: string;
  completed: boolean;
  source: string;
}

interface BlockWithTasks {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  tasks: BlockTask[];
  isCompleted: boolean;
  isCurrent: boolean;
  isPast: boolean;
}

export function DailyScheduleOverview() {
  const { blocks, getCurrentBlock } = useRoutineBlocksDB();
  const [blockTasks, setBlockTasks] = useState<Record<string, BlockTask[]>>({});
  const [completedBlocks, setCompletedBlocks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockData();
  }, [blocks]);

  const loadBlockData = async () => {
    if (blocks.length === 0) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Load tasks assigned to blocks for today
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, completed, routine_block_id, source')
        .not('routine_block_id', 'is', null)
        .eq('due_date', today);

      // Group tasks by block
      const tasksByBlock: Record<string, BlockTask[]> = {};
      (tasksData || []).forEach(task => {
        if (task.routine_block_id) {
          if (!tasksByBlock[task.routine_block_id]) {
            tasksByBlock[task.routine_block_id] = [];
          }
          tasksByBlock[task.routine_block_id].push({
            id: task.id,
            title: task.title,
            completed: task.completed || false,
            source: task.source,
          });
        }
      });
      setBlockTasks(tasksByBlock);

      // Load completed blocks for today
      const { data: completionsData } = await supabase
        .from('block_completions')
        .select('block_id')
        .eq('completion_date', today)
        .eq('completed', true);

      setCompletedBlocks((completionsData || []).map(c => c.block_id));
    } catch (error) {
      console.error('Error loading block data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentBlock = getCurrentBlock();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const blocksWithStatus: BlockWithTasks[] = useMemo(() => {
    return blocks.map(block => {
      const startMinutes = parseTime(block.startTime);
      const endMinutes = parseTime(block.endTime);
      const isPast = currentMinutes >= endMinutes && endMinutes > startMinutes;
      const isCurrent = currentBlock?.id === block.id;

      return {
        id: block.id,
        title: block.title,
        startTime: block.startTime,
        endTime: block.endTime,
        tasks: blockTasks[block.id] || [],
        isCompleted: completedBlocks.includes(block.id),
        isCurrent,
        isPast: isPast && !isCurrent,
      };
    });
  }, [blocks, blockTasks, completedBlocks, currentBlock, currentMinutes]);

  const toggleBlockCompletion = async (blockId: string, currentlyCompleted: boolean) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    if (currentlyCompleted) {
      // Remove completion
      await supabase
        .from('block_completions')
        .delete()
        .eq('block_id', blockId)
        .eq('completion_date', today);
      
      setCompletedBlocks(prev => prev.filter(id => id !== blockId));
    } else {
      // Add completion
      await supabase
        .from('block_completions')
        .upsert({
          block_id: blockId,
          completion_date: today,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'block_id,completion_date' });
      
      setCompletedBlocks(prev => [...prev, blockId]);
    }
  };

  const toggleTaskCompletion = async (taskId: string, currentlyCompleted: boolean) => {
    await supabase
      .from('tasks')
      .update({ 
        completed: !currentlyCompleted,
        status: currentlyCompleted ? 'pendiente' : 'completada'
      })
      .eq('id', taskId);

    setBlockTasks(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(blockId => {
        updated[blockId] = updated[blockId].map(task =>
          task.id === taskId ? { ...task, completed: !currentlyCompleted } : task
        );
      });
      return updated;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Horario Completo del Día
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {blocksWithStatus.map((block, index) => (
            <div
              key={block.id}
              className={`relative flex items-start gap-3 p-3 rounded-lg transition-all ${
                block.isCurrent
                  ? 'bg-primary/10 border-2 border-primary ring-2 ring-primary/20'
                  : block.isCompleted
                  ? 'bg-green-500/10 border border-green-500/20'
                  : block.isPast
                  ? 'opacity-50'
                  : 'hover:bg-muted/50'
              }`}
            >
              {/* Time Column */}
              <div className="flex flex-col items-center w-16 shrink-0">
                <span className="text-xs font-mono font-semibold">
                  {formatTimeDisplay(block.startTime)}
                </span>
                <div className="h-full w-px bg-border my-1" />
                <span className="text-xs font-mono text-muted-foreground">
                  {formatTimeDisplay(block.endTime)}
                </span>
              </div>

              {/* Status Icon */}
              <div className="shrink-0 pt-0.5">
                {block.isCurrent ? (
                  <div className="relative">
                    <Play className="h-5 w-5 text-primary fill-primary" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                ) : block.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium ${block.isCompleted || block.isPast ? 'text-muted-foreground' : ''}`}>
                    {block.title}
                  </h4>
                  {block.isCurrent && (
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      AHORA
                    </Badge>
                  )}
                  {block.isCompleted && !block.isCurrent && (
                    <Badge variant="outline" className="text-green-500 border-green-500 text-xs">
                      ✓ Hecho
                    </Badge>
                  )}
                </div>

                {/* Tasks inside block */}
                {block.tasks.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {block.tasks.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-2 text-sm ${
                          task.completed ? 'text-muted-foreground line-through' : ''
                        }`}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskCompletion(task.id, task.completed)}
                          className="h-4 w-4"
                        />
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Complete Block Button */}
              {!block.isCurrent && (
                <Checkbox
                  checked={block.isCompleted}
                  onCheckedChange={() => toggleBlockCompletion(block.id, block.isCompleted)}
                  className="shrink-0"
                />
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Bloques completados: {completedBlocks.length}/{blocks.length}
          </span>
          <Badge variant="secondary">
            {Math.round((completedBlocks.length / Math.max(blocks.length, 1)) * 100)}% del día
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
