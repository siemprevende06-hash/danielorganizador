import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface JournalEntry {
  id: string;
  date: string;
  content: string;
}

export default function JournalingPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('journalEntries');
    if (stored) {
      setEntries(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('journalEntries', JSON.stringify(entries));
    }
  }, [entries]);

  const handleSaveEntry = () => {
    if (!currentEntry.trim()) return;

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      date: new Date().toISOString(),
      content: currentEntry,
    };

    setEntries(prev => [newEntry, ...prev]);
    setCurrentEntry('');
    toast({ title: 'Entrada guardada', description: 'Tu reflexión ha sido guardada.' });
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
    toast({ title: 'Entrada eliminada' });
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Diario Personal
        </h1>
        <p className="text-muted-foreground">Reflexiona y documenta tu viaje</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Entrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={currentEntry}
            onChange={(e) => setCurrentEntry(e.target.value)}
            placeholder="¿Cómo te sientes hoy? ¿Qué has aprendido? ¿Qué agradeces?"
            className="min-h-[200px]"
          />
          <Button onClick={handleSaveEntry} className="w-full">Guardar Entrada</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Entradas Anteriores</h2>
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {format(new Date(entry.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(entry.date), 'HH:mm')}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{entry.content}</p>
            </CardContent>
          </Card>
        ))}
        {entries.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tienes entradas aún. Comienza tu diario hoy.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
