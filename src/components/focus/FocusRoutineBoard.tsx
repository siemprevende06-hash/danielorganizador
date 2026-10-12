import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Clock, LayoutGrid, Plus, Trash2, Briefcase, ListChecks } from 'lucide-react';
import { RoutineCardsView } from '@/components/today/RoutineCardsView';
import { DailyTimelinePlanner } from '@/components/today/DailyTimelinePlanner';
import type { RoutineBlock, RoutineInfo } from '@/hooks/useRoutineBlocks';
import type { TaskItem } from '@/hooks/useDailyPlanData';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  start_time: string | null;
  end_time: string | null;
}

interface Props {
  blocks: RoutineBlock[];
  routineInfo?: RoutineInfo;
  tasksByBlock: Record<string, TaskItem[]>;
  onToggleBlock: (blockId: string) => void;
  isBlockCompleted: (blockId: string) => boolean;
  onRemoveTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onDropTask: (taskId: string, blockId: string) => void;
  onUpdateFocus: (blockId: string, focus: string) => void;
  onUpdateCover: (blockId: string, url: string) => void;
  covers?: Record<string, string>;
  onAddBlock: (data: { title: string; startTime: string; endTime: string; isFocusBlock: boolean }) => void;
  onRemoveBlock: (blockId: string) => void;
  events?: CalendarEvent[];
  musicInstrument?: 'piano' | 'guitar';
  languageChoice?: 'ingles' | 'italiano';
  isFutureView?: boolean;
}

type Scope = 'all' | 'work';
type ViewMode = 'timeline' | 'cards';

const isWorkBlock = (block: RoutineBlock) =>
  Boolean(block.isFocusBlock || block.blockType === 'focus' || block.id.includes('bloque-extra'));

const isCustomBlock = (block: RoutineBlock) => block.id.startsWith('custom-');

export function FocusRoutineBoard({
  blocks,
  routineInfo,
  tasksByBlock,
  onToggleBlock,
  isBlockCompleted,
  onRemoveTask,
  onToggleTask,
  onDropTask,
  onUpdateFocus,
  onUpdateCover,
  covers,
  onAddBlock,
  onRemoveBlock,
  events,
  musicInstrument,
  languageChoice,
  isFutureView,
}: Props) {
  const [scope, setScope] = useState<Scope>('work');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [asWork, setAsWork] = useState(true);

  const visibleBlocks = useMemo(
    () => (scope === 'work' ? blocks.filter(isWorkBlock) : blocks),
    [blocks, scope]
  );

  const customBlocks = useMemo(() => blocks.filter(isCustomBlock), [blocks]);

  const handleCreate = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    onAddBlock({ title: cleanTitle, startTime, endTime, isFocusBlock: asWork });
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:00');
    setAsWork(true);
    setDialogOpen(false);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {viewMode === 'cards' ? <LayoutGrid className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-primary" />}
          Rutina de trabajo
          {routineInfo && (
            <Badge variant="outline" className="ml-1 text-[10px] font-mono">
              {routineInfo.icon} {routineInfo.shortLabel}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 p-0.5 rounded-xl bg-muted">
            <button
              onClick={() => setScope('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                scope === 'all' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Toda la rutina
            </button>
            <button
              onClick={() => setScope('work')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                scope === 'work' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Solo trabajo
            </button>
          </div>
          <div className="flex gap-1 p-0.5 rounded-xl bg-muted">
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === 'timeline' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Horario
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === 'cards' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Tarjetas
            </button>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Bloque personalizado
          </Button>
        </div>
      </div>

      {customBlocks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
            <ListChecks className="h-3 w-3" /> Personalizados
          </span>
          {customBlocks.map((block) => (
            <span
              key={block.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted/60 pl-2.5 pr-1 py-0.5 text-[11px]"
            >
              {block.isFocusBlock && <Briefcase className="h-3 w-3 text-emerald-500" />}
              <span className="font-medium">{block.title}</span>
              <span className="text-muted-foreground font-mono text-[10px]">{block.startTime}–{block.endTime}</span>
              <button
                onClick={() => onRemoveBlock(block.id)}
                className="ml-0.5 grid place-items-center h-4 w-4 rounded-full hover:bg-destructive/15 hover:text-destructive"
                aria-label={`Eliminar ${block.title}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {visibleBlocks.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">No hay bloques para mostrar.</p>
      ) : viewMode === 'cards' ? (
        <RoutineCardsView
          blocks={visibleBlocks}
          tasksByBlock={tasksByBlock}
          onToggleBlock={onToggleBlock}
          isBlockCompleted={isBlockCompleted}
          onRemoveTask={onRemoveTask}
          onToggleTask={onToggleTask}
          onUpdateCover={onUpdateCover}
          covers={covers}
          isFutureView={isFutureView}
        />
      ) : (
        <DailyTimelinePlanner
          blocks={visibleBlocks}
          tasksByBlock={tasksByBlock}
          onToggleBlock={onToggleBlock}
          isBlockCompleted={isBlockCompleted}
          onDropTask={onDropTask}
          onRemoveTask={onRemoveTask}
          onUpdateFocus={onUpdateFocus}
          events={events}
          musicInstrument={musicInstrument}
          languageChoice={languageChoice}
          isFutureView={isFutureView}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo bloque personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Repaso examen" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Inicio</label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Fin</label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={asWork} onCheckedChange={(v) => setAsWork(v === true)} />
              Es bloque de trabajo
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={!title.trim()}>Añadir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
