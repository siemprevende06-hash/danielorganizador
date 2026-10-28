import { useState, useMemo, useEffect } from 'react';
import { startOfWeek, addDays } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookText, BookOpen, Headphones, MessageCircle, PenLine, Languages as LangIcon, Sparkles, Check, Clock, Tv, Gamepad2, XCircle, Flame, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeekStreakBar } from './WeekStreakBar';
import { getCubaDate } from '@/lib/cubaTime';
import { useAreaCovers, coverKey } from '@/hooks/useAreaCovers';
import { getCoverGradient } from '@/components/areas/AreaCover';
import { SystemChronoBox } from '@/components/today/systems/SystemChronoBox';
import { useChronoTime } from '@/hooks/useChronoTime';
import { useLanguageStats } from '@/hooks/useLanguageStats';
import {
  LANGUAGE_SKILLS,
  LANGUAGE_LABELS,
  getWeekLanguagePlans,
  type LanguageId,
} from '@/lib/languagePlan';
import type { ChronoRange } from '@/lib/systemSchedule';

interface Skill {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

const SKILL_ICONS: Record<string, { icon: Skill['icon']; color: string; bg: string }> = {
  gramatica: { icon: BookText, color: 'text-purple-600', bg: 'bg-purple-500/10' },
  vocabulario: { icon: Sparkles, color: 'text-pink-600', bg: 'bg-pink-500/10' },
  'lectura-l': { icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  listening: { icon: Headphones, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  speaking: { icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  escritura: { icon: PenLine, color: 'text-rose-600', bg: 'bg-rose-500/10' },
};

const SKILLS: Skill[] = LANGUAGE_SKILLS.map(skill => ({
  ...skill,
  ...(SKILL_ICONS[skill.id] ?? { icon: Sparkles, color: 'text-slate-600', bg: 'bg-slate-500/10' }),
}));

interface PassiveActivity {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

// Idioma pasivo: solo existe para inglés.
const PASSIVE: PassiveActivity[] = [
  { id: 'reading_podcast', name: 'Lectura o podcast', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  { id: 'tv', name: 'Televisión', icon: Tv, color: 'text-sky-600', bg: 'bg-sky-500/10' },
  { id: 'videogames', name: 'Videojuegos', icon: Gamepad2, color: 'text-violet-600', bg: 'bg-violet-500/10' },
];

const passiveKey = (id: string) => `idioma-ingles-pasivo-${id}`;

interface Props {
  completions: Record<string, boolean>;
  onToggle: (id: string) => void;
  italianoTime?: number;
  inglesTime?: number;
  onItalianoTimeChange?: (minutes: number) => void;
  onInglesTimeChange?: (minutes: number) => void;
  skipped?: Record<string, boolean>;
  onSkipToggle?: (id: string) => void;
  /** Fecha ISO (yyyy-MM-dd) del día (para persistir el reparto fijo/extra). */
  date?: string;
  fixedBlocks?: ChronoRange[];
  extraBlocks?: ChronoRange[];
}

export const LanguageSkillCards = ({
  completions,
  onToggle,
  italianoTime = 0,
  inglesTime = 0,
  onItalianoTimeChange,
  onInglesTimeChange,
  skipped,
  onSkipToggle,
  date,
  fixedBlocks,
  extraBlocks,
}: Props) => {
  const { covers } = useAreaCovers();
  const idiomasCover = covers[coverKey('sub', 'idiomas')] ?? null;
  const [activeLang, setActiveLang] = useState<LanguageId>('ingles');
  const [today, setToday] = useState(() => getCubaDate());
  const currentTime = activeLang === 'italiano' ? italianoTime : inglesTime;
  const langPrefix = `idioma-${activeLang}`;
  const showPassive = activeLang === 'ingles';

  useEffect(() => {
    const id = setInterval(() => setToday(getCubaDate()), 60_000);
    return () => clearInterval(id);
  }, []);

  const weekStart = useMemo(
    () => startOfWeek(new Date(`${today}T12:00:00`), { weekStartsOn: 1 }),
    [today],
  );
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const { stats } = useLanguageStats(weekStart, weekEnd);
  const weekPlan = useMemo(() => getWeekLanguagePlans(weekStart), [weekStart]);
  const langStats = stats[activeLang];
  const focusSkill = LANGUAGE_SKILLS.find(s => s.id === weekPlan[activeLang].focusSkill) ?? null;

  const applyTotalToLanguages = (nextTotal: number) => {
    const target = Math.max(0, Math.round(nextTotal));
    const other = activeLang === 'italiano' ? inglesTime : italianoTime;
    const otherNew = Math.min(other, target);
    const activeNew = Math.max(0, target - otherNew);
    if (activeLang === 'italiano') {
      if (otherNew !== inglesTime) onInglesTimeChange?.(otherNew);
      onItalianoTimeChange?.(activeNew);
    } else {
      if (otherNew !== italianoTime) onItalianoTimeChange?.(otherNew);
      onInglesTimeChange?.(activeNew);
    }
  };

  const extraUnlocked = (extraBlocks?.length ?? 0) > 0;
  const chrono = useChronoTime({
    enabled: fixedBlocks !== undefined || extraBlocks !== undefined,
    date,
    areaId: 'idiomas',
    total: italianoTime + inglesTime,
    onTotalChange: applyTotalToLanguages,
  });

  const doneCount = SKILLS.filter(s => completions[`${langPrefix}-${s.id}`]).length;
  const passiveDone = showPassive ? PASSIVE.filter(p => completions[passiveKey(p.id)]).length : 0;
  const totalItems = SKILLS.length + (showPassive ? PASSIVE.length : 0);
  const totalDone = doneCount + passiveDone;

  const minTime = 15;
  const maxTime = 30;

  const ring = totalDone === 0
    ? 'ring-red-500/40'
    : totalDone >= totalItems
      ? 'ring-green-500/60'
      : 'ring-blue-500/60';

  const timeColor = currentTime >= maxTime
    ? 'ring-green-500/60'
    : currentTime >= minTime
      ? 'ring-blue-500/60'
      : 'ring-red-500/40';

  const setTime = (value: number) => {
    const minutes = Math.max(0, Math.round(value) || 0);
    if (activeLang === 'italiano') onItalianoTimeChange?.(minutes);
    else onInglesTimeChange?.(minutes);
  };

  return (
    <Card className={cn('p-3 ring-2 transition-all space-y-3', ring, 'bg-emerald-500/5')}>
      <div className={cn('relative -m-3 mb-3 h-14 overflow-hidden bg-gradient-to-br', getCoverGradient('idiomas'))}>
        {idiomasCover ? (
          <img src={idiomasCover} alt="Portada de Idiomas" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-2xl drop-shadow-sm">🌐</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-emerald-500/20">
          <LangIcon className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">🌐 Idiomas</p>
          <p className="text-[10px] text-muted-foreground">
            {LANGUAGE_LABELS[activeLang]} · minutos y habilidades reales
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-emerald-600 tabular-nums">{currentTime}</span>
          <span className="text-xs text-muted-foreground">/{maxTime} min</span>
          <div className="text-[9px] font-bold text-emerald-600">{totalDone}/{totalItems} hoy</div>
        </div>
      </div>

      {/* ITA / ING switch */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 w-fit mx-auto">
        {(['italiano', 'ingles'] as LanguageId[]).map(lang => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-semibold transition-all',
              activeLang === lang
                ? lang === 'italiano' ? 'bg-green-500 text-white shadow-sm' : 'bg-blue-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {lang === 'italiano' ? 'ITA' : 'ING'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
        {SKILLS.map(s => {
          const Icon = s.icon;
          const id = `${langPrefix}-${s.id}`;
          const done = !!completions[id];
          return (
            <button
              key={`${activeLang}-${s.id}`}
              onClick={() => onToggle(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border-2 p-2 transition-all text-left',
                done
                  ? 'bg-green-500/15 border-green-500/50'
                  : `${s.bg} border-transparent hover:border-muted-foreground/30`,
              )}
            >
              <div className={cn(
                'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0',
                done ? 'bg-green-500 border-green-500' : 'border-muted-foreground/40',
              )}>
                {done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </div>
              <Icon className={cn('h-3.5 w-3.5 shrink-0', s.color)} />
              <span className="text-[11px] font-medium truncate flex-1">{s.name}</span>
            </button>
          );
        })}
      </div>

      {/* Enfoque de la semana */}
      {(focusSkill || weekPlan[activeLang].challenge) && (
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-2 space-y-1">
          <div className="flex items-center gap-1.5">
            <Target className="h-3 w-3 text-sky-600 shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">Foco de la semana</span>
            {focusSkill && <span className="text-[10px] font-semibold">{focusSkill.name}</span>}
          </div>
          {weekPlan[activeLang].challenge && (
            <p className="text-[10px] text-muted-foreground flex items-start gap-1">
              <Flame className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
              {weekPlan[activeLang].challenge}
            </p>
          )}
        </div>
      )}

      {/* Tiempo */}
      <div className={cn('flex items-center gap-2 p-2 rounded-lg ring-2 transition-all', timeColor)}>
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-[11px] font-medium text-muted-foreground shrink-0">Tiempo</span>
        <Input
          type="number"
          min={0}
          max={240}
          value={currentTime || ''}
          onChange={e => setTime(parseInt(e.target.value) || 0)}
          className="h-7 w-14 text-xs text-center font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-muted-foreground">min</span>
        <button
          onClick={() => {
            setTime(0);
            onSkipToggle?.(activeLang);
          }}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors',
            skipped?.[activeLang] ? 'bg-red-500/20 text-red-500' : 'bg-muted text-muted-foreground hover:bg-red-500/10',
          )}
        >
          <XCircle className="h-3 w-3" />
          {skipped?.[activeLang] ? 'Saltado' : 'No hice'}
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <span className={cn('text-[9px] font-medium', currentTime >= maxTime ? 'text-green-600' : currentTime >= minTime ? 'text-blue-600' : 'text-red-500')}>
            {currentTime >= maxTime ? 'Máx ✓' : currentTime >= minTime ? 'Mín ✓' : '—'}
          </span>
          <div className={cn('w-2 h-2 rounded-full', currentTime >= maxTime ? 'bg-green-500' : currentTime >= minTime ? 'bg-blue-500' : 'bg-red-500')} />
        </div>
      </div>
      <p className="text-[9px] text-muted-foreground text-center -mt-1">Se guarda automáticamente</p>

      {/* Resumen real de la semana */}
      <div className="grid grid-cols-3 gap-1.5 border-t border-border/40 pt-2">
        <div className="text-center rounded-md bg-muted/40 py-1">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Semana</p>
          <p className="text-[12px] font-bold tabular-nums">{langStats.minutes} min</p>
        </div>
        <div className="text-center rounded-md bg-muted/40 py-1">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Días activos</p>
          <p className="text-[12px] font-bold tabular-nums">{langStats.activeDays}/7</p>
        </div>
        <div className="text-center rounded-md bg-muted/40 py-1">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Cobertura</p>
          <p className={cn('text-[12px] font-bold tabular-nums', langStats.skillCoverage.length >= 4 ? 'text-emerald-600' : '')}>
            {langStats.skillCoverage.length}/6
          </p>
        </div>
      </div>

      {(fixedBlocks || extraBlocks) && (
        <SystemChronoBox
          fixed={fixedBlocks ?? []}
          extra={extraBlocks ?? []}
          fixedMinutes={chrono.fixed}
          extraMinutes={chrono.extra}
          onFixedMinutesChange={chrono.setFixed}
          onExtraMinutesChange={extraUnlocked ? chrono.setExtra : undefined}
        />
      )}

      {showPassive && (
        <div className="space-y-1.5 border-t border-border/40 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-extrabold uppercase tracking-wide text-foreground">🌐 Idioma pasivo</span>
            <span className={cn('text-[10px] font-bold tabular-nums', passiveDone === PASSIVE.length ? 'text-emerald-500' : 'text-muted-foreground')}>
              {passiveDone}/{PASSIVE.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {PASSIVE.map(p => {
              const Icon = p.icon;
              const done = !!completions[passiveKey(p.id)];
              return (
                <button
                  key={p.id}
                  onClick={() => onToggle(passiveKey(p.id))}
                  className={cn(
                    'flex items-center gap-1 rounded-lg border-2 p-1.5 transition-all text-left',
                    done ? 'bg-indigo-500/15 border-indigo-500/50' : `${p.bg} border-transparent`,
                  )}
                >
                  <div className={cn(
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0',
                    done ? 'bg-indigo-500 border-indigo-500' : 'border-muted-foreground/40',
                  )}>
                    {done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', p.color)} />
                  <span className="text-[11px] font-medium truncate flex-1">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <WeekStreakBar habitId="idiomas" todayValue={totalDone} todayCompleted={totalDone > 0} minThreshold={1} maxThreshold={totalItems} compact />
    </Card>
  );
};
