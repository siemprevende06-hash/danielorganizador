import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Plus, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PointBMetric } from '@/hooks/usePointBMetrics';

interface HabitDef {
  id: string;
  name: string;
  hasTime?: boolean;
  hasCount?: boolean;
  countLabel?: string;
}

const HABITS_BY_PB_AREA: Record<string, HabitDef[]> = {
  salud: [
    { id: 'alistamiento-desayuno', name: 'Alistamiento y Desayuno' },
    { id: 'horario-regular', name: 'Horario Regular' },
    { id: 'pre-entreno', name: 'Pre-entreno' },
    { id: 'desayuno', name: 'Desayuno' },
    { id: 'entrenamiento-fisico', name: 'Ejercicio' },
    { id: 'almuerzo', name: 'Almuerzo' },
    { id: 'comida', name: 'Comida' },
    { id: 'antes-dormir', name: 'Antes de dormir' },
  ],
  'fuerza-mental': [
    { id: 'rutina-activacion', name: 'Rutina Activación' },
    { id: 'rutina-desactivacion', name: 'Rutina Desactivación' },
  ],
  apariencia: [
    { id: 'skincare-manana', name: 'Skin Care Mañana' },
    { id: 'skincare-noche', name: 'Skin Care Noche' },
    { id: 'banarme-vestirme', name: 'Bañarme y Vestirme' },
  ],
  desarrollo: [
    { id: 'lectura', name: 'Lectura', hasTime: true },
    { id: 'musica', name: 'Música', hasTime: true },
    { id: 'ajedrez', name: 'Ajedrez', hasTime: true, hasCount: true, countLabel: 'partidas' },
  ],
  profesional: [
    { id: 'universidad', name: 'Universidad', hasTime: true },
    { id: 'emprendimiento', name: 'Emprendimiento', hasTime: true },
    { id: 'proyectos', name: 'Proyectos', hasTime: true },
  ],
  amor: [
    { id: 'game', name: 'Game (Seducción)', hasTime: true },
  ],
};

const AREAS_WITH_GOALS: string[] = ['desarrollo', 'profesional'];

interface Props {
  pbAreaId: string;
  areaName: string;
  areaIcon: string;
  completions: Record<string, boolean>;
  timeData: Record<string, number>;
  countData: Record<string, number>;
  metrics: PointBMetric[];
  onToggleCompletion: (id: string) => void;
  onSetTimeValue: (id: string, v: number) => void;
  onSetCountValue: (id: string, v: number) => void;
  onAddMetric: () => void;
  onEditMetric: (metric: PointBMetric) => void;
  onDeleteMetric: (metricId: string) => void;
}

export function AreaSystemsAndGoals({
  pbAreaId,
  areaName,
  areaIcon,
  completions,
  timeData,
  countData,
  metrics,
  onToggleCompletion,
  onSetTimeValue,
  onSetCountValue,
  onAddMetric,
  onEditMetric,
  onDeleteMetric,
}: Props) {
  const habits = HABITS_BY_PB_AREA[pbAreaId] || [];
  const hasGoals = AREAS_WITH_GOALS.includes(pbAreaId);
  const showSystems = habits.length > 0;

  if (!showSystems && !hasGoals) return null;

  return (
    <div className="space-y-2 pt-2">
      <div className="h-px bg-border/50" />

      {/* Habits (Sistemas) */}
      {showSystems && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">⚙️ Sistema</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {habits.map(habit => {
              const done = completions[habit.id] || false;
              const timeVal = timeData[habit.id] || 0;
              const countVal = countData[habit.id] || 0;
              return (
                <div
                  key={habit.id}
                  className={cn(
                    'group flex items-center gap-2 py-1 px-2 rounded-md transition-colors',
                    done ? 'bg-green-500/5' : 'hover:bg-muted/30',
                  )}
                >
                  <button
                    onClick={() => onToggleCompletion(habit.id)}
                    className={cn(
                      'w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors',
                      done ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground/30 hover:border-muted-foreground/60',
                    )}
                  >
                    {done && <Check className="h-3 w-3" />}
                  </button>

                  <span className={cn(
                    'text-xs flex-1 truncate',
                    done && 'line-through text-muted-foreground/60',
                  )}>
                    {habit.name}
                  </span>

                  {habit.hasTime && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3 text-muted-foreground/50" />
                      <Input
                        type="number"
                        min={0}
                        value={timeVal || ''}
                        onChange={e => onSetTimeValue(habit.id, parseInt(e.target.value) || 0)}
                        placeholder="min"
                        className="h-6 w-14 text-[10px] text-center px-1"
                      />
                    </div>
                  )}

                  {habit.hasCount && (
                    <Input
                      type="number"
                      min={0}
                      value={countVal || ''}
                      onChange={e => onSetCountValue(habit.id, parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="h-6 w-12 text-[10px] text-center px-1"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Metrics (Metas) */}
      {hasGoals && metrics.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">📊 Metas</span>
          </div>
          <div className="space-y-1">
            {metrics.map(metric => {
              const pct = metric.target_value > 0
                ? Math.min(100, Math.round((metric.current_value / metric.target_value) * 100))
                : 0;
              const getColor = (v: number) => v >= 80 ? 'text-green-500' : v >= 40 ? 'text-amber-500' : 'text-red-500';
              const getBarColor = (v: number) => v >= 80 ? 'bg-green-500' : v >= 40 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div
                  key={metric.id}
                  className="group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium truncate">{metric.metric_name}</span>
                      <span className={cn('text-xs font-bold shrink-0', getColor(pct))}>
                        {metric.current_value}/{metric.target_value}
                        <span className="text-[10px] text-muted-foreground font-normal ml-0.5">{metric.unit}</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', getBarColor(pct))}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={cn('text-[10px] font-medium', getColor(pct))}>{pct}%</span>
                  </div>
                  <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditMetric(metric)}
                      className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onDeleteMetric(metric.id)}
                      className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-destructive rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add goal button */}
      {hasGoals && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground w-full"
          onClick={onAddMetric}
        >
          <Plus className="h-3 w-3" /> Agregar meta
        </Button>
      )}
    </div>
  );
}
