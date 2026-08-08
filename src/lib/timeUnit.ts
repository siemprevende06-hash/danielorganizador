import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'display_time_unit';

export type TimeUnit = 'min' | 'h';

const listeners = new Set<() => void>();

function read(): TimeUnit {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'h' ? 'h' : 'min';
  } catch {
    return 'min';
  }
}

export function getTimeUnit(): TimeUnit {
  return read();
}

export function setTimeUnit(unit: TimeUnit) {
  try {
    localStorage.setItem(STORAGE_KEY, unit);
  } catch {}
  listeners.forEach(l => l());
}

export function useTimeUnit(): TimeUnit {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
    read
  );
}

export function formatTimeValue(minutes: number, unit: TimeUnit): string {
  if (unit === 'min') return String(Math.round(minutes));
  const h = Math.round((minutes / 60) * 10) / 10;
  return String(h);
}

export function formatTime(minutes: number, unit: TimeUnit): string {
  return `${formatTimeValue(minutes, unit)} ${unit === 'min' ? 'min' : 'h'}`;
}