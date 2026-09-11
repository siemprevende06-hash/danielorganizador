import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useVocabulary, VocabularyWord } from '@/hooks/useVocabulary';
import { supabase } from '@/integrations/supabase/client';
import { Search, Trash2, Languages, BookOpenCheck, RotateCcw, Check, ChevronLeft, ChevronRight, Plus, FlipVertical2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_LABELS: Record<string, string> = {
  new: 'Nueva',
  learning: 'En repaso',
  learned: 'Dominada',
};

export default function VocabularyPanel() {
  const { words, loading, updateWord, deleteWord, refetch } = useVocabulary();

  const [language, setLanguage] = useState<string>('english');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('language_settings').select('current_language').maybeSingle();
      if (data?.current_language) setLanguage(data.current_language);
    };
    load();
  }, []);

  const languagesPresent = useMemo(() => {
    const set = new Set((words || []).map(w => w.language || 'english'));
    return ['english', 'italian'].filter(l => set.has(l));
  }, [words]);

  const filtered = useMemo(() => {
    let list = (words || []).filter(w => (w.language || 'english') === language);
    if (statusFilter !== 'all') list = list.filter(w => (w.status || 'new') === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(w => w.word.toLowerCase().includes(q) || w.translation?.toLowerCase().includes(q));
    }
    return list;
  }, [words, language, statusFilter, search]);

  const stats = useMemo(() => {
    const list = (words || []).filter(w => (w.language || 'english') === language);
    return {
      total: list.length,
      new: list.filter(w => (w.status || 'new') === 'new').length,
      learning: list.filter(w => (w.status || 'new') === 'learning').length,
      learned: list.filter(w => (w.status || 'new') === 'learned').length,
    };
  }, [words, language]);

  const reviewDeck = useMemo(
    () => (words || []).filter(w => (w.language || 'english') === language && w.status !== 'learned'),
    [words, language]
  );

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4 justify-between">
            <div className="flex items-center gap-5 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Palabras</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.new}</p>
                <p className="text-xs text-muted-foreground">Nuevas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.learning}</p>
                <p className="text-xs text-muted-foreground">En repaso</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.learned}</p>
                <p className="text-xs text-muted-foreground">Dominadas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {languagesPresent.length > 1 && (
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languagesPresent.map(l => (
                      <SelectItem key={l} value={l}>{l === 'english' ? 'Inglés' : 'Italiano'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button size="sm" variant="default" disabled={reviewDeck.length === 0} onClick={() => setReviewOpen(true)}>
                <FlipVertical2 className="w-4 h-4 mr-1.5" /> Repasar ({reviewDeck.length})
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Palabras capturadas desde el lector de libros bilingües. Repásalas hasta dominarlas.
          </p>
        </CardContent>
      </Card>

      {/* Filtros */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar palabra o traducción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="new">Nuevas</SelectItem>
              <SelectItem value="learning">En repaso</SelectItem>
              <SelectItem value="learned">Dominadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{words.length === 0 ? 'Aún no hay palabras. Abre un libro bilingüe y haz doble clic en una palabra para guardarla aquí.' : 'Sin resultados'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(word => (
            <Card key={word.id} className="hover:ring-1 hover:ring-primary/30 transition-all">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">{word.word}</p>
                      <Badge variant={word.status === 'learned' ? 'default' : word.status === 'learning' ? 'secondary' : 'outline'} className="text-[10px]">
                        {STATUS_LABELS[word.status || 'new']}
                      </Badge>
                      {word.book_title && <Badge variant="outline" className="text-[10px] text-muted-foreground">📖 {word.book_title}</Badge>}
                    </div>
                    <Input
                      key={`${word.id}-${word.translation}`}
                      defaultValue={word.translation || ''}
                      placeholder="Traducción…"
                      onBlur={(e) => { if ((e.target.value || '') !== (word.translation || '')) updateWord(word.id, { translation: e.target.value || null }); }}
                      className="mt-1.5 h-8 text-sm max-w-xs"
                    />
                    {word.context_es && (
                      <p className="text-xs text-muted-foreground/80 italic mt-1.5 line-clamp-2">"— {word.context_es}"</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {word.created_at ? format(new Date(word.created_at), 'd MMM yyyy', { locale: es }) : ''}
                      {word.review_count && word.review_count > 1 ? ` · ${word.review_count}× vista` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {word.status !== 'learned' && (
                      <Button size="sm" variant="default" className="h-7 px-2 text-xs" onClick={() => updateWord(word.id, { status: 'learned' })}>
                        <Check className="w-3 h-3 mr-1" /> Dominada
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteWord(word.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modo repaso (flashcards) */}
      <ReviewDialog
        deck={reviewDeck}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onUpdate={updateWord}
      />
    </div>
  );
}

function ReviewDialog({ deck, open, onOpenChange, onUpdate }: {
  deck: VocabularyWord[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onUpdate: (id: string, updates: Partial<VocabularyWord>) => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setIndex(0);
      setFlipped(false);
      setDone(false);
    }
  }, [open]);

  const card = deck[index];

  const next = () => {
    if (index + 1 >= deck.length) setDone(true);
    else {
      setIndex(i => i + 1);
      setFlipped(false);
    }
  };

  const markLearned = () => {
    if (!card) return;
    onUpdate(card.id, { status: 'learned' });
    next();
  };

  const markLearning = () => {
    if (!card) return;
    onUpdate(card.id, { status: 'learning' });
    next();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlipVertical2 className="w-5 h-5 text-primary" /> Modo repaso
          </DialogTitle>
        </DialogHeader>

        {deck.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">No hay palabras por repasar. ¡Lee y guarda más! 🎉</div>
        ) : done ? (
          <div className="py-8 text-center space-y-3">
            <BookOpenCheck className="w-10 h-10 mx-auto text-emerald-600" />
            <p className="font-semibold">¡Repaso completado! 🎉</p>
            <p className="text-sm text-muted-foreground">Repasaste {deck.length} palabras.</p>
            <Button variant="outline" size="sm" onClick={() => { setIndex(0); setDone(false); setFlipped(false); }} className="mx-auto">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Repetir
            </Button>
          </div>
        ) : card ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Palabra {index + 1} de {deck.length}</span>
              {card.book_title && <span className="truncate max-w-[50%]">📖 {card.book_title}</span>}
            </div>

            <div
              className={cn(
                "min-h-40 rounded-xl border-2 flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer select-none transition-colors",
                flipped ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50"
              )}
              onClick={() => setFlipped(f => !f)}
            >
              {flipped ? (
                <>
                  <p className="font-semibold text-lg break-words">{card.translation || '—'}</p>
                  {card.context_es && <p className="text-xs text-muted-foreground italic line-clamp-3">"{card.context_es}"</p>}
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                    <Plus className="w-3 h-3" /> Toca para ver la palabra
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-xl break-words">{card.word}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Toca para revelar la traducción
                  </p>
                </>
              )}
            </div>

            {flipped && (
              <div className="flex justify-center gap-3">
                <Button variant="outline" size="sm" onClick={markLearning}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Aún no
                </Button>
                <Button size="sm" onClick={markLearned}>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> La sabía
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => { setIndex(i => Math.max(0, i - 1)); setFlipped(false); }}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={next}>
                <ChevronRight className="w-4 h-4" /> Saltar
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}