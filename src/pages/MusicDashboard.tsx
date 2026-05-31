import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useMusicRepertoire, type Song } from '@/hooks/useMusicRepertoire';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MusicAddSongDialog } from '@/components/music/MusicAddSongDialog';
import { MusicQuickStats } from '@/components/music/MusicQuickStats';
import { MusicRepertoireTab } from '@/components/music/MusicRepertoireTab';
import { MusicPracticeTab } from '@/components/music/MusicPracticeTab';
import { MusicStatsTab } from '@/components/music/MusicStatsTab';

export default function MusicDashboard() {
  const { songs, loading, addSong, markAsMastered, deleteSong, getSongsByInstrument, getStats } = useMusicRepertoire();
  const { toast } = useToast();

  const [instrument, setInstrument] = useState<'piano' | 'guitar'>('piano');
  const [activeTab, setActiveTab] = useState<'repertoire' | 'practice' | 'stats'>('repertoire');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'learning' | 'mastered'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  // Practice timer state
  const [practiceActive, setPracticeActive] = useState(false);
  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [practiceSongId, setPracticeSongId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Metronome state
  const [metronomeBpm, setMetronomeBpm] = useState(120);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const metronomeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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
    setTodayPractice((data ?? []).reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0));
  }, []);

  useEffect(() => {
    loadTodayPractice();
  }, [loadTodayPractice]);

  // Practice timer
  useEffect(() => {
    if (practiceActive) {
      intervalRef.current = setInterval(() => setPracticeSeconds(s => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [practiceActive]);

  const startPractice = (songId?: string) => {
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
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
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
    } else if (metronomeRef.current) {
      clearInterval(metronomeRef.current);
    }

    return () => {
      if (metronomeRef.current) clearInterval(metronomeRef.current);
    };
  }, [metronomeActive, metronomeBpm, playClick]);

  const instrumentSongs = getSongsByInstrument(instrument);

  const filteredSongs = useMemo(() => {
    return instrumentSongs.filter(song => {
      const matchesSearch =
        !searchQuery ||
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesStatus = filterStatus === 'all' || song.status === filterStatus;
      const matchesDiff = filterDifficulty === 'all' || song.difficulty === filterDifficulty;
      return matchesSearch && matchesStatus && matchesDiff;
    });
  }, [instrumentSongs, searchQuery, filterStatus, filterDifficulty]);

  const totalStats = getStats();

  const pieData = useMemo(
    () =>
      [
        { name: 'Dominadas', value: totalStats.mastered, color: 'hsl(var(--success))' },
        { name: 'Aprendiendo', value: totalStats.learning, color: 'hsl(var(--warning))' },
      ].filter(d => d.value > 0),
    [totalStats.mastered, totalStats.learning]
  );

  const difficultyData = useMemo(
    () => [
      { name: 'Principiante', piano: getStats('piano').byDifficulty.beginner, guitar: getStats('guitar').byDifficulty.beginner },
      { name: 'Intermedio', piano: getStats('piano').byDifficulty.intermediate, guitar: getStats('guitar').byDifficulty.intermediate },
      { name: 'Avanzado', piano: getStats('piano').byDifficulty.advanced, guitar: getStats('guitar').byDifficulty.advanced },
    ],
    [getStats]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 pt-20 pb-24">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const practicePercent = Math.min((todayPractice / dailyGoal) * 100, 100);

  return (
    <div className="min-h-screen bg-background p-4 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">🎵 Mi Música</h1>
            <p className="text-sm text-muted-foreground">Repertorio, práctica y progreso</p>
          </div>

          <MusicAddSongDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            instrument={instrument}
            onInstrumentChange={setInstrument}
            onAdd={async (song) => {
              await addSong({
                instrument,
                title: song.title,
                artist: song.artist,
                difficulty: song.difficulty,
                youtube_url: song.youtube_url,
                notes: song.notes,
                status: 'learning',
              });
            }}
          />
        </header>

        <MusicQuickStats
          todayPractice={todayPractice}
          dailyGoal={dailyGoal}
          totalSongs={totalStats.total}
          mastered={totalStats.mastered}
          learning={totalStats.learning}
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="repertoire" className="text-xs sm:text-sm">
              🎼 Repertorio
            </TabsTrigger>
            <TabsTrigger value="practice" className="text-xs sm:text-sm">
              ⏱️ Práctica
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm">
              📊 Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="repertoire" className="space-y-4">
            <MusicRepertoireTab
              instrument={instrument}
              onInstrumentChange={setInstrument}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              filterDifficulty={filterDifficulty}
              onFilterDifficultyChange={setFilterDifficulty}
              songsCountByInstrument={(inst) => getSongsByInstrument(inst).length}
              songs={filteredSongs}
              onStartPractice={(songId) => {
                setActiveTab('practice');
                startPractice(songId);
              }}
              onMarkMastered={markAsMastered}
              onDelete={deleteSong}
            />
          </TabsContent>

          <TabsContent value="practice" className="space-y-4">
            <MusicPracticeTab
              songs={songs}
              practiceActive={practiceActive}
              practiceSeconds={practiceSeconds}
              practiceSongId={practiceSongId}
              onStartPractice={startPractice}
              onStopPractice={stopPractice}
              todayPractice={todayPractice}
              dailyGoal={dailyGoal}
              practicePercent={practicePercent}
              metronomeBpm={metronomeBpm}
              onBpmDown={() => setMetronomeBpm(b => Math.max(40, b - 5))}
              onBpmUp={() => setMetronomeBpm(b => Math.min(240, b + 5))}
              metronomeActive={metronomeActive}
              onToggleMetronome={() => setMetronomeActive(v => !v)}
              onPresetBpm={(bpm) => setMetronomeBpm(bpm)}
              onQuickPractice={(songId) => {
                setActiveTab('practice');
                startPractice(songId);
              }}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <MusicStatsTab pieData={pieData} difficultyData={difficultyData} getStats={getStats} />
          </TabsContent>
        </Tabs>

        {practiceActive && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-3 text-center text-sm">
              Práctica en curso — vuelve a la pestaña <strong>Práctica</strong> para guardar.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
