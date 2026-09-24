import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ExternalLink, Music, Save } from 'lucide-react';
import type { Song, SongCheckpoint } from '@/hooks/useMusicRepertoire';
import { difficultyBadgeClass, difficultyLabel } from './musicUtils';

const CHECKPOINTS: { key: SongCheckpoint; label: string; desc: string; emoji: string }[] = [
  { key: 'learned', label: 'Aprendida', desc: 'Ya sé tocar la canción', emoji: '🎵' },
  { key: 'mastered', label: 'Dominada', desc: 'La domino con fluidez', emoji: '🏆' },
  { key: 'recorded', label: 'Videograbada', desc: 'Video grabado', emoji: '🎥' },
];

export function MusicSongDetailDialog({
  open,
  onOpenChange,
  song,
  onToggleCheckpoint,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song | null;
  onToggleCheckpoint: (id: string, checkpoint: SongCheckpoint) => Promise<void>;
  onSave: (id: string, updates: { duration_seconds: number | null; practice_minutes: number | null }) => Promise<void>;
}) {
  const [minInput, setMinInput] = useState('');
  const [secInput, setSecInput] = useState('');
  const [practiceInput, setPracticeInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && song) {
      const mm = song.duration_seconds ? Math.floor(song.duration_seconds / 60) : 0;
      const ss = song.duration_seconds ? song.duration_seconds % 60 : 0;
      setMinInput(mm > 0 ? String(mm) : '');
      setSecInput(ss > 0 ? String(ss) : '');
      setPracticeInput(song.practice_minutes ? String(song.practice_minutes) : '');
    }
  }, [open, song]);

  if (!song) return null;

  const checked = {
    learned: !!song.learned_at,
    mastered: !!song.mastered_at,
    recorded: !!song.recorded_at,
  };
  const doneCount = Number(checked.learned) + Number(checked.mastered) + Number(checked.recorded);
  const fullyReady = doneCount === 3;

  const durationMin = (parseInt(minInput, 10) || 0) * 60 + (parseInt(secInput, 10) || 0);
  const durationMinutesFloat = song.duration_seconds ? song.duration_seconds / 60 : 0;
  const practiced = song.practice_minutes || 0;
  const progressPct =
    durationMinutesFloat > 0 ? Math.min(Math.round(((parseInt(practiceInput, 10) || 0) / durationMinutesFloat) * 100), 100) : 0;
  const practiceLocal = parseInt(practiceInput, 10) || 0;
  const effectivePct = Number.isFinite(progressPct) ? progressPct : 0;

  const durLabel = song.duration_seconds
    ? `${Math.floor(song.duration_seconds / 60)}:${String(song.duration_seconds % 60).padStart(2, '0')}`
    : '—';

  const handleSave = async () => {
    setSaving(true);
    await onSave(song.id, {
      duration_seconds: durationMin > 0 ? durationMin : null,
      practice_minutes: practiceLocal > 0 ? practiceLocal : null,
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 min-w-0">
            <Music className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{song.title}</span>
            {fullyReady && <Badge className="flex-shrink-0 bg-success text-success-foreground">¡Lista!</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              {song.cover_image_url ? (
                <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center">
                  <Music className="w-6 h-6 text-primary/50" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground truncate">
                {song.artist || 'Sin artista'} · {song.instrument === 'piano' ? '🎹 Piano' : '🎸 Guitarra'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn('text-xs', difficultyBadgeClass(song.difficulty))}>
                  {difficultyLabel(song.difficulty)}
                </Badge>
                {song.youtube_url && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => window.open(song.youtube_url!, '_blank')}>
                    <ExternalLink className="w-3 h-3 mr-1" />YouTube
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Tiempos</p>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Duración de la canción</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number" min={0} inputMode="numeric"
                    className="h-8 text-center"
                    placeholder="min"
                    value={minInput}
                    onChange={(e) => setMinInput(e.target.value)}
                  />
                  <span className="text-muted-foreground">:</span>
                  <Input
                    type="number" min={0} max={59} inputMode="numeric"
                    className="h-8 text-center"
                    placeholder="seg"
                    value={secInput}
                    onChange={(e) => setSecInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tiempo aprendido (min)</Label>
                <Input
                  type="number" min={0} inputMode="numeric"
                  className="h-8 text-center"
                  placeholder="0"
                  value={practiceInput}
                  onChange={(e) => setPracticeInput(e.target.value)}
                />
              </div>
            </div>

            {song.duration_seconds > 0 && (
              <div className="pt-1 space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>⏱ Canción: {durLabel}</span>
                  <span>{practiceLocal} min aprendidos</span>
                </div>
                <Progress value={effectivePct} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground">
                  {effectivePct}% de la duración de la canción en tiempo de práctica
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Puntos de control</p>
              <span className="text-xs font-bold">{doneCount}/3</span>
            </div>
            {CHECKPOINTS.map(cp => {
              const isChecked = checked[cp.key];
              return (
                <button
                  key={cp.key}
                  onClick={() => onToggleCheckpoint(song.id, cp.key)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors',
                    isChecked
                      ? 'border-success/40 bg-success/10'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <Checkbox checked={isChecked} className="pointer-events-none" />
                  <span className="text-base">{cp.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{cp.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{isChecked ? cp.desc : 'Pendiente'}</p>
                  </div>
                  {isChecked && <span className="text-xs text-success">✓</span>}
                </button>
              );
            })}
            {fullyReady && (
              <p className="text-xs text-success font-medium text-center pt-1">
                🎉 Canción completamente lista: aprendida, dominada y videograbada
              </p>
            )}
          </div>

          {song.notes && (
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1">Notas</p>
              <p className="text-xs whitespace-pre-wrap">{song.notes}</p>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar tiempos'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}