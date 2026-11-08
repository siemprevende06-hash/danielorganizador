import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, Clock, ExternalLink, Play } from 'lucide-react';
import type { LanguageSkillDef, LanguageSkillId } from './skills';
import { toneBgClass, toneTextClass } from './skills';

export function LanguageSkillsChecklist({
  skills,
  completions,
  skillKeyPrefix,
  activeSkillId,
  onToggle,
  onStartTimer,
}: {
  skills: LanguageSkillDef[];
  completions: Record<string, boolean>;
  skillKeyPrefix: string;
  activeSkillId: string | null;
  onToggle: (id: LanguageSkillId) => void;
  onStartTimer: (id: LanguageSkillId) => void;
}) {
  const done = skills.filter(skill => completions[`${skillKeyPrefix}-${skill.id}`]).length;
  const totalMinutes = skills.reduce((sum, skill) => sum + skill.durationMinutes, 0);
  const percent = skills.length > 0 ? Math.round((done / skills.length) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg">Habilidades del día</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {done}/{skills.length} completadas · {totalMinutes} min orientativos
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold tabular-nums">{percent}%</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">del plan diario</p>
          </div>
        </div>
        <Progress value={percent} className="mt-2 h-2" />
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {skills.map(skill => {
          const isCompleted = !!completions[`${skillKeyPrefix}-${skill.id}`];
          const isActive = activeSkillId === skill.id;

          return (
            <div
              key={skill.id}
              className={cn(
                'group flex items-center gap-2.5 rounded-xl border p-2.5 transition-all',
                isCompleted
                  ? 'border-success/30 bg-success/5'
                  : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40',
                isActive && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
              )}
            >
              <button
                type="button"
                onClick={() => onToggle(skill.id)}
                aria-pressed={isCompleted}
                aria-label={isCompleted ? `Desmarcar ${skill.label}` : `Marcar ${skill.label}`}
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  isCompleted
                    ? 'border-success bg-success text-success-foreground'
                    : 'border-muted-foreground/30 hover:border-primary'
                )}
              >
                {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </button>

              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', toneBgClass(skill.tone))}>
                <skill.Icon className={cn('h-4 w-4', toneTextClass(skill.tone))} />
              </div>

              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm font-semibold', isCompleted && 'text-muted-foreground line-through')}>
                  {skill.label}
                </p>
                <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  {skill.durationMinutes} min · {skill.resource}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                {skill.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground opacity-70 hover:opacity-100"
                    aria-label={`Abrir recurso de ${skill.label}`}
                    onClick={() => window.open(skill.url!, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                )}
                {!isCompleted && (
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 gap-1 px-2 text-xs"
                    onClick={() => onStartTimer(skill.id)}
                    aria-label={`Practicar ${skill.label} con temporizador`}
                  >
                    <Play className="h-3 w-3" />
                    <span className="hidden sm:inline">Practicar</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
