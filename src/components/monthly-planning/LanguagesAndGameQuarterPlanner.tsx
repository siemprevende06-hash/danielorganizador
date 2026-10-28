import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Languages, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrimestralPlanData } from '@/hooks/useTrimestralPlan';
import {
  CEFR_LEVELS,
  LANGUAGE_IDS,
  LANGUAGE_LABELS,
  readLanguageQuarterPlans,
  type LanguageId,
  type LanguageQuarterPlan,
} from '@/lib/languagePlan';
import {
  GAME_SKILL_BLOCKS,
  readGameQuarterPlan,
  type GameQuarterPlan,
} from '@/lib/game';

interface Props {
  planData: TrimestralPlanData;
  updatePlanData: (updater: (prev: TrimestralPlanData) => TrimestralPlanData) => void;
}

export function LanguagesAndGameQuarterPlanner({ planData, updatePlanData }: Props) {
  const languages = readLanguageQuarterPlans(planData.languages);
  const game = readGameQuarterPlan(planData.game);

  const saveLanguage = (lang: LanguageId, patch: Partial<LanguageQuarterPlan>) => {
    updatePlanData(prev => {
      const current = readLanguageQuarterPlans(prev.languages);
      return { ...prev, languages: { ...current, [lang]: { ...current[lang], ...patch } } };
    });
  };

  const saveGame = (patch: Partial<GameQuarterPlan>) => {
    updatePlanData(prev => ({ ...prev, game: { ...readGameQuarterPlan(prev.game), ...patch } }));
  };

  const toggleSkill = (id: string) => {
    const selected = game.selectedSkills.includes(id)
      ? game.selectedSkills.filter(skill => skill !== id)
      : [...game.selectedSkills, id].slice(0, 4);
    saveGame({ selectedSkills: selected });
  };

  return (
    <Card className="border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-rose-500" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-semibold">Idiomas y Game · metas del trimestre</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LANGUAGE_IDS.map(lang => (
            <div key={lang} className="rounded-lg border border-muted/60 p-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={cn('text-[11px] font-bold', lang === 'ingles' ? 'text-sky-600 dark:text-sky-400' : 'text-indigo-600 dark:text-indigo-400')}>
                  {LANGUAGE_LABELS[lang]}
                </span>
                <select
                  value={languages[lang].levelGoal}
                  onChange={e => saveLanguage(lang, { levelGoal: e.target.value })}
                  className="h-6 rounded border border-input bg-background px-1 text-[10px] font-semibold"
                >
                  {CEFR_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
                <span className="text-[9px] text-muted-foreground">nivel al cerrar el trimestre</span>
              </div>
              <Input
                value={languages[lang].milestone}
                onChange={e => saveLanguage(lang, { milestone: e.target.value })}
                placeholder="Hito del trimestre…"
                className="h-7 text-[10px]"
              />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-rose-200/50 dark:border-rose-800/40 p-2 space-y-2">
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Game</span>
            <span className="ml-auto text-[9px] text-muted-foreground">sin XP por intimidad</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-between gap-1">
              <span className="text-[9px] text-muted-foreground">XP objetivo</span>
              <Input
                type="number"
                min={0}
                value={game.xpGoal || ''}
                onChange={e => saveGame({ xpGoal: Math.max(0, parseInt(e.target.value) || 0) })}
                className="h-6 w-16 text-[10px] text-center tabular-nums"
              />
            </label>
            <label className="flex items-center justify-between gap-1">
              <span className="text-[9px] text-muted-foreground">Nivel objetivo</span>
              <Input
                type="number"
                min={0}
                value={game.levelGoal || ''}
                onChange={e => saveGame({ levelGoal: Math.max(0, parseInt(e.target.value) || 0) })}
                className="h-6 w-16 text-[10px] text-center tabular-nums"
              />
            </label>
          </div>
          <Input
            value={game.milestone}
            onChange={e => saveGame({ milestone: e.target.value })}
            placeholder="Hito del trimestre (ej. 12 citas y nivel 3)…"
            className="h-7 text-[10px]"
          />
          <div className="space-y-1">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Habilidades del trimestre · hasta 4</p>
            <div className="flex flex-wrap gap-1">
              {GAME_SKILL_BLOCKS.flatMap(block => block.skills).map(skill => {
                const checked = game.selectedSkills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={cn(
                      'rounded-full border px-1.5 py-0.5 text-[9px] transition-colors',
                      checked
                        ? 'bg-rose-500/15 border-rose-500/50 text-rose-700 dark:text-rose-300 font-semibold'
                        : 'border-muted-foreground/30 text-muted-foreground hover:border-rose-400',
                    )}
                  >
                    {skill.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
