export type PomodoroPhase = 'focus' | 'break';

export interface ActivePomodoro {
  startTime: number;
  totalSeconds: number;
  remainingSeconds?: number;
  phase: PomodoroPhase;
  running: boolean;
  title: string;
}

const KEY = 'activePomodoro_v1';

export function setActivePomodoro(pomodoro: ActivePomodoro | null): void {
  try {
    if (pomodoro === null) {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, JSON.stringify(pomodoro));
    }
  } catch {}
}

export function getActivePomodoro(): ActivePomodoro | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActivePomodoro;
    if (!parsed || typeof parsed.startTime !== 'number' || typeof parsed.totalSeconds !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearActivePomodoro(): void {
  setActivePomodoro(null);
}

export function getRemainingSeconds(pomodoro: ActivePomodoro, now = Date.now()): number {
  if (!pomodoro.running) return Math.max(0, pomodoro.remainingSeconds ?? pomodoro.totalSeconds);
  const elapsed = Math.floor((now - pomodoro.startTime) / 1000);
  return Math.max(0, pomodoro.totalSeconds - elapsed);
}