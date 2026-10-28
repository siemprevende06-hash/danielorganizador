import { useMemo } from 'react';
import { addMonths, endOfMonth, startOfMonth } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Languages, Flame, Target, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonthlyPlanData } from '@/hooks/useMonthlyPlan';
import { useLanguageStats } from '@/hooks/useLanguageStats';
import { useGameTracking } from '@/hooks/useGameTracking';
import {
  CEFR_LEVELS,
  LANGUAGE_IDS,
  LANGUAGE_LABELS,
  LANGUAGE_SKILLS,
  readLanguageMonthPlans,
  suggestedMonthMinutes,
  type LanguageId,
  type LanguageMonthPlan,
  type LanguageSkillId,
} from '@/lib/languagePlan';
import {
  GAME_SKILL_BLOCKS,
  GAME_XP,
  readGameMonthPlan,
  type GameMonthPlan,
} from '@/lib/game';

interface Props {
  month: Date;
  planData: MonthlyPlanData;
  updatePlanData: (updater: (prev: MonthlyPlanData) => MonthlyPlanData) => void;
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          value={value || ''}
          placeholder={placeholder ?? '0'}
          onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="h-6 w-16 text-[10px] text-center tabular-nums"
        />
        {suffix && <span className="text-[9px] text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}

export function LanguagesAndGamePlanner({ month, planData, updatePlanData }: Props) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const prevStart = startOfMonth(addMonths(month, -1));
  const prevEnd = endOfMonth(addMonths(month, -1));

  const languageMonth = useMemo(() => readLanguageMonthPlans(planData.languages), [planData.languages]);
  const gameMonth = useMemo(() => readGameMonthPlan(planData.game), [planData.game]);

  const { stats: currentLanguageStats } = useLanguageStats(monthStart, monthEnd);
  const { stats: previousLanguageStats } = useLanguageStats(prevStart, prevEnd);
  const { stats: gameStats, totalXp } = useGameTracking(monthStart, monthEnd);

  const saveLanguage = (lang: LanguageId, patch: Partial<LanguageMonthPlan>) => {
    updatePlanData(prev => {
      const current = readLanguageMonthPlans(prev.languages);
      return { ...prev, languages: { ...current, [lang]: { ...current[lang], ...patch } } };
    });
  };

  const saveGame = (patch: Partial<GameMonthPlan>) => {
    updatePlanData(prev => ({ ...prev, game: { ...readGameMonthPlan(prev.game), ...patch } }));
  };

  const toggleEvaluation = (lang: LanguageId, skill: LanguageSkillId, value: number) => {
    const current = languageMonth[lang].selfEvaluation?.[skill] ?? 0;
    const next = { ...languageMonth[lang].selfEvaluation };
    if (current === value) delete next[skill];
    else next[skill] = value;
    saveLanguage(lang, { selfEvaluation: next });
  };

  const toggleSkill = (skillId: string) => {
    const selected = gameMonth.selectedSkills.includes(skillId)
      ? gameMonth.selectedSkills.filter(id => id !== skillId)
      : [...gameMonth.selectedSkills, skillId];
    if (selected.length > 4) return;
    saveGame({ selectedSkills: selected });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* IDIOMAS */}
      <Card className="border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-sky-500" />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-semibold">Idiomas · nivel, hito y autoevaluación</h3>
          </div>

          {LANGUAGE_IDS.map(lang => {
            const plan = languageMonth[lang];
            const actual = currentLanguageStats[lang];
            const previous = previousLanguageStats[lang];
            const suggestion = suggestedMonthMinutes(plan.level, previous.minutes);

            return (
              <div key={lang} className="rounded-lg border border-muted/60 p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn('text-[11px] font-bold', lang === 'ingles' ? 'text-sky-600 dark:text-sky-400' : 'text-indigo-600 dark:text-indigo-400')}>
                    {LANGUAGE_LABELS[lang]}
                  </span>
                  <select
                    value={plan.level}
                    onChange={e => saveLanguage(lang, { level: e.target.value })}
                    className="h-6 rounded border border-input bg-background px-1 text-[10px] font-semibold"
                  >
                    {CEFR_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                  <span className="ml-auto text-[9px] text-muted-foreground tabular-nums">
                    real: {actual.minutes} min · {actual.activeDays} días · {actual.skillCoverage.length}/6 hab.
                  </span>
                </div>

                <NumberField
                  label="Minutos objetivo del mes"
                  value={plan.monthMinutes}
                  onChange={value => saveLanguage(lang, { monthMinutes: value })}
                  suffix="min"
                />
                <div className="flex items-center justify-between gap-2 -mt-1">
                  <span className="text-[9px] text-muted-foreground">
                    Sugerencia editable: {suggestion} min
                    {previous.minutes > 0 ? ' (según el mes anterior)' : ' (base por nivel)'}
                  </span>
                  <button
                    onClick={() => saveLanguage(lang, { monthMinutes: suggestion })}
                    className="text-[9px] font-semibold text-emerald-600 hover:underline"
                  >
                    Usar sugerencia
                  </button>
                </div>

                <Input
                  value={plan.milestone}
                  onChange={e => saveLanguage(lang, { milestone: e.target.value })}
                  placeholder="Hito del mes (ej. terminar unidad 4)…"
                  className="h-7 text-[10px]"
                />

                <div className="space-y-1">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Autoevaluación por habilidad · opcional (1–5)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {LANGUAGE_SKILLS.map(skill => (
                      <div key={skill.id} className="flex items-center justify-between gap-1">
                        <span className="text-[9px] truncate">{skill.name}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(value => {
                            const active = (plan.selfEvaluation?.[skill.id as LanguageSkillId] ?? 0) >= value;
                            return (
                              <button
                                key={value}
                                onClick={() => toggleEvaluation(lang, skill.id as LanguageSkillId, value)}
                                title={`${skill.name}: ${value}/5`}
                                className={cn(
                                  'w-4 h-4 rounded-sm border text-[8px] font-bold transition-colors',
                                  active
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-muted-foreground/30 text-transparent hover:border-emerald-500',
                                )}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* GAME */}
      <Card className="border border-rose-200/60 dark:border-rose-800/40 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-semibold">Game · habilidades, hito y metas</h3>
            <Badge variant="outline" className="ml-auto text-[9px] border-rose-500/40 text-rose-600 dark:text-rose-400">
              {totalXp} XP · {gameStats.xp} XP este mes
            </Badge>
          </div>

          <div className="rounded-lg bg-muted/40 p-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[13px] font-bold tabular-nums">{gameStats.activeDays}</p>
              <p className="text-[8px] uppercase tracking-wide text-muted-foreground">días activos</p>
            </div>
            <div>
              <p className="text-[13px] font-bold tabular-nums">{gameStats.actions}</p>
              <p className="text-[8px] uppercase tracking-wide text-muted-foreground">acciones</p>
            </div>
            <div>
              <p className="text-[13px] font-bold tabular-nums">{gameStats.citas}</p>
              <p className="text-[8px] uppercase tracking-wide text-muted-foreground">citas</p>
            </div>
          </div>

          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
            Habilidades del mes · elige hasta 4
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {GAME_SKILL_BLOCKS.map(block => (
              <div key={block.id} className="rounded-lg border border-muted/60 p-1.5 space-y-1">
                <p className="text-[9px] font-bold text-rose-600 dark:text-rose-400">{block.name}</p>
                {block.skills.map(skill => {
                  const checked = gameMonth.selectedSkills.includes(skill.id);
                  const disabled = !checked && gameMonth.selectedSkills.length >= 4;
                  return (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      disabled={disabled}
                      className={cn(
                        'flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[9px] transition-colors',
                        checked ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold' : 'hover:bg-muted',
                        disabled && 'opacity-40 cursor-not-allowed',
                      )}
                    >
                      <span className={cn('w-3 h-3 rounded-sm border grid place-items-center text-[8px]', checked ? 'bg-rose-500 border-rose-500 text-white' : 'border-muted-foreground/40')}>
                        {checked ? '✓' : ''}
                      </span>
                      <span className="truncate">{skill.name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground text-right">
            {gameMonth.selectedSkills.length}/4 seleccionadas
          </p>

          <Input
            value={gameMonth.milestone}
            onChange={e => saveGame({ milestone: e.target.value })}
            placeholder="Hito del mes (ej. 3 citas y cerrar 5 números)…"
            className="h-7 text-[10px]"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
            <NumberField label="Acciones objetivo" value={gameMonth.actionsGoal} onChange={value => saveGame({ actionsGoal: value })} />
            <NumberField label="Números objetivo" value={gameMonth.numbersGoal} onChange={value => saveGame({ numbersGoal: value })} />
            <NumberField label="Citas objetivo" value={gameMonth.citasGoal} onChange={value => saveGame({ citasGoal: value })} />
            <NumberField label="XP objetivo del mes" value={gameMonth.xpGoal} onChange={value => saveGame({ xpGoal: value })} suffix="XP" />
          </div>

          <div className="flex items-start gap-1.5 rounded-lg bg-muted/40 p-2">
            <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              XP real: 1 por cada 10 min (máx. 3/día) · 5 por acción (máx. 3/día) · 10 por número (máx. 2/día) ·
              30 por cita · 10 por evento social (máx. 1/día). La intimidad no da XP. Nivel cada {GAME_XP.levelXp} XP.
            </p>
          </div>

          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <Target className="w-3 h-3" />
            Las citas se registran en Vida Social; aquí solo se planifican.
            <Sparkles className="w-3 h-3 ml-auto text-amber-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}
