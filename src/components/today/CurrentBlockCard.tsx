import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Dumbbell, Book, Music, Target, BookOpen, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseTime } from '@/hooks/useRoutineBlocksDB';
import { useWorkoutTracking } from '@/hooks/useWorkoutTracking';
import { useReadingLibrary } from '@/hooks/useReadingLibrary';
import { useMusicRepertoire } from '@/hooks/useMusicRepertoire';
import type { RoutineBlock } from '@/hooks/useRoutineBlocksDB';
import type { TaskItem } from '@/hooks/useDailyPlanData';

interface Props {
  currentBlock: RoutineBlock | null;
  blockProgress: number;
  tasksByBlock: Record<string, TaskItem[]>;
}

function identifyBlockType(title: string): 'gym' | 'lectura' | 'musica' | 'deepwork' | 'ajedrez' | 'almuerzo' | 'other' {
  const t = title.toLowerCase();
  if (t.includes('gym') || t.includes('entreno')) return 'gym';
  if (t.includes('lectura') || t.includes('podcast')) return 'lectura';
  if (t.includes('música') || t.includes('piano') || t.includes('guitarra')) return 'musica';
  if (t.includes('ajedrez')) return 'ajedrez';
  if (t.includes('deep work') || t.includes('work-') || t.includes('trabajo') || t.includes('focus') || t.includes('bloque')) return 'deepwork';
  if (t.includes('almuerzo')) return 'almuerzo';
  return 'other';
}

export function CurrentBlockCard({ currentBlock, blockProgress, tasksByBlock }: Props) {
  const { routine, exercises, getTodayWorkout, isLoading: workoutLoading } = useWorkoutTracking();
  const { getCurrentlyReading } = useReadingLibrary();
  const { getSongsByStatus } = useMusicRepertoire();

  const blockType = currentBlock ? identifyBlockType(currentBlock.title) : 'other';
  const todayWorkout = getTodayWorkout();
  const currentBook = getCurrentlyReading();
  const learningSongs = getSongsByStatus('learning');

  const timeRemaining = useMemo(() => {
    if (!currentBlock) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = parseTime(currentBlock.endTime);
    const remaining = endMinutes - currentMinutes;
    if (remaining <= 0) return null;
    return remaining;
  }, [currentBlock]);

  const blockTasks = currentBlock ? tasksByBlock[currentBlock.id] || [] : [];
  const incompleteTasks = blockTasks.filter(t => !t.completed);

  return (
    <Card className={cn(
      "p-3 border-l-[3px] transition-all",
      currentBlock ? "border-l-primary" : "border-l-muted-foreground/30"
    )}>
      {currentBlock ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm">{currentBlock.title}</span>
              <Badge variant="secondary" className="text-[10px] h-5">
                {currentBlock.startTime} - {currentBlock.endTime}
              </Badge>
            </div>
            {timeRemaining && (
              <Badge variant="outline" className="text-[10px] h-5">
                <Clock className="h-3 w-3 mr-1" />
                {timeRemaining} min
              </Badge>
            )}
          </div>

          <Progress value={blockProgress} className="h-1.5" />

          {/* Content by block type */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {blockType === 'gym' && !workoutLoading && routine && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Dumbbell className="h-3 w-3 text-orange-500" />
                {todayWorkout?.isWorkoutDay ? (
                  <span>
                    Hoy: <strong>{todayWorkout.dayName}</strong> ·{' '}
                    {exercises.filter(e => e.day_of_week === todayWorkout.dayName.toLowerCase()).slice(0, 3).map(e => e.muscle_group || e.name).join(', ') || 'Ejercicios'}
                  </span>
                ) : (
                  <span>Día de descanso</span>
                )}
              </div>
            )}

            {blockType === 'lectura' && currentBook && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Book className="h-3 w-3 text-indigo-500" />
                <span>
                  <strong>{currentBook.title}</strong>
                  {currentBook.author && <span> — {currentBook.author}</span>}
                  {currentBook.pages_total && (
                    <span> · {currentBook.pages_read || 0}/{currentBook.pages_total} pág</span>
                  )}
                </span>
              </div>
            )}

            {blockType === 'musica' && learningSongs.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Music className="h-3 w-3 text-pink-500" />
                <span>
                  {learningSongs.slice(0, 2).map(s => `${s.title} (${s.instrument === 'piano' ? '🎹' : '🎸'})`).join(', ')}
                </span>
              </div>
            )}

            {blockType === 'deepwork' && incompleteTasks.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Target className="h-3 w-3 text-emerald-500" />
                <span className="truncate max-w-[300px]">
                  {incompleteTasks.slice(0, 3).map(t => t.title).join(' · ')}
                  {incompleteTasks.length > 3 && ` +${incompleteTasks.length - 3}`}
                </span>
              </div>
            )}

            {blockType === 'ajedrez' && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ChevronRight className="h-3 w-3" />
                <span>Partidas de hoy</span>
              </div>
            )}
          </div>

          {blockTasks.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {blockTasks.map(task => (
                <Badge
                  key={task.id}
                  variant={task.completed ? 'default' : 'outline'}
                  className={cn("text-[9px] px-1.5 py-0 h-4", task.completed && "bg-green-500/20 text-green-600")}
                >
                  {task.title}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Sin bloque activo en este momento
        </div>
      )}
    </Card>
  );
}
