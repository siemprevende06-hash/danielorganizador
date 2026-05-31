import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateMorningSchedule, getTimeComparison } from "@/lib/routineScheduler";
import { RoutineBlock } from "@/components/RoutineBlockCard";
import { Badge } from "@/components/ui/badge";

interface WakeTimeSettingsProps {
  currentSettings: {
    wake_time: string;
    morning_end_time: string;
    auto_adjust_enabled: boolean;
  } | null;
  blocks: RoutineBlock[];
  onSave: (settings: {
    wake_time: string;
    morning_end_time: string;
    auto_adjust_enabled: boolean;
  }) => Promise<void>;
}

export function WakeTimeSettings({ currentSettings, blocks, onSave }: WakeTimeSettingsProps) {
  const [open, setOpen] = useState(false);
  const [wakeTime, setWakeTime] = useState("05:00");
  const [morningEndTime, setMorningEndTime] = useState("09:00");
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [preview, setPreview] = useState<RoutineBlock[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (currentSettings) {
      // Convert TIME to HH:MM format
      const wakeTimeStr = currentSettings.wake_time.substring(0, 5);
      const endTimeStr = currentSettings.morning_end_time.substring(0, 5);
      setWakeTime(wakeTimeStr);
      setMorningEndTime(endTimeStr);
      setAutoAdjust(currentSettings.auto_adjust_enabled);
    }
  }, [currentSettings]);

  useEffect(() => {
    if (open) {
      const config = calculateMorningSchedule(wakeTime, morningEndTime, blocks);
      setPreview(config.adjustedBlocks);
    }
  }, [wakeTime, morningEndTime, open, blocks]);

  const handleSave = async () => {
    try {
      await onSave({
        wake_time: wakeTime + ":00",
        morning_end_time: morningEndTime + ":00",
        auto_adjust_enabled: autoAdjust,
      });
      
      toast({
        title: "Configuración guardada",
        description: autoAdjust 
          ? "Tu rutina matutina se ajustará automáticamente"
          : "Ajuste automático desactivado",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  const timeComparison = getTimeComparison(wakeTime);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Ajustar Hora de Despertar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>⏰ Configurar Rutina Matutina</DialogTitle>
          <DialogDescription>
            Ajusta tu hora de despertar y la rutina se adaptará automáticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Settings */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="wake-time">Hora de Despertar</Label>
              <Input
                id="wake-time"
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end-time">Hora de Fin de Mañana</Label>
              <Input
                id="end-time"
                type="time"
                value={morningEndTime}
                onChange={(e) => setMorningEndTime(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="auto-adjust">Ajuste Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Adapta los bloques matutinos según tu hora de despertar
                </p>
              </div>
              <Switch
                id="auto-adjust"
                checked={autoAdjust}
                onCheckedChange={setAutoAdjust}
              />
            </div>
          </div>

          {/* Time Comparison */}
          <div className={`p-4 rounded-lg ${
            timeComparison.type === 'late' ? 'bg-orange-500/10 border border-orange-500/20' :
            timeComparison.type === 'early' ? 'bg-green-500/10 border border-green-500/20' :
            'bg-blue-500/10 border border-blue-500/20'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">
                  {timeComparison.type === 'late' && '⚠️ Despertarás más tarde'}
                  {timeComparison.type === 'early' && '✅ Despertarás más temprano'}
                  {timeComparison.type === 'ontime' && '👌 A tiempo'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {timeComparison.message}
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {autoAdjust && (
            <div className="space-y-3">
              <h4 className="font-semibold">Vista Previa de Bloques Ajustados</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {preview.map((block) => (
                  <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{block.title}</p>
                      <p className="text-sm text-muted-foreground">{block.time}</p>
                    </div>
                    <Badge variant="secondary">{block.duration} min</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Guardar Configuración
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
