import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ExternalLink, Music, Play, Search, Star, Trash2, Upload } from 'lucide-react';
import type { Song } from '@/hooks/useMusicRepertoire';
import { difficultyBadgeClass, difficultyLabel, masteredCardClass } from './musicUtils';

const practiceGoalByDifficulty: Record<string, number> = {
  beginner: 60,
  intermediate: 180,
  advanced: 360,
};

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
  onStartPractice,
  onMarkMastered,
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
  onStartPractice: (songId?: string) => void;
  onMarkMastered: (songId: string) => void;
  onDelete: (songId: string) => void;
  onUploadCover: (songId: string, file: File) => Promise<void>;
}) {
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
          return (
            <Card key={song.id} className={cn(masteredCardClass(song.status === 'mastered'), 'overflow-hidden')}>
              <div className="flex gap-3 p-3 sm:p-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 group/cover">
                  {song.cover_image_url ? (
                    <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center">
                      <Music className="w-6 h-6 sm:w-8 sm:h-8 text-primary/50" />
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer">
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
                      </div>
                      {song.artist && <p className="text-xs sm:text-sm text-muted-foreground truncate">{song.artist}</p>}
                    </div>

                    <Badge variant="outline" className={cn('flex-shrink-0 text-xs', difficultyBadgeClass(song.difficulty))}>
                      {difficultyLabel(song.difficulty)}
                    </Badge>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>🕐 {practiceMinutes} min practicados</span>
                      <span>{song.status === 'mastered' ? '✓ Dominada' : `Meta: ${goal} min`}</span>
                    </div>
                    <Progress value={progressPct} className="h-1.5" />
                  </div>

                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onStartPractice(song.id)}>
                      <Play className="w-3 h-3 mr-1" />Practicar
                    </Button>

                    {song.youtube_url && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(song.youtube_url!, '_blank')}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}

                    {song.status === 'learning' && (
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs ml-auto" onClick={() => onMarkMastered(song.id)}>
                        ✓ Dominada
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDelete(song.id)}>
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
    </div>
  );
}
