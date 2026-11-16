import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImageUpload } from "@/hooks/useImageUpload";
import {
  useRoutineSteps,
  stepCardId,
  type RoutineCard,
  type RoutineType,
} from "@/hooks/useRoutineSteps";
import { RoutineCardTile } from "@/components/routine/RoutineCardTile";

interface Props {
  type: RoutineType;
  title: string;
  subtitle?: string;
}

export const EditableRoutineChecklist = ({ type, title, subtitle }: Props) => {
  const {
    steps,
    cards,
    completed,
    loading,
    toggle,
    addStep,
    removeStep,
    updateStep,
    moveStep,
    createCard,
    renameCard,
    setCardCover,
    removeCardCover,
    deleteCard,
  } = useRoutineSteps(type);
  const { uploadImage, uploading } = useImageUpload();

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCover, setNewCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [savingCard, setSavingCard] = useState(false);

  const [renamingCard, setRenamingCard] = useState<RoutineCard | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [cardToDelete, setCardToDelete] = useState<RoutineCard | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!newCover) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(newCover);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [newCover]);

  const tasksByCard = useMemo(() => {
    const map = new Map<string, typeof steps>();
    for (const card of cards) map.set(card.id, []);
    for (const step of steps) {
      const id = stepCardId(step);
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(step);
    }
    return map;
  }, [cards, steps]);

  const total = steps.length;
  const done = steps.filter((s) => completed.has(s.id)).length;
  const progress = total ? (done / total) * 100 : 0;

  const openCreate = () => {
    setNewTitle("");
    setNewCover(null);
    setCreateOpen(true);
  };

  const handleCreateCard = async () => {
    const value = newTitle.trim();
    if (!value) return;
    setSavingCard(true);
    let coverUrl: string | null = null;
    if (newCover) coverUrl = await uploadImage(newCover, "routine-cards");
    await createCard(value, coverUrl);
    setSavingCard(false);
    setCreateOpen(false);
    setNewTitle("");
    setNewCover(null);
  };

  const handleUploadCover = async (card: RoutineCard, file: File) => {
    const url = await uploadImage(file, "routine-cards");
    if (url) await setCardCover(card.id, url);
  };

  const handleRenameCard = async () => {
    if (!renamingCard) return;
    await renameCard(renamingCard.id, renameValue);
    setRenamingCard(null);
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;
    await deleteCard(cardToDelete.id);
    setCardToDelete(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-24">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            Arrastra las tareas entre tarjetas para reorganizarlas.
          </p>
        </div>
        <Button onClick={openCreate} className="sm:self-center">
          <Plus className="mr-1 h-4 w-4" /> Nueva tarjeta
        </Button>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Progreso de hoy
              </p>
              <p className="text-3xl font-bold leading-none">{Math.round(progress)}%</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">{done}</span> de {total} tareas
              </p>
              <p>
                <span className="font-semibold text-foreground">{cards.length}</span>{" "}
                {cards.length === 1 ? "tarjeta" : "tarjetas"}
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-3 sm:w-1/2" />
        </CardContent>
      </Card>

      {cards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-muted-foreground">
              Todavía no hay tarjetas en esta rutina. Crea la primera para empezar.
            </p>
            <Button onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" /> Nueva tarjeta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <RoutineCardTile
              key={card.id}
              card={card}
              tasks={tasksByCard.get(card.id) ?? []}
              completed={completed}
              uploading={uploading}
              draggingTaskId={draggingTaskId}
              onToggleTask={toggle}
              onAddTask={(cardId, value) => {
                void addStep(value, cardId);
              }}
              onRenameTask={(taskId, value) => {
                void updateStep(taskId, { title: value });
              }}
              onDeleteTask={(taskId) => {
                void removeStep(taskId);
              }}
              onRenameCard={(target) => {
                setRenamingCard(target);
                setRenameValue(target.title);
              }}
              onDeleteCard={setCardToDelete}
              onUploadCover={handleUploadCover}
              onRemoveCover={(target) => {
                void removeCardCover(target.id);
              }}
              onMoveTask={(taskId, cardId) => {
                void moveStep(taskId, cardId);
              }}
              onDragTaskChange={setDraggingTaskId}
            />
          ))}

          <button
            type="button"
            onClick={openCreate}
            className={cn(
              "flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-muted-foreground transition-colors",
              "hover:border-primary/60 hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-muted">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">Nueva tarjeta</span>
            <span className="text-xs">Con portada, título y tareas</span>
          </button>
        </div>
      )}

      {/* Crear tarjeta */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setNewTitle("");
            setNewCover(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva tarjeta</DialogTitle>
            <DialogDescription>
              Ponle un título y, si quieres, una portada. Después agrégale las tareas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-title">Título</Label>
              <Input
                id="card-title"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCard();
                }}
                placeholder="Ej. Inicio energético"
              />
            </div>

            <div className="space-y-2">
              <Label>Portada (opcional)</Label>
              <label
                className={cn(
                  "relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                )}
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Vista previa de la portada" className="absolute inset-0 h-full w-full object-cover" />
                    <span className="relative rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white">
                      Cambiar imagen
                    </span>
                  </>
                ) : (
                  <span className="flex flex-col items-center gap-1 text-xs font-medium">
                    <ImagePlus className="h-6 w-6" />
                    Subir imagen
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setNewCover(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {newCover && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setNewCover(null)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Quitar imagen
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCard} disabled={!newTitle.trim() || savingCard}>
              {savingCard ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Crear tarjeta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renombrar tarjeta */}
      <Dialog
        open={!!renamingCard}
        onOpenChange={(open) => {
          if (!open) setRenamingCard(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar tarjeta</DialogTitle>
            <DialogDescription>El nuevo nombre se verá en la portada de la tarjeta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-card">Título</Label>
            <Input
              id="rename-card"
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameCard();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingCard(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRenameCard} disabled={!renameValue.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar tarjeta */}
      <AlertDialog
        open={!!cardToDelete}
        onOpenChange={(open) => {
          if (!open) setCardToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar “{cardToDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también las tareas de esta tarjeta. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
