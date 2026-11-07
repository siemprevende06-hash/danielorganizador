import { useCallback, useEffect, useRef, useState } from 'react';
import { Lock, Pause, Play, ShieldCheck, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SPEED_PLAN_SYSTEMS } from '@/lib/daySystems';
import { planSystemEmoji } from '@/lib/planMananaTasks';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'daniel_focus_lock_v1';
const DURATIONS = [25, 45, 60, 90] as const;

type LockStatus = 'idle' | 'running' | 'paused';

interface StoredLock {
  status: LockStatus;
  durationSec: number;
  endsAt: number | null;
  remainingSec: number;
  systemId: string | null;
}

const IDLE_LOCK: StoredLock = {
  status: 'idle',
  durationSec: 45 * 60,
  endsAt: null,
  remainingSec: 45 * 60,
  systemId: null,
};

function readStoredLock(): StoredLock {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return IDLE_LOCK;
    const parsed = JSON.parse(raw) as Partial<StoredLock>;
    const status: LockStatus = parsed.status === 'running' || parsed.status === 'paused' ? parsed.status : 'idle';
    const durationSec = Math.max(60, Number(parsed.durationSec) || IDLE_LOCK.durationSec);
    const remainingSec = Math.max(0, Number(parsed.remainingSec) || durationSec);
    const endsAt = status === 'running' ? Number(parsed.endsAt) || null : null;
    if (status === 'running' && endsAt != null && endsAt <= Date.now()) {
      return { ...IDLE_LOCK, durationSec, remainingSec: durationSec };
    }
    return {
      status,
      durationSec,
      endsAt,
      remainingSec,
      systemId: typeof parsed.systemId === 'string' ? parsed.systemId : null,
    };
  } catch {
    return IDLE_LOCK;
  }
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function remainingFor(lock: StoredLock, now: number): number {
  if (lock.status === 'running' && lock.endsAt != null) {
    return Math.max(0, Math.ceil((lock.endsAt - now) / 1000));
  }
  return Math.max(0, lock.remainingSec);
}

interface FocusLockCardProps {
  /** Se llama cuando el temporizador llega a cero. */
  onComplete?: (systemId: string | null) => void;
}

/**
 * Tarjeta de bloqueo de enfoque: inicia un temporizador que cubre toda la app
 * con una capa de bloqueo hasta que termine o el usuario lo detenga.
 */
export function FocusLockCard({ onComplete }: FocusLockCardProps) {
  const [lock, setLock] = useState<StoredLock>(() => readStoredLock());
  const [now, setNow] = useState(() => Date.now());
  const [durationMinutes, setDurationMinutes] = useState<number>(() => {
    const stored = readStoredLock();
    const minutes = Math.round(stored.durationSec / 60);
    return DURATIONS.includes(minutes as (typeof DURATIONS)[number]) ? minutes : 45;
  });
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  const remainingSec = remainingFor(lock, now);
  const active = lock.status !== 'idle';
  const paused = lock.status === 'paused';
  const progress = lock.durationSec > 0
    ? Math.max(0, Math.min(100, ((lock.durationSec - remainingSec) / lock.durationSec) * 100))
    : 0;
  const system = lock.systemId
    ? SPEED_PLAN_SYSTEMS.find(candidate => candidate.id === lock.systemId)
    : null;

  // Tick del temporizador mientras está activo.
  useEffect(() => {
    if (lock.status !== 'running') return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [lock.status]);

  // Persistencia del bloqueo.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lock));
    } catch {
      // localStorage no disponible.
    }
  }, [lock]);

  // Bloquea el scroll del documento mientras la capa está visible.
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);

  // Aviso al cerrar la pestaña con el bloqueo activo.
  useEffect(() => {
    if (lock.status !== 'running') return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [lock.status]);

  // Finalización automática.
  useEffect(() => {
    if (lock.status !== 'running' || remainingSec > 0) return;
    setLock(prev => ({
      ...prev,
      status: 'idle',
      endsAt: null,
      remainingSec: prev.durationSec,
    }));
    completeRef.current?.(lock.systemId);
  }, [lock.status, lock.systemId, remainingSec]);

  const start = useCallback(() => {
    const durationSec = durationMinutes * 60;
    const startedAt = Date.now();
    setNow(startedAt);
    setLock(prev => ({
      ...prev,
      status: 'running',
      durationSec,
      endsAt: startedAt + durationSec * 1000,
      remainingSec: durationSec,
    }));
  }, [durationMinutes]);

  const pause = useCallback(() => {
    setLock(prev => ({
      ...prev,
      status: 'paused',
      remainingSec: remainingFor(prev, Date.now()),
      endsAt: null,
    }));
  }, []);

  const resume = useCallback(() => {
    setNow(Date.now());
    setLock(prev => ({
      ...prev,
      status: 'running',
      endsAt: Date.now() + Math.max(1, prev.remainingSec) * 1000,
    }));
  }, []);

  const stop = useCallback(() => {
    if (lock.status === 'running' && remainingSec > 60) {
      const confirmed = window.confirm('¿Seguro que quieres romper el bloqueo de enfoque?');
      if (!confirmed) return;
    }
    setLock(prev => ({
      ...prev,
      status: 'idle',
      endsAt: null,
      remainingSec: prev.durationSec,
    }));
  }, [lock.status, remainingSec]);

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border-0 bg-zinc-950 text-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-zinc-950 to-violet-950 px-4 py-3">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10">
              <Lock className="h-5 w-5 text-indigo-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold">Bloqueo de enfoque</h2>
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white/70">
                  {active ? (paused ? 'En pausa' : 'Activo') : 'Sistema'}
                </span>
              </div>
              <p className="truncate text-[10px] text-white/60">
                {active
                  ? `${system?.name ?? 'Enfoque profundo'} · ${formatCountdown(remainingSec)} restantes`
                  : 'Bloquea la app y trabaja solo en una cosa hasta que suene el temporizador.'}
              </p>
            </div>
            {active && (
              <span className="shrink-0 text-2xl font-extrabold tabular-nums tracking-tight">
                {formatCountdown(remainingSec)}
              </span>
            )}
          </div>
        </div>

        <CardContent className="space-y-3 bg-white/80 p-3 text-foreground dark:bg-zinc-950/80">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Sistema objetivo</p>
              <Select
                value={lock.systemId ?? 'none'}
                onValueChange={value =>
                  setLock(prev => ({ ...prev, systemId: value === 'none' ? null : value }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Enfoque libre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">Enfoque libre</SelectItem>
                  {SPEED_PLAN_SYSTEMS.map(candidate => (
                    <SelectItem key={candidate.id} value={candidate.id} className="text-xs">
                      {planSystemEmoji(candidate.id)} {candidate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Duración</p>
              <div className="flex gap-1">
                {DURATIONS.map(minutes => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setDurationMinutes(minutes)}
                    disabled={active}
                    className={cn(
                      'rounded-lg border px-2 py-1.5 text-[10px] font-bold tabular-nums transition-colors',
                      durationMinutes === minutes
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-border/60 bg-foreground/5 text-muted-foreground hover:bg-foreground/10',
                      active && 'opacity-50',
                    )}
                  >
                    {minutes}′
                  </button>
                ))}
              </div>
            </div>
          </div>

          {active ? (
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 rounded-full gap-1 text-xs"
                  onClick={paused ? resume : pause}
                >
                  {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  {paused ? 'Reanudar' : 'Pausar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 rounded-full gap-1 text-xs text-red-600 hover:bg-red-500/10 dark:text-red-400"
                  onClick={stop}
                >
                  <Square className="h-3.5 w-3.5" /> Detener
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="h-9 w-full rounded-full gap-1.5 bg-indigo-600 text-xs font-semibold hover:bg-indigo-500"
              onClick={start}
            >
              <ShieldCheck className="h-4 w-4" /> Bloquear enfoque {durationMinutes} min
            </Button>
          )}
          <p className="text-center text-[8px] text-muted-foreground">
            La capa de bloqueo cubre toda la app. Puedes pausar o detener desde aquí.
          </p>
        </CardContent>
      </Card>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bloqueo de enfoque activo"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950 px-6 text-white"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.25),transparent_62%)]" />
          <div className="relative flex flex-col items-center gap-5 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full border border-white/15 bg-white/5 shadow-[0_0_60px_rgba(99,102,241,0.35)]">
              <Lock className="h-9 w-9 text-indigo-300" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">
                Bloqueo de enfoque
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {system ? `${planSystemEmoji(system.id)} ${system.name}` : 'Enfoque profundo'}
              </h2>
            </div>
            <div className="text-7xl font-extrabold tabular-nums tracking-tight sm:text-8xl">
              {formatCountdown(remainingSec)}
            </div>
            <div className="h-2 w-64 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-white/50">
              La app está bloqueada. Termina el bloque o detén el bloqueo desde aquí.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-9 rounded-full gap-1.5 px-4 text-xs"
                onClick={paused ? resume : pause}
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {paused ? 'Reanudar' : 'Pausar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full gap-1.5 border-white/20 bg-transparent px-4 text-xs text-white hover:bg-white/10 hover:text-white"
                onClick={stop}
              >
                <Square className="h-4 w-4" /> Detener
              </Button>
            </div>
            {paused && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                En pausa · el tiempo no corre
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
