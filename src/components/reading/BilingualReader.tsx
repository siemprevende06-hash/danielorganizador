import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Book } from '@/hooks/useReadingLibrary';
import { X, Plus, Minus, Languages, BookOpenCheck, Loader2 } from 'lucide-react';

export interface LinePair {
  en: string;
  es: string;
}

const STORAGE_POS_PREFIX = 'bil-reader-pos-';

const isSeparator = (line: string) => /^[^\p{L}\p{N}]+$/u.test(line.trim()) && line.trim().length > 0;

export function parseBilingualText(text: string): LinePair[] {
  if (!text) return [];

  // Formato recomendado: pares #EN / #ES (a prueba de desalineación)
  if (text.split(/\r?\n/).some(l => /^\s*#\s*(EN|ES)\b/i.test(l))) {
    const pairs: LinePair[] = [];
    let current: LinePair | null = null;
    const lineRe = /^\s*#\s*(EN|ES)\s*[:.\-]?\s*(.*)$/i;
    for (const raw of text.split(/\r?\n/)) {
      const m = raw.match(lineRe);
      if (m) {
        if (m[1].toLowerCase() === 'en') {
          if (current) pairs.push(current);
          current = { en: m[2].trim(), es: '' };
        } else {
          if (!current) current = { en: '', es: '' };
          current.es = m[2].trim();
        }
      } else if (/^\s*#\s*(PAG|PAGE|P[AÁ]GINA|P[AÁ]G)\.?\s*\d*[:.\-]?\s*$/i.test(raw.trim())) {
        continue;
      } else if (current && raw.trim()) {
        current.es = current.es ? `${current.es} ${raw.trim()}` : raw.trim();
      }
    }
    if (current && (current.en || current.es)) pairs.push(current);
    return pairs;
  }

  // Formato alternado (1 EN + 1 ES sin marcar)
  const lines: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trimEnd();
    if (!trimmed.trim() || isSeparator(line)) continue;
    lines.push(trimmed);
  }
  const pairs: LinePair[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    pairs.push({ en: lines[i], es: lines[i + 1] });
  }
  if (lines.length % 2 === 1) pairs.push({ en: lines[lines.length - 1], es: '' });
  return pairs;
}

function caretRangeFromPoint(x: number, y: number): Range | null {
  if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
  const pos = (document as any).caretPositionFromPoint?.(x, y);
  if (!pos) return null;
  const range = document.createRange();
  range.setStart(pos.offsetNode, pos.offset);
  return range;
}

async function fetchTranslation(word: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(word)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('translate failed');
    const json = await res.json();
    return json?.[0]?.[0]?.[0] ?? '';
  } catch {
    return '';
  }
}

interface PopoverState {
  word: string;
  en: string;
  es: string;
  x: number;
  y: number;
}

interface BilingualReaderProps {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveProgress?: (bookId: string, pairIndex: number, pairsCount: number) => void;
}

export default function BilingualReader({ book, open, onOpenChange, onSaveProgress }: BilingualReaderProps) {
  const pairs = useMemo(() => parseBilingualText(book.bilingual_txt || ''), [book.bilingual_txt]);
  const { addWord } = useVocabulary();
  const { toast } = useToast();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(17);
  const [showTranslation, setShowTranslation] = useState(true);
  const [currentPair, setCurrentPair] = useState(0);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [translation, setTranslation] = useState('');
  const [translating, setTranslating] = useState(false);
  const [savingVocab, setSavingVocab] = useState(false);
  const lastDbSaveRef = useRef(0);

  const savePosition = useCallback((pairIndex: number) => {
    try {
      localStorage.setItem(`${STORAGE_POS_PREFIX}${book.id}`, String(pairIndex));
    } catch {
      /* ignore */
    }
  }, [book.id]);

  const persistProgress = useCallback((pairIndex: number) => {
    if (!onSaveProgress || !pairs.length) return;
    savePosition(pairIndex);
    const now = Date.now();
    if (now - lastDbSaveRef.current > 15000 || pairIndex === pairs.length) {
      lastDbSaveRef.current = now;
      onSaveProgress(book.id, pairIndex, pairs.length);
    }
  }, [onSaveProgress, pairs.length, book.id, savePosition]);

  useEffect(() => {
    if (!open) return;
    setCurrentPair(0);
    setPopover(null);
    let saved = 0;
    try {
      saved = parseInt(localStorage.getItem(`${STORAGE_POS_PREFIX}${book.id}`) || '0', 10) || 0;
    } catch {
      /* ignore */
    }
    const restore = () => {
      const target = scrollRef.current?.querySelector<HTMLElement>(`[data-pair-index="${saved}"]`);
      if (target) target.scrollIntoView({ block: 'start' });
    };
    requestAnimationFrame(restore);
  }, [open, book.id]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !pairs.length) return;
    const containerTop = el.getBoundingClientRect().top;
    let visible = 0;
    const blocks = el.querySelectorAll<HTMLElement>('[data-pair-index]');
    for (const block of Array.from(blocks)) {
      if (block.getBoundingClientRect().top - containerTop <= 40) {
        visible = parseInt(block.dataset.pairIndex || '0', 10);
      } else break;
    }
    setCurrentPair(visible);
    savePosition(visible);
    persistProgress(visible);
  }, [pairs.length, savePosition, persistProgress]);

  const openPopover = (word: string, en: string, es: string, x: number, y: number) => {
    setPopover({ word, en, es, x, y });
    setTranslation('');
    setTranslating(true);
    fetchTranslation(word).then(t => {
      setTranslation(t);
      setTranslating(false);
    });
  };

  const handleEnLineClick = (e: React.MouseEvent<HTMLParagraphElement>, pair: LinePair) => {
    const selection = window.getSelection();
    const selectedText = selection && selection.toString().trim();
    if (selectedText && selectedText.length <= 60 && !selectedText.includes('\n')) {
      openPopover(selectedText, pair.en, pair.es, e.clientX, e.clientY);
      return;
    }
    const caret = caretRangeFromPoint(e.clientX, e.clientY);
    if (!caret || !caret.startContainer) return;
    const node = caret.startContainer as Text;
    const full = node.textContent || '';
    const idx = caret.startOffset;
    const beforeMatch = full.slice(0, idx).match(/([A-Za-zÀ-ÿ'’-]+)$/);
    const afterMatch = full.slice(idx).match(/^([A-Za-zÀ-ÿ'’-]+)/);
    const word = (beforeMatch?.[1] || '') + (afterMatch?.[1] || '');
    if (word) openPopover(word, pair.en, pair.es, e.clientX, e.clientY);
  };

  const saveVocab = async () => {
    if (!popover || savingVocab) return;
    setSavingVocab(true);
    const result = await addWord({
      word: popover.word,
      translation: translation || null,
      context_en: popover.en,
      context_es: popover.es,
      book_id: book.id,
      book_title: book.title,
      language: 'english',
    });
    setSavingVocab(false);
    if (result) {
      setPopover(null);
      toast({ title: 'Guardada', description: `"${popover.word}" añadida a tu vocabulario` });
    }
  };

  const closePopover = () => {
    setPopover(null);
    setTranslation('');
  };

  const handleClose = () => {
    savePosition(currentPair);
    persistProgress(pairs.length === 0 ? 0 : currentPair);
    onOpenChange(false);
  };

  const progressPercent = pairs.length ? Math.round((currentPair / pairs.length) * 100) : 0;
  const esFont = Math.round(fontSize * 0.8);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-full w-screen h-screen sm:max-w-full sm:rounded-none p-0 overflow-hidden flex flex-col [&>button:last-child]:hidden">
        {/* Header */}
        <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur px-4 md:px-8 py-3 flex items-center gap-3 z-20">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-base md:text-lg truncate flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-primary shrink-0" />
              {book.title}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {book.author ? `${book.author} · ` : ''}
              Párrafo {pairs.length ? Math.min(currentPair + 1, pairs.length) : 0} de {pairs.length} · {progressPercent}%
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant={showTranslation ? 'default' : 'outline'}
              onClick={() => setShowTranslation(s => !s)}
              className="hidden sm:inline-flex"
              title={showTranslation ? 'Ocultar traducción' : 'Mostrar traducción'}
            >
              <Languages className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setFontSize(f => Math.max(14, f - 1))} title="Reducir texto">
              <Minus className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setFontSize(f => Math.min(24, f + 1))} title="Agrandar texto">
              <Plus className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClose} title="Salir (Esc)" className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />{" "}
              <span className="hidden sm:inline text-sm">Salir</span>
            </Button>
          </div>
        </header>

        {/* Reading body */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-5 md:px-8 py-6 pb-24">
            <p className="text-xs text-muted-foreground mb-6 border-b border-border pb-3">
              Lea en inglés. Una palabra que no entiendas: haz <span className="font-medium text-foreground">doble clic</span> sobre ella para guardarla en tu vocabulario. La traducción está debajo en gris.
            </p>
            <div className="space-y-5">
              {pairs.map((pair, i) => (
                <div key={i} data-pair-index={i} className="leading-relaxed">
                  <p
                    onClick={(e) => handleEnLineClick(e, pair)}
                    className="text-foreground font-medium cursor-text select-text"
                    style={{ fontSize }}
                  >
                    {pair.en}
                  </p>
                  {showTranslation && pair.es && (
                    <p className="text-muted-foreground/80 italic mt-0.5 select-none" style={{ fontSize: esFont }}>
                      {pair.es}
                    </p>
                  )}
                </div>
              ))}
              {pairs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-16">El libro no tiene contenido bilingüe todavía.</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom progress */}
        <div className="shrink-0 border-t border-border px-4 py-2 bg-background/95 backdrop-blur absolute bottom-0 inset-x-0">
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* Vocabulary popover */}
        {popover && createPortal(
          <div
            className="fixed z-[100] w-80 bg-popover text-popover-foreground rounded-xl border border-border shadow-xl p-4"
            style={{ top: Math.min(popover.y, window.innerHeight - 240), left: Math.min(popover.x, window.innerWidth - 340) }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-semibold text-base break-words">{popover.word}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 italic">"{popover.es}"</p>
              </div>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={closePopover}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder={translating ? 'Traduciendo…' : 'Traducción…'}
                className="h-9 text-sm flex-1"
              />
              <Button size="sm" disabled={savingVocab} onClick={saveVocab}>
                {savingVocab ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpenCheck className="w-4 h-4" />}
                Guardar
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Badge variant="outline" className="text-[10px]">vocabulario inglés</Badge>
              {translating && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            </div>
          </div>,
          document.body
        )}
      </DialogContent>
    </Dialog>
  );
}