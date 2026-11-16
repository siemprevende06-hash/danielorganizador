import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Camera,
  GripVertical,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { getCoverGradient } from "@/components/areas/AreaCover";
import { cn } from "@/lib/utils";
import type { RoutineCard, RoutineStep } from "@/hooks/useRoutineSteps";

interface Props {
  card: RoutineCard;
  tasks: RoutineStep[];
  completed: Set<string>;
  uploading: boolean;
  draggingTaskId: string | null;
  onToggleTask: (taskId: string) => void;
  onAddTask: (cardId: string, title: string) => void;
  onRenameTask: (taskId: string, title: string) => void;
  onDeleteTask: (taskId: string) => void;
  onRenameCard: (card: RoutineCard) => void;
  onDeleteCard: (card: RoutineCard) => void;
  onUploadCover: (card: RoutineCard, file: File) => void;
  onRemoveCover: (card: RoutineCard) => void;
  onMoveTask: (taskId: string, cardId: string) => void;
  onDragTaskChange: (taskId: string | null) => void;
}

export const RoutineCardTile = ({
  card,
  tasks,
  completed,
  uploading,
  draggingTaskId,
  onToggleTask,
  onAddTask,
  onRenameTask,
  onDeleteTask,
  onRenameCard,
  onDeleteCard,
  onUploadCover,
  onRemoveCover,
  onMoveTask,
  onDragTaskChange,
}: Props) => {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isDropTarget, setIsDropTarget] = useState(false);

  const done = tasks.filter((t) => completed.has(t.id)).length;
  const total = tasks.length;
  const progress = total ? (done / total) * 100 : 0;
  const isComplete = total > 0 && done === total;

  const submitTask = () => {
    const value = newTask.trim();
    if (!value) return;
    onAddTask(card.id, value);
    setNewTask("");
  };

  const startEditing = (task: RoutineStep) => {
    setEditingId(task.id);
    setEditValue(task.title);
  };

  const commitEditing = () => {
    if (!editingId) return;
    const value = editValue.trim();
    if (value) onRenameTask(editingId, value);
    setEditingId(null);
  };

  return (
    <Card
      onDragOver={(e) => {
        if (!draggingTaskId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDropTarget(true);
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain") || draggingTaskId;
        setIsDropTarget(false);
        if (taskId) onMoveTask(taskId, card.id);
      }}
      className={cn(
        "group/card flex flex-col overflow-hidden transition-all hover:shadow-lg",
        isDropTarget && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isComplete && "border-emerald-500/60"
      )}
    >
      {/* Portada */}
      <div className={cn("relative h-36 w-full overflow-hidden bg-gradient-to-br sm:h-40", getCoverGradient(card.id))}>
        {card.cover_url ? (
          <img
            src={card.cover_url}
            alt={`Portada de ${card.title}`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 grid place-items-center text-white/80 transition-colors hover:text-white"
          >
            <span className="flex flex-col items-center gap-1.5 text-xs font-semibold">
              <ImagePlus className="h-7 w-7" />
              Agregar portada
            </span>
          </button>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

        {/* Acciones de la tarjeta */}
        <div className="absolute left-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover/card:opacity-100 data-[state=open]:opacity-100"
                aria-label="Opciones de la tarjeta"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onRenameCard(card)}>
                <Pencil className="mr-2 h-4 w-4" /> Renombrar tarjeta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => coverInputRef.current?.click()}>
                <Camera className="mr-2 h-4 w-4" /> {card.cover_url ? "Cambiar portada" : "Agregar portada"}
              </DropdownMenuItem>
              {card.cover_url && (
                <DropdownMenuItem onClick={() => onRemoveCover(card)}>
                  <ImagePlus className="mr-2 h-4 w-4" /> Quitar portada
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDeleteCard(card)}>
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar tarjeta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="absolute right-2 top-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading}
            className="h-8 w-8 rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover/card:opacity-100 focus-visible:opacity-100"
            aria-label={card.cover_url ? "Cambiar portada" : "Agregar portada"}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </Button>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-3 pb-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold leading-tight text-white drop-shadow-sm">
                {card.title}
              </h3>
              <p className="text-[11px] font-medium text-white/75">
                {done}/{total} tareas
              </p>
            </div>
            <Badge
              className={cn(
                "shrink-0 border-0 text-[11px] font-bold",
                isComplete ? "bg-emerald-500 text-white" : "bg-white/20 text-white backdrop-blur-sm"
              )}
            >
              {Math.round(progress)}%
            </Badge>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
          <div
            className={cn("h-full transition-all", isComplete ? "bg-emerald-400" : "bg-white/80")}
            style={{ width: `${progress}%` }}
          />
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadCover(card, file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Tareas */}
      <CardContent className="flex flex-1 flex-col gap-1 p-3">
        {tasks.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">
            Todavía no hay tareas en esta tarjeta.
          </p>
        ) : (
          <div className="space-y-0.5">
            {tasks.map((task) => {
              const isDone = completed.has(task.id);
              const isEditing = editingId === task.id;
              return (
                <div
                  key={task.id}
                  draggable={!isEditing}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", task.id);
                    e.dataTransfer.effectAllowed = "move";
                    onDragTaskChange(task.id);
                  }}
                  onDragEnd={() => onDragTaskChange(null)}
                  className={cn(
                    "group/task flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-muted/60",
                    draggingTaskId === task.id && "opacity-40"
                  )}
                >
                  <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/40 opacity-0 transition-opacity group-hover/task:opacity-100" />
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={() => onToggleTask(task.id)}
                    className="shrink-0"
                    aria-label={`Marcar ${task.title}`}
                  />
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEditing}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEditing();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-7 flex-1 px-2 text-sm"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      className={cn(
                        "min-w-0 flex-1 truncate text-left text-sm leading-snug transition-colors",
                        isDone && "text-muted-foreground line-through"
                      )}
                      title={task.title}
                    >
                      {task.title}
                    </button>
                  )}
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/task:opacity-100 focus-within:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => startEditing(task)}
                      aria-label="Editar tarea"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => onDeleteTask(task.id)}
                      aria-label="Eliminar tarea"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitTask();
          }}
          className="mt-auto flex items-center gap-2 pt-2"
        >
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Nueva tarea..."
            className="h-9 text-sm"
            aria-label={`Nueva tarea en ${card.title}`}
          />
          <Button
            type="submit"
            size="icon"
            variant="outline"
            className="h-9 w-9 shrink-0"
            disabled={!newTask.trim()}
            aria-label="Agregar tarea"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
