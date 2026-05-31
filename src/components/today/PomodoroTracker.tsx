import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface PomodoroTrackerProps {
  blockStartTime: string;
  blockEndTime: string;
  cycleDuration?: number; // minutes, default 30
}

interface Cycle {
  index: number;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  status: 'completed' | 'active' | 'pending';
  progress: number;
}

export function PomodoroTracker({ 
  blockStartTime, 
  blockEndTime, 
  cycleDuration = 30 
}: PomodoroTrackerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cycles, setCycles] = useState<Cycle[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for smooth timer
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    calculateCycles();
  }, [blockStartTime, blockEndTime, currentTime]);

  const parseTime = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const formatTimeFromMinutes = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const calculateCycles = () => {
    const startMinutes = parseTime(blockStartTime);
    const endMinutes = parseTime(blockEndTime);
    const totalBlockMinutes = endMinutes - startMinutes;
    const numCycles = Math.ceil(totalBlockMinutes / cycleDuration);
    
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const currentSeconds = currentTime.getSeconds();

    const newCycles: Cycle[] = [];

    for (let i = 0; i < numCycles; i++) {
      const cycleStartMinutes = startMinutes + (i * cycleDuration);
      const cycleEndMinutes = Math.min(cycleStartMinutes + cycleDuration, endMinutes);
      
      let status: 'completed' | 'active' | 'pending' = 'pending';
      let progress = 0;

      if (currentMinutes >= cycleEndMinutes) {
        status = 'completed';
        progress = 100;
      } else if (currentMinutes >= cycleStartMinutes && currentMinutes < cycleEndMinutes) {
        status = 'active';
        const elapsedMinutes = currentMinutes - cycleStartMinutes;
        const elapsedSeconds = elapsedMinutes * 60 + currentSeconds;
        const totalCycleSeconds = (cycleEndMinutes - cycleStartMinutes) * 60;
        progress = (elapsedSeconds / totalCycleSeconds) * 100;
      }

      const startH = Math.floor(cycleStartMinutes / 60);
      const startM = cycleStartMinutes % 60;
      const endH = Math.floor(cycleEndMinutes / 60);
      const endM = cycleEndMinutes % 60;

      newCycles.push({
        index: i + 1,
        startTime: `${startH}:${startM.toString().padStart(2, '0')}`,
        endTime: `${endH}:${endM.toString().padStart(2, '0')}`,
        startMinutes: cycleStartMinutes,
        endMinutes: cycleEndMinutes,
        status,
        progress
      });
    }

    setCycles(newCycles);
  };

  const getActiveCycle = () => cycles.find(c => c.status === 'active');

  const formatRemainingTime = (cycle: Cycle): string => {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const currentSeconds = currentTime.getSeconds();
    
    const totalSecondsRemaining = (cycle.endMinutes - currentMinutes) * 60 - currentSeconds;
    
    if (totalSecondsRemaining <= 0) return "0:00";
    
    const minutes = Math.floor(totalSecondsRemaining / 60);
    const seconds = totalSecondsRemaining % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const activeCycle = getActiveCycle();
  const completedCount = cycles.filter(c => c.status === 'completed').length;

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Ciclos de Trabajo</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{cycles.length} completados
        </span>
      </div>

      <div className="space-y-3">
        {cycles.map((cycle) => (
          <div 
            key={cycle.index}
            className={cn(
              "rounded-lg p-3 transition-all",
              cycle.status === 'active' 
                ? "bg-primary/10 border-2 border-primary shadow-sm" 
                : cycle.status === 'completed'
                  ? "bg-muted/50 border border-border"
                  : "bg-card border border-border/50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {cycle.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : cycle.status === 'active' ? (
                  <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  cycle.status === 'completed' && "text-muted-foreground"
                )}>
                  Ciclo {cycle.index}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeFromMinutes(cycle.startMinutes)} - {formatTimeFromMinutes(cycle.endMinutes)}
                </span>
              </div>
              
              {cycle.status === 'active' && (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono font-bold text-primary">
                    {formatRemainingTime(cycle)}
                  </span>
                  <span className="text-xs text-muted-foreground">restante</span>
                </div>
              )}
              
              {cycle.status === 'completed' && (
                <span className="text-xs text-success font-medium">✓ Completado</span>
              )}
            </div>

            <Progress 
              value={cycle.progress} 
              className={cn(
                "h-2",
                cycle.status === 'completed' && "[&>div]:bg-success"
              )} 
            />
          </div>
        ))}
      </div>

      {activeCycle && (
        <div className="text-center pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Enfócate los próximos <span className="font-bold text-foreground">{formatRemainingTime(activeCycle)}</span> minutos
          </p>
        </div>
      )}
    </div>
  );
}
