import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Check, Timer, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LanguageSkillDef, LanguageSkillId } from './skills';
import { toneBgClass, toneTextClass } from './skills';

export function LanguagePracticeTimerCard({
  skills,
  timerActive,
  timerSeconds,
  selectedSkill,
  onSelectSkill,
  onStart,
  onComplete,
  onCancel,
  formatTime,
}: {
  skills: LanguageSkillDef[];
  timerActive: boolean;
  timerSeconds: number;
  selectedSkill: LanguageSkillId;
  onSelectSkill: (id: LanguageSkillId) => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  formatTime: (seconds: number) => string;
}) {
  const skill = skills.find(s => s.id === selectedSkill) ?? skills[0];
  const minutes = Math.floor(timerSeconds / 60);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Timer className="h-4 w-4 text-primary" />
          </span>
          Temporizador de práctica
          {timerActive && (
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              En curso
            </span>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Elige una habilidad, cronometra tu sesión y se guardará en tu progreso diario.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToggleGroup
          type="single"
          value={selectedSkill}
          disabled={timerActive}
          onValueChange={value => value && onSelectSkill(value as LanguageSkillId)}
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {skills.map(s => (
            <ToggleGroupItem
              key={s.id}
              value={s.id}
              className="h-auto justify-start gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-left text-xs data-[state=on]:border-primary/40 data-[state=on]:bg-primary/10"
              aria-label={s.label}
            >
              <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', toneBgClass(s.tone))}>
                <s.Icon className={cn('h-3.5 w-3.5', toneTextClass(s.tone))} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{s.label}</span>
                <span className="block text-[10px] text-muted-foreground">{s.durationMinutes} min</span>
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/40 to-background px-4 py-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {timerActive ? skill?.label : 'Sesión de práctica'}
          </p>
          <p className="mt-1 font-mono text-5xl font-bold tracking-tight tabular-nums sm:text-6xl">
            {formatTime(timerSeconds)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {timerActive
              ? minutes > 0
                ? `${minutes} min registrados al guardar`
                : 'Los primeros minutos se registran al guardar'
              : `Sugerido: ${skill?.durationMinutes ?? 10} min · ${skill?.resource ?? ''}`}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          {timerActive ? (
            <>
              <Button onClick={onCancel} variant="outline" size="lg" className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                Descartar
              </Button>
              <Button onClick={onComplete} size="lg" className="w-full sm:w-auto">
                <Check className="mr-2 h-4 w-4" />
                Guardar sesión
              </Button>
            </>
          ) : (
            <Button onClick={onStart} size="lg" className="w-full sm:w-auto">
              <Timer className="mr-2 h-4 w-4" />
              Iniciar {skill?.label ?? 'práctica'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
