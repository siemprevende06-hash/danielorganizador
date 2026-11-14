import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, Flag, Play, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SKILL_CATALOG, skillColor, type SessionStep } from './playbook';

export type SessionStepState = SessionStep & { done: boolean };

export function TodaySessionPath({
  steps,
  weekLabel,
  focus,
  onStart,
  onToggle,
}: {
  steps: SessionStepState[];
  weekLabel?: string;
  focus: string | null;
  onStart: (step: SessionStepState) => void;
  onToggle: (step: SessionStepState) => void;
}) {
  const totalMinutes = steps.reduce((sum, step) => sum + step.minutes, 0);
  const doneMinutes = steps.reduce((sum, step) => sum + (step.done ? step.minutes : 0), 0);
  const doneCount = steps.filter(step => step.done).length;
  const percent = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;
  const next = steps.find(step => !step.done) ?? null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10">
                <Route className="h-3.5 w-3.5 text-primary" />
              </span>
              <h2 className="text-base font-semibold">Sesión de hoy</h2>
              {weekLabel && (
                <Badge variant="outline" className="hidden text-[10px] font-medium sm:inline-flex">
                  {weekLabel}
                </Badge>
              )}
              {focus && (
                <Badge variant="secondary" className="text-[10px] font-medium">
                  Foco: {focus}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {doneCount}/{steps.length} pasos · {doneMinutes}/{totalMinutes} min · método:
              recuperar → notar → input → output → cierre
            </p>
          </div>
          {next && (
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onStart(next)}>
              <Play className="h-3.5 w-3.5" />
              Continuar
            </Button>
          )}
        </div>
        <Progress value={percent} className="mt-2 h-1.5" />
      </CardHeader>

      <CardContent className="space-y-1.5 pt-0">
        {steps.map((step, index) => {
          const meta = step.skill ? SKILL_CATALOG.find(item => item.id === step.skill) ?? null : null;
          const Icon = meta?.Icon ?? Flag;
          const isNext = next?.id === step.id;
          const accent = step.skill ? skillColor(step.skill) : 'hsl(var(--muted-foreground))';

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-2.5 rounded-xl border p-2.5 transition-colors',
                step.done
                  ? 'border-success/25 bg-success/5'
                  : isNext
                    ? 'border-primary/40 bg-primary/[0.03]'
                    : 'border-border/60 bg-muted/10'
              )}
            >
              <button
                type="button"
                onClick={() => onToggle(step)}
                aria-pressed={step.done}
                aria-label={step.done ? `Desmarcar ${step.title}` : `Marcar ${step.title} como hecho`}
                className={cn(
                  'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
                  step.done
                    ? 'border-success bg-success text-success-foreground'
                    : 'border-muted-foreground/30 hover:border-primary'
                )}
              >
                {step.done ? (
                  <Check className="h-3.5 w-3.5 animate-check-pop" strokeWidth={3} />
                ) : (
                  <span className="text-[10px] font-semibold text-muted-foreground">{index + 1}</span>
                )}
              </button>

              <span
                className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                style={{ backgroundColor: step.skill ? skillColor(step.skill, 0.12) : 'hsl(var(--muted))' }}
              >
                <Icon className="h-4 w-4" style={{ color: step.skill ? accent : undefined }} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <p className={cn('text-[13px] font-semibold leading-tight', step.done && 'text-muted-foreground line-through')}>
                    {step.title}
                  </p>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{step.minutes} min</span>
                  {step.kind === 'focus' && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                      foco
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{step.detail}</p>
              </div>

              <Button
                variant={isNext ? 'default' : 'outline'}
                size="sm"
                className="h-8 shrink-0 gap-1 px-2 text-[11px]"
                onClick={() => onStart(step)}
                aria-label={`Abrir ${step.title}`}
              >
                <Play className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {step.kind === 'close' ? 'Cerrar' : step.done ? 'Repetir' : isNext ? 'Empezar' : 'Abrir'}
                </span>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
