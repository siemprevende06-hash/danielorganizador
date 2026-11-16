import { useState } from 'react';
import { ChevronDown, Languages, Settings2, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MinutesGoalInput } from '@/components/hierarchy/MinutesGoalInput';
import { ALL_HIERARCHY_AREAS, AREA_LABELS } from '@/lib/hierarchy';
import { cn } from '@/lib/utils';

interface DaySettingsCardProps {
  /** Metas de minutos efectivas por área para el día. */
  dayGoals: Record<string, number>;
  dayGoalSum: number;
  onGoalChange: (area: string, value: string) => void;
  languageChoice: string;
  onLanguageChange: (value: 'ingles' | 'italiano') => void;
  musicInstrument: string;
  onMusicInstrumentChange: (value: 'piano' | 'guitarra') => void;
  defaultOpen?: boolean;
}

const LANGUAGE_OPTIONS = [
  { value: 'italiano', label: 'Italiano', flag: '🇮🇹' },
  { value: 'ingles', label: 'Inglés', flag: '🇬🇧' },
] as const;

const INSTRUMENT_OPTIONS = [
  { value: 'piano', label: 'Piano', icon: '🎹' },
  { value: 'guitarra', label: 'Guitarra', icon: '🎸' },
] as const;

/**
 * Ajustes secundarios del día: metas de minutos y preferencias de repaso.
 * Vive en una tarjeta colapsable para no competir con la planificación.
 */
export function DaySettingsCard({
  dayGoals,
  dayGoalSum,
  onGoalChange,
  languageChoice,
  onLanguageChange,
  musicInstrument,
  onMusicInstrumentChange,
  defaultOpen = false,
}: DaySettingsCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const languageLabel =
    LANGUAGE_OPTIONS.find(option => option.value === languageChoice)?.label ?? 'Inglés';
  const instrumentLabel =
    INSTRUMENT_OPTIONS.find(option => option.value === musicInstrument)?.label ?? 'Piano';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 shadow-sm dark:bg-zinc-950/80">
        <div className="h-1 bg-gradient-to-r from-rose-400 to-pink-500" />
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-muted/30"
            aria-expanded={open}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-500">
              <Settings2 className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">Ajustes del día</p>
              <p className="truncate text-[10px] text-muted-foreground">
                Meta {dayGoalSum} min · {languageLabel} · {instrumentLabel}
              </p>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                open && 'rotate-180',
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-4 border-t border-border/40 p-3.5">
            <section>
              <h3 className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
                <Target className="h-3.5 w-3.5 text-indigo-500" />
                Metas de minutos del día
              </h3>
              <p className="mb-2 text-[10px] text-muted-foreground">
                Precargadas del mes/semana. Editarlas propaga hacia arriba.
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {ALL_HIERARCHY_AREAS.map(area => (
                  <div
                    key={area}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 px-2 py-1"
                  >
                    <span className="text-[10px] text-muted-foreground">{AREA_LABELS[area]}</span>
                    <MinutesGoalInput
                      value={dayGoals[area] ?? 0}
                      onApply={value => onGoalChange(area, value)}
                      className="h-6 w-16 text-[10px]"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                Total día: {dayGoalSum} min
              </p>
            </section>

            <section className="border-t border-border/40 pt-3">
              <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold">
                <Languages className="h-3.5 w-3.5 text-pink-500" />
                Preferencias
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[10px] text-muted-foreground">Idioma a repasar:</p>
                  <div className="flex gap-1.5">
                    {LANGUAGE_OPTIONS.map(language => (
                      <button
                        key={language.value}
                        type="button"
                        onClick={() => onLanguageChange(language.value)}
                        aria-pressed={languageChoice === language.value}
                        className={cn(
                          'rounded-xl border px-2.5 py-1.5 text-[10px] font-medium transition-all',
                          languageChoice === language.value
                            ? 'border-pink-500 bg-pink-500 text-white'
                            : 'border-border/60 bg-muted/50 text-muted-foreground hover:border-pink-300',
                        )}
                      >
                        {language.flag} {language.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] text-muted-foreground">
                    Instrumento musical:
                  </p>
                  <div className="flex gap-1.5">
                    {INSTRUMENT_OPTIONS.map(instrument => (
                      <button
                        key={instrument.value}
                        type="button"
                        onClick={() => onMusicInstrumentChange(instrument.value)}
                        aria-pressed={musicInstrument === instrument.value}
                        className={cn(
                          'rounded-xl border px-2.5 py-1.5 text-[10px] font-medium transition-all',
                          musicInstrument === instrument.value
                            ? 'border-pink-500 bg-pink-500 text-white'
                            : 'border-border/60 bg-muted/50 text-muted-foreground hover:border-pink-300',
                        )}
                      >
                        {instrument.icon} {instrument.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
