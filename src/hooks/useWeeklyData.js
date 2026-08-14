import { useState, useCallback } from 'react';
import { format, endOfMonth, eachWeekOfInterval } from 'date-fns';
const STORAGE_KEY = 'weeklyData';
function loadAll() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw)
            return JSON.parse(raw);
    }
    catch { }
    return {};
}
function saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
export function getWeekKey(date) {
    return format(date, "yyyy-'W'ww");
}
export function getWeeksInRange(start, end) {
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    return weeks.map(w => getWeekKey(w));
}
export function getDaysInPeriod(periodType, periodStart) {
    if (periodType === 'week')
        return 7;
    const end = periodType === 'month'
        ? endOfMonth(periodStart)
        : new Date(periodStart.getFullYear(), periodStart.getMonth() + 3, 0);
    return Math.round((end.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}
export function useWeeklyData() {
    const [store, setStore] = useState(loadAll);
    const getWeek = useCallback((weekKey) => {
        const all = loadAll();
        return all[weekKey] || {};
    }, []);
    const setEffortMinutes = useCallback((weekKey, areaId, minutes) => {
        const all = loadAll();
        if (!all[weekKey])
            all[weekKey] = {};
        if (!all[weekKey][areaId])
            all[weekKey][areaId] = { effortMinutes: 0, metrics: {} };
        all[weekKey][areaId].effortMinutes = minutes;
        saveAll(all);
        setStore(all);
    }, []);
    const setMetricValue = useCallback((weekKey, areaId, metricId, value) => {
        const all = loadAll();
        if (!all[weekKey])
            all[weekKey] = {};
        if (!all[weekKey][areaId])
            all[weekKey][areaId] = { effortMinutes: 0, metrics: {} };
        all[weekKey][areaId].metrics[metricId] = value;
        saveAll(all);
        setStore(all);
    }, []);
    const getEffortMinutes = useCallback((weekKey, areaId) => {
        const all = loadAll();
        return all[weekKey]?.[areaId]?.effortMinutes ?? 0;
    }, []);
    const getMetricValue = useCallback((weekKey, areaId, metricId) => {
        const all = loadAll();
        return all[weekKey]?.[areaId]?.metrics?.[metricId] ?? 0;
    }, []);
    const sumEffortForWeeks = useCallback((weekKeys, areaId) => {
        const all = loadAll();
        return weekKeys.reduce((sum, wk) => sum + (all[wk]?.[areaId]?.effortMinutes ?? 0), 0);
    }, []);
    const sumMetricForWeeks = useCallback((weekKeys, areaId, metricId) => {
        const all = loadAll();
        return weekKeys.reduce((sum, wk) => sum + (all[wk]?.[areaId]?.metrics?.[metricId] ?? 0), 0);
    }, []);
    return {
        store, getWeek, setEffortMinutes, setMetricValue,
        getEffortMinutes, getMetricValue, sumEffortForWeeks, sumMetricForWeeks,
    };
}
