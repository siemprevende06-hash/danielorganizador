import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Clock,
  LayoutGrid,
  ListChecks,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { DailyTimelinePlanner } from "@/components/today/DailyTimelinePlanner";
import { RoutineCardsView } from "@/components/today/RoutineCardsView";
import { TaskPoolPanel } from "@/components/today/TaskPoolPanel";
import type { RoutineBlock, RoutineInfo } from "@/hooks/useRoutineBlocks";
import type { TaskItem } from "@/hooks/useDailyPlanData";
import type { SpeedPlan } from "@/lib/speedPlan";

export interface RoutineCalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  start_time: string | null;
  end_time: string | null;
}

interface Props {
  blocks: RoutineBlock[];
  tasksByBlock: Record<string, TaskItem[]>;
  unassignedTasks: TaskItem[];
  onTaskCreated: () => void;
  abcMap?: Record<string, string>;
  onToggleBlock: (blockId: string) => void;
  isBlockCompleted: (blockId: string) => boolean;
  onDropTask: (taskId: string, blockId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateFocus?: (blockId: string, focus: string) => void;
  onUpdateCover: (blockId: string, url: string) => void;
  covers?: Record<string, string>;
  onAddBlock: (data: {
    title: string;
    startTime: string;
    endTime: string;
    isFocusBlock: boolean;
  }) => void;
  onRemoveBlock: (blockId: string) => void;
  routineInfo?: RoutineInfo;
  events?: RoutineCalendarEvent[];
  musicInstrument?: "piano" | "guitar";
  languageChoice?: "ingles" | "italiano";
  isFutureView?: boolean;
  speedPlan?: SpeedPlan;
  onSpeedPlanChange?: (next: SpeedPlan) => void;
  loading?: boolean;
}

type ViewMode = "timeline" | "cards";

const isCustomBlock = (block: RoutineBlock) => block.id.startsWith("custom-");

/**
 * Rutina editable del Panel de control: reutiliza el horario visual de la
 * pestaña Sistemas, permite alternar a tarjetas, arrastrar tareas a los bloques
 * y crear tarjetas/bloques personalizados junto al creador de tareas.
 */
export function RoutineControlBoard({
  blocks,
  tasksByBlock,
  unassignedTasks,
  onTaskCreated,
  abcMap,
  onToggleBlock,
  isBlockCompleted,
  onDropTask,
  onRemoveTask,
  onToggleTask,
  onUpdateFocus,
  onUpdateCover,
  covers,
  onAddBlock,
  onRemoveBlock,
  routineInfo,
  events = [],
  musicInstrument,
  languageChoice,
  isFutureView = false,
  speedPlan,
  onSpeedPlanChange,
  loading = false,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [asWork, setAsWork] = useState(true);

  const safeBlocks = useMemo(
    () => (Array.isArray(blocks) ? blocks : []),
    [blocks],
  );
  const customBlocks = useMemo(
    () => safeBlocks.filter(isCustomBlock),
    [safeBlocks],
  );

  const handleCreate = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    onAddBlock({
      title: cleanTitle,
      startTime,
      endTime,
      isFocusBlock: asWork,
    });
    setTitle("");
    setStartTime("09:00");
    setEndTime("10:00");
    setAsWork(true);
    setDialogOpen(false);
  };

  return (
    <Card className="space-y-3 p-3 md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {viewMode === "cards" ? (
            <LayoutGrid className="h-4 w-4 text-primary" />
          ) : (
            <Clock className="h-4 w-4 text-primary" />
          )}
          Rutina del día
          {routineInfo && (
            <Badge variant="outline" className="ml-1 font-mono text-[10px]">
              {routineInfo.icon} {routineInfo.shortLabel}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                viewMode === "timeline"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Horario
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                viewMode === "cards"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Tarjetas
            </button>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva tarjeta
          </Button>
        </div>
      </div>

      {customBlocks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <ListChecks className="h-3 w-3" />
            Personalizadas
          </span>
          {customBlocks.map((block) => (
            <span
              key={block.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted/60 py-0.5 pl-2.5 pr-1 text-[11px]"
            >
              {block.isFocusBlock && (
                <Briefcase className="h-3 w-3 text-emerald-500" />
              )}
              <span className="font-medium">{block.title}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {block.startTime}–{block.endTime}
              </span>
              <button
                type="button"
                onClick={() => onRemoveBlock(block.id)}
                className="ml-0.5 grid h-4 w-4 place-items-center rounded-full hover:bg-destructive/15 hover:text-destructive"
                aria-label={`Eliminar ${block.title}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando rutina…
            </div>
          ) : safeBlocks.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              No hay bloques en la rutina. Crea una tarjeta para empezar.
            </p>
          ) : viewMode === "cards" ? (
            <RoutineCardsView
              blocks={safeBlocks}
              tasksByBlock={tasksByBlock}
              onToggleBlock={onToggleBlock}
              isBlockCompleted={isBlockCompleted}
              onDropTask={onDropTask}
              onRemoveTask={onRemoveTask}
              onToggleTask={onToggleTask}
              onUpdateCover={onUpdateCover}
              onUpdateFocus={onUpdateFocus}
              covers={covers}
              isFutureView={isFutureView}
              speedPlan={speedPlan}
              onSpeedPlanChange={onSpeedPlanChange}
            />
          ) : (
            <DailyTimelinePlanner
              blocks={safeBlocks}
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
              speedPlan={speedPlan}
              onSpeedPlanChange={onSpeedPlanChange}
            />
          )}
        </div>

        <div className="flex h-[min(70vh,560px)] min-h-[360px] flex-col lg:sticky lg:top-20 lg:self-start">
          <TaskPoolPanel
            unassignedTasks={unassignedTasks}
            onTaskCreated={onTaskCreated}
            abcMap={abcMap}
          />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva tarjeta de rutina</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Título</label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej. Repaso examen"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Inicio</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Fin</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <Checkbox
                checked={asWork}
                onCheckedChange={(value) => setAsWork(value === true)}
              />
              Es bloque de trabajo
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!title.trim()}>
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
