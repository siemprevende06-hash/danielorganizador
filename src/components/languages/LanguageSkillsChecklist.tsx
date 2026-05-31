import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, ExternalLink, Play } from 'lucide-react';
import type { LanguageSubTask } from '@/hooks/useLanguageLearning';
import { toneTextClass, type LanguageSkillDef } from './skills';

export function LanguageSkillsChecklist({
  skills,
  subTasks,
  activeSkillId,
  onToggle,
  onStartTimer,
}: {
  skills: LanguageSkillDef[];
  subTasks: LanguageSubTask[];
  activeSkillId: string | null;
  onToggle: (id: string) => void;
  onStartTimer: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">Habilidades del día</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        {skills.map(skill => {
          const sub = subTasks.find(t => t.id === skill.id);
          const isCompleted = sub?.completed || false;
          const isActive = activeSkillId === skill.id;

          return (
            <div
              key={skill.id}
              className={cn(
                'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all border',
                isCompleted ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-transparent',
                isActive && 'ring-2 ring-primary'
              )}
            >
              <button
                onClick={() => onToggle(skill.id)}
                className={cn(
                  'w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
                  isCompleted ? 'bg-success border-success' : 'border-muted-foreground/30'
                )}
                aria-label={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
              >
                {isCompleted && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-success-foreground" />}
              </button>

              <skill.Icon className={cn('w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0', toneTextClass(skill.tone))} />

              <div className="flex-1 min-w-0">
                <p className={cn('font-medium text-xs sm:text-sm', isCompleted && 'line-through text-muted-foreground')}>
                  {skill.label}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {sub?.durationMinutes}min • {skill.resource}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {skill.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => window.open(skill.url!, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
                {!isCompleted && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onStartTimer(skill.id)}>
                    <Play className="w-3 h-3" />
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
