import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Trash2, Send, Sparkles, Clock, PenLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function JournalingPage() {
  const { entries, isLoading, addEntry, deleteEntry } = useJournalEntries();
  const [currentEntry, setCurrentEntry] = useState('');
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (entries.length > 0) {
      let count = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        const hasEntry = entries.some(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
        if (hasEntry) count++;
        else break;
      }
      setStreak(count);
    }
  }, [entries]);

  const handleSaveEntry = async () => {
    if (!currentEntry.trim()) return;
    setSaving(true);
    const result = await addEntry(currentEntry);
    if (result) {
      setCurrentEntry('');
      toast({ title: 'Entrada guardada', description: 'Tu reflexión ha sido guardada.' });
      textareaRef.current?.focus();
    }
    setSaving(false);
  };

  const handleDeleteEntry = async (entryId: string) => {
    await deleteEntry(entryId);
    toast({ title: 'Entrada eliminada' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveEntry();
    }
  };

  const todayStr = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
  const entryCount = entries.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="h-4 w-28 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Diario</h1>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{todayStr}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: <PenLine className="h-4 w-4 text-purple-500" />, label: "Entradas", value: entryCount, gradient: "from-purple-500 to-pink-400" },
            { icon: <Sparkles className="h-4 w-4 text-amber-500" />, label: "Racha (días)", value: streak, gradient: "from-amber-500 to-orange-400" },
            { icon: <BookOpen className="h-4 w-4 text-blue-500" />, label: "Total palabras", value: entries.reduce((s, e) => s + e.content.split(/\s+/).filter(Boolean).length, 0), gradient: "from-blue-500 to-cyan-400" },
          ].map((s, i) => (
            <Card key={i} className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className={cn("h-1 bg-gradient-to-r", s.gradient)} />
              <CardContent className="p-3.5 text-center space-y-1">
                <div className="flex justify-center">{s.icon}</div>
                <div className="text-lg font-bold tabular-nums">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Entry */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <PenLine className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nueva Entrada</span>
            </div>
            <Textarea
              ref={textareaRef}
              value={currentEntry}
              onChange={(e) => setCurrentEntry(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="¿Cómo te sientes hoy? ¿Qué has aprendido? ¿Qué agradeces?"
              className="min-h-[180px] resize-none border-0 bg-muted/30 focus-visible:ring-0 text-sm leading-relaxed rounded-xl"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {currentEntry.length > 0 ? `${currentEntry.split(/\s+/).filter(Boolean).length} palabras · Cmd+Enter para guardar` : 'Escribe algo...'}
              </span>
              <Button onClick={handleSaveEntry} disabled={!currentEntry.trim() || saving}
                className="rounded-full h-8 text-xs gap-1.5">
                <Send className="h-3.5 w-3.5" /> {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Previous entries */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5" /> Entradas Anteriores ({entryCount})
          </div>

          {entries.length === 0 ? (
            <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium mb-1">Sin entradas aún</p>
                <p className="text-xs text-muted-foreground text-center">Comienza tu diario hoy</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const entryDate = new Date(entry.date);
                const isToday = format(entryDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <Card key={entry.id} className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            isToday ? "bg-primary" : "bg-muted-foreground/30"
                          )} />
                          <span className={cn("text-xs font-medium", isToday && "text-primary")}>
                            {isToday ? 'Hoy' : format(entryDate, "EEEE, d 'de' MMMM", { locale: es })}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(entryDate, 'HH:mm')}
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleDeleteEntry(entry.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {entry.content}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}