import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRoutineBlocks, formatTimeDisplay, type RoutineBlock } from "@/hooks/useRoutineBlocks";
import { GripVertical, Clock, Target, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const NEW_ROUTINE: { title: string; startTime: string; endTime: string; tasks: string[]; isFocusBlock?: boolean }[] = [
  { title: "Despertar / Rutina de Activación", startTime: "06:30", endTime: "07:00", tasks: ["Despertar", "Hidratación", "Estiramientos"] },
  { title: "Gym", startTime: "07:00", endTime: "08:00", tasks: ["Calentamiento", "Entrenamiento", "Estiramientos"], isFocusBlock: false },
  { title: "Alistamiento y Desayuno", startTime: "08:00", endTime: "08:30", tasks: ["Ducha", "Vestirse", "Desayuno"] },
  { title: "Viaje a CUJAE (Lectura o Podcast)", startTime: "08:30", endTime: "09:00", tasks: ["Lectura", "Podcast educativo"] },
  { title: "Focus 1", startTime: "09:00", endTime: "09:30", tasks: ["Tarea más importante"], isFocusBlock: true },
  { title: "Focus 2", startTime: "09:30", endTime: "10:00", tasks: ["Continuación"], isFocusBlock: true },
  { title: "Focus 3", startTime: "10:00", endTime: "10:30", tasks: ["Trabajo concentrado"], isFocusBlock: true },
  { title: "Focus 4", startTime: "10:30", endTime: "11:00", tasks: ["Proyecto"], isFocusBlock: true },
  { title: "Focus 5", startTime: "11:00", endTime: "11:30", tasks: ["Tarea pendiente"], isFocusBlock: true },
  { title: "Focus 6", startTime: "11:30", endTime: "12:00", tasks: ["Finalizar bloque"], isFocusBlock: true },
  { title: "Focus 7", startTime: "12:00", endTime: "12:40", tasks: ["Trabajo profundo"], isFocusBlock: true },
  { title: "Focus 8", startTime: "12:40", endTime: "13:20", tasks: ["Completar tareas"], isFocusBlock: true },
  { title: "Almuerzo", startTime: "13:20", endTime: "14:00", tasks: ["Almorzar", "Descanso"] },
  { title: "Focus 9", startTime: "14:00", endTime: "14:30", tasks: ["Tareas pendientes"], isFocusBlock: true },
  { title: "Focus 10", startTime: "14:30", endTime: "15:00", tasks: ["Proyecto"], isFocusBlock: true },
  { title: "Focus 11", startTime: "15:00", endTime: "15:30", tasks: ["Trabajo"], isFocusBlock: true },
  { title: "Focus 12", startTime: "15:30", endTime: "16:00", tasks: ["Finalizar"], isFocusBlock: true },
  { title: "Focus 13", startTime: "16:00", endTime: "16:30", tasks: ["Últimas tareas"], isFocusBlock: true },
  { title: "Focus 14", startTime: "16:30", endTime: "17:00", tasks: ["Cerrar día laboral"], isFocusBlock: true },
  { title: "Viaje a casa / Descanso", startTime: "17:00", endTime: "17:30", tasks: ["Descanso", "Podcast"] },
  { title: "Idiomas", startTime: "17:30", endTime: "19:00", tasks: ["Inglés / Italiano"] },
  { title: "Ocio", startTime: "19:00", endTime: "20:00", tasks: ["Entretenimiento", "Descanso"] },
  { title: "Piano", startTime: "20:00", endTime: "20:30", tasks: ["Práctica musical"] },
  { title: "Bloque Libre (Multifuncional)", startTime: "20:30", endTime: "22:00", tasks: ["Tareas pendientes", "Estudio extra", "Hobby"] },
  { title: "Rutina de Desactivación", startTime: "22:00", endTime: "22:30", tasks: ["Skincare", "Preparación para dormir"] },
];

export default function RoutineDay() {
  const { blocks, isLoaded, reorderBlocks, updateBlock, saveBlocks } = useRoutineBlocks();
  const { toast } = useToast();
  const [useNewRoutine, setUseNewRoutine] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', startTime: '', endTime: '', tasks: '' });

  const displayBlocks = useNewRoutine
    ? NEW_ROUTINE.map((b, i) => ({ ...b, id: `new-${i}`, order: i, tasks: b.tasks } as RoutineBlock))
    : blocks;

  const handleDragStart = (index: number) => { if (!useNewRoutine) setDraggedIndex(index); };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (useNewRoutine || draggedIndex === null || draggedIndex === index) return;
    reorderBlocks(draggedIndex, index);
    setDraggedIndex(index);
  };
  const handleDragEnd = () => { setDraggedIndex(null); };

  const startEditing = (block: RoutineBlock) => {
    if (useNewRoutine) return;
    setEditingId(block.id);
    setEditForm({ title: block.title, startTime: block.startTime, endTime: block.endTime, tasks: block.tasks.join(', ') });
  };

  const cancelEditing = () => { setEditingId(null); };

  const saveEditing = (block: RoutineBlock) => {
    updateBlock({ ...block, title: editForm.title, startTime: editForm.startTime, endTime: editForm.endTime, tasks: editForm.tasks.split(',').map(t => t.trim()).filter(Boolean) });
    setEditingId(null);
    toast({ title: "Bloque actualizado" });
  };

  const addNewBlock = () => {
    const newBlock: RoutineBlock = { id: Date.now().toString(), title: "Nuevo Bloque", startTime: "12:00", endTime: "13:00", tasks: ["Nueva tarea"], order: blocks.length };
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
            <h1 className="text-3xl font-bold">Rutina del Día</h1>
            <p className="text-muted-foreground">
              {useNewRoutine ? 'Nueva Rutina (6:30 AM)' : 'Rutina Anterior (5:00 AM)'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="routine-switch" className="text-sm">Anterior</Label>
              <Switch id="routine-switch" checked={useNewRoutine} onCheckedChange={setUseNewRoutine} />
              <Label htmlFor="routine-switch" className="text-sm font-medium">Nueva</Label>
            </div>
            {!useNewRoutine && (
              <Button onClick={addNewBlock}><Plus className="w-4 h-4 mr-2" />Agregar Bloque</Button>
            )}
          </div>
        </header>

        <div className="space-y-2">
          {displayBlocks.map((block, index) => (
            <Card key={block.id}
              draggable={!useNewRoutine}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "transition-all",
                !useNewRoutine && "cursor-move",
                draggedIndex === index && "opacity-50 scale-[0.98]",
                block.isFocusBlock && "border-l-4 border-l-primary"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {!useNewRoutine && (
                    <div className="flex items-center justify-center w-6 h-6 mt-1 text-muted-foreground">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}

                  {editingId === block.id ? (
                    <div className="flex-1 space-y-2">
                      <Input value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="font-semibold" />
                      <div className="flex gap-2">
                        <Input type="time" value={editForm.startTime} onChange={(e) => setEditForm({...editForm, startTime: e.target.value})} className="w-32" />
                        <span className="flex items-center text-muted-foreground">-</span>
                        <Input type="time" value={editForm.endTime} onChange={(e) => setEditForm({...editForm, endTime: e.target.value})} className="w-32" />
                      </div>
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
                      </div>
                      {!useNewRoutine && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditing(block)}><Edit2 className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteBlock(block.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      )}
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