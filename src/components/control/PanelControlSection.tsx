import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Gauge } from 'lucide-react';
import { getDayGoalEffective } from '@/lib/hierarchy';
import { cn } from '@/lib/utils';

const DEFAULT_GOALS: Record<string, number> = {
  universidad: 120,
  emprendimiento: 60,
  proyectos: 90,
  idiomas: 60,
  gym: 60,
  lectura: 30,
  musica: 30,
  ajedrez: 15,
  game: 15,
};

interface TimerItem { id: string; label: string; color: string; }

const PRIORITIES: TimerItem[] = [
  { id: 'universidad', label: 'Universidad', color: '#3b82f6' },
  { id: 'emprendimiento', label: 'Emprendimiento', color: '#a855f7' },
  { id: 'proyectos', label: 'Proyectos', color: '#f59e0b' },
  { id: 'idiomas', label: 'Idiomas', color: '#10b981' },
  { id: 'gym', label: 'Gym', color: '#f97316' },
];

const HOBBY_ITEMS: TimerItem[] = [
  { id: 'lectura', label: 'Lectura', color: '#8b5cf6' },
  { id: 'ajedrez', label: 'Ajedrez', color: '#14b8a6' },
  { id: 'game', label: 'Game', color: '#eab308' },
  { id: 'musica', label: 'Música', color: '#ec4899' },
];

const SOSTEN_ITEMS: TimerItem[] = [
  { id: 'rutina-activacion', label: 'Rutina de Activación', color: '#3b82f6' },
  { id: 'alistamiento-desayuno', label: 'Alistamiento y Desayuno', color: '#10b981' },
  { id: 'rutina-desactivacion', label: 'Rutina de Desactivación', color: '#8b5cf6' },
  { id: 'horario-regular', label: 'Horario de Sueño', color: '#06b6d4' },
];

const ALL_TIMER_ITEMS = [...PRIORITIES, ...HOBBY_ITEMS];

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const num = parseInt(full, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

export function minutesOfToday(timeData: Record<string, number>, workoutDuration: number, id: string): number {
  if (id === 'gym') return workoutDuration || 0;
  if (id === 'idiomas') return (timeData.italiano || 0) + (timeData.ingles || 0);
  return timeData[id] || 0;
}

export function goalOfToday(today: Date, id: string): number {
  if (id === 'idiomas') {
    const g = getDayGoalEffective(today, 'italiano') + getDayGoalEffective(today, 'ingles');
    return g > 0 ? g : (DEFAULT_GOALS.idiomas || 0);
  }
  const g = getDayGoalEffective(today, id);
  return g > 0 ? g : (DEFAULT_GOALS[id] || 30);
}

export function computePanelSummary(timeData: Record<string, number>, workoutDuration: number, today = new Date()) {
  const minutes = ALL_TIMER_ITEMS.reduce((s, it) => s + minutesOfToday(timeData, workoutDuration, it.id), 0);
  const goal = ALL_TIMER_ITEMS.reduce((s, it) => s + goalOfToday(today, it.id), 0);
  return { minutes, goal, pct: goal > 0 ? Math.min(100, Math.round((minutes / goal) * 100)) : 0 };
}

function GlowRing({ pct, color, size = 68, children }: { pct: number; color: string; size?: number; children?: React.ReactNode }) {
  const capped = Math.min(100, Math.max(0, pct));
  const r = 26;
  const c = 2 * Math.PI * r;
  const glowAlpha = 0.15 + (capped / 100) * 0.65;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="6" className="dark:opacity-40" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - capped / 100)}
          style={{
            filter: `drop-shadow(0 0 ${3 + (capped / 100) * 9}px rgb(${hexToRgb(color)} / ${glowAlpha}))`,
            transition: 'stroke-dashoffset .6s ease, filter .6s ease',
          }}
        />
      </svg>
      <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1.5 rounded-full bg-black/40 dark:bg-white/40" />
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </div>
  );
}

function TimerRingCard({ item, minutes, goal }: { item: TimerItem; minutes: number; goal: number }) {
  const pct = goal > 0 ? Math.round((minutes / goal) * 100) : 0;
  const over = minutes - goal;
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm border border-border/40 p-3 flex flex-col items-center gap-1.5">
      <GlowRing pct={pct} color={item.color}>
        <span className="text-sm font-bold tabular-nums">{minutes}<span className="text-[9px] text-muted-foreground ml-0.5">min</span></span>
      </GlowRing>
      <div className="text-center leading-tight">
        <p className="text-[10px] font-semibold">{item.label}</p>
        <p className="text-[9px] text-muted-foreground">
          máx {goal} min
          {over > 0 && <span className="text-amber-500 font-semibold"> · +{over}</span>}
        </p>
      </div>
    </div>
  );
}

function SostenRing({ item, completed }: { item: TimerItem; completed: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl shadow-sm border p-3 flex flex-col items-center gap-1.5 transition-all",
      completed
        ? "bg-white/80 dark:bg-zinc-950/80 border-border/40"
        : "bg-muted/30 border-dashed border-border/60"
    )}>
      <GlowRing pct={completed ? 100 : 0} color={item.color}>
        <span className="text-sm font-bold">{completed ? '✓' : '—'}</span>
      </GlowRing>
      <div className="text-center leading-tight">
        <p className="text-[10px] font-semibold">{item.label}</p>
        <p className={completed ? "text-[9px] text-emerald-500 font-medium" : "text-[9px] text-muted-foreground/60"}>
          {completed ? 'Completado' : 'Pendiente'}
        </p>
      </div>
    </div>
  );
}

export interface PanelControlSectionProps {
  timeData?: Record<string, number>;
  completions?: Record<string, boolean>;
  workoutDuration?: number;
}

export function PanelControlSection({ timeData = {}, completions = {}, workoutDuration = 0 }: PanelControlSectionProps) {
  const today = new Date();

  const summary = useMemo(() => computePanelSummary(timeData, workoutDuration, today), [timeData, workoutDuration]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Resumen general */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-3 flex items-center gap-4">
          <GlowRing pct={summary.pct} color="#6366f1" size={60}>
            <span className="text-xs font-bold tabular-nums">{summary.pct}%</span>
          </GlowRing>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-indigo-500" /> Panel de control</p>
            <p className="text-[10px] text-muted-foreground">{summary.minutes} min invertidos hoy · objetivo {summary.goal} min</p>
          </div>
        </CardContent>
      </Card>

      {/* Prioridades */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Prioridades</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PRIORITIES.map(it => (
            <TimerRingCard key={it.id} item={it} minutes={minutesOfToday(timeData, workoutDuration, it.id)} goal={goalOfToday(today, it.id)} />
          ))}
        </div>
      </div>

      {/* Acumulativos */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Acumulativos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {HOBBY_ITEMS.map(it => (
            <TimerRingCard key={it.id} item={it} minutes={minutesOfToday(timeData, workoutDuration, it.id)} goal={goalOfToday(today, it.id)} />
          ))}
        </div>
      </div>

      {/* Sostén */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Sostén</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SOSTEN_ITEMS.map(it => (
            <SostenRing key={it.id} item={it} completed={!!completions[it.id]} />
          ))}
        </div>
      </div>
    </div>
  );
}