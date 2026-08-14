import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, getISOWeek } from 'date-fns';
import { pushSyncKey, pullPlansIntoLocal } from '@/lib/planSync';
const makeDefault = (weekNumber) => ({
    objectives: [],
    focus_areas: [],
    books: { goal: 0, selected: [] },
    songs: { goal: 0, selected: [] },
    personal_goals: [],
    actions: [],
    weekNumber,
});
const STORAGE_PREFIX = 'weekly_plan_';
function loadFromLocal(key) {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (raw)
            return JSON.parse(raw);
    }
    catch { }
    return null;
}
function saveToLocal(key, data) {
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    }
    catch { }
    pushSyncKey(STORAGE_PREFIX + key);
}
export function getWeekId(date) {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    return format(weekStart, 'yyyy-ww');
}
function genId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
export function useWeeklyPlan(weekStart) {
    const weekId = getWeekId(weekStart);
    const weekNumber = getISOWeek(weekStart);
    const [planData, setPlanData] = useState(makeDefault(weekNumber));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [books, setBooks] = useState([]);
    const [songs, setSongs] = useState([]);
    const fetchPlan = useCallback(async () => {
        setLoading(true);
        await pullPlansIntoLocal();
        const local = loadFromLocal(weekId);
        const base = makeDefault(weekNumber);
        setPlanData(local ? { ...base, ...local, actions: local.actions ?? [], weekNumber } : base);
        setLoading(false);
    }, [weekId, weekNumber]);
    const savePlan = useCallback(async () => {
        setSaving(true);
        saveToLocal(weekId, planData);
        await new Promise(r => setTimeout(r, 300));
        setSaving(false);
    }, [weekId, planData]);
    const loadLocalData = useCallback(() => {
        try {
            const storedBooks = localStorage.getItem('reading_library');
            if (storedBooks)
                setBooks(JSON.parse(storedBooks));
            const storedSongs = localStorage.getItem('music_repertoire');
            if (storedSongs)
                setSongs(JSON.parse(storedSongs));
        }
        catch { }
    }, []);
    useEffect(() => {
        fetchPlan();
        loadLocalData();
    }, [weekId]);
    const updatePlanData = useCallback((updater) => {
        setPlanData(prev => updater(prev));
    }, []);
    const addAction = useCallback((action) => {
        setPlanData(prev => ({ ...prev, actions: [...(prev.actions ?? []), { ...action, id: genId() }] }));
    }, []);
    const toggleAction = useCallback((id) => {
        setPlanData(prev => ({
            ...prev,
            actions: (prev.actions ?? []).map(a => a.id === id ? { ...a, completed: !a.completed } : a),
        }));
    }, []);
    const removeAction = useCallback((id) => {
        setPlanData(prev => ({ ...prev, actions: (prev.actions ?? []).filter(a => a.id !== id) }));
    }, []);
    return {
        planData, loading, saving, weekId,
        books, songs,
        updatePlanData, savePlan, fetchPlan,
        addAction, toggleAction, removeAction,
    };
}
