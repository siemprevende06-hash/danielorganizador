import type { RoutineBlock } from '@/hooks/useRoutineBlocks';
import {
  blockEffectiveEnd,
  parseTimeToMinutes,
  type SpeedPlan,
} from '@/lib/speedPlan';

export const MINUTES_PER_DAY = 24 * 60;

export type RoutineBlockStatus = 'active' | 'future' | 'past';

export interface RoutineBlockWindow {
  start: number;
  end: number;
  duration: number;
  crossesMidnight: boolean;
}

export interface RoutineBlockStateInfo {
  status: RoutineBlockStatus;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  untilStartMinutes: number;
  progress: number;
  crossesMidnight: boolean;
}

export function parseClock(time: string): number {
  return parseTimeToMinutes(time || '0:00');
}

/** Hora en formato 12h, por ejemplo `5:00 AM`. */
export function formatClockTime(time: string): string {
  const total = parseClock(time);
  const normalized = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/** Hora en formato 24h, por ejemplo `17:30`. */
export function formatClockTime24(time: string): string {
  const total = parseClock(time);
  const normalized = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours > 0) return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
  return `${rest} min`;
}

export function routineBlockWindow(
  block: Pick<RoutineBlock, 'startTime' | 'endTime'>,
): RoutineBlockWindow {
  const start = parseClock(block.startTime);
  let end = parseClock(block.endTime);
  const crossesMidnight = end <= start;
  if (crossesMidnight) end += MINUTES_PER_DAY;
  return {
    start,
    end,
    duration: Math.max(end - start, 1),
    crossesMidnight,
  };
}

export function effectiveBlockEndTime(
  block: RoutineBlock,
  speedPlan?: SpeedPlan | null,
  nextBlock?: RoutineBlock,
): string {
  return blockEffectiveEnd(block, speedPlan?.blocks?.[block.id], nextBlock);
}

export function routineBlockStaticState(
  block: RoutineBlock,
  completed: boolean,
): RoutineBlockStateInfo {
  const window = routineBlockWindow(block);
  return {
    status: 'future',
    startMinutes: window.start,
    endMinutes: window.end,
    durationMinutes: window.duration,
    elapsedMinutes: completed ? window.duration : 0,
    remainingMinutes: 0,
    untilStartMinutes: 0,
    progress: completed ? 100 : 0,
    crossesMidnight: window.crossesMidnight,
  };
}

export function routineBlockStateAt(
  block: RoutineBlock,
  now: Date,
  effectiveEndTime?: string,
): RoutineBlockStateInfo {
  const window = routineBlockWindow(block);
  let end = effectiveEndTime ? parseClock(effectiveEndTime) : window.end;
  if (end <= window.start) end += MINUTES_PER_DAY;

  const nowMinutes =
    now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  let current = nowMinutes;
  if (end > MINUTES_PER_DAY && current < end - MINUTES_PER_DAY) {
    current += MINUTES_PER_DAY;
  }

  const active = current >= window.start && current < end;
  const past = current >= end;
  const duration = Math.max(end - window.start, 1);
  const elapsed = active ? current - window.start : past ? duration : 0;
  const progress = active
    ? Math.min(100, Math.max(0, (elapsed / duration) * 100))
    : past
      ? 100
      : 0;

  return {
    status: active ? 'active' : past ? 'past' : 'future',
    startMinutes: window.start,
    endMinutes: end,
    durationMinutes: duration,
    elapsedMinutes: elapsed,
    remainingMinutes: active ? Math.max(0, end - current) : 0,
    untilStartMinutes: current < window.start ? window.start - current : 0,
    progress,
    crossesMidnight: window.crossesMidnight,
  };
}

/**
 * Misma lista que usa la vista de tarjetas: ordenada por hora y sin bloques
 * anteriores a las 5:00 (los residuos de madrugada).
 */
export function sortRoutineBlocks(
  blocks: RoutineBlock[] | null | undefined,
): RoutineBlock[] {
  return (Array.isArray(blocks) ? blocks : [])
    .filter(block => {
      try {
        return parseClock(block.startTime || '0:00') >= 300;
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        return parseClock(a.startTime) - parseClock(b.startTime);
      } catch {
        return 0;
      }
    });
}

export function findCurrentBlockIndex(
  blocks: RoutineBlock[],
  now: Date,
): number {
  return blocks.findIndex(
    block => routineBlockStateAt(block, now).status === 'active',
  );
}

export function findNextBlockIndex(
  blocks: RoutineBlock[],
  now: Date,
): number {
  if (blocks.length === 0) return -1;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let bestIndex = -1;
  let bestDelta = Number.POSITIVE_INFINITY;

  blocks.forEach((block, index) => {
    const { start } = routineBlockWindow(block);
    let delta = start - nowMinutes;
    if (delta <= 0) delta += MINUTES_PER_DAY;
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = index;
    }
  });

  return bestIndex;
}
