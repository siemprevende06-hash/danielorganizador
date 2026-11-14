import { differenceInCalendarDays } from 'date-fns';
import { BookOpen, Check, Target, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FocusMode } from '@/hooks/useLanguageFocus';
import type { LanguageSkillId } from '@/lib/languagePlan';
import { SKILL_CATALOG, skillColor } from './playbook';

export function SkillMap({
  doneIds,
  focus,
  focusMode,
  weekDays,
  lastDate,
  onToggle,
  onLearn,
  onTimer,
  onFocus,
}: {
  doneIds: string[];
  focus: LanguageSkillId | null;
  focusMode: FocusMode;
  weekDays: Record<string, number>;
  lastDate: Record<string, string>;
  onToggle: (skill: LanguageSkillId) => void;
  onLearn: (skill: LanguageSkillId) => void;
  onTimer: (skill: LanguageSkillId) => void;
  onFocus: (skill: LanguageSkillId) => void;
}) {
  const doneSet = new Set(doneIds);

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-1">
        <div>
          <h2 className="text-sm font-semibold">Las 6 habilidades</h2>
          <p className="text-[11px] text-muted-foreground">
            Cada tarjeta trae su método, su práctica y su registro. El foco se marca con la diana.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Foco {focusMode === 'day' ? 'diario' : 'semanal'}
        </Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {SKILL_CATALOG.map(meta => {
          const days = weekDays[meta.id] ?? 0;
          const done = doneSet.has(meta.id);
          const isFocus = focus === meta.id;
          const last = lastDate[meta.id] ? lastLabel(lastDate[meta.id]) : 'Sin práctica';

          return (
            <article
              key={meta.id}
              className={cn(
                'group relative overflow-hidden rounded-2xl border bg-card/60 p-3 transition-colors',
                done ? 'border-success/30' : 'border-border/60'
              )}
              style={isFocus ? { borderColor: skillColor(meta.id, 0.5) } : undefined}
            >
              <div
                className="pointer-events-none absolute -right-10 -top-12 h-24 w-24 rounded-full blur-2xl"
                style={{ background: skillColor(meta.id, isFocus ? 0.16 : 0.07) }}
              />

              <div className="relative flex items-start gap-2">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                  style={{ backgroundColor: skillColor(meta.id, 0.12) }}
                >
                  <meta.Icon className="h-4 w-4" style={{ color: skillColor(meta.id) }} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-[13px] font-semibold leading-tight">{meta.label}</h3>
                    {done && <Check className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={3} />}
                  </div>
                  <p className="truncate text-[11px] leading-tight text-muted-foreground" title={meta.playbook.goal}>
                    {meta.playbook.tactic}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onFocus(meta.id)}
                  aria-pressed={isFocus}
                  aria-label={isFocus ? `Quitar ${meta.label} como foco` : `Poner ${meta.label} como foco`}
                  title={isFocus ? 'Quitar foco' : 'Poner como foco'}
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors',
                    isFocus ? 'bg-foreground text-background' : 'text-muted-foreground/70 hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Target className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="relative mt-2.5 flex items-center gap-1">
                {Array.from({ length: 7 }).map((_, index) => (
                  <span
                    key={index}
                    className="h-1.5 flex-1 rounded-full"
                    style={{ background: index < days ? skillColor(meta.id, 0.8) : 'hsl(var(--muted))' }}
                  />
                ))}
                <span className="ml-1 w-10 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                  {days}/7 d
                </span>
              </div>

              <div className="relative mt-2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[11px]"
                  onClick={() => onLearn(meta.id)}
                  title={`Aprender ${meta.label} con el Tutor IA`}
                >
                  <BookOpen className="h-3 w-3" />
                  Aprender
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[11px]"
                  onClick={() => onTimer(meta.id)}
                  title={`Cronometrar una sesión de ${meta.label}`}
                >
                  <Timer className="h-3 w-3" />
                  Practicar
                </Button>

                <span className="ml-auto truncate text-[10px] text-muted-foreground" title="Última práctica">
                  {last}
                </span>

                <button
                  type="button"
                  onClick={() => onToggle(meta.id)}
                  aria-pressed={done}
                  aria-label={done ? `Desmarcar ${meta.label}` : `Marcar ${meta.label} como practicada hoy`}
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
                    done
                      ? 'border-success bg-success text-success-foreground'
                      : 'border-muted-foreground/30 hover:border-primary'
                  )}
                >
                  {done && <Check className="h-3 w-3 animate-check-pop" strokeWidth={3} />}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function lastLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Sin práctica';
  const diff = differenceInCalendarDays(new Date(), parsed);
  if (diff <= 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} d`;
  if (diff < 14) return 'Hace 1 sem';
  return `Hace ${Math.floor(diff / 7)} sem`;
}
