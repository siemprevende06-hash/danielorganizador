import { useState } from 'react';
import { CheckCircle2, ChevronDown, Lightbulb, Volume2, Wand2, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Language } from '@/hooks/useLanguageLearning';
import type { StructureReview } from '@/hooks/useLanguageTutorCoach';
import type { SpeakingStructure } from './speakingStructures';

interface Props {
  structure: SpeakingStructure;
  language: Language;
  review?: StructureReview | null;
  onSpeak: (text: string) => void;
  onClear: () => void;
  onOpenAll: () => void;
}

/**
 * Estructura activa junto al chat. Se queda visible mientras el estudiante
 * habla y marca los pasos que ya cubrió en su última respuesta.
 */
export function ActiveStructurePanel({ structure, language, review, onSpeak, onClear, onOpenAll }: Props) {
  const [showExample, setShowExample] = useState(false);
  const question = structure.question[language];
  const example = structure.example[language];
  const phrases = structure.phrases[language];
  const covered = new Map((review?.covered ?? []).map(item => [item.label.toLowerCase(), item.ok]));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-focus/10">
          <Wand2 className="h-3.5 w-3.5 text-focus" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">Estructura activa</p>
          <p className="text-[11px] text-muted-foreground leading-tight">Sigue los pasos mientras hablas</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onClear}
          aria-label="Quitar estructura"
          title="Quitar estructura"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <div className="rounded-xl border border-focus/30 bg-focus/[0.05] p-2.5">
          <p className="text-sm font-semibold leading-snug">{question}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{structure.questionEs}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2 text-[11px]"
              onClick={() => onSpeak(question)}
            >
              <Volume2 className="h-3 w-3" />
              Escuchar
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px]" onClick={onOpenAll}>
              <Wand2 className="h-3 w-3" />
              Cambiar
            </Button>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">{structure.goal}</p>

        <ol className="space-y-2">
          {structure.steps.map((step, index) => {
            const state = covered.get(step.label.toLowerCase());
            return (
              <li
                key={`${structure.id}-${index}`}
                className={cn(
                  'flex gap-2 rounded-lg border p-2 transition-colors',
                  state === true
                    ? 'border-success/40 bg-success/[0.06]'
                    : state === false
                      ? 'border-amber-500/40 bg-amber-500/[0.06]'
                      : 'border-border/60 bg-background'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                    state === true
                      ? 'bg-success/15 text-success'
                      : state === false
                        ? 'bg-amber-500/15 text-amber-600'
                        : 'bg-focus/10 text-focus'
                  )}
                >
                  {state === true ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : state === false ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-focus/90">{step.label}</p>
                  <p className="text-sm font-medium leading-snug">{step.template[language]}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{step.tip}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {phrases.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Expresiones útiles</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {phrases.map(phrase => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => onSpeak(phrase)}
                  className="rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] text-foreground/90 transition-colors hover:border-focus/40 hover:bg-focus/5"
                  title="Escuchar"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        )}

        {example && (
          <div>
            <button
              type="button"
              onClick={() => setShowExample(value => !value)}
              className="flex w-full items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              aria-expanded={showExample}
            >
              <Lightbulb className="h-3 w-3" />
              {showExample ? 'Ocultar respuesta modelo' : 'Ver respuesta modelo'}
              <ChevronDown className={cn('ml-auto h-3 w-3 transition-transform', showExample && 'rotate-180')} />
            </button>
            {showExample && (
              <div className="mt-1.5 rounded-lg border border-border/70 bg-background p-2.5">
                <p className="text-sm leading-relaxed">{example}</p>
                {structure.exampleEs && (
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{structure.exampleEs}</p>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-1 h-7 gap-1 px-2 text-[11px]"
                  onClick={() => onSpeak(example)}
                >
                  <Volume2 className="h-3 w-3" />
                  Escuchar ejemplo
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
