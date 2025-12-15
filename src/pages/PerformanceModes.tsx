import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Rocket, 
  Activity, 
  BatteryLow, 
  Heart, 
  Clock, 
  CheckCircle2,
  Zap,
  Moon,
  Sun,
  Coffee,
  Edit2,
  Save,
  RotateCcw,
  Plus,
  Trash2
} from "lucide-react";
import { usePerformanceModes, PerformanceMode } from "@/hooks/usePerformanceModes";
import { RoutineBlock } from "@/hooks/useRoutineBlocks";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  rocket: Rocket,
  activity: Activity,
  "battery-low": BatteryLow,
  heart: Heart,
};

export default function PerformanceModes() {
  const { 
    modes, 
    selectedModeId, 
    isLoaded,
    selectMode, 
    updateBlockInMode,
    addBlockToMode,
    removeBlockFromMode,
    resetModeToDefault 
  } = usePerformanceModes();
  
  const [previewMode, setPreviewMode] = useState<PerformanceMode | null>(null);
  const [editingBlock, setEditingBlock] = useState<{ modeId: string; blockId: string } | null>(null);
  const [editForm, setEditForm] = useState<Partial<RoutineBlock>>({});
  const [showAddBlock, setShowAddBlock] = useState<string | null>(null);
  const [newBlock, setNewBlock] = useState({ title: '', startTime: '', endTime: '' });
  const { toast } = useToast();

  const handleSelectMode = (modeId: string) => {
    selectMode(modeId);
    toast({
      title: "Modo aplicado",
      description: `Los bloques de "${modes.find(m => m.id === modeId)?.name}" ahora son tu rutina del día.`,
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const countDeepWorkBlocks = (mode: PerformanceMode) => {
    return mode.blocks.filter(b => b.isFocusBlock).length;
  };

  const getTotalDeepWorkHours = (mode: PerformanceMode) => {
    const totalMinutes = mode.blocks
      .filter(b => b.isFocusBlock)
      .reduce((acc, block) => {
        const [startH, startM] = block.startTime.split(":").map(Number);
        const [endH, endM] = block.endTime.split(":").map(Number);
        let diff = (endH * 60 + endM) - (startH * 60 + startM);
        if (diff < 0) diff += 24 * 60;
        return acc + diff;
      }, 0);
    return (totalMinutes / 60).toFixed(1);
  };

  const startEditBlock = (modeId: string, block: RoutineBlock) => {
    setEditingBlock({ modeId, blockId: block.id });
    setEditForm({
      title: block.title,
      startTime: block.startTime,
      endTime: block.endTime,
    });
  };

  const saveBlockEdit = () => {
    if (editingBlock && editForm.title && editForm.startTime && editForm.endTime) {
      updateBlockInMode(editingBlock.modeId, editingBlock.blockId, editForm);
      setEditingBlock(null);
      setEditForm({});
      toast({ title: "Bloque actualizado" });
    }
  };

  const handleAddBlock = (modeId: string) => {
    if (newBlock.title && newBlock.startTime && newBlock.endTime) {
      const mode = modes.find(m => m.id === modeId);
      const newId = `${modeId}-${Date.now()}`;
      addBlockToMode(modeId, {
        id: newId,
        title: newBlock.title,
        startTime: newBlock.startTime,
        endTime: newBlock.endTime,
        tasks: [],
        order: mode?.blocks.length || 0,
      });
      setNewBlock({ title: '', startTime: '', endTime: '' });
      setShowAddBlock(null);
      toast({ title: "Bloque agregado" });
    }
  };

  const handleDeleteBlock = (modeId: string, blockId: string) => {
    removeBlockFromMode(modeId, blockId);
    toast({ title: "Bloque eliminado" });
  };

  const handleResetMode = (modeId: string) => {
    resetModeToDefault(modeId);
    toast({ title: "Modo restaurado a valores predeterminados" });
  };

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Modos de Rendimiento
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecciona y personaliza el modo que define la distribución de tus bloques de tiempo
          </p>
        </div>

        {/* Mode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modes.map((mode) => {
            const IconComponent = ICON_MAP[mode.icon] || Activity;
            const isSelected = selectedModeId === mode.id;
            const deepWorkBlocks = countDeepWorkBlocks(mode);
            const deepWorkHours = getTotalDeepWorkHours(mode);

            return (
              <Card
                key={mode.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 cursor-pointer group",
                  isSelected
                    ? "ring-2 ring-primary shadow-lg shadow-primary/20"
                    : "hover:shadow-lg hover:scale-[1.02]"
                )}
                onClick={() => setPreviewMode(mode)}
              >
                {/* Gradient Background */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-10 bg-gradient-to-br",
                    mode.color
                  )}
                />

                <div className="relative p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-3 rounded-xl bg-gradient-to-br",
                          mode.color
                        )}
                      >
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{mode.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sun className="h-4 w-4" />
                          <span>Despertar: {formatTime(mode.wakeTime)}</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Badge className="bg-primary">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Activo
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground">{mode.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                      <p className="text-2xl font-bold">{deepWorkBlocks}</p>
                      <p className="text-xs text-muted-foreground">Deep Work</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-2xl font-bold">{deepWorkHours}h</p>
                      <p className="text-xs text-muted-foreground">Productivas</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <Moon className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                      <p className="text-2xl font-bold">{mode.blocks.length}</p>
                      <p className="text-xs text-muted-foreground">Bloques</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectMode(mode.id);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Activo
                        </>
                      ) : (
                        "Aplicar Modo"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewMode(mode);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Edit Panel */}
        {previewMode && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg bg-gradient-to-br",
                    previewMode.color
                  )}
                >
                  {(() => {
                    const Icon = ICON_MAP[previewMode.icon] || Activity;
                    return <Icon className="h-5 w-5 text-white" />;
                  })()}
                </div>
                <h2 className="text-2xl font-bold">
                  Editar: {previewMode.name}
                </h2>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleResetMode(previewMode.id)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddBlock(previewMode.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Bloque
                </Button>
                <Button variant="ghost" onClick={() => setPreviewMode(null)}>
                  Cerrar
                </Button>
              </div>
            </div>

            {/* Add Block Form */}
            {showAddBlock === previewMode.id && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
                <h4 className="font-medium">Nuevo Bloque</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder="Título"
                    value={newBlock.title}
                    onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={newBlock.startTime}
                    onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAddBlock(previewMode.id)}>
                    Agregar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddBlock(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {previewMode.blocks.map((block) => (
                  <div
                    key={block.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                      block.isFocusBlock
                        ? "bg-primary/5 border-primary/30"
                        : "bg-muted/30 border-border"
                    )}
                  >
                    {editingBlock?.blockId === block.id ? (
                      // Edit Mode
                      <div className="flex-1 flex items-center gap-3">
                        <Input
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="flex-1"
                        />
                        <Input
                          type="time"
                          value={editForm.startTime || ''}
                          onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                          className="w-32"
                        />
                        <Input
                          type="time"
                          value={editForm.endTime || ''}
                          onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                          className="w-32"
                        />
                        <Button size="sm" onClick={saveBlockEdit}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingBlock(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="text-center min-w-[100px]">
                          <p className="text-sm font-medium">
                            {formatTime(block.startTime)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(block.endTime)}
                          </p>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{block.title}</span>
                            {block.isFocusBlock && (
                              <Badge variant="secondary" className="text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                Deep Work
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {block.tasks?.join(", ")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditBlock(previewMode.id, block)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteBlock(previewMode.id, block.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* Info Section */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                ¿Cómo funcionan los modos?
              </h3>
              <p className="text-muted-foreground">
                Al hacer clic en "Aplicar Modo", los bloques de ese modo se convertirán en tu rutina del día. 
                Los verás reflejados en la página de Inicio y Rutina del Día. Puedes editar los horarios 
                de cada modo haciendo clic en "Editar".
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
