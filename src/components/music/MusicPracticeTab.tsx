import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, Pause, Play, Timer, Volume2 } from 'lucide-react';
import type { Song } from '@/hooks/useMusicRepertoire';
import { formatTime } from './musicUtils';

export function MusicPracticeTab({
  songs,
  practiceActive,
  practiceSeconds,
  practiceSongId,
  onStartPractice,
  onStopPractice,
  todayPractice,
  dailyGoal,
  practicePercent,
  metronomeBpm,
  onBpmDown,
  onBpmUp,
  metronomeActive,
  onToggleMetronome,
  onPresetBpm,
  onQuickPractice,
}: {
  songs: Song[];
  practiceActive: boolean;
  practiceSeconds: number;
  practiceSongId: string | null;
  onStartPractice: (songId?: string) => void;
  onStopPractice: () => void;
  todayPractice: number;
  dailyGoal: number;
  practicePercent: number;
  metronomeBpm: number;
  onBpmDown: () => void;
  onBpmUp: () => void;
  metronomeActive: boolean;
  onToggleMetronome: () => void;
  onPresetBpm: (bpm: number) => void;
  onQuickPractice: (songId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Timer className="w-5 h-5" />Temporizador de Práctica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-4xl sm:text-6xl font-mono font-bold tracking-wider">{formatTime(practiceSeconds)}</p>
            {practiceSongId && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Practicando: {songs.find(s => s.id === practiceSongId)?.title}</p>
            )}
          </div>

          <div className="flex justify-center gap-3">
            {!practiceActive ? (
              <Button onClick={() => onStartPractice()} size="lg" className="w-full sm:w-auto">
                <Play className="w-5 h-5 mr-2" />Iniciar Práctica
              </Button>
            ) : (
              <Button onClick={onStopPractice} variant="destructive" size="lg" className="w-full sm:w-auto">
                <Pause className="w-5 h-5 mr-2" />Detener y Guardar
              </Button>
            )}
          </div>

          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span>Meta diaria</span>
              <span>
                {todayPractice}/{dailyGoal} min
              </span>
            </div>
            <Progress value={practicePercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Volume2 className="w-5 h-5" />Metrónomo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <Button variant="outline" size="icon" onClick={onBpmDown}>
              <ChevronDown className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold">{metronomeBpm}</p>
              <p className="text-xs text-muted-foreground">BPM</p>
            </div>
            <Button variant="outline" size="icon" onClick={onBpmUp}>
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex justify-center mt-4">
            <Button
              variant={metronomeActive ? 'destructive' : 'default'}
              onClick={onToggleMetronome}
              className="w-full sm:w-auto"
            >
              {metronomeActive ? 'Detener' : 'Iniciar'} Metrónomo
            </Button>
          </div>

          <ScrollArea className="w-full mt-3">
            <div className="flex justify-center gap-2 pb-2">
              {[60, 80, 100, 120, 140, 160].map(bpm => (
                <Button key={bpm} variant="ghost" size="sm" className="h-7 px-2 text-xs flex-shrink-0" onClick={() => onPresetBpm(bpm)}>
                  {bpm}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Práctica Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {songs
              .filter(s => s.status === 'learning')
              .slice(0, 6)
              .map(song => (
                <div key={song.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {song.instrument === 'piano' ? '🎹' : '🎸'} {song.artist || ''}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => onQuickPractice(song.id)}>
                    <Play className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Practicar</span>
                  </Button>
                </div>
              ))}

            {songs.filter(s => s.status === 'learning').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay canciones en aprendizaje</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
