import { ArrowRight, Info, ListChecks, Target, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SKILL_CATALOG, skillColor } from './playbook';
import type { LanguageSkillId } from '@/lib/languagePlan';

/**
 * Táctica del día. Si hay foco, enseña la del foco; si no, la de la habilidad
 * que lleva más días sin practicarse. Nunca inventa progreso: solo método.
 */
export function FocusTacticCard({
  skillId,
  isFocus,
  onPractice,
}: {
  skillId: LanguageSkillId | null;
  isFocus: boolean;
  onPractice: (skill: LanguageSkillId) => void;
}) {
  const meta = skillId ? SKILL_CATALOG.find(item => item.id === skillId) ?? null : null;

  if (!meta) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-muted">
              <Info className="h-3.5 w-3.5" />
            </span>
            <p className="text-[13px] font-semibold leading-tight">Táctica del día</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-[11px] text-muted-foreground">
            Elige una habilidad foco arriba y aquí verás la técnica concreta, sus pasos y cómo medirla.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { playbook } = meta;

  return (
    <Card className="overflow-hidden">
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(to right, ${skillColor(meta.id, 0.9)}, ${skillColor(meta.id, 0.25)})` }}
      />
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: skillColor(meta.id, 0.12) }}
          >
            <meta.Icon className="h-4 w-4" style={{ color: skillColor(meta.id) }} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-[13px] font-semibold leading-tight">{meta.label}</p>
              <Badge variant={isFocus ? 'secondary' : 'outline'} className="h-4 px-1.5 text-[9px]">
                {isFocus ? 'foco' : 'menos practicada'}
              </Badge>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{playbook.goal}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 pt-0">
        <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Target className="h-3 w-3" />
            Táctica
          </p>
          <p className="mt-0.5 text-[12px] font-semibold leading-snug">{playbook.tactic}</p>
        </div>

        <div>
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <ListChecks className="h-3 w-3" />
            Pasos
          </p>
          <ol className="mt-1 space-y-0.5">
            {playbook.steps.map((step, index) => (
              <li key={step} className="flex items-start gap-1.5 text-[11px] leading-snug">
                <span
                  className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold"
                  style={{ backgroundColor: skillColor(meta.id, 0.14), color: skillColor(meta.id) }}
                >
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="flex items-start gap-1 text-[10px] leading-snug text-muted-foreground">
          <Timer className="mt-0.5 h-3 w-3 shrink-0" />
          {playbook.minutes} min · {playbook.metric}
        </p>

        <Button
          size="sm"
          className="h-8 w-full gap-1.5 text-[11px]"
          onClick={() => onPractice(meta.id)}
        >
          Practicar {meta.label.toLowerCase()}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
