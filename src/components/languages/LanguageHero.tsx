import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Mic,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LANGUAGE_SKILLS } from './skills';
import { skillColor } from './playbook';

const LANGUAGE_ACCENT = {
  english: 'hsl(210 90% 50% / 0.16)',
  italian: 'hsl(152 65% 40% / 0.16)',
} as const;

export function LanguageHero({
  currentLanguage,
  onSetLanguage,
  level,
  streak,
  goal,
  todayMinutes,
  dailyGoal,
  weekMinutes,
  weekGoal,
  weekPercent,
  doneIds,
  completedToday,
  totalSkills,
  sessionTotalMinutes,
  sessionDoneSteps,
  sessionTotalSteps,
  reviewCount,
  onStartSession,
  onSpeak,
  onReview,
}: {
  currentLanguage: 'english' | 'italian';
  onSetLanguage: (language: 'english' | 'italian') => void;
  level: string;
  streak: number;
  goal: string;
  todayMinutes: number;
  dailyGoal: number;
  weekMinutes: number;
  weekGoal: number;
  weekPercent: number;
  doneIds: string[];
  completedToday: number;
  totalSkills: number;
  sessionTotalMinutes: number;
  sessionDoneSteps: number;
  sessionTotalSteps: number;
  reviewCount: number;
  onStartSession: () => void;
  onSpeak: () => void;
  onReview: () => void;
}) {
  const isEnglish = currentLanguage === 'english';
  const accent = LANGUAGE_ACCENT[currentLanguage];
  const remainingMinutes = Math.max(
    0,
    Math.round(sessionTotalMinutes * (1 - (sessionTotalSteps > 0 ? sessionDoneSteps / sessionTotalSteps : 0)))
  );
  const sessionComplete = sessionTotalSteps > 0 && sessionDoneSteps >= sessionTotalSteps;
  const doneSet = new Set(doneIds);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5">
      <div
        className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full blur-3xl"
        style={{ background: accent }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/4 h-44 w-44 rounded-full blur-3xl"
        style={{ background: 'hsl(var(--success) / 0.10)' }}
      />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border/60 bg-background/80 text-2xl shadow-sm">
            <span aria-hidden>{isEnglish ? '🇺🇸' : '🇮🇹'}</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Idiomas</p>
              <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
                <Sparkles className="h-2.5 w-2.5" />
                CEFR {level}
              </Badge>
            </div>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">
              {isEnglish ? 'Inglés' : 'Italiano'}
            </h1>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:text-[13px]">Hoy: {goal}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5"
              style={{ borderColor: 'hsl(var(--warning) / 0.25)', background: 'hsl(var(--warning) / 0.10)' }}
              title={`${streak} días seguidos practicando`}
            >
              <Flame className="h-3.5 w-3.5" style={{ color: 'hsl(var(--warning))' }} />
              <span className="text-xs font-bold tabular-nums">{streak}</span>
              <span className="hidden text-[10px] text-muted-foreground sm:inline">días</span>
            </div>
          )}
          <WeekRing percent={weekPercent} />
        </div>
      </div>

      <div className="relative mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/70 p-1">
          <button
            type="button"
            onClick={() => onSetLanguage('english')}
            aria-pressed={isEnglish}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors',
              isEnglish ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span aria-hidden>🇺🇸</span> Inglés
          </button>
          <button
            type="button"
            onClick={() => onSetLanguage('italian')}
            aria-pressed={!isEnglish}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors',
              !isEnglish ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span aria-hidden>🇮🇹</span> Italiano
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="tabular-nums">
              {completedToday}/{totalSkills}
            </span>
            habilidades
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            <span className="tabular-nums">{todayMinutes}</span>
            {dailyGoal > 0 ? `/ ${dailyGoal} min hoy` : 'min hoy'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="tabular-nums">{weekMinutes}</span>
            {weekGoal > 0 ? `/ ${weekGoal} min semana` : 'min semana'}
          </span>
          <span className="flex items-center gap-1" aria-hidden>
            {LANGUAGE_SKILLS.map(skill => (
              <span
                key={skill.id}
                className="h-1.5 w-1.5 rounded-full transition-colors"
                style={{
                  background: doneSet.has(skill.id) ? skillColor(skill.id) : 'hsl(var(--muted-foreground) / 0.25)',
                }}
              />
            ))}
          </span>
        </div>
      </div>

      <div className="relative mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={onStartSession} size="sm" className="h-9 gap-2" disabled={sessionComplete}>
          {sessionComplete ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {sessionComplete
            ? 'Sesión completada'
            : sessionDoneSteps > 0
              ? `Continuar sesión · ${remainingMinutes} min`
              : `Empezar sesión · ${sessionTotalMinutes} min`}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={onSpeak}>
            <Mic className="h-3.5 w-3.5" />
            Hablar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={onReview}
            disabled={reviewCount === 0}
            title={reviewCount === 0 ? 'No hay nada pendiente de repaso' : `${reviewCount} elementos por repasar`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Repasar{reviewCount > 0 ? ` (${reviewCount})` : ''}
          </Button>
        </div>
        <span className="text-[10px] text-muted-foreground sm:ml-auto">
          {sessionDoneSteps}/{sessionTotalSteps} pasos del plan de hoy
        </span>
      </div>
    </section>
  );
}

function WeekRing({ percent }: { percent: number }) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative h-10 w-10" title={`${Math.round(safe)}% de la meta semanal`}>
      <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
        <circle cx="20" cy="20" r={radius} fill="none" strokeWidth="3.5" style={{ stroke: 'hsl(var(--muted))' }} />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - safe / 100)}
          style={{ stroke: 'hsl(var(--foreground))', transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[9px] font-bold tabular-nums">
        {Math.round(safe)}%
      </span>
    </div>
  );
}
