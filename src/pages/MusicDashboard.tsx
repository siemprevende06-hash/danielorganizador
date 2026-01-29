import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMusicRepertoire, Song } from '@/hooks/useMusicRepertoire';
import { Music, Plus, Guitar, Piano, Star, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MusicDashboard() {
  const {
    songs,
    loading,
    addSong,
    markAsMastered,
    deleteSong,
    getSongsByInstrument,
    getStats,
  } = useMusicRepertoire();

  const [instrument, setInstrument] = useState<'piano' | 'guitar'>('piano');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    difficulty: 'beginner',
    youtube_url: '',
    notes: '',
  });

  const instrumentSongs = getSongsByInstrument(instrument);
  const stats = getStats(instrument);

  const handleAddSong = async () => {
    if (!newSong.title) return;
    
    await addSong({
      instrument,
      title: newSong.title,
      artist: newSong.artist || null,
      difficulty: newSong.difficulty as Song['difficulty'],
      youtube_url: newSong.youtube_url || null,
      notes: newSong.notes || null,
      status: 'learning',
    });
    
    setNewSong({ title: '', artist: '', difficulty: 'beginner', youtube_url: '', notes: '' });
    setDialogOpen(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🎵 Mi Repertorio Musical
          </h1>
          <p className="text-muted-foreground">
            Canciones que estás aprendiendo y dominando
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Canción
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Canción</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Instrumento</label>
                <Select 
                  value={instrument} 
                  onValueChange={(v) => setInstrument(v as typeof instrument)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piano">🎹 Piano</SelectItem>
                    <SelectItem value="guitar">🎸 Guitarra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Nombre de la canción</label>
                <Input
                  placeholder="Für Elise"
                  value={newSong.title}
                  onChange={(e) => setNewSong(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Artista</label>
                <Input
                  placeholder="Beethoven"
                  value={newSong.artist}
                  onChange={(e) => setNewSong(prev => ({ ...prev, artist: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Dificultad</label>
                <Select 
                  value={newSong.difficulty} 
                  onValueChange={(v) => setNewSong(prev => ({ ...prev, difficulty: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Link YouTube (opcional)</label>
                <Input
                  placeholder="https://youtube.com/..."
                  value={newSong.youtube_url}
                  onChange={(e) => setNewSong(prev => ({ ...prev, youtube_url: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddSong} className="w-full">
                Agregar Canción
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Instrument Tabs */}
      <Tabs value={instrument} onValueChange={(v) => setInstrument(v as typeof instrument)}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="piano" className="flex items-center gap-2">
            <Piano className="w-4 h-4" />
            Piano ({getSongsByInstrument('piano').length})
          </TabsTrigger>
          <TabsTrigger value="guitar" className="flex items-center gap-2">
            <Guitar className="w-4 h-4" />
            Guitarra ({getSongsByInstrument('guitar').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={instrument} className="mt-4 space-y-4">
          {/* Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.mastered}</p>
                    <p className="text-xs text-muted-foreground">Dominadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.learning}</p>
                    <p className="text-xs text-muted-foreground">Aprendiendo</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>🟢 Principiante: {stats.byDifficulty.beginner}</p>
                  <p>🟡 Intermedio: {stats.byDifficulty.intermediate}</p>
                  <p>🔴 Avanzado: {stats.byDifficulty.advanced}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Song List */}
          <div className="space-y-3">
            <h3 className="font-medium">
              {instrument === 'piano' ? '🎹' : '🎸'} Canciones de {instrument === 'piano' ? 'Piano' : 'Guitarra'}
            </h3>
            
            {instrumentSongs.map(song => (
              <Card key={song.id} className={cn(
                "transition-all",
                song.status === 'mastered' && "border-green-500/30 bg-green-500/5"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{song.title}</h4>
                        {song.status === 'mastered' && (
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        )}
                      </div>
                      {song.artist && (
                        <p className="text-sm text-muted-foreground">{song.artist}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getDifficultyColor(song.difficulty)}>
                        {song.difficulty === 'beginner' && 'Principiante'}
                        {song.difficulty === 'intermediate' && 'Intermedio'}
                        {song.difficulty === 'advanced' && 'Avanzado'}
                      </Badge>
                      {song.youtube_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(song.youtube_url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      {song.status === 'learning' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsMastered(song.id)}
                        >
                          Dominada ✓
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => deleteSong(song.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {song.notes && (
                    <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                      {song.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            {instrumentSongs.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    No hay canciones de {instrument === 'piano' ? 'piano' : 'guitarra'} aún
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ¡Agrega tu primera canción!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
