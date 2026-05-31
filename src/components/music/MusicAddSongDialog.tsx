import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import type { Song } from '@/hooks/useMusicRepertoire';

export function MusicAddSongDialog({
  open,
  onOpenChange,
  instrument,
  onInstrumentChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instrument: 'piano' | 'guitar';
  onInstrumentChange: (v: 'piano' | 'guitar') => void;
  onAdd: (song: { title: string; artist: string | null; difficulty: Song['difficulty']; youtube_url: string | null; notes: string | null }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [difficulty, setDifficulty] = useState<Song['difficulty']>('beginner');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setTitle('');
    setArtist('');
    setDifficulty('beginner');
    setYoutubeUrl('');
    setNotes('');
  };

  const handleAdd = async () => {
    if (!title.trim()) return;
    await onAdd({
      title: title.trim(),
      artist: artist.trim() ? artist.trim() : null,
      difficulty,
      youtube_url: youtubeUrl.trim() ? youtubeUrl.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />Nueva Canción
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Canción</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Select value={instrument} onValueChange={(v) => onInstrumentChange(v as 'piano' | 'guitar')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="piano">🎹 Piano</SelectItem>
              <SelectItem value="guitar">🎸 Guitarra</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Nombre de la canción" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Artista" value={artist} onChange={(e) => setArtist(e.target.value)} />

          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Song['difficulty'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Principiante</SelectItem>
              <SelectItem value="intermediate">Intermedio</SelectItem>
              <SelectItem value="advanced">Avanzado</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Link YouTube (opcional)" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
          <Textarea placeholder="Notas..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

          <Button onClick={handleAdd} className="w-full">
            Agregar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
