import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { startOfWeek } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Flame, Clock, Swords, Hash, Heart, CalendarHeart, Users, ArrowRight, XCircle, Target, Gamepad2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameTracking } from '@/hooks/useGameTracking';
import { getDayGoalEffective } from '@/lib/hierarchy';
import { GoalMeter } from '@/components/goals/GoalMeter';
import {
  gameDayXp,
  gameLevel,
  gameSkillName,
  getMonthGamePlan,
  getWeekGamePlan,
  GAME_XP,
} from '@/lib/game';
import { WeekStreakBar } from './WeekStreakBar';

interface Props {
  /** Fecha de Cuba (yyyy-MM-dd). */
  date: string;
  minutes: number;
  actions: number;
  numbers: number;
  onMinutesChange: (minutes: number) => void;
  onActionsChange: (actions: number) => void;
  onNumbersChange: (numbers: number) => void;
  skipped?: boolean;
  onSkipToggle?: () => void;
}

function Counter({
  icon,
  label,
  value,
  max,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 p-1.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-[10px] font-medium flex-1 min-w-0 truncate">{label}</span>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-5 h-5 rounded bg-background border text-[11px] font-bold leading-none hover:bg-muted"
          aria-label={`Quitar ${label}`}
        >
          −
        </button>
        <span className={cn('w-6 text-center text-[11px] font-bold tabular-nums', max !== undefined && value >= max && 'text-emerald-600')}>
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-5 h-5 rounded bg-background border text-[11px] font-bold leading-none hover:bg-muted"
          aria-label={`Añadir ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function GameCard({
  date,
  minutes,
  actions,
  numbers,
  onMinutesChange,
  onActionsChange,
  onNumbersChange,
  skipped,
  onSkipToggle,
}: Props) {
  const day = useMemo(() => new Date(`${date}T12:00:00`), [date]);
  const weekStart = useMemo(() => startOfWeek(day, { weekStartsOn: 1 }), [day]);
  const { stats, totalXp } = useGameTracking(day, day);
  const weekPlan = useMemo(() => getWeekGamePlan(weekStart), [weekStart]);
  const monthPlan = useMemo(() => getMonthGamePlan(day), [day]);
  const dayGoal = useMemo(() => getDayGoalEffective(day, 'game'), [day]);

  const liveXp = gameDayXp({
    minutes,
    actions,
    numbers,
    citas: stats.citas,
    social: stats.social,
  });
  // El XP total del hook puede ir un guardado por detrás: se ajusta con el día live.
  const displayTotalXp = Math.max(0, totalXp - stats.xp + liveXp.total);
  const level = gameLevel(displayTotalXp);

  return (
    <Card className="p-3 ring-2 ring-rose-500/30 bg-rose-500/5 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-rose-500/15">
          <Flame className="h-4 w-4 text-rose-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            Game · Seducción
            <Badge variant="outline" className="text-[9px] h-4 border-rose-500/40 text-rose-600 dark:text-rose-400">
              Nv {level.level}
            </Badge>
          </p>
          <p className="text-[10px] text-muted-foreground">
            {gameSkillName(weekPlan.focusSkill) || monthPlan.milestone || 'Acción real + tiempo de práctica'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-rose-600 tabular-nums">{liveXp.total}</span>
          <span className="text-xs text-muted-foreground"> XP hoy</span>
          <div className="text-[9px] text-muted-foreground tabular-nums">{displayTotalXp} XP total</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-rose-500 transition-all" style={{ width: `${level.progress}%` }} />
        </div>
        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
          <span>Nivel {level.level}</span>
          <span>{level.xpToNext} XP para el nivel {level.level + 1}</span>
        </div>
      </div>

      <GoalMeter
        label="Minutos de hoy"
        value={minutes}
        goal={dayGoal}
        unit=" min"
        tone="rose"
        emptyLabel="sin meta en el plan"
      />

      <div className="flex items-center gap-2 rounded-lg ring-2 ring-rose-500/20 p-1.5">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-[10px] font-medium text-muted-foreground">Tiempo</span>
        <Input
          type="number"
          min={0}
          max={240}
          value={minutes || ''}
          onChange={e => onMinutesChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="h-7 w-14 text-xs text-center font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[9px] text-muted-foreground">min</span>
        <span className="text-[9px] font-semibold text-rose-600">+{liveXp.time} XP</span>
        <div className="flex-1" />
        <button
          onClick={onSkipToggle}
          className={cn(
            'flex items-center gap-1 px-1.5 py-1 rounded-md text-[9px] font-medium transition-colors',
            skipped ? 'bg-red-500/20 text-red-500' : 'bg-muted text-muted-foreground hover:bg-red-500/10',
          )}
        >
          <XCircle className="h-3 w-3" />
          {skipped ? 'Saltado' : 'No hice'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <Counter icon={<Swords className="h-3.5 w-3.5" />} label="Acciones" value={actions} max={GAME_XP.actionDailyCap} onChange={onActionsChange} />
        <Counter icon={<Hash className="h-3.5 w-3.5" />} label="Números" value={numbers} max={GAME_XP.numberDailyCap} onChange={onNumbersChange} />
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-lg bg-muted/50 p-1.5">
          <CalendarHeart className="h-3.5 w-3.5 mx-auto text-rose-500" />
          <p className="text-[12px] font-bold tabular-nums">{stats.citas}</p>
          <p className="text-[8px] uppercase tracking-wide text-muted-foreground">citas</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-1.5">
          <Users className="h-3.5 w-3.5 mx-auto text-orange-500" />
          <p className="text-[12px] font-bold tabular-nums">{stats.social}</p>
          <p className="text-[8px] uppercase tracking-wide text-muted-foreground">eventos</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-1.5">
          <Heart className="h-3.5 w-3.5 mx-auto text-pink-500" />
          <p className="text-[12px] font-bold tabular-nums">{stats.intimacy}</p>
          <p className="text-[8px] uppercase tracking-wide text-muted-foreground">intimidad</p>
        </div>
      </div>

      <Link
        to="/vida-social"
        className="flex items-center justify-center gap-1 rounded-lg bg-rose-500/10 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-500/20 transition-colors"
      >
        <CalendarHeart className="h-3 w-3" />
        Registrar citas en Vida Social
        <ArrowRight className="h-3 w-3" />
      </Link>

      {(weekPlan.challenge || weekPlan.actionsTarget > 0 || weekPlan.numbersTarget > 0) && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-1.5 space-y-0.5">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-rose-500 shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
              Reto de la semana
            </span>
            <span className="ml-auto text-[9px] text-muted-foreground tabular-nums">
              {weekPlan.actionsTarget > 0 && `${weekPlan.actionsTarget} acc.`}
              {weekPlan.actionsTarget > 0 && weekPlan.numbersTarget > 0 && ' · '}
              {weekPlan.numbersTarget > 0 && `${weekPlan.numbersTarget} núm.`}
            </span>
          </div>
          {weekPlan.challenge && <p className="text-[10px] text-muted-foreground">{weekPlan.challenge}</p>}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
        <Gamepad2 className="h-3 w-3" />
        XP: tiempo {liveXp.time} · acciones {liveXp.actions} · números {liveXp.numbers} · citas {liveXp.citas} · social {liveXp.social}
      </div>

      <WeekStreakBar habitId="game" todayValue={minutes} todayCompleted={liveXp.total > 0} minThreshold={10} maxThreshold={30} compact />
    </Card>
  );
}
