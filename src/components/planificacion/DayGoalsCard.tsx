import { useMemo, useState } from 'react';
import { ChevronDown, Gauge, Languages, Music, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  systemSpeedLevelLabel,
  systemSpeedOptions,
  systemTargetMinutes,
  type DaySystem,
  type SystemSpeed,
} from '@/lib/daySystems';
import { cn } from '@/lib/utils';

const LANGUAGE_OPTIONS = [
  { value: 'italiano', label: 'Italiano', flag: '🇮🇹' },
  { value: 'ingles', label: 'Inglés', flag: '🇬🇧' },
] as const;

const INSTRUMENT_OPTIONS = [
  { value: 'piano', label: 'Piano', icon: '🎹' },
  { value: 'guitarra', label: 'Guitarra', icon: '🎸' },
] as const;

interface DayGoalsCardProps {
  /** Sistemas con nivel propio (profesionales y personales). */
  systems: DaySystem[];
  getSpeed: (systemId: string) => SystemSpeed;
  onSpeedChange: (systemId: string, speed: SystemSpeed) => void;
  /** Minutos ya planificados en los bloques del día, por sistema. */
  plannedBySystem: Record<string, number>;
  languageChoice: string;
  onLanguageChange: (value: 'ingles' | 'italiano') => void;
  musicInstrument: string;
  onMusicInstrumentChange: (value: 'piano' | 'guitarra') => void;
  defaultOpen?: boolean;
}

/**
 * Tarjeta única de metas del día: nivel (y minutos objetivo) de cada sistema,
 * resumen de lo planificado y preferencias de idioma/instrumento.
 * Los botones están sincronizados con las tarjetas de sistema.
 */
export function DayGoalsCard({
  systems,
  getSpeed,
  onSpeedChange,
  plannedBySystem,
  languageChoice,
  onLanguageChange,
  musicInstrument,
  onMusicInstrumentChange,
  defaultOpen = false,
}: DayGoalsCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const rows = useMemo(
    () => systems.map(system => {
      const speed = getSpeed(system.id);
      const target = systemTargetMinutes(system, speed);
      const planned = plannedBySystem[system.id] ?? 0;
      return {
        system,
        speed,
        target,
        planned,
        targetLabel: systemSpeedLevelLabel(system, speed),
        options: systemSpeedOptions(system),
      };
    }),
    [systems, getSpeed, plannedBySystem],
  );

  const plannedTotal = rows.reduce((total, row) => total + row.planned, 0);
  const goalTotal = rows.reduce(
    (total, row) => total + (row.planned > 0 ? row.target : 0),
    0,
  );
  const activeSystems = rows.filter(row => row.planned > 0).length;

  const languageLabel =
    LANGUAGE_OPTIONS.find(option => option.value === languageChoice)?.label ?? 'Inglés';
  const instrumentLabel =
    INSTRUMENT_OPTIONS.find(option => option.value === musicInstrument)?.label ?? 'Piano';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 shadow-sm dark:bg-zinc-950/80">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400" />
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-muted/30"
            aria-expanded={open}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
              <Gauge className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold">
                Metas del día
                <Badge variant="secondary" className="text-[8px] font-semibold tabular-nums">
                  {plannedTotal}′ plan · {goalTotal}′ meta
                </Badge>
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {activeSystems} sistema{activeSystems === 1 ? '' : 's'} con minutos · {languageLabel} · {instrumentLabel}
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
          <div className="space-y-3 border-t border-border/40 p-3.5">
            <p className="text-[10px] leading-snug text-muted-foreground">
              El nivel de cada sistema fija su meta para esta fecha. Se puede bajar sin
              cambiar los demás días y queda sincronizado con las tarjetas de sistemas.
            </p>

            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {rows.map(row => {
                const pct = row.target > 0
                  ? Math.min(100, Math.round((row.planned / row.target) * 100))
                  : row.planned > 0 ? 100 : 0;
                return (
                  <div
                    key={row.system.id}
                    className={cn(
                      'space-y-1 rounded-xl border px-2 py-1.5',
                      row.planned > 0
                        ? 'border-sky-400/40 bg-sky-500/5'
                        : 'border-border/40 bg-muted/20',
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">
                        {row.system.name}
                      </span>
                      <span className="shrink-0 text-[9px] tabular-nums text-muted-foreground">
                        {row.planned}′ / {row.targetLabel}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {row.options.map(option => {
                        const active = row.speed === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => onSpeedChange(row.system.id, option.id)}
                            aria-pressed={active}
                            title={systemSpeedLevelLabel(row.system, option.id)}
                            className={cn(
                              'rounded-md border px-1.5 py-0.5 text-[8px] font-bold tabular-nums transition-colors',
                              active
                                ? 'border-foreground/30 bg-foreground text-background'
                                : 'border-border/50 bg-foreground/5 text-muted-foreground hover:bg-foreground/10',
                            )}
                          >
                            {systemSpeedLevelLabel(row.system, option.id)}
                          </button>
                        );
                      })}
                    </div>

                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          row.planned >= row.target && row.target > 0
                            ? 'bg-emerald-500'
                            : row.planned > 0
                              ? 'bg-sky-500'
                              : 'bg-muted-foreground/30',
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

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
                  <p className="mb-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Music className="h-3 w-3" /> Instrumento musical:
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
              <p className="mt-2 text-[9px] leading-snug text-muted-foreground">
                La meta de Idiomas se asigna al idioma elegido; la de Música, al instrumento.
              </p>
            </section>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
