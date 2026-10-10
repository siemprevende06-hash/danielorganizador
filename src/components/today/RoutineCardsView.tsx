import { useMemo, useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { parseTime } from '@/hooks/useRoutineBlocks';
import type { RoutineBlock } from '@/hooks/useRoutineBlocks';
import type { TaskItem } from '@/hooks/useDailyPlanData';
import { useImageUpload } from '@/hooks/useImageUpload';
import {
  Clock, BookOpen, Briefcase, FolderKanban, Dumbbell, Sun, Moon, Coffee,
  Languages, Target, Music, Book, ImagePlus, X, Camera, Loader2, CheckCircle2,
} from 'lucide-react';

interface Props {
  blocks: RoutineBlock[];
  tasksByBlock: Record<string, TaskItem[]>;
  onToggleBlock: (blockId: string) => void;
  isBlockCompleted: (blockId: string) => boolean;
  onRemoveTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateCover: (blockId: string, url: string) => void;
  isFutureView?: boolean;
}

const FOCUS_COLORS: Record<string, { border: string; bg: string; dot: string; label: string }> = {
  universidad: { border: 'border-l-blue-500', bg: 'bg-blue-500/10', dot: 'bg-blue-500', label: 'Universidad' },
  emprendimiento: { border: 'border-l-purple-500', bg: 'bg-purple-500/10', dot: 'bg-purple-500', label: 'Emprendimiento' },
  proyectos: { border: 'border-l-emerald-500', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', label: 'Proyectos' },
  idiomas: { border: 'border-l-teal-500', bg: 'bg-teal-500/10', dot: 'bg-teal-500', label: 'Idiomas' },
  musica: { border: 'border-l-pink-500', bg: 'bg-pink-500/10', dot: 'bg-pink-500', label: 'Música' },
  lectura: { border: 'border-l-indigo-500', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500', label: 'Lectura' },
  descanso: { border: 'border-l-slate-500', bg: 'bg-slate-500/10', dot: 'bg-slate-500', label: 'Descanso' },
  ocio: { border: 'border-l-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500', label: 'Ocio' },
  entretenimiento: { border: 'border-l-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500', label: 'Entretenimiento' },
  gym: { border: 'border-l-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500', label: 'Gym' },
  estructural: { border: 'border-l-indigo-500', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500', label: 'Estructural' },
  alimentacion: { border: 'border-l-amber-500', bg: 'bg-amber-500/10', dot: 'bg-amber-500', label: 'Alimentación' },
  hobbys: { border: 'border-l-pink-500', bg: 'bg-pink-500/10', dot: 'bg-pink-500', label: 'Hobbys' },
  default: { border: 'border-l-muted-foreground/30', bg: 'bg-muted/30', dot: 'bg-muted-foreground', label: 'Otros' },
};

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function getBlockFocus(block: RoutineBlock): string {
  const focus = block.currentFocus || block.defaultFocus;
  if (focus && focus !== 'none') return focus;
  const title = block.title.toLowerCase();
  if (title.includes('gym') || title.includes('entreno')) return 'gym';
  if (title.includes('activación') || title.includes('alistamiento') || title.includes('desactivación') || title.includes('dormir') || title.includes('skincare') || title.includes('bañ')) return 'estructural';
  if (title.includes('almuerzo') || title.includes('comida') || title.includes('desayuno') || title.includes('merienda')) return 'alimentacion';
  if (title.includes('lectura') || title.includes('música') || title.includes('piano') || title.includes('ajedrez')) return 'hobbys';
  if (title.includes('idiomas')) return 'hobbys';
  if (title.includes('ocio')) return 'ocio';
  return 'default';
}

function getBlockIcon(block: RoutineBlock) {
  switch (getBlockFocus(block)) {
    case 'universidad': return <BookOpen className="h-4 w-4 text-blue-500" />;
    case 'emprendimiento': return <Briefcase className="h-4 w-4 text-purple-500" />;
    case 'proyectos': return <FolderKanban className="h-4 w-4 text-emerald-500" />;
    case 'descanso': return <Moon className="h-4 w-4 text-slate-500" />;
    case 'lectura': return <Book className="h-4 w-4 text-indigo-500" />;
    case 'musica': return <Music className="h-4 w-4 text-pink-500" />;
    case 'entretenimiento': return <Target className="h-4 w-4 text-orange-500" />;
    case 'gym': return <Dumbbell className="h-4 w-4 text-orange-500" />;
    case 'estructural': return <Sun className="h-4 w-4 text-indigo-500" />;
    case 'alimentacion': return <Coffee className="h-4 w-4 text-amber-500" />;
    case 'hobbys': return <Music className="h-4 w-4 text-pink-500" />;
    case 'ocio': return <Moon className="h-4 w-4 text-slate-400" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

interface CardProps {
  block: RoutineBlock;
  tasks: TaskItem[];
  completed: boolean;
  isActive: boolean;
  isPast: boolean;
  progress: number;
  onToggleBlock: (blockId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateCover: (blockId: string, url: string) => void;
}

function RoutineCard({
  block, tasks, completed, isActive, isPast, progress,
  onToggleBlock, onRemoveTask, onToggleTask, onUpdateCover,
}: CardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading } = useImageUpload();
  const focusKey = getBlockFocus(block);
  const colors = FOCUS_COLORS[focusKey] || FOCUS_COLORS.default;
  const pendingTasks = tasks.filter(t => !t.completed);
  const image = block.coverImage;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'routine-blocks');
    if (url) onUpdateCover(block.id, url);
    e.target.value = '';
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-l-[3px] transition-all duration-300',
        colors.border,
        completed && !isActive && 'opacity-60',
        isPast && !completed && !isActive && 'opacity-45',
        isActive && 'ring-2 ring-primary shadow-[0_0_28px_-6px] shadow-primary/60 scale-[1.01]',
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {image ? (
        <div className="relative w-full h-32 overflow-hidden group">
          <img src={image} alt={`${block.title} portada`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-6 w-6"
              onClick={() => onUpdateCover(block.id, '')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2">
            {getBlockIcon(block)}
            <span className={cn('text-sm font-bold text-white drop-shadow truncate', completed && 'line-through')}>
              {block.title}
            </span>
          </div>
        </div>
      ) : (
        <div className={cn('px-3 pt-3 pb-2 flex items-start gap-2', colors.bg)}>
          <div className="flex items-center gap-2 flex-1 min-w-0 pt-0.5">
            {getBlockIcon(block)}
            <span className={cn('text-sm font-bold truncate', completed && 'line-through text-muted-foreground')}>
              {block.title}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
            Foto
          </Button>
        </div>
      )}

      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTime(block.startTime)} – {formatTime(block.endTime)}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isActive && (
              <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary text-primary-foreground animate-pulse">
                En curso
              </Badge>
            )}
            {isPast && !completed && !isActive && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground">
                Pasado
              </Badge>
            )}
            {completed && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 text-green-600 gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" /> Hecho
              </Badge>
            )}
          </div>
        </div>

        {isActive && (
          <div className="space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-[9px] text-muted-foreground text-right">{Math.round(progress)}% del bloque</p>
          </div>
        )}

        {tasks.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="h-3 w-3" />
              Planificado
              <span className="text-[9px] text-muted-foreground/60">({pendingTasks.length} pendientes)</span>
            </div>
            <div className="space-y-0.5">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-1.5 py-0.5 px-1.5 rounded bg-background/60 group"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => onToggleTask(task.id)}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                  <span className={cn('text-[11px] flex-1 truncate', task.completed && 'line-through text-muted-foreground')}>
                    {task.title}
                  </span>
                  <button
                    onClick={() => onRemoveTask(task.id)}
                    className="h-5 w-5 p-0 flex items-center justify-center shrink-0 rounded hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Quitar del bloque"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground italic">Sin tareas planificadas para este bloque</p>
        )}

        {block.tasks && block.tasks.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {block.tasks.map((t, i) => (
              <Badge key={i} variant="outline" className={cn('text-[9px] px-1.5 py-0 h-4', colors.bg)}>
                {t}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
            <span className="text-[9px] text-muted-foreground">{colors.label}</span>
          </div>
          <Button
            variant={completed ? 'secondary' : 'outline'}
            size="sm"
            className="h-7 text-[10px] gap-1"
            onClick={() => onToggleBlock(block.id)}
          >
            <CheckCircle2 className="h-3 w-3" />
            {completed ? 'Desmarcar' : 'Completar'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function RoutineCardsView({
  blocks,
  tasksByBlock,
  onToggleBlock,
  isBlockCompleted,
  onRemoveTask,
  onToggleTask,
  onUpdateCover,
  isFutureView = false,
}: Props) {
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const safeTasksByBlock = tasksByBlock || {};

  const sortedBlocks = useMemo(
    () => (Array.isArray(blocks) ? blocks : [])
      .filter(b => {
        try { return parseTime(b.startTime || '0:00') >= 300; } catch { return false; }
      })
      .sort((a, b) => {
        try { return parseTime(a.startTime) - parseTime(b.startTime); } catch { return 0; }
      }),
    [blocks]
  );

  const currentBlockIndex = useMemo(() => sortedBlocks.findIndex(block => {
    try {
      let startM = 0, endM = 0;
      try { startM = parseTime(block.startTime || '0:00'); } catch { startM = 0; }
      try { endM = parseTime(block.endTime || '0:00'); } catch { endM = 0; }
      return currentMinutes >= startM && currentMinutes < endM;
    } catch { return false; }
  }), [sortedBlocks, currentMinutes]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sortedBlocks.map((block, index) => {
        let startM = 0, endM = 0;
        try { startM = parseTime(block.startTime || '0:00'); } catch { startM = 0; }
        try { endM = parseTime(block.endTime || '0:00'); } catch { endM = 0; }
        const isActive = !isFutureView && index === currentBlockIndex;
        const isPast = !isFutureView && endM <= currentMinutes;
        const duration = Math.max(endM - startM, 1);
        const progress = Math.min(100, Math.max(0, ((currentMinutes - startM) / duration) * 100));

        return (
          <RoutineCard
            key={block.id}
            block={block}
            tasks={safeTasksByBlock[block.id] || []}
            completed={isBlockCompleted(block.id)}
            isActive={isActive}
            isPast={isPast}
            progress={progress}
            onToggleBlock={onToggleBlock}
            onRemoveTask={onRemoveTask}
            onToggleTask={onToggleTask}
            onUpdateCover={onUpdateCover}
          />
        );
      })}
    </div>
  );
}
