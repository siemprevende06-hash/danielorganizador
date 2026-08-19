import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ProgressRing } from '@/components/monthly-planning/ProgressRing';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronRight, Calendar, Trash2, Repeat, Plus, Flag, Trophy, X, MapPin, RotateCcw } from 'lucide-react';
import type { Goal, GoalTask } from '@/hooks/useGoalProgress';

const RING_COLORS = ['indigo', 'emerald', 'amber', 'blue', 'rose', 'purple'] as const;

const STAGE_BADGE: Record<string, { label: string; className: string }> = {
  sosten: { label: '🏗️ Sostén', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  mejora: { label: '📈 Mejora', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  enfoque: { label: '🎯 Enfoque', className: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
};

interface DestinoGoalCardProps {
  goal: Goal;
  tasks: GoalTask[];
  colorIndex: number;
  onToggleTask: (task: GoalTask) => Promise<void>;
  onAddTask: (title: string) => Promise<void>;
  onDeleteTask: (task: GoalTask) => Promise<void>;
  onUpdateSystem: (dailySystem: string) => Promise<void>;
  onUpdateStatus: (status: Goal['status']) => Promise<void>;
  onDeleteGoal: () => Promise<void>;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: 'Activa', className: 'bg-success/10 text-success border-success/20' },
  completed: { label: 'Completada', className: 'bg-success/10 text-success border-success/20' },
  paused: { label: 'En pausa', className: 'bg-warning/10 text-warning border-warning/20' },
  abandoned: { label: 'Abandonada', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function DestinoGoalCard({
  goal,
  tasks,
  colorIndex,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onUpdateSystem,
  onUpdateStatus,
  onDeleteGoal,
}: DestinoGoalCardProps) {
  const [planOpen, setPlanOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(!goal.daily_system);
  const [systemValue, setSystemValue] = useState(goal.daily_system || '');
  const [newItem, setNewItem] = useState('');
  const [deleting, setDeleting] = useState(false);

  const parsedWhy = goal.description?.match(/💡 ¿Por qué\?: (.*?)(?:\n|$)/)?.[1] || '';
  const systemText =
    goal.daily_system ||
    goal.description?.match(/🔄 Sistema diario: (.*?)(?:\n|$)/)?.[1] ||
    '';

  const completed = tasks.filter(t => t.completed).length;
  const progress = Math.min(goal.progress_percentage || 0, 100);
  const status = statusLabels[goal.status || 'active'];

  const handleSaveSystem = async () => {
    await onUpdateSystem(systemValue.trim());
    setSystemOpen(false);
  };

  const handleAddItem = async () => {
    const title = newItem.trim();
    if (!title) return;
    setNewItem('');
    await onAddTask(title);
  };

  const handleDeleteGoal = async () => {
    if (deleting) return;
    setDeleting(true);
    await onDeleteGoal();
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary/40">
      <CardContent className="p-4 space-y-4">
        {/* Título de la meta */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-snug">{goal.title}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {goal.stage && STAGE_BADGE[goal.stage] && (
                <Badge variant="outline" className={STAGE_BADGE[goal.stage].className}>{STAGE_BADGE[goal.stage].label}</Badge>
              )}
              {status && <Badge variant="outline" className={status.className}>{status.label}</Badge>}
              {goal.target_date && (
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(goal.target_date), 'dd MMM yyyy', { locale: es })}
                </Badge>
              )}
              {tasks.length > 0 && (
                <Badge variant="outline"><Flag className="h-3 w-3 mr-1" />{completed}/{tasks.length}</Badge>
              )}
            </div>
          </div>
          <ProgressRing progress={progress} size={56} strokeWidth={5} strokeColor={RING_COLORS[colorIndex % RING_COLORS.length]}>
            <span className="text-xs font-bold">{progress}%</span>
          </ProgressRing>
        </div>

        {/* Sistema diario */}
        <div className={cn('p-3 rounded-lg border', systemText ? 'bg-success/5 border-success/20' : 'bg-muted/40 border-border/40')}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-success flex items-center gap-1">
              <Repeat className="h-3.5 w-3.5" />SISTEMA DIARIO
            </p>
            {systemText && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { setSystemValue(systemText); setSystemOpen(true); }}>
                Editar
              </Button>
            )}
          </div>
          {systemOpen ? (
            <div className="flex gap-2 mt-2">
              <Input
                value={systemValue}
                onChange={(e) => setSystemValue(e.target.value)}
                placeholder="Ej: 30 minutos diarios de práctica"
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSystem(); }}
              />
              <Button size="sm" className="h-8" onClick={handleSaveSystem}>Guardar</Button>
            </div>
          ) : systemText ? (
            <p className="text-sm mt-1">{systemText}</p>
          ) : (
            <Button variant="ghost" size="sm" className="h-7 mt-1 px-2 text-xs text-muted-foreground" onClick={() => setSystemOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />Definir sistema diario
            </Button>
          )}
        </div>

        {/* Avance de la meta */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium flex items-center gap-1"><Trophy className="h-3.5 w-3.5" />Avance de la meta</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2.5" />
        </div>

        {parsedWhy && (
          <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5">
            <span className="font-medium text-foreground/80">💡 ¿Por qué?: </span>{parsedWhy}
          </p>
        )}

        {/* Plan desglosado */}
        <div className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setPlanOpen(v => !v)}
            className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-muted/50 transition-colors"
          >
            {planOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            <span className="text-sm font-medium flex-1">Plan desglosado</span>
            {tasks.length > 0 && (
              <Badge variant="secondary" className={cn(completed === tasks.length && 'bg-success/15 text-success')}>
                {completed}/{tasks.length}
              </Badge>
            )}
          </button>

          {planOpen && (
            <div className="border-t p-2.5 space-y-2">
              {tasks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-1">Aún no hay items en el plan</p>
              )}
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={!!task.completed}
                    onCheckedChange={() => onToggleTask(task)}
                    className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                  />
                  <span className={cn('text-sm flex-1', task.completed && 'line-through text-muted-foreground')}>
                    {task.title}
                  </span>
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(task.due_date), 'dd/MM')}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDeleteTask(task)}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Añadir item al plan..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }}
                />
                <Button size="sm" className="h-8 shrink-0" onClick={handleAddItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2">
          {goal.status === 'completed' ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onUpdateStatus('active')}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />Reabrir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-success/40 text-success hover:bg-success/10"
              onClick={() => onUpdateStatus('completed')}
            >
              <MapPin className="h-3.5 w-3.5 mr-1" />Llegué
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={handleDeleteGoal}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
