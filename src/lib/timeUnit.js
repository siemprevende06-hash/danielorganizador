import { useSyncExternalStore } from 'react';
const STORAGE_KEY = 'display_time_unit';
const listeners = new Set();
function read() {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'h' ? 'h' : 'min';
    }
    catch {
        return 'min';
    }
}
export function getTimeUnit() {
    return read();
}
export function setTimeUnit(unit) {
    try {
        localStorage.setItem(STORAGE_KEY, unit);
    }
    catch { }
    listeners.forEach(l => l());
}
export function useTimeUnit() {
    return useSyncExternalStore(cb => {
        listeners.add(cb);
        return () => { listeners.delete(cb); };
    }, read);
}
export function formatTimeValue(minutes, unit) {
    if (unit === 'min')
        return String(Math.round(minutes));
    const h = Math.round((minutes / 60) * 10) / 10;
    return String(h);
}
export function formatTime(minutes, unit) {
    return `${formatTimeValue(minutes, unit)} ${unit === 'min' ? 'min' : 'h'}`;
}
