import { Target, X } from 'lucide-react';
import type { FocusMode } from '@/hooks/useLanguageFocus';
import type { LanguageSkillId } from '@/lib/languagePlan';
import { cn } from '@/lib/utils';
import { SKILL_CATALOG, skillColor } from './playbook';

export function FocusSkillPicker({
  mode,
  onModeChange,
  skill,
  label,
  suggested,
  onSelect,
  onClear,
}: {
  mode: FocusMode;
  onModeChange: (mode: FocusMode) => void;
  skill: LanguageSkillId | null;
  label: string;
  suggested: LanguageSkillId | null;
  onSelect: (skill: LanguageSkillId) => void;
  onClear: () => void;
}) {
  const suggestedMeta = suggested ? SKILL_CATALOG.find(item => item.id === suggested) ?? null : null;

  return (
    <section className="rounded-2xl border border-border/60 bg-card/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-muted">
            <Target className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[13px] font-semibold leading-tight">Habilidad foco</p>
            <p className="text-[10px] leading-tight text-muted-foreground">Elige dónde poner el esfuerzo</p>
          </div>
        </div>

        <div className="ml-auto flex items-center rounded-lg bg-muted p-0.5">
          {(
            [
              { id: 'day' as const, label: 'Diaria' },
              { id: 'week' as const, label: 'Semanal' },
            ]
          ).map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => onModeChange(option.id)}
              aria-pressed={mode === option.id}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                mode === option.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SKILL_CATALOG.map(item => {
          const active = skill === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={active}
              className={cn(
                'flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-colors',
                active ? 'shadow-sm' : 'border-border/60 bg-background text-muted-foreground hover:text-foreground'
              )}
              style={
                active
                  ? {
                      borderColor: skillColor(item.id, 0.5),
                      backgroundColor: skillColor(item.id, 0.12),
                      color: skillColor(item.id),
                    }
                  : undefined
              }
            >
              <item.Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onClear}
          disabled={!skill}
          className="ml-1 flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        >
          <X className="h-3 w-3" />
          Quitar
        </button>
      </div>

      <p className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
        {label}
        {!skill && suggestedMeta && (
          <button
            type="button"
            onClick={() => onSelect(suggestedMeta.id)}
            className="font-medium text-foreground underline decoration-dotted underline-offset-2"
          >
            Usar {suggestedMeta.label} ({suggestedMeta.playbook.tactic})
          </button>
        )}
      </p>
    </section>
  );
}
