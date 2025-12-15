import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Coffee
} from "lucide-react";
import { PERFORMANCE_MODES, PerformanceMode } from "@/lib/performanceModes";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  rocket: Rocket,
  activity: Activity,
  "battery-low": BatteryLow,
  heart: Heart,
};

const STORAGE_KEY = "selectedPerformanceMode";

export default function PerformanceModes() {
  const [selectedMode, setSelectedMode] = useState<string>("normal");
  const [previewMode, setPreviewMode] = useState<PerformanceMode | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedMode(stored);
    }
  }, []);

  const handleSelectMode = (modeId: string) => {
    setSelectedMode(modeId);
    localStorage.setItem(STORAGE_KEY, modeId);
    toast({
      title: "Modo seleccionado",
      description: `El modo "${PERFORMANCE_MODES.find(m => m.id === modeId)?.name}" será tu configuración predeterminada.`,
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Modos de Rendimiento
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecciona el modo que define la distribución de tus bloques de tiempo según tu energía y objetivos del día
          </p>
        </div>

        {/* Mode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PERFORMANCE_MODES.map((mode) => {
            const IconComponent = ICON_MAP[mode.icon] || Activity;
            const isSelected = selectedMode === mode.id;
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
                          Seleccionado
                        </>
                      ) : (
                        "Seleccionar"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewMode(mode);
                      }}
                    >
                      Ver Bloques
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Preview Panel */}
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
                  Bloques de {previewMode.name}
                </h2>
              </div>
              <Button variant="ghost" onClick={() => setPreviewMode(null)}>
                Cerrar
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {previewMode.blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                      block.isFocusBlock
                        ? "bg-primary/5 border-primary/30"
                        : "bg-muted/30 border-border"
                    )}
                  >
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
                        {block.tasks.join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <Coffee className="h-4 w-4 text-amber-500" />
                      )}
                      {block.title.toLowerCase().includes("sueño") && (
                        <Moon className="h-4 w-4 text-indigo-500" />
                      )}
                    </div>
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
                Cuando planifiques tu día, el modo seleccionado determinará automáticamente 
                la distribución de tus bloques de tiempo. Puedes cambiar el modo en cualquier 
                momento desde el planificador diario para adaptarte a tus necesidades del día.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
