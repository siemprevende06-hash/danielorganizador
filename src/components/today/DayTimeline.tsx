import { useEffect, useState } from "react";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, Play, Zap, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TimelineTask {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  source: string;
}

interface BlockWithTasks {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  tasks: TimelineTask[];
  status: 'current' | 'completed' | 'upcoming';
  progress: number;
}

export function DayTimeline() {
  const { blocks, getCurrentBlock, isLoaded } = useRoutineBlocksDB();
  const [blocksWithTasks, setBlocksWithTasks] = useState<BlockWithTasks[]>([]);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && blocks.length > 0) {
      loadTasksForBlocks();
    }
  }, [isLoaded, blocks]);

  const loadTasksForBlocks = async () => {
    const today = new Date().toISOString().split('T')[0];
    const currentBlock = getCurrentBlock();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Load all tasks for today
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, completed, priority, source, routine_block_id')
      .gte('due_date', `${today}T00:00:00`)
      .lte('due_date', `${today}T23:59:59`);

    const enrichedBlocks: BlockWithTasks[] = blocks.map(block => {
      const [endH, endM] = block.endTime.split(':').map(Number);
      const endMinutes = endH * 60 + endM;

      const blockTasks = (tasks || [])
        .filter(t => t.routine_block_id === block.id)
        .map(t => ({
          id: t.id,
          title: t.title,
          completed: t.completed || false,
          priority: t.priority || undefined,
          source: t.source || 'general'
        }));

      const completedCount = blockTasks.filter(t => t.completed).length;
      const progress = blockTasks.length > 0 
        ? Math.round((completedCount / blockTasks.length) * 100) 
        : 0;

      let status: 'current' | 'completed' | 'upcoming' = 'upcoming';
      if (currentBlock?.id === block.id) status = 'current';
      else if (currentMinutes >= endMinutes) status = 'completed';

      return {
        id: block.id,
        title: block.title,
        startTime: block.startTime,
        endTime: block.endTime,
        tasks: blockTasks,
        status,
        progress
      };
    });

    setBlocksWithTasks(enrichedBlocks);
    
    // Auto-expand current block
    if (currentBlock) {
      setExpandedBlock(currentBlock.id);
    }
  };

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse h-10 bg-muted rounded" />
        ))}
      </div>
    );
  }

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')}`;
  };

  const getSourceBadge = (source: string) => {
    const config: Record<string, { label: string; class: string }> = {
      university: { label: 'Uni', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      entrepreneurship: { label: 'Emp', class: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      projects: { label: 'Proy', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      general: { label: 'Gen', class: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
    };
    return config[source] || config.general;
  };

  const totalTasks = blocksWithTasks.reduce((acc, b) => acc + b.tasks.length, 0);
  const completedTasks = blocksWithTasks.reduce((acc, b) => acc + b.tasks.filter(t => t.completed).length, 0);

  return (
    <div className="space-y-1">
      {/* Summary header */}
      {totalTasks > 0 && (
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
          <span className="text-xs text-muted-foreground">
            {completedTasks}/{totalTasks} tareas
          </span>
          <div className="flex items-center gap-2">
            <Progress value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0} className="w-16 h-1.5" />
            <span className="text-xs font-mono">{Math.round((completedTasks / totalTasks) * 100)}%</span>
          </div>
        </div>
      )}

      {blocksWithTasks.map((block) => {
        const isExpanded = expandedBlock === block.id;
        const hasTasks = block.tasks.length > 0;
        
        return (
          <div
            key={block.id}
            className={cn(
              "rounded-lg transition-all overflow-hidden",
              block.status === 'current' && "ring-2 ring-primary"
            )}
          >
            {/* Block Header */}
            <button
              onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 transition-all text-left",
                block.status === 'current' 
                  ? 'bg-foreground text-background font-medium' 
                  : block.status === 'completed'
                    ? 'bg-muted/50 text-muted-foreground'
                    : 'hover:bg-muted/50'
              )}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {block.status === 'completed' ? (
                  <CheckCircle2 className={cn("w-5 h-5", block.progress === 100 ? "text-success" : "text-warning")} />
                ) : block.status === 'current' ? (
                  <Play className="w-5 h-5 fill-current animate-pulse" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              {/* Time */}
              <span className={cn(
                "font-mono text-sm w-12 flex-shrink-0",
                block.status === 'current' ? 'text-background' : 'text-muted-foreground'
              )}>
                {formatTime(block.startTime)}
              </span>

              {/* Title */}
              <span className={cn(
                "flex-1 truncate text-sm",
                block.status === 'completed' && block.progress === 100 && 'line-through'
              )}>
                {block.title}
              </span>

              {/* Task count & progress */}
              {hasTasks && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-xs font-mono",
                      block.status === 'current' ? 'text-background/70' : 'text-muted-foreground'
                    )}>
                      {block.tasks.filter(t => t.completed).length}/{block.tasks.length}
                    </span>
                  </div>
                  <div className={cn(
                    "w-8 h-1.5 rounded-full overflow-hidden",
                    block.status === 'current' ? 'bg-background/30' : 'bg-muted'
                  )}>
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        block.progress === 100 ? 'bg-success' : 'bg-primary'
                      )}
                      style={{ width: `${block.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Current indicator */}
              {block.status === 'current' && (
                <span className="text-xs px-2 py-0.5 bg-background text-foreground rounded font-semibold">
                  AHORA
                </span>
              )}
            </button>

            {/* Expanded Tasks */}
            {isExpanded && hasTasks && (
              <div className={cn(
                "px-3 pb-3 space-y-1.5 animate-fade-in",
                block.status === 'current' 
                  ? 'bg-foreground/90' 
                  : 'bg-muted/30'
              )}>
                <div className="pt-1 border-t border-border/20">
                  {block.tasks.map(task => {
                    const sourceBadge = getSourceBadge(task.source);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-2 py-2 px-2 rounded transition-all",
                          task.completed && "opacity-60"
                        )}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        ) : (
                          <Circle className={cn(
                            "w-4 h-4 flex-shrink-0",
                            block.status === 'current' ? 'text-background/50' : 'text-muted-foreground'
                          )} />
                        )}
                        
                        <span className={cn(
                          "flex-1 text-sm truncate",
                          task.completed && "line-through",
                          block.status === 'current' && !task.completed && 'text-background'
                        )}>
                          {task.title}
                        </span>

                        <Badge 
                          variant="outline" 
                          className={cn("text-[10px] px-1.5 py-0", sourceBadge.class)}
                        >
                          {sourceBadge.label}
                        </Badge>

                        {task.priority === 'high' && !task.completed && (
                          <Zap className="w-3 h-3 text-destructive" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick task preview for collapsed blocks */}
            {!isExpanded && hasTasks && block.status !== 'completed' && (
              <div className={cn(
                "px-12 pb-2 flex flex-wrap gap-1",
                block.status === 'current' ? 'bg-foreground/90' : ''
              )}>
                {block.tasks.slice(0, 3).map(task => (
                  <span 
                    key={task.id}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      task.completed 
                        ? 'bg-success/20 text-success line-through' 
                        : task.priority === 'high'
                          ? 'bg-destructive/20 text-destructive'
                          : block.status === 'current'
                            ? 'bg-background/20 text-background'
                            : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
                  </span>
                ))}
                {block.tasks.length > 3 && (
                  <span className={cn(
                    "text-xs px-2 py-0.5",
                    block.status === 'current' ? 'text-background/70' : 'text-muted-foreground'
                  )}>
                    +{block.tasks.length - 3} más
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
