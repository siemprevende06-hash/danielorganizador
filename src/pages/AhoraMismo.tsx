import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, ArrowRight, CheckCircle2, Circle, Moon } from 'lucide-react';
import { useRoutineBlocks, parseTime, formatTimeDisplay, ROUTINES, type RoutineBlock } from '@/hooks/useRoutineBlocks';
import { cn } from '@/lib/utils';

function nowMinutes(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

function isInBlock(block: RoutineBlock, mins: number) {
  const start = parseTime(block.startTime);
  const end = parseTime(block.endTime);
  if (end <= start) return mins >= start || mins < end;
  return mins >= start && mins < end;
}

export default function AhoraMismo() {
  const { blocks, isLoaded, routineType } = useRoutineBlocks();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const routine = ROUTINES.find(r => r.type === routineType);
  const mins = nowMinutes(now);

  const ordered = useMemo(
    () => [...blocks].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime)),
    [blocks]
  );

  const currentIndex = useMemo(() => ordered.findIndex(b => isInBlock(b, mins)), [ordered, mins]);
  const current = currentIndex >= 0 ? ordered[currentIndex] : null;
  const next = useMemo(() => {
    if (currentIndex >= 0) return ordered[currentIndex + 1] || ordered[0] || null;
    return ordered.find(b => parseTime(b.startTime) > mins) || ordered[0] || null;
  }, [ordered, currentIndex, mins]);

  const progress = useMemo(() => {
    if (!current) return 0;
    const start = parseTime(current.startTime);
    let end = parseTime(current.endTime);
    if (end <= start) end += 24 * 60;
    let m = mins < start ? mins + 24 * 60 : mins;
    return Math.min(100, Math.max(0, ((m - start) / (end - start)) * 100));
  }, [current, mins]);

  const minutesLeft = useMemo(() => {
    if (!current) return 0;
    const start = parseTime(current.startTime);
    let end = parseTime(current.endTime);
    if (end <= start) end += 24 * 60;
    const m = mins < start ? mins + 24 * 60 : mins;
    return Math.max(0, Math.round(end - m));
  }, [current, mins]);

  const minutesToNext = useMemo(() => {
    if (!next) return 0;
    let start = parseTime(next.startTime);
    if (start <= mins) start += 24 * 60;
    return Math.max(0, start - mins);
  }, [next, mins]);

  const renderTasks = (block: RoutineBlock) => {
    const tasks = [...(block.tasks || []), ...(block.genericTasks || [])].filter(Boolean);
    if (tasks.length === 0) {
      return <p className="text-sm text-muted-foreground">Sin tareas definidas en este bloque.</p>;
    }
    return (
      <ul className="space-y-1.5">
        {tasks.map((t, i) => (
          <li key={`${t}-${i}`} className="flex items-start gap-2 text-sm">
            <Circle className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    );
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-4 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ahora mismo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rutina {routine?.label || routineType} · {routine?.icon}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">
              {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        {/* Bloque actual */}
        {current ? (
          <Card className="p-5 border-primary/40">
            <div className="flex items-center justify-between mb-2">
              <Badge className="gap-1"><Clock className="h-3 w-3" /> Bloque actual</Badge>
              <span className="text-xs text-muted-foreground">
                Quedan {minutesLeft} min
              </span>
            </div>
            <h2 className="text-2xl font-bold">{current.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatTimeDisplay(current.startTime)} → {formatTimeDisplay(current.endTime)}
              {current.currentFocus ? ` · ${current.currentFocus}` : ''}
            </p>
            <Progress value={progress} className="h-2 mt-3" />
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Tareas
              </h3>
              {renderTasks(current)}
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <Moon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">No hay bloque activo ahora mismo</p>
            <p className="text-sm text-muted-foreground mt-1">Tiempo libre o fuera de la rutina.</p>
          </Card>
        )}

        {/* Bloque siguiente */}
        {next && (
          <Card className={cn('p-5 bg-muted/30')}>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="gap-1">
                <ArrowRight className="h-3 w-3" /> Siguiente bloque
              </Badge>
              <span className="text-xs text-muted-foreground">En {minutesToNext} min</span>
            </div>
            <h2 className="text-xl font-semibold">{next.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatTimeDisplay(next.startTime)} → {formatTimeDisplay(next.endTime)}
              {next.currentFocus ? ` · ${next.currentFocus}` : ''}
            </p>
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Tareas
              </h3>
              {renderTasks(next)}
            </div>
          </Card>
        )}

        <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Los bloques provienen de la rutina seleccionada en la página Hoy.
        </p>
      </div>
    </div>
  );
}
