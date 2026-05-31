import { Sun, Moon, AlertTriangle, Check, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RoutinePreset } from "@/hooks/useRoutinePresets";

interface RoutinePresetSelectorProps {
  presets: RoutinePreset[];
  selectedPresetId: string | null;
  onSelectPreset: (presetId: string) => void;
}

const PRESET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  moon: Moon,
  'alert-triangle': AlertTriangle,
};

const PRESET_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-500' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/50', text: 'text-purple-500' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-500' },
};

export function RoutinePresetSelector({ 
  presets, 
  selectedPresetId, 
  onSelectPreset 
}: RoutinePresetSelectorProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:${minutes} ${period}`;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Configuración Rápida de Rutina
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {presets.map((preset) => {
          const Icon = PRESET_ICONS[preset.icon || 'sun'] || Sun;
          const colors = PRESET_COLORS[preset.color || 'blue'] || PRESET_COLORS.blue;
          const isSelected = selectedPresetId === preset.id;
          const excludedCount = preset.excluded_block_ids.length;

          return (
            <Card
              key={preset.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:scale-[1.02]",
                colors.bg,
                isSelected 
                  ? `ring-2 ring-primary ${colors.border}` 
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => onSelectPreset(preset.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2 rounded-lg", colors.bg)}>
                  <Icon className={cn("h-6 w-6", colors.text)} />
                </div>
                {isSelected && (
                  <div className="bg-primary text-primary-foreground p-1 rounded-full">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>

              <h4 className="font-bold text-lg mb-1">{preset.name}</h4>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {preset.description}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Despertar:</span>
                  <span className="font-medium">{formatTime(preset.wake_time)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dormir:</span>
                  <span className="font-medium">{formatTime(preset.sleep_time)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sueño:</span>
                  <Badge variant="secondary" className={cn(colors.text)}>
                    {preset.sleep_hours}h
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50">
                {excludedCount > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    ❌ {excludedCount} bloque{excludedCount > 1 ? 's' : ''} excluido{excludedCount > 1 ? 's' : ''}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    ✅ Todos los bloques activos
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
