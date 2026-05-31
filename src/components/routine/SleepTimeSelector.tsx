import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Sun, Clock } from "lucide-react";

interface SleepTimeSelectorProps {
  wakeTime: string;
  sleepTime: string;
  excludeIdiomas: boolean;
  excludeBloqueExtra: boolean;
  onWakeTimeChange: (time: string) => void;
  onSleepTimeChange: (time: string) => void;
  onExcludeIdiomasChange: (exclude: boolean) => void;
  onExcludeBloqueExtraChange: (exclude: boolean) => void;
}

const WAKE_TIMES = [
  { value: '05:00', label: '5:00 AM' },
  { value: '05:30', label: '5:30 AM' },
  { value: '06:00', label: '6:00 AM' },
  { value: '06:30', label: '6:30 AM' },
  { value: '07:00', label: '7:00 AM' },
];

const SLEEP_TIMES = [
  { value: '21:00', label: '9:00 PM' },
  { value: '21:30', label: '9:30 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '22:30', label: '10:30 PM' },
  { value: '23:00', label: '11:00 PM' },
];

export function SleepTimeSelector({
  wakeTime,
  sleepTime,
  excludeIdiomas,
  excludeBloqueExtra,
  onWakeTimeChange,
  onSleepTimeChange,
  onExcludeIdiomasChange,
  onExcludeBloqueExtraChange,
}: SleepTimeSelectorProps) {
  const calculateSleepHours = () => {
    const [wakeH, wakeM] = wakeTime.split(':').map(Number);
    const [sleepH, sleepM] = sleepTime.split(':').map(Number);
    
    let wakeMinutes = wakeH * 60 + wakeM;
    let sleepMinutes = sleepH * 60 + sleepM;
    
    // Add 24 hours to wake time since it's next day
    wakeMinutes += 24 * 60;
    
    const totalMinutes = wakeMinutes - sleepMinutes;
    return (totalMinutes / 60).toFixed(1);
  };

  const sleepHours = parseFloat(calculateSleepHours());
  const sleepQuality = sleepHours >= 8 ? 'text-green-500' : sleepHours >= 7 ? 'text-yellow-500' : 'text-red-500';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Moon className="h-5 w-5" />
          Configurar Sueño
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              Despertar
            </Label>
            <Select value={wakeTime} onValueChange={onWakeTimeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WAKE_TIMES.map(time => (
                  <SelectItem key={time.value} value={time.value}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-500" />
              Dormir
            </Label>
            <Select value={sleepTime} onValueChange={onSleepTimeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLEEP_TIMES.map(time => (
                  <SelectItem key={time.value} value={time.value}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Horas de sueño</p>
            <p className={`text-3xl font-bold ${sleepQuality}`}>{sleepHours}h</p>
            {sleepHours < 7 && (
              <p className="text-xs text-red-500 mt-1">⚠️ Menos de 7 horas</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <Label className="font-medium">Eliminar bloque de Idiomas</Label>
              <p className="text-xs text-muted-foreground">
                5:30-7:00 AM → Permite despertar a las 6:30 AM
              </p>
            </div>
            <Switch
              checked={excludeIdiomas}
              onCheckedChange={(checked) => {
                onExcludeIdiomasChange(checked);
                if (checked && wakeTime === '05:00') {
                  onWakeTimeChange('06:30');
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <Label className="font-medium">Eliminar bloque extra nocturno</Label>
              <p className="text-xs text-muted-foreground">
                9:00-11:00 PM → Asegura dormir antes de las 9 PM
              </p>
            </div>
            <Switch
              checked={excludeBloqueExtra}
              onCheckedChange={(checked) => {
                onExcludeBloqueExtraChange(checked);
                if (checked && sleepTime === '23:00') {
                  onSleepTimeChange('21:00');
                }
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
