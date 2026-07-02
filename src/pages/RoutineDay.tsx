import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRoutineBlocks, formatTimeDisplay, type RoutineBlock, type RoutineType, ROUTINES } from "@/hooks/useRoutineBlocks";
import { GripVertical, Clock, Target, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ROUTINE_STYLES: Record<RoutineType, { active: string; inactive: string }> = {
  disciplina: {
    active: "bg-orange-500/20 border-orange-500/60 text-orange-500",
    inactive: "border-orange-500/20 text-orange-400/60 hover:border-orange-500/40",
  },
  normal: {
    active: "bg-blue-500/20 border-blue-500/60 text-blue-500",
    inactive: "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40",
  },
  super: {
    active: "bg-purple-500/20 border-purple-500/60 text-purple-500",
    inactive: "border-purple-500/20 text-purple-400/60 hover:border-purple-500/40",
  },
  descanso: {
    active: "bg-green-500/20 border-green-500/60 text-green-500",
    inactive: "border-green-500/20 text-green-400/60 hover:border-green-500/40",
  },
};

export default function RoutineDay() {
  const { blocks, isLoaded, routineType, setRoutineType, reorderBlocks, updateBlock, saveBlocks } = useRoutineBlocks();
  const { toast } = useToast();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', startTime: '', endTime: '', tasks: '' });

  const currentRoutine = ROUTINES.find(r => r.type === routineType) || ROUTINES[0];

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    reorderBlocks(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => setDraggedIndex(null);

  const startEditing = (block: RoutineBlock) => {
    setEditingId(block.id);
    setEditForm({ title: block.title, startTime: block.startTime, endTime: block.endTime, tasks: (block.tasks || []).join(', ') });
  };

  const cancelEditing = () => setEditingId(null);

  const saveEditing = (block: RoutineBlock) => {
    updateBlock({
      ...block,
      title: editForm.title,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      tasks: editForm.tasks.split(',').map(t => t.trim()).filter(Boolean),
    });
    setEditingId(null);
    toast({ title: "Bloque actualizado" });
  };

  const addNewBlock = () => {
    const newBlock: RoutineBlock = {
      id: Date.now().toString(),
      title: "Nuevo Bloque",
      startTime: "12:00",
      endTime: "13:00",
      tasks: ["Nueva tarea"],
      currentStreak: 0,
      maxStreak: 0,
      weeklyCompletion: [false, false, false, false, false, false, false],
      order: blocks.length,
    };
    saveBlocks([...blocks, newBlock]);
  };

  const deleteBlock = (id: string) => {
    saveBlocks(blocks.filter(b => b.id !== id).map((b, idx) => ({ ...b, order: idx })));
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Cargando rutina...</p></div>;

  return (
    <div className="min-h-screen bg-background p-6 pt-24 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configurar Rutina</h1>
            <p className="text-muted-foreground">
              {currentRoutine.label} · {currentRoutine.totalBlocks} bloques · {currentRoutine.wakeTime} — {currentRoutine.sleepTime}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={addNewBlock} size="sm"><Plus className="w-4 h-4 mr-1" />Agregar Bloque</Button>
          </div>
        </header>

        {/* iPhone-style Segmented Control */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {ROUTINES.map((r) => {
            const style = ROUTINE_STYLES[r.type];
            const isActive = routineType === r.type;
            return (
              <button
                key={r.type}
                onClick={() => setRoutineType(r.type)}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all duration-300 min-w-[100px]",
                  isActive ? style.active : `${style.inactive} bg-transparent`,
                  isActive && "scale-[1.02]"
                )}
              >
                <span className="text-xl leading-none">{r.icon}</span>
                <span className={cn("text-xs font-semibold tracking-tight whitespace-nowrap", isActive ? "opacity-100" : "opacity-70")}>{r.shortLabel}</span>
                <span className={cn("text-[10px] font-mono tracking-tight", isActive ? "opacity-80" : "opacity-40")}>{r.wakeTime}—{r.sleepTime}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Arrastra los bloques para reordenarlos. Edítalos o elimínalos según necesites.
        </p>

        <div className="space-y-2">
          {blocks.map((block, index) => (
            <Card
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "transition-all cursor-move",
                draggedIndex === index && "opacity-50 scale-[0.98]",
                block.isFocusBlock && "border-l-4 border-l-primary"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 mt-1 text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {editingId === block.id ? (
                    <div className="flex-1 space-y-2">
                      <Input value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="font-semibold" />
                      <div className="flex gap-2">
                        <Input type="time" value={editForm.startTime} onChange={(e) => setEditForm({...editForm, startTime: e.target.value})} className="w-32" />
                        <span className="flex items-center text-muted-foreground">-</span>
                        <Input type="time" value={editForm.endTime} onChange={(e) => setEditForm({...editForm, endTime: e.target.value})} className="w-32" />
                      </div>
                      <Input value={editForm.tasks} onChange={(e) => setEditForm({...editForm, tasks: e.target.value})} placeholder="Tareas separadas por coma" className="text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEditing(block)}><Check className="w-4 h-4 mr-1" />Guardar</Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}><X className="w-4 h-4 mr-1" />Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-sm">{block.title}</h3>
                          {block.isFocusBlock && <Badge variant="default" className="text-xs"><Target className="w-3 h-3 mr-1" />Focus</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}</span>
                        </div>
                        {block.tasks && block.tasks.length > 0 && (
                          <p className="text-xs text-muted-foreground/60 mt-1 truncate max-w-md">
                            {block.tasks.join(' · ')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditing(block)}><Edit2 className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteBlock(block.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
