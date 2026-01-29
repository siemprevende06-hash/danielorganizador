import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Song {
  id: string;
  user_id: string | null;
  instrument: 'piano' | 'guitar';
  title: string;
  artist: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'learning' | 'mastered';
  youtube_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useMusicRepertoire = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('music_repertoire')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSongs((data as Song[]) || []);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const addSong = async (song: Partial<Song>) => {
    try {
      const { data, error } = await supabase
        .from('music_repertoire')
        .insert({
          instrument: song.instrument || 'piano',
          title: song.title || '',
          artist: song.artist,
          difficulty: song.difficulty || 'beginner',
          status: song.status || 'learning',
          youtube_url: song.youtube_url,
          notes: song.notes,
        })
        .select()
        .single();

      if (error) throw error;
      
      setSongs(prev => [data as Song, ...prev]);
      toast({
        title: "Canción agregada",
        description: `${song.title} - ${song.artist}`,
      });
      
      return data;
    } catch (error) {
      console.error('Error adding song:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la canción",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSong = async (id: string, updates: Partial<Song>) => {
    try {
      const { error } = await supabase
        .from('music_repertoire')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setSongs(prev => prev.map(song => 
        song.id === id ? { ...song, ...updates } : song
      ));
    } catch (error) {
      console.error('Error updating song:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la canción",
        variant: "destructive",
      });
    }
  };

  const markAsMastered = async (id: string) => {
    await updateSong(id, { status: 'mastered' });
    toast({
      title: "¡Felicitaciones!",
      description: "Canción dominada 🎵",
    });
  };

  const deleteSong = async (id: string) => {
    try {
      const { error } = await supabase
        .from('music_repertoire')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSongs(prev => prev.filter(song => song.id !== id));
      toast({
        title: "Canción eliminada",
      });
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const getSongsByInstrument = (instrument: Song['instrument']) => {
    return songs.filter(song => song.instrument === instrument);
  };

  const getSongsByStatus = (status: Song['status']) => {
    return songs.filter(song => song.status === status);
  };

  const getStats = (instrument?: Song['instrument']) => {
    const filtered = instrument ? getSongsByInstrument(instrument) : songs;
    const mastered = filtered.filter(s => s.status === 'mastered');
    const learning = filtered.filter(s => s.status === 'learning');
    
    return {
      total: filtered.length,
      mastered: mastered.length,
      learning: learning.length,
      byDifficulty: {
        beginner: filtered.filter(s => s.difficulty === 'beginner').length,
        intermediate: filtered.filter(s => s.difficulty === 'intermediate').length,
        advanced: filtered.filter(s => s.difficulty === 'advanced').length,
      },
    };
  };

  return {
    songs,
    loading,
    addSong,
    updateSong,
    markAsMastered,
    deleteSong,
    getSongsByInstrument,
    getSongsByStatus,
    getStats,
    refetch: fetchSongs,
  };
};
