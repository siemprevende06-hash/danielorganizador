import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useMusicRepertoire } from '@/hooks/useMusicRepertoire';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MusicAddSongDialog } from '@/components/music/MusicAddSongDialog';
import { MusicQuickStats } from '@/components/music/MusicQuickStats';
import { MusicRepertoireTab } from '@/components/music/MusicRepertoireTab';
import { MusicPracticeTab } from '@/components/music/MusicPracticeTab';
import { MusicStatsTab } from '@/components/music/MusicStatsTab';
import { MusicDailyIndicator } from '@/components/music/MusicDailyIndicator';
export default function MusicDashboard() {
    const { songs, loading, addSong, markAsMastered, deleteSong, getSongsByInstrument, getStats } = useMusicRepertoire();
    const { toast } = useToast();
    const [instrument, setInstrument] = useState('piano');
    const [activeTab, setActiveTab] = useState('repertoire');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    // Practice timer state
    const [practiceActive, setPracticeActive] = useState(false);
    const [practiceSeconds, setPracticeSeconds] = useState(0);
    const [practiceSongId, setPracticeSongId] = useState(null);
    const intervalRef = useRef(null);
    // Metronome state
    const [metronomeBpm, setMetronomeBpm] = useState(120);
    const [metronomeActive, setMetronomeActive] = useState(false);
    const metronomeRef = useRef(null);
    const audioCtxRef = useRef(null);
    // Practice sessions
    const [todayPractice, setTodayPractice] = useState(0);
    const dailyGoal = 30; // minutes
    const loadTodayPractice = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('music_practice_sessions').select('duration_minutes').eq('practice_date', today);
        if (error) {
            console.error(error);
            return;
        }
        setTodayPractice((data ?? []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0));
    }, []);
    useEffect(() => {
        loadTodayPractice();
    }, [loadTodayPractice]);
    // Practice timer
    useEffect(() => {
        if (practiceActive) {
            intervalRef.current = setInterval(() => setPracticeSeconds(s => s + 1), 1000);
        }
        else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
        };
    }, [practiceActive]);
    const startPractice = (songId) => {
        setPracticeSongId(songId || null);
        setPracticeSeconds(0);
        setPracticeActive(true);
    };
    const stopPractice = async () => {
        setPracticeActive(false);
        const minutes = Math.ceil(practiceSeconds / 60);
        if (minutes <= 0) {
            setPracticeSeconds(0);
            setPracticeSongId(null);
            return;
        }
        const { error: insertError } = await supabase.from('music_practice_sessions').insert({
            song_id: practiceSongId,
            instrument,
            duration_minutes: minutes,
        });
        if (insertError) {
            console.error(insertError);
            toast({ title: 'Error', description: 'No se pudo guardar la práctica', variant: 'destructive' });
            return;
        }
        if (practiceSongId) {
            const song = songs.find(s => s.id === practiceSongId);
            const currentPractice = song?.practice_minutes ?? 0;
            const nextPractice = currentPractice + minutes;
            await supabase
                .from('music_repertoire')
                .update({
                practice_minutes: nextPractice,
                last_practiced: new Date().toISOString().split('T')[0],
            })
                .eq('id', practiceSongId);
        }
        setTodayPractice(prev => prev + minutes);
        toast({ title: 'Práctica guardada', description: `${minutes} min registrados` });
        setPracticeSeconds(0);
        setPracticeSongId(null);
    };
    // Metronome
    const playClick = useCallback(() => {
        if (!audioCtxRef.current)
            audioCtxRef.current = new AudioContext();
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
    }, []);
    useEffect(() => {
        if (metronomeActive) {
            const ms = 60000 / metronomeBpm;
            playClick();
            metronomeRef.current = setInterval(playClick, ms);
        }
        else if (metronomeRef.current) {
            clearInterval(metronomeRef.current);
        }
        return () => {
            if (metronomeRef.current)
                clearInterval(metronomeRef.current);
        };
    }, [metronomeActive, metronomeBpm, playClick]);
    const instrumentSongs = getSongsByInstrument(instrument);
    const filteredSongs = useMemo(() => {
        return instrumentSongs.filter(song => {
            const matchesSearch = !searchQuery ||
                song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
            const matchesStatus = filterStatus === 'all' || song.status === filterStatus;
            const matchesDiff = filterDifficulty === 'all' || song.difficulty === filterDifficulty;
            return matchesSearch && matchesStatus && matchesDiff;
        });
    }, [instrumentSongs, searchQuery, filterStatus, filterDifficulty]);
    const totalStats = getStats();
    const pieData = useMemo(() => [
        { name: 'Dominadas', value: totalStats.mastered, color: 'hsl(var(--success))' },
        { name: 'Aprendiendo', value: totalStats.learning, color: 'hsl(var(--warning))' },
    ].filter(d => d.value > 0), [totalStats.mastered, totalStats.learning]);
    const difficultyData = useMemo(() => [
        { name: 'Principiante', piano: getStats('piano').byDifficulty.beginner, guitar: getStats('guitar').byDifficulty.beginner },
        { name: 'Intermedio', piano: getStats('piano').byDifficulty.intermediate, guitar: getStats('guitar').byDifficulty.intermediate },
        { name: 'Avanzado', piano: getStats('piano').byDifficulty.advanced, guitar: getStats('guitar').byDifficulty.advanced },
    ], [getStats]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-background p-4 pt-20 pb-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-4", children: [_jsx(Skeleton, { className: "h-8 w-1/3" }), _jsx(Skeleton, { className: "h-64 w-full" })] }) }));
    }
    const practicePercent = Math.min((todayPractice / dailyGoal) * 100, 100);
    return (_jsx("div", { className: "min-h-screen bg-background p-4 pt-20 pb-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("header", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-bold", children: "\uD83C\uDFB5 Mi M\u00FAsica" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Repertorio, pr\u00E1ctica y progreso" })] }), _jsx(MusicAddSongDialog, { open: dialogOpen, onOpenChange: setDialogOpen, instrument: instrument, onInstrumentChange: setInstrument, onAdd: async (song) => {
                                await addSong({
                                    instrument,
                                    title: song.title,
                                    artist: song.artist,
                                    difficulty: song.difficulty,
                                    youtube_url: song.youtube_url,
                                    notes: song.notes,
                                    status: 'learning',
                                });
                            } })] }), _jsx(MusicDailyIndicator, { dailyMinutesGoal: dailyGoal }), _jsx(MusicQuickStats, { todayPractice: todayPractice, dailyGoal: dailyGoal, totalSongs: totalStats.total, mastered: totalStats.mastered, learning: totalStats.learning }), _jsxs(Tabs, { value: activeTab, onValueChange: (v) => setActiveTab(v), children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "repertoire", className: "text-xs sm:text-sm", children: "\uD83C\uDFBC Repertorio" }), _jsx(TabsTrigger, { value: "practice", className: "text-xs sm:text-sm", children: "\u23F1\uFE0F Pr\u00E1ctica" }), _jsx(TabsTrigger, { value: "stats", className: "text-xs sm:text-sm", children: "\uD83D\uDCCA Stats" })] }), _jsx(TabsContent, { value: "repertoire", className: "space-y-4", children: _jsx(MusicRepertoireTab, { instrument: instrument, onInstrumentChange: setInstrument, searchQuery: searchQuery, onSearchChange: setSearchQuery, filterStatus: filterStatus, onFilterStatusChange: setFilterStatus, filterDifficulty: filterDifficulty, onFilterDifficultyChange: setFilterDifficulty, songsCountByInstrument: (inst) => getSongsByInstrument(inst).length, songs: filteredSongs, onStartPractice: (songId) => {
                                    setActiveTab('practice');
                                    startPractice(songId);
                                }, onMarkMastered: markAsMastered, onDelete: deleteSong }) }), _jsx(TabsContent, { value: "practice", className: "space-y-4", children: _jsx(MusicPracticeTab, { songs: songs, practiceActive: practiceActive, practiceSeconds: practiceSeconds, practiceSongId: practiceSongId, onStartPractice: startPractice, onStopPractice: stopPractice, todayPractice: todayPractice, dailyGoal: dailyGoal, practicePercent: practicePercent, metronomeBpm: metronomeBpm, onBpmDown: () => setMetronomeBpm(b => Math.max(40, b - 5)), onBpmUp: () => setMetronomeBpm(b => Math.min(240, b + 5)), metronomeActive: metronomeActive, onToggleMetronome: () => setMetronomeActive(v => !v), onPresetBpm: (bpm) => setMetronomeBpm(bpm), onQuickPractice: (songId) => {
                                    setActiveTab('practice');
                                    startPractice(songId);
                                } }) }), _jsx(TabsContent, { value: "stats", className: "space-y-4", children: _jsx(MusicStatsTab, { pieData: pieData, difficultyData: difficultyData, getStats: getStats }) })] }), practiceActive && (_jsx(Card, { className: "border-warning/30 bg-warning/5", children: _jsxs(CardContent, { className: "p-3 text-center text-sm", children: ["Pr\u00E1ctica en curso \u2014 vuelve a la pesta\u00F1a ", _jsx("strong", { children: "Pr\u00E1ctica" }), " para guardar."] }) }))] }) }));
}
