import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRoutineBlocksDB, parseTime } from '@/hooks/useRoutineBlocksDB';
const STORAGE_KEY = 'routineConfig';
const MUSIC_KEY = 'musicInstrument';
function loadConfig() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored)
            return JSON.parse(stored);
    }
    catch { }
    return { wakeTime: '05:00', focusBlock: true, sleepTime: '22:30', lateWake: null };
}
function loadMusicInstrument() {
    try {
        const stored = localStorage.getItem(MUSIC_KEY);
        if (stored === 'piano' || stored === 'guitar')
            return stored;
    }
    catch { }
    return 'piano';
}
function buildBlockMatcher(baseBlocks) {
    const counter = new Map();
    return function matchBlock(title, startTime, endTime) {
        const words = title.toLowerCase().split(' ').filter(w => w.length > 2);
        if (words.length === 0)
            return undefined;
        const s1 = parseTime(startTime), e1 = parseTime(endTime);
        const candidates = baseBlocks
            .map(b => {
            const t = b.title.toLowerCase();
            const wordScore = words.filter(w => t.includes(w)).length;
            const s2 = parseTime(b.startTime), e2 = parseTime(b.endTime);
            const overlap = Math.max(0, Math.min(e1, e2) - Math.max(s1, s2));
            return { block: b, wordScore, overlap };
        })
            .filter(c => c.wordScore > 0 || c.overlap > 0);
        if (candidates.length === 0)
            return undefined;
        candidates.sort((a, b) => {
            if (b.wordScore !== a.wordScore)
                return b.wordScore - a.wordScore;
            return b.overlap - a.overlap;
        });
        const bestScore = candidates[0].wordScore;
        const bestOverlap = candidates[0].overlap;
        const bestCandidates = candidates.filter(c => c.wordScore === bestScore && c.overlap === bestOverlap);
        if (bestCandidates.length === 1)
            return bestCandidates[0].block;
        const key = words.sort().join('::');
        const idx = counter.get(key) ?? 0;
        counter.set(key, idx + 1);
        return bestCandidates[idx % bestCandidates.length].block;
    };
}
function buildSchedule(wakeTime, focusBlock, sleepTime) {
    const s = [];
    if (wakeTime === '05:00') {
        s.push({ title: 'Rutina de Activación', start: '05:00', end: '05:30', type: 'fijo' });
        if (focusBlock) {
            s.push({ title: 'Bloque Focus', start: '05:30', end: '07:00', type: 'deep' });
        }
        s.push({ title: 'Gym', start: '07:00', end: '08:00', type: 'fijo' });
        s.push({ title: 'Alistamiento y Desayuno', start: '08:00', end: '08:30', type: 'fijo' });
        s.push({ title: 'Lectura o Podcast', start: '08:30', end: '09:00', type: 'fijo' });
    }
    else {
        s.push({ title: 'Rutina de Activación', start: '06:30', end: '07:00', type: 'fijo' });
        s.push({ title: 'Gym', start: '07:00', end: '08:00', type: 'fijo' });
        s.push({ title: 'Alistamiento y Desayuno', start: '08:00', end: '08:30', type: 'fijo' });
        s.push({ title: 'Lectura o Podcast', start: '08:30', end: '09:00', type: 'fijo' });
    }
    s.push({ title: 'Deep Work 1', start: '09:00', end: '10:30', type: 'deep' });
    s.push({ title: 'Deep Work 2', start: '10:30', end: '12:00', type: 'deep' });
    s.push({ title: 'Deep Work 3', start: '12:00', end: '13:20', type: 'deep' });
    s.push({ title: 'Almuerzo + Ajedrez + Gaming', start: '13:20', end: '14:00', type: 'fijo' });
    s.push({ title: 'Deep Work 4', start: '14:00', end: '15:30', type: 'deep' });
    s.push({ title: 'Deep Work 5', start: '15:30', end: '16:50', type: 'deep' });
    s.push({ title: 'Rutina de Llegada', start: '16:50', end: '17:00', type: 'fijo' });
    s.push({ title: 'Bloque', start: '17:00', end: '18:30', type: 'deep' });
    if (sleepTime === '21:00') {
        s.push({ title: 'Ocio', start: '18:30', end: '20:00', type: 'ocio' });
        s.push({ title: 'Música', start: '20:00', end: '20:30', type: 'musica' });
        s.push({ title: 'Rutina de Desactivación', start: '20:30', end: '21:00', type: 'fijo' });
    }
    else {
        s.push({ title: 'Bloque', start: '18:30', end: '20:00', type: 'deep' });
        s.push({ title: 'Ocio', start: '20:00', end: '21:30', type: 'ocio' });
        s.push({ title: 'Música', start: '21:30', end: '22:00', type: 'musica' });
        s.push({ title: 'Rutina de Desactivación', start: '22:00', end: '22:30', type: 'fijo' });
    }
    return s;
}
function applyLateWake(schedule, lateWake) {
    const [lateH, lateM] = lateWake.split(':').map(Number);
    const lateMin = lateH * 60 + lateM;
    const protectedTitles = ['Rutina de Activación', 'Gym', 'Alistamiento y Desayuno', 'Lectura o Podcast'];
    const result = [];
    let cursor = lateMin;
    for (const block of schedule) {
        const isProtected = protectedTitles.includes(block.title);
        const isMorningDeep = block.type === 'deep' && parseTime(block.start) < parseTime('14:00');
        if (isProtected) {
            const dur = parseTime(block.end) - parseTime(block.start);
            const f = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
            result.push({ ...block, start: f(cursor), end: f(cursor + dur) });
            cursor += dur;
        }
        else if (isMorningDeep) {
            const blockStart = parseTime(block.start);
            if (blockStart < cursor)
                continue;
            result.push(block);
        }
        else {
            result.push(block);
        }
    }
    return result;
}
function toRoutineBlock(entry, i, matchBlock) {
    const match = matchBlock(entry.title, entry.start, entry.end);
    return {
        id: match?.id || `gen-${i}`,
        title: entry.title,
        startTime: entry.start,
        endTime: entry.end,
        tasks: match?.tasks || [],
        isFocusBlock: entry.type === 'deep',
        order: i,
        blockType: (entry.type === 'deep' ? 'configurable' : 'fijo'),
        defaultFocus: (match?.defaultFocus || 'none'),
        currentFocus: match?.currentFocus,
        canSubdivide: entry.type === 'deep',
        emergencyOnly: false,
        subBlocks: match?.subBlocks || [],
        notes: match?.notes || undefined,
    };
}
export function useRoutineConfig() {
    const { blocks: baseBlocks, isLoaded } = useRoutineBlocksDB();
    const [config, setConfig] = useState(loadConfig);
    const [musicInstrument, setMusicInstrumentState] = useState(loadMusicInstrument);
    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); }, [config]);
    useEffect(() => { localStorage.setItem(MUSIC_KEY, musicInstrument); }, [musicInstrument]);
    useEffect(() => {
        if (!config.lateWake)
            return;
        const now = new Date();
        const ms = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
        const t = setTimeout(() => setConfig(prev => ({ ...prev, lateWake: null })), ms);
        return () => clearTimeout(t);
    }, [config.lateWake]);
    const { wakeTime, focusBlock, sleepTime, lateWake } = config;
    const setWakeTime = useCallback((w) => setConfig(p => ({ ...p, wakeTime: w })), []);
    const setFocusBlock = useCallback((f) => setConfig(p => ({ ...p, focusBlock: f })), []);
    const setSleepTime = useCallback((s) => setConfig(p => ({ ...p, sleepTime: s })), []);
    const setLateWake = useCallback((t) => setConfig(p => ({ ...p, lateWake: t })), []);
    const setMusicInstrument = useCallback((i) => setMusicInstrumentState(i), []);
    const adjustedBlocks = useMemo(() => {
        let schedule = buildSchedule(wakeTime, focusBlock, sleepTime);
        if (lateWake)
            schedule = applyLateWake(schedule, lateWake);
        const matcher = buildBlockMatcher(baseBlocks);
        return schedule.map((entry, i) => toRoutineBlock(entry, i, matcher));
    }, [baseBlocks, isLoaded, wakeTime, focusBlock, sleepTime, lateWake]);
    const presetName = useMemo(() => {
        const parts = [];
        parts.push(wakeTime === '05:00' ? '5AM' : '6:30AM');
        if (wakeTime === '05:00')
            parts.push(focusBlock ? '+Focus' : 'sin Focus');
        parts.push(sleepTime === '21:00' ? 'Acuesto 9PM' : 'Acuesto 10:30PM');
        if (lateWake)
            parts.push('(despert\u00E9 ' + lateWake + ')');
        return parts.join(' \u00B7 ');
    }, [wakeTime, focusBlock, sleepTime, lateWake]);
    return {
        adjustedBlocks,
        wakeTime, setWakeTime,
        focusBlock, setFocusBlock,
        sleepTime, setSleepTime,
        lateWake, setLateWake,
        musicInstrument, setMusicInstrument,
        presetName,
        isLoaded,
    };
}
