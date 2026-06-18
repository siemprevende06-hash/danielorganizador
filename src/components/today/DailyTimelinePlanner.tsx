import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Clock, BookOpen, Briefcase, FolderKanban, Dumbbell, Sun, Moon, Coffee,
  Languages, Target, Music, Book, ChevronDown, ChevronUp, GripVertical, X
} from 'lucide-react';
import { parseTime } from '@/hooks/useRoutineBlocksDB';
import type { RoutineBlock, BlockFocus } from '@/hooks/useRoutineBlocksDB';
import type { TaskItem } from '@/hooks/useDailyPlanData';

interface Props {
  blocks: RoutineBlock[];
  tasksByBlock: Record<string, TaskItem[]>;
  onToggleBlock: (blockId: string) => void;
  isBlockCompleted: (blockId: string) => boolean;
  onDropTask: (taskId: string, blockId: string) => void;
  onRemoveTask: (taskId: string) => void;
}

const FOCUS_COLORS: Record<string, { border: string; bg: string; dot: string; label: string }> = {
  universidad: { border: 'border-l-blue-500', bg: 'bg-blue-500/10', dot: 'bg-blue-500', label: 'Universidad' },
  emprendimiento: { border: 'border-l-purple-500', bg: 'bg-purple-500/10', dot: 'bg-purple-500', label: 'Emprendimiento' },
  proyectos: { border: 'border-l-emerald-500', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', label: 'Proyectos' },
  gym: { border: 'border-l-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500', label: 'Gym' },
  estructural: { border: 'border-l-indigo-500', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500', label: 'Estructural' },
  alimentacion: { border: 'border-l-amber-500', bg: 'bg-amber-500/10', dot: 'bg-amber-500', label: 'Alimentación' },
  hobbys: { border: 'border-l-pink-500', bg: 'bg-pink-500/10', dot: 'bg-pink-500', label: 'Hobbys' },
  ocio: { border: 'border-l-slate-400', bg: 'bg-slate-400/10', dot: 'bg-slate-400', label: 'Ocio' },
  default: { border: 'border-l-muted-foreground/30', bg: 'bg-muted/30', dot: 'bg-muted-foreground', label: 'Otros' },
};

const SOURCE_STYLES: Record<string, { icon: React.ReactNode; color: string }> = {
  university: { icon: <BookOpen className="h-3 w-3" />, color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  entrepreneurship: { icon: <Briefcase className="h-3 w-3" />, color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  project: { icon: <FolderKanban className="h-3 w-3" />, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  general: { icon: <Target className="h-3 w-3" />, color: 'bg-muted text-muted-foreground border-border' },
};

const getBlockFocus = (block: RoutineBlock): string => {
  const focus = block.currentFocus || block.defaultFocus;
  if (focus && focus !== 'none') return focus;
  const title = block.title.toLowerCase();
  if (title.includes('gym') || title.includes('entreno')) return 'gym';
  if (title.includes('activación') || title.includes('alistamiento') || title.includes('desactivación') || title.includes('dormir') || title.includes('skincare') || title.includes('bañ')) return 'estructural';
  if (title.includes('almuerzo') || title.includes('comida') || title.includes('desayuno') || title.includes('merienda')) return 'alimentacion';
  if (title.includes('lectura') || title.includes('música') || title.includes('piano') || title.includes('ajedrez')) return 'hobbys';
  if (title.includes('ocio')) return 'ocio';
  if (title.includes('idiomas')) return 'hobbys';
  return 'default';
};

const getBlockIcon = (block: RoutineBlock) => {
  const focus = getBlockFocus(block);
  switch (focus) {
    case 'universidad': return <BookOpen className="h-4 w-4 text-blue-500" />;
    case 'emprendimiento': return <Briefcase className="h-4 w-4 text-purple-500" />;
    case 'proyectos': return <FolderKanban className="h-4 w-4 text-emerald-500" />;
    case 'gym': return <Dumbbell className="h-4 w-4 text-orange-500" />;
    case 'estructural': return <Sun className="h-4 w-4 text-indigo-500" />;
    case 'alimentacion': return <Coffee className="h-4 w-4 text-amber-500" />;
    case 'hobbys': return <Music className="h-4 w-4 text-pink-500" />;
    case 'ocio': return <Moon className="h-4 w-4 text-slate-400" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function DailyTimelinePlanner({
  blocks,
  tasksByBlock,
  onToggleBlock,
  isBlockCompleted,
  onDropTask,
  onRemoveTask,
}: Props) {
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const sortedBlocks = useMemo(() => {
    return [...blocks]
      .filter(b => {
        const startM = parseTime(b.startTime);
        return startM >= 360;
      })
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
  }, [blocks]);

  const currentBlockIndex = useMemo(() => {
    return sortedBlocks.findIndex(block => {
      const startM = parseTime(block.startTime);
      const endM = parseTime(block.endTime);
      return currentMinutes >= startM && currentMinutes < endM;
    });
  }, [sortedBlocks, currentMinutes]);

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverBlockId(blockId);
  };

  const handleDrop = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, blockId);
    }
    setDragOverBlockId(null);
  };

  const handleDragLeave = () => {
    setDragOverBlockId(null);
  };

  return (
    <Card className="p-3 md:p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Hoy
          </h3>
          <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {format(new Date(), 'h:mm a')}
        </Badge>
      </div>

      <div className="relative space-y-1">
        {sortedBlocks.map((block, index) => {
          const blockId = block.id;
          const startM = parseTime(block.startTime);
          const endM = parseTime(block.endTime);
          const completed = isBlockCompleted(blockId);
          const focusKey = getBlockFocus(block);
          const colors = FOCUS_COLORS[focusKey] || FOCUS_COLORS.default;
          const isCurrent = index === currentBlockIndex;
          const isPast = endM <= currentMinutes;
          const isDragOver = dragOverBlockId === blockId;
          const tasks = tasksByBlock[blockId] || [];

          return (
            <div
              key={blockId}
              onDragOver={(e) => handleDragOver(e, blockId)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, blockId)}
            >
              <div className="flex items-start gap-2">
                <div className="w-12 flex-shrink-0 text-[10px] text-muted-foreground font-mono pt-2 text-right leading-tight">
                  {formatTime(block.startTime)}
                </div>

                <div className={cn(
                  "flex-1 border-l-[3px] rounded-lg border transition-all",
                  colors.border,
                  completed && "opacity-70",
                  isCurrent && "ring-2 ring-primary shadow-md",
                  isDragOver && "ring-2 ring-primary/60 bg-primary/10 scale-[1.01]",
                  !completed && !isCurrent && isPast && "opacity-40",
                )}>
                  <div className={cn(
                    "p-2.5 rounded-r-lg",
                    colors.bg,
                    isDragOver && "bg-primary/10"
                  )}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Checkbox
                          checked={completed}
                          onCheckedChange={() => onToggleBlock(blockId)}
                          className="h-4 w-4 shrink-0"
                        />
                        {getBlockIcon(block)}
                        <span className={cn(
                          "text-xs font-medium truncate",
                          completed && "line-through text-muted-foreground"
                        )}>
                          {block.title}
                        </span>
                        <span className="text-[9px] text-muted-foreground hidden sm:inline font-mono">
                          {formatTime(block.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isCurrent && (
                          <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary text-primary-foreground animate-pulse">
                            En curso
                          </Badge>
                        )}
                        {tasks.length > 0 && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                            {tasks.length}
                          </Badge>
                        )}
                        {focusKey !== 'default' && (
                          <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
                        )}
                      </div>
                    </div>

                    {tasks.length > 0 && (
                      <div className="mt-1.5 ml-6 space-y-0.5">
                        {tasks.map(task => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between py-0.5 px-1.5 rounded bg-background/60 group"
                          >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", task.completed ? "bg-green-500" : colors.dot)} />
                              <span className={cn(
                                "text-[11px] truncate",
                                task.completed && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </span>
                              {task.source && SOURCE_STYLES[task.source] && (
                                <Badge variant="outline" className={cn("text-[8px] px-1 py-0 h-3.5 border-0", SOURCE_STYLES[task.source].color)}>
                                  {SOURCE_STYLES[task.source].icon}
                                </Badge>
                              )}
                            </div>
                            <button
                              onClick={() => onRemoveTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 flex items-center justify-center shrink-0"
                            >
                              <X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isCurrent && (
                    <div className="h-0.5 bg-primary rounded-full" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[9px] text-muted-foreground">
        <span className={cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.universidad.dot)} /> Uni
        <span className={cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.emprendimiento.dot)} /> Emp
        <span className={cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.proyectos.dot)} /> Proy
        <span className={cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.gym.dot)} /> Gym
        <span className={cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.estructural.dot)} /> Est
        <span className={cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.alimentacion.dot)} /> Ali
        <span className={cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.hobbys.dot)} /> Hob
      </div>
    </Card>
  );
}
