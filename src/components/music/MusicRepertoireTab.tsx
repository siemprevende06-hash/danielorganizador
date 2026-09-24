import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ExternalLink, Music, PencilLine, Play, Search, Star, Trash2, Upload } from 'lucide-react';
import type { HandTotals, Song, SongCheckpoint } from '@/hooks/useMusicRepertoire';
import { songCheckpoints, songIsFullyReady } from '@/hooks/useMusicRepertoire';
import { difficultyBadgeClass, difficultyLabel, masteredCardClass } from './musicUtils';
import { MusicLogPracticeDialog } from './MusicLogPracticeDialog';
import { MusicSongDetailDialog } from './MusicSongDetailDialog';

const practiceGoalByDifficulty: Record<string, number> = {
  beginner: 60,
  intermediate: 180,
  advanced: 360,
};

function songDurationLabel(song: Song) {
  if (!song.duration_seconds) return null;
  return `${Math.floor(song.duration_seconds / 60)}:${String(song.duration_seconds % 60).padStart(2, '0')}`;
}

const CHECKPOINT_DOT: { key: SongCheckpoint; label: string }[] = [
  { key: 'learned', label: 'Aprendida' },
  { key: 'mastered', label: 'Dominada' },
  { key: 'recorded', label: 'Video' },
];

export function MusicRepertoireTab({
  instrument,
  onInstrumentChange,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterDifficulty,
  onFilterDifficultyChange,
  songsCountByInstrument,
  songs,
  handTotals,
  onStartPractice,
  onLogPractice,
  onToggleCheckpoint,
  onSaveDetails,
  onDelete,
  onUploadCover,
}: {
  instrument: 'piano' | 'guitar';
  onInstrumentChange: (v: 'piano' | 'guitar') => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filterStatus: 'all' | 'learning' | 'mastered';
  onFilterStatusChange: (v: 'all' | 'learning' | 'mastered') => void;
  filterDifficulty: 'all' | 'beginner' | 'intermediate' | 'advanced';
  onFilterDifficultyChange: (v: 'all' | 'beginner' | 'intermediate' | 'advanced') => void;
  songsCountByInstrument: (inst: 'piano' | 'guitar') => number;
  songs: Song[];
  handTotals: Record<string, HandTotals>;
  onStartPractice: (songId?: string) => void;
  onLogPractice: (song: Song, minutes: { left: number; right: number; both: number }) => Promise<void>;
  onToggleCheckpoint: (songId: string, checkpoint: SongCheckpoint) => Promise<void>;
  onSaveDetails: (songId: string, updates: { duration_seconds: number | null; practice_minutes: number | null }) => Promise<void>;
  onDelete: (songId: string) => void;
  onUploadCover: (songId: string, file: File) => Promise<void>;
}) {
  const [logSong, setLogSong] = useState<Song | null>(null);
  const [detailSong, setDetailSong] = useState<Song | null>(null);
  const [savingLog, setSavingLog] = useState(false);

  const handleSaveLog = async (song: Song, minutes: { left: number; right: number; both: number }) => {
    setSavingLog(true);
    await onLogPractice(song, minutes);
    setSavingLog(false);
    setLogSong(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={instrument === 'piano' ? 'default' : 'outline'} size="sm" onClick={() => onInstrumentChange('piano')}>
          🎹 Piano ({songsCountByInstrument('piano')})
        </Button>
        <Button variant={instrument === 'guitar' ? 'default' : 'outline'} size="sm" onClick={() => onInstrumentChange('guitar')}>
          🎸 Guitarra ({songsCountByInstrument('guitar')})
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar canción..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>

        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={(v) => onFilterStatusChange(v as any)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="learning">Aprendiendo</SelectItem>
              <SelectItem value="mastered">Dominadas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterDifficulty} onValueChange={(v) => onFilterDifficultyChange(v as any)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Dificultad</SelectItem>
              <SelectItem value="beginner">Fácil</SelectItem>
              <SelectItem value="intermediate">Medio</SelectItem>
              <SelectItem value="advanced">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {songs.map(song => {
          const practiceMinutes = song.practice_minutes || 0;
          const goal = practiceGoalByDifficulty[song.difficulty] || 60;
          const progressPct = Math.min(Math.round((practiceMinutes / goal) * 100), 100);
          const cps = songCheckpoints(song);
          const fullyReady = songIsFullyReady(song);
          const durationLabel = songDurationLabel(song);
          return (
            <Card
              key={song.id}
              className={cn(masteredCardClass(song.status === 'mastered'), 'overflow-hidden cursor-pointer')}
              onClick={() => setDetailSong(song)}
            >
              <div className="flex gap-3 p-3 sm:p-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 group/cover">
                  {song.cover_image_url ? (
                    <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center">
                      <Music className="w-6 h-6 sm:w-8 sm:h-8 text-primary/50" />
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer" onClick={(e) => e.stopPropagation()}>
                    <Upload className="w-5 h-5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await onUploadCover(song.id, file);
                        e.target.value = '';
                      }
                    }} />
                  </label>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm sm:text-base truncate">{song.title}</h4>
                        {song.status === 'mastered' && <Star className="w-4 h-4 flex-shrink-0 fill-warning text-warning" />}
                        {fullyReady && <Badge className="text-[9px] bg-success text-success-foreground flex-shrink-0">Lista</Badge>}
                      </div>
                      {song.artist && <p className="text-xs sm:text-sm text-muted-foreground truncate">{song.artist}</p>}
                    </div>

                    <Badge variant="outline" className={cn('flex-shrink-0 text-xs', difficultyBadgeClass(song.difficulty))}>
                      {difficultyLabel(song.difficulty)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {CHECKPOINT_DOT.map(dot => (
                      <span
                        key={dot.key}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium border',
                          cps[dot.key]
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-muted/40 text-muted-foreground border-border/60'
                        )}
                      >
                        {cps[dot.key] ? '✓' : '○'} {dot.label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>
                        🕐 {practiceMinutes} min practicados
                        {durationLabel && <span className="ml-1">· ⏱ {durationLabel}</span>}
                      </span>
                      <span>{song.status === 'mastered' ? '✓ Dominada' : `Meta: ${goal} min`}</span>
                    </div>
                    <Progress value={progressPct} className="h-1.5" />
                    {handTotals[song.id] &&
                      handTotals[song.id].left + handTotals[song.id].right + handTotals[song.id].both > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          {song.instrument === 'piano' && `✋ Izq ${handTotals[song.id].left} · Der ${handTotals[song.id].right} · `}🤝 Ambas {handTotals[song.id].both}
                        </p>
                      )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); onStartPractice(song.id); }}>
                      <Play className="w-3 h-3 mr-1" />Practicar
                    </Button>

                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); setLogSong(song); }}>
                      <PencilLine className="w-3 h-3 mr-1" />Registrar
                    </Button>

                    {song.youtube_url && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); window.open(song.youtube_url!, '_blank'); }}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}

                    {song.status === 'learning' && (
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs ml-auto" onClick={(e) => { e.stopPropagation(); onToggleCheckpoint(song.id, 'mastered'); }}>
                        ✓ Dominada
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onDelete(song.id); }}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>

                  {song.notes && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t line-clamp-2">{song.notes}</p>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {songs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No se encontraron canciones</p>
          </CardContent>
        </Card>
      )}

      <MusicLogPracticeDialog
        open={logSong !== null}
        onOpenChange={(v) => {
          if (!v && !savingLog) setLogSong(null);
        }}
        song={logSong}
        saving={savingLog}
        onSave={handleSaveLog}
      />

      <MusicSongDetailDialog
        open={detailSong !== null}
        onOpenChange={(v) => {
          if (!v) setDetailSong(null);
        }}
        song={detailSong}
        onToggleCheckpoint={onToggleCheckpoint}
        onSave={onSaveDetails}
      />
    </div>
  );
}
