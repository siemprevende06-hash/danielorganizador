import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, Sun, Moon, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { WakeOption, SleepOption } from '@/hooks/useRoutineConfig';

interface Props {
  wakeTime: WakeOption;
  onWakeChange: (w: WakeOption) => void;
  focusBlock: boolean;
  onFocusChange: (f: boolean) => void;
  sleepTime: SleepOption;
  onSleepChange: (s: SleepOption) => void;
  lateWake: string | null;
  onLateWakeChange: (t: string | null) => void;
  presetName: string;
}

export function RoutineConfigBar({
  wakeTime, onWakeChange,
  focusBlock, onFocusChange,
  sleepTime, onSleepChange,
  lateWake, onLateWakeChange,
  presetName,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showLateInput, setShowLateInput] = useState(false);

  return (
    <Card className="p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <div className="flex gap-1">
            <button
              onClick={() => onWakeChange('05:00')}
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium rounded transition-colors',
                wakeTime === '05:00' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >5:00 AM</button>
            <button
              onClick={() => onWakeChange('06:30')}
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium rounded transition-colors',
                wakeTime === '06:30' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >6:30 AM</button>
          </div>

          {wakeTime === '05:00' && (
            <>
              <Zap className="h-3.5 w-3.5 text-primary ml-1" />
              <button
                onClick={() => onFocusChange(!focusBlock)}
                className={cn(
                  'px-2 py-0.5 text-[10px] font-medium rounded transition-colors',
                  focusBlock ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >Focus {focusBlock ? 'Sí' : 'No'}</button>
            </>
          )}

          <Moon className="h-3.5 w-3.5 text-indigo-500 ml-1" />
          <div className="flex gap-1">
            <button
              onClick={() => onSleepChange('22:30')}
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium rounded transition-colors',
                sleepTime === '22:30' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >10:30 PM</button>
            <button
              onClick={() => onSleepChange('21:00')}
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium rounded transition-colors',
                sleepTime === '21:00' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >9:00 PM</button>
          </div>

          <button
            onClick={() => setShowLateInput(!showLateInput)}
            className={cn(
              'px-2 py-0.5 text-[10px] font-medium rounded transition-colors flex items-center gap-1',
              lateWake ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <Clock className="h-3 w-3" />
            {lateWake ? `Desperté ${lateWake}` : '😴 Tardío'}
          </button>
        </div>

        <Badge variant="outline" className="text-[9px] font-normal shrink-0 hidden sm:inline-flex">
          {presetName}
        </Badge>
      </div>

      {showLateInput && (
        <div className="mt-2 flex items-center gap-2 pt-2 border-t">
          <span className="text-[10px] text-muted-foreground">Hora que despertaste:</span>
          <Input
            type="time"
            value={lateWake || ''}
            onChange={(e) => onLateWakeChange(e.target.value || null)}
            className="h-7 w-28 text-xs"
          />
          {lateWake && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] text-muted-foreground"
              onClick={() => { onLateWakeChange(null); setShowLateInput(false); }}
            >
              Quitar
            </Button>
          )}
          <span className="text-[9px] text-muted-foreground">
            (se resetea mañana)
          </span>
        </div>
      )}
    </Card>
  );
}
