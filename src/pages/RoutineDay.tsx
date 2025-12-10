import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRoutineBlocks, formatTimeDisplay, type RoutineBlock } from "@/hooks/useRoutineBlocks";
import { GripVertical, Clock, Target, Save, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function RoutineDay() {
  const { blocks, isLoaded, reorderBlocks, updateBlock, saveBlocks } = useRoutineBlocks();
  const { toast } = useToast();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', startTime: '', endTime: '', tasks: '' });

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    reorderBlocks(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    toast({
      title: "Orden actualizado",
      description: "El nuevo orden se reflejará en la página Focus",
    });
  };

  const startEditing = (block: RoutineBlock) => {
    setEditingId(block.id);
    setEditForm({
      title: block.title,
      startTime: block.startTime,
      endTime: block.endTime,
      tasks: block.tasks.join(', '),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ title: '', startTime: '', endTime: '', tasks: '' });
  };

  const saveEditing = (block: RoutineBlock) => {
    updateBlock({
      ...block,
      title: editForm.title,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      tasks: editForm.tasks.split(',').map(t => t.trim()).filter(Boolean),
    });
    setEditingId(null);
    toast({
      title: "Bloque actualizado",
      description: "Los cambios se guardaron correctamente",
    });
  };

  const addNewBlock = () => {
    const newBlock: RoutineBlock = {
      id: Date.now().toString(),
      title: "Nuevo Bloque",
      startTime: "12:00",
      endTime: "13:00",
      tasks: ["Nueva tarea"],
      order: blocks.length,
    };
    saveBlocks([...blocks, newBlock]);
    toast({
      title: "Bloque creado",
      description: "Se agregó un nuevo bloque a tu rutina",
    });
  };

  const deleteBlock = (id: string) => {
    const newBlocks = blocks
      .filter(b => b.id !== id)
      .map((b, idx) => ({ ...b, order: idx }));
    saveBlocks(newBlocks);
    toast({
      title: "Bloque eliminado",
      description: "El bloque fue eliminado de tu rutina",
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando rutina...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rutina del Día</h1>
            <p className="text-muted-foreground">
              Arrastra los bloques para reorganizar tu día
            </p>
          </div>
          <Button onClick={addNewBlock}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Bloque
          </Button>
        </header>

        <div className="space-y-3">
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
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 mt-1 text-muted-foreground hover:text-foreground">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {editingId === block.id ? (
                    <div className="flex-1 space-y-3">
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Título del bloque"
                        className="font-semibold"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="time"
                          value={editForm.startTime}
                          onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                          className="w-32"
                        />
                        <span className="flex items-center text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={editForm.endTime}
                          onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                          className="w-32"
                        />
                      </div>
                      <Input
                        value={editForm.tasks}
                        onChange={(e) => setEditForm({ ...editForm, tasks: e.target.value })}
                        placeholder="Tareas (separadas por coma)"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEditing(block)}>
                          <Check className="w-4 h-4 mr-1" />
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{block.title}</h3>
                          {block.isFocusBlock && (
                            <Badge variant="default" className="text-xs">
                              <Target className="w-3 h-3 mr-1" />
                              Focus
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {block.tasks.map((task, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {task}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditing(block)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteBlock(block.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {blocks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No hay bloques en tu rutina
              </p>
              <Button onClick={addNewBlock}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primer bloque
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
