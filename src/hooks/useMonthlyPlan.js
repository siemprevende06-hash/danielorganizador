import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { pushSyncKey, pullPlansIntoLocal } from '@/lib/planSync';
const defaultPlanData = {
    books: { goal: 0, selected: [] },
    songs: { goal: 0, selected: [] },
    projects: [],
    subjects: [],
    events: [],
    personal_goals: [],
};
const STORAGE_PREFIX = 'monthly_plan_';
function loadFromLocal(monthStr) {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + monthStr);
        if (raw)
            return JSON.parse(raw);
    }
    catch { }
    return null;
}
function saveToLocal(monthStr, data) {
    try {
        localStorage.setItem(STORAGE_PREFIX + monthStr, JSON.stringify(data));
    }
    catch { }
    pushSyncKey(STORAGE_PREFIX + monthStr);
}
function getTrimestralData(month) {
    const q = Math.ceil((month.getMonth() + 1) / 3);
    const y = month.getFullYear();
    const monthIndex = month.getMonth() - (q - 1) * 3;
    const quarterLabel = `Q${q} ${y}`;
    try {
        const raw = localStorage.getItem(`trimestral_plan_Q${q}_${y}`);
        if (raw) {
            const tData = JSON.parse(raw);
            return {
                books: { goal: tData.books?.goal || 0, selected: tData.books?.selected?.length || 0 },
                songs: { goal: tData.songs?.goal || 0, selected: tData.songs?.selected?.length || 0 },
                projects: tData.projects?.length || 0,
                subjects: tData.subjects?.length || 0,
                personal_goals: tData.personal_goals?.length || 0,
                monthIndex,
                quarterLabel,
            };
        }
    }
    catch { }
    return null;
}
export function useMonthlyPlan(month) {
    const monthStr = format(startOfMonth(month), 'yyyy-MM-dd');
    const [planData, setPlanData] = useState(defaultPlanData);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [books, setBooks] = useState([]);
    const [songs, setSongs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [topics, setTopics] = useState([]);
    const [events, setEvents] = useState([]);
    const [trimestralData, setTrimestralData] = useState(null);
    const fetchPlan = useCallback(async () => {
        setLoading(true);
        await pullPlansIntoLocal();
        const local = loadFromLocal(monthStr);
        setPlanData(local || defaultPlanData);
        setLoading(false);
    }, [monthStr]);
    const savePlan = useCallback(async () => {
        setSaving(true);
        saveToLocal(monthStr, planData);
        await new Promise(r => setTimeout(r, 300));
        setSaving(false);
    }, [monthStr, planData]);
    const loadLocalData = useCallback(async () => {
        try {
            const storedBooks = localStorage.getItem('reading_library');
            if (storedBooks)
                setBooks(JSON.parse(storedBooks));
            const storedSongs = localStorage.getItem('music_repertoire');
            if (storedSongs)
                setSongs(JSON.parse(storedSongs));
            try {
                const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'user_projects').maybeSingle();
                if (data?.setting_value && Array.isArray(data.setting_value)) {
                    setProjects(data.setting_value);
                }
                else {
                    const stored = localStorage.getItem('userProjects');
                    if (stored)
                        setProjects(JSON.parse(stored));
                }
            }
            catch {
                const stored = localStorage.getItem('userProjects');
                if (stored)
                    setProjects(JSON.parse(stored));
            }
            const storedSubjects = localStorage.getItem('university_subjects');
            if (storedSubjects)
                setSubjects(JSON.parse(storedSubjects));
            const storedTopics = localStorage.getItem('subject_topics');
            if (storedTopics)
                setTopics(JSON.parse(storedTopics));
            const storedEvents = localStorage.getItem('calendar_events');
            if (storedEvents)
                setEvents(JSON.parse(storedEvents));
        }
        catch { }
    }, []);
    useEffect(() => {
        fetchPlan();
        loadLocalData();
        setTrimestralData(getTrimestralData(month));
    }, [monthStr]);
    const updatePlanData = useCallback((updater) => {
        setPlanData(prev => updater(prev));
    }, []);
    return {
        planData, loading, saving, monthStr,
        books, songs, projects, subjects, topics, events,
        trimestralData,
        updatePlanData, savePlan, fetchPlan,
    };
}
