import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { pushSyncKey, pullPlansIntoLocal } from '@/lib/planSync';
const defaultTrimestralData = {
    books: { goal: 0, selected: [] },
    songs: { goal: 0, selected: [] },
    projects: [],
    monthProjects: { month1: [], month2: [], month3: [] },
    monthEntrepreneurships: { month1: [], month2: [], month3: [] },
    subjects: [],
    monthSubjects: { month1: [], month2: [], month3: [] },
    events: [],
    personal_goals: [],
    completedTasks: { month1: [], month2: [], month3: [] },
    completedEvents: { month1: [], month2: [], month3: [] },
    distribution: {
        month1: { books: [], songs: [] },
        month2: { books: [], songs: [] },
        month3: { books: [], songs: [] },
    },
    notes: {},
    timeGoals: {
        month1: { lectura: 0, ajedrez: 0, game: 0, italiano: 0, ingles: 0, musica: 0, gym: 0 },
        month2: { lectura: 0, ajedrez: 0, game: 0, italiano: 0, ingles: 0, musica: 0, gym: 0 },
        month3: { lectura: 0, ajedrez: 0, game: 0, italiano: 0, ingles: 0, musica: 0, gym: 0 },
    },
    areaTimeGoals: {
        month1: { universidad: 0, proyectos: 0, emprendimiento: 0 },
        month2: { universidad: 0, proyectos: 0, emprendimiento: 0 },
        month3: { universidad: 0, proyectos: 0, emprendimiento: 0 },
    },
    chessGoals: {
        month1: { partidas: 0, minutos: 0 },
        month2: { partidas: 0, minutos: 0 },
        month3: { partidas: 0, minutos: 0 },
    },
};
const STORAGE_PREFIX = 'trimestral_plan_';
function saveToLocal(key, data) {
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    }
    catch { }
    pushSyncKey(STORAGE_PREFIX + key);
}
export function loadTrimestralPlanFromLocal(key) {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (raw) {
            const data = JSON.parse(raw);
            const migrated = migrateDistribution(data);
            if (migrated !== data)
                saveToLocal(key, migrated);
            return migrated;
        }
    }
    catch { }
    return null;
}
function migrateDistribution(data) {
    if (!data.notes)
        data.notes = {};
    if (!data.monthProjects)
        data.monthProjects = { month1: [], month2: [], month3: [] };
    if (!data.monthEntrepreneurships)
        data.monthEntrepreneurships = { month1: [], month2: [], month3: [] };
    if (!data.monthSubjects)
        data.monthSubjects = { month1: [], month2: [], month3: [] };
    if (!data.completedTasks)
        data.completedTasks = { month1: [], month2: [], month3: [] };
    if (!data.completedEvents)
        data.completedEvents = { month1: [], month2: [], month3: [] };
    if (!data.timeGoals)
        data.timeGoals = defaultTrimestralData.timeGoals;
    if (!data.areaTimeGoals)
        data.areaTimeGoals = defaultTrimestralData.areaTimeGoals;
    if (!data.chessGoals)
        data.chessGoals = defaultTrimestralData.chessGoals;
    if (!data.distribution)
        return { ...defaultTrimestralData, ...data, distribution: defaultTrimestralData.distribution };
    const m1 = data.distribution.month1;
    if (m1 && typeof m1.books === 'number') {
        const books = data.books?.selected || [];
        const songs = data.songs?.selected || [];
        const bSplit = splitEvenly(books, 3);
        const sSplit = splitEvenly(songs, 3);
        return {
            ...data,
            distribution: {
                month1: { books: bSplit[0], songs: sSplit[0] },
                month2: { books: bSplit[1], songs: sSplit[1] },
                month3: { books: bSplit[2], songs: sSplit[2] },
            },
        };
    }
    return data;
}
function splitEvenly(arr, n) {
    const result = Array.from({ length: n }, () => []);
    arr.forEach((item, i) => result[i % n].push(item));
    return result;
}
export function getQuarterFromDate(date) {
    return { quarter: Math.ceil((date.getMonth() + 1) / 3), year: date.getFullYear() };
}
const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
function getMonthName(quarter, monthIndex) {
    const realMonth = (quarter - 1) * 3 + monthIndex;
    return MONTH_NAMES[realMonth] || `Mes ${monthIndex + 1}`;
}
export function getMonthNamesForQuarter(quarter) {
    return [0, 1, 2].map(i => getMonthName(quarter, i));
}
export function useTrimestralPlan(quarter, year) {
    const storageKey = `Q${quarter}_${year}`;
    const [planData, setPlanData] = useState(defaultTrimestralData);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [books, setBooks] = useState([]);
    const [songs, setSongs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [entrepreneurships, setEntrepreneurships] = useState([]);
    const [events, setEvents] = useState([]);
    const [quarterTasks, setQuarterTasks] = useState([]);
    const [monthlyTimeData, setMonthlyTimeData] = useState({});
    const qStart = (quarter - 1) * 3;
    const getMonthRange = useCallback((monthIdx) => {
        const start = new Date(year, qStart + monthIdx, 1);
        const end = new Date(year, qStart + monthIdx + 1, 0);
        return { start, end };
    }, [year, qStart]);
    const fetchPlan = useCallback(async () => {
        setLoading(true);
        await pullPlansIntoLocal();
        const local = loadTrimestralPlanFromLocal(storageKey);
        setPlanData(local || defaultTrimestralData);
        setLoading(false);
    }, [storageKey]);
    const savePlan = useCallback(async (data) => {
        setSaving(true);
        const toSave = data || planData;
        saveToLocal(storageKey, toSave);
        await new Promise(r => setTimeout(r, 300));
        setSaving(false);
    }, [storageKey, planData]);
    const loadLocalData = useCallback(async () => {
        try {
            const qStartMonth = (quarter - 1) * 3;
            const quarterStart = new Date(year, qStartMonth, 1);
            const quarterEnd = new Date(year, qStartMonth + 3, 0);
            const [booksRes, songsRes, tasksRes, eventsRes] = await Promise.all([
                supabase.from('reading_library').select('id, title, author, cover_image_url').order('title'),
                supabase.from('music_repertoire').select('id, title, artist, instrument').order('title'),
                supabase.from('tasks').select('id, title, source, due_date, completed, priority')
                    .gte('due_date', format(quarterStart, 'yyyy-MM-dd'))
                    .lte('due_date', format(quarterEnd, 'yyyy-MM-dd')),
                supabase.from('calendar_events').select('*')
                    .gte('event_date', format(quarterStart, 'yyyy-MM-dd'))
                    .lte('event_date', format(quarterEnd, 'yyyy-MM-dd'))
                    .order('event_date'),
            ]);
            if (booksRes.data)
                setBooks(booksRes.data);
            if (songsRes.data)
                setSongs(songsRes.data);
            if (tasksRes.data)
                setQuarterTasks(tasksRes.data);
            if (eventsRes.data)
                setEvents(eventsRes.data);
            // Load time data per month from daily_systems_tracking
            const monthTimes = {};
            for (let mi = 0; mi < 3; mi++) {
                const { start, end } = getMonthRange(mi);
                const s = format(start, 'yyyy-MM-dd');
                const e = format(end, 'yyyy-MM-dd');
                const { data: timeRows } = await supabase
                    .from('daily_systems_tracking')
                    .select('tracking_date, time_data')
                    .gte('tracking_date', s)
                    .lte('tracking_date', e);
                const byArea = {};
                let total = 0;
                (timeRows || []).forEach((row) => {
                    const td = row.time_data || {};
                    Object.entries(td).forEach(([key, val]) => {
                        const v = val;
                        byArea[key] = (byArea[key] || 0) + v;
                        total += v;
                    });
                });
                monthTimes[`month${mi + 1}`] = { totalMinutes: total, byArea };
            }
            setMonthlyTimeData(monthTimes);
            // Load projects from Supabase projects table
            try {
                const { data: projRows } = await supabase
                    .from('projects')
                    .select('id, title')
                    .order('created_at', { ascending: true });
                if (projRows && projRows.length > 0) {
                    setProjects(projRows.map((p) => ({ id: p.id, name: p.title })));
                }
            }
            catch (e) {
                console.error('Error loading projects:', e);
            }
            // Load subjects from university_subjects table
            try {
                const { data: subjRows } = await supabase
                    .from('university_subjects')
                    .select('id, name')
                    .order('name');
                if (subjRows && subjRows.length > 0) {
                    setSubjects(subjRows.map((s) => ({ id: s.id, name: s.name })));
                }
            }
            catch (e) {
                console.error('Error loading subjects:', e);
            }
            // Load entrepreneurships from entrepreneurships table
            try {
                const { data: entrepRows } = await supabase
                    .from('entrepreneurships')
                    .select('id, name')
                    .order('created_at', { ascending: true });
                if (entrepRows && entrepRows.length > 0) {
                    setEntrepreneurships(entrepRows.map((e) => ({ id: e.id, name: e.name })));
                }
            }
            catch (e) {
                console.error('Error loading entrepreneurships:', e);
            }
        }
        catch (e) {
            console.error('Error loading trimestral data:', e);
        }
    }, [quarter, year, getMonthRange]);
    useEffect(() => {
        fetchPlan();
        loadLocalData();
    }, [storageKey]);
    const updatePlanData = useCallback((updater) => {
        setPlanData(prev => updater(prev));
    }, []);
    const autoDistribute = useCallback(() => {
        let result = null;
        updatePlanData(prev => {
            const bookIds = prev.books.selected || [];
            const songIds = prev.songs.selected || [];
            const bSplit = splitEvenly(bookIds, 3);
            const sSplit = splitEvenly(songIds, 3);
            result = {
                ...prev,
                distribution: {
                    month1: { books: bSplit[0], songs: sSplit[0] },
                    month2: { books: bSplit[1], songs: sSplit[1] },
                    month3: { books: bSplit[2], songs: sSplit[2] },
                },
            };
            return result;
        });
        return result;
    }, []);
    const toggleTaskCompletion = useCallback((monthKey, taskId) => {
        setPlanData(prev => {
            const list = prev.completedTasks[monthKey] || [];
            const updated = list.includes(taskId) ? list.filter(id => id !== taskId) : [...list, taskId];
            return { ...prev, completedTasks: { ...prev.completedTasks, [monthKey]: updated } };
        });
    }, []);
    const toggleEventCompletion = useCallback((monthKey, eventId) => {
        setPlanData(prev => {
            const list = prev.completedEvents[monthKey] || [];
            const updated = list.includes(eventId) ? list.filter(id => id !== eventId) : [...list, eventId];
            return { ...prev, completedEvents: { ...prev.completedEvents, [monthKey]: updated } };
        });
    }, []);
    return {
        planData, loading, saving, storageKey, quarter, year,
        books, songs, projects, subjects, entrepreneurships, events, quarterTasks, monthlyTimeData,
        updatePlanData, savePlan, fetchPlan, autoDistribute,
        toggleTaskCompletion, toggleEventCompletion,
        getMonthRange, getMonthNamesForQuarter: () => getMonthNamesForQuarter(quarter),
    };
}
