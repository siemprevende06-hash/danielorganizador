import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Pause, Play, Timer } from 'lucide-react';
import type { LanguageSkillDef, LanguageSkillId } from './skills';

export function LanguagePracticeTimerCard({
  skills,
  timerActive,
  timerSeconds,
  selectedSkill,
  onSelectSkill,
  onStart,
  onComplete,
  formatTime,
}: {
  skills: LanguageSkillDef[];
  timerActive: boolean;
  timerSeconds: number;
  selectedSkill: LanguageSkillId;
  onSelectSkill: (id: LanguageSkillId) => void;
  onStart: () => void;
  onComplete: () => void;
  formatTime: (seconds: number) => string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Timer className="w-5 h-5" />Temporizador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <ToggleGroup
            type="single"
            value={selectedSkill}
            onValueChange={(v) => v && onSelectSkill(v as LanguageSkillId)}
            className="grid grid-cols-2 sm:grid-cols-5 gap-2"
          >
            {skills.map(s => (
              <ToggleGroupItem
                key={s.id}
                value={s.id}
                className="text-xs sm:text-[11px] h-9 sm:h-10"
                aria-label={s.label}
              >
                {s.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="text-center">
            <p className="text-4xl sm:text-6xl font-mono font-bold tracking-wider">{formatTime(timerSeconds)}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              {skills.find(s => s.id === selectedSkill)?.label}
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          {!timerActive ? (
            <Button onClick={onStart} size="lg" className="w-full sm:w-auto">
              <Play className="w-5 h-5 mr-2" />Iniciar
            </Button>
          ) : (
            <Button onClick={onComplete} variant="destructive" size="lg" className="w-full sm:w-auto">
              <Pause className="w-5 h-5 mr-2" />Completar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
