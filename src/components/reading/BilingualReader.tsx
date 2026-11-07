import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Book, effectiveStartDate, effectiveFinishDate } from '@/hooks/useReadingLibrary';
import { useSpeechReader, splitIntoSpeechChunks, SPEECH_LANG_LABEL } from '@/hooks/useSpeechReader';
import type { SpeechLang, SpeechSegment } from '@/hooks/useSpeechReader';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { X, Plus, Minus, Languages, BookOpenCheck, Loader2, ChevronLeft, ChevronRight, BookMarked, ScrollText, AlignLeft, AlignJustify, AlignCenter, Calendar, Volume2, Pause, Play } from 'lucide-react';

export interface LinePair {
  en: string;
  es: string;
}

export interface BookPage {
  pageNumber?: number;
  pairs: LinePair[];
}

type ReaderMode = 'book' | 'scroll';
type TextAlign = 'left' | 'justify' | 'center';
type TranslationMode = 'both' | 'en' | 'es';

const nextTranslationMode = (m: TranslationMode): TranslationMode =>
  m === 'both' ? 'en' : m === 'en' ? 'es' : 'both';

/** yyyy-MM-dd (o ISO) → "12 ago 2026", sin corrimientos de zona horaria. */
const fmtBookDate = (value?: string | null) => {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return isNaN(d.getTime()) ? null : format(d, 'd MMM yyyy', { locale: es });
};

const STORAGE_POS_PREFIX = 'bil-reader-pos-';
const STORAGE_MODE_PREFIX = 'bil-reader-mode-';
const STORAGE_ALIGN_PREFIX = 'bil-reader-align-';
const STORAGE_SPEECH_LANG = 'bil-reader-speech-lang';
const PAIRS_PER_PAGE = 25;

const ALIGN_OPTIONS: { value: TextAlign; label: string; Icon: typeof AlignLeft }[] = [
  { value: 'left', label: 'Alinear a la izquierda', Icon: AlignLeft },
  { value: 'justify', label: 'Justificar párrafo', Icon: AlignJustify },
  { value: 'center', label: 'Centrar texto', Icon: AlignCenter },
];

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

export function parseBilingualPages(text: string): BookPage[] {
  if (!text) return [];
  const all = text.split(/\r?\n/);

  // Formato recomendado: pares #EN/#ES agrupados en #PAG (páginas del libro original)
  if (all.some(l => /^\s*#\s*(EN|ES)\b/i.test(l))) {
    const pages: BookPage[] = [];
    let current: BookPage | null = null;
    let lastPair: LinePair | null = null;
    const lineRe = /^\s*#\s*(EN|ES)\s*[:.\-]?\s*(.*)$/i;
    const pagRe = /^\s*#\s*(PAG|PAGE|P[AÁ]GINA|P[AÁ]G)\.?\s*(\d*)\s*[:.\-]?\s*$/i;
    for (const raw of all) {
      const pagM = raw.trim().match(pagRe);
      if (pagM) {
        if (current) pages.push(current);
        current = { pageNumber: pagM[2] ? parseInt(pagM[2], 10) : undefined, pairs: [] };
        lastPair = null;
        continue;
      }
      const m = raw.match(lineRe);
      if (m) {
        if (m[1].toLowerCase() === 'en') {
          lastPair = { en: m[2].trim(), es: '' };
          if (current) current.pairs.push(lastPair);
        } else if (lastPair) {
          lastPair.es = m[2].trim();
        }
      } else if (current && lastPair && raw.trim()) {
        lastPair.es = lastPair.es ? `${lastPair.es} ${raw.trim()}` : raw.trim();
      }
    }
    if (current) pages.push(current);
    if (pages.length) return pages;
  }

  // Sin marcadores: páginas sintéticas de PAIRS_PER_PAGE pares
  const pairs = parseBilingualText(text);
  const pages: BookPage[] = [];
  for (let i = 0; i < pairs.length; i += PAIRS_PER_PAGE) {
    pages.push({ pairs: pairs.slice(i, i + PAIRS_PER_PAGE) });
  }
  return pages;
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
  onSaveProgress?: (bookId: string, position: number, totalPositions: number) => void;
}

export default function BilingualReader({ book, open, onOpenChange, onSaveProgress }: BilingualReaderProps) {
  const pages = useMemo(() => parseBilingualPages(book.bilingual_txt || ''), [book.bilingual_txt]);
  const totalPairs = useMemo(() => pages.reduce((acc, p) => acc + p.pairs.length, 0), [pages]);
  const ranges = useMemo(() => {
    const out: { start: number; end: number; pageNumber?: number }[] = [];
    let acc = 0;
    for (const p of pages) {
      out.push({ start: acc, end: acc + p.pairs.length, pageNumber: p.pageNumber });
      acc += p.pairs.length;
    }
    return out;
  }, [pages]);
  const allPairs = useMemo(() => pages.flatMap(p => p.pairs), [pages]);

  const { addWord } = useVocabulary();
  const { toast } = useToast();

  const scrollRef = useRef<HTMLDivElement>(null);
  const bookScrollRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef(false);
  const lastDbSaveRef = useRef(0);
  const [mode, setMode] = useState<ReaderMode>('book');
  const [pageIndex, setPageIndex] = useState(0);
  const [currentPair, setCurrentPair] = useState(0);
  const [fontSize, setFontSize] = useState(17);
  const [align, setAlign] = useState<TextAlign>('justify');
  const [translationMode, setTranslationMode] = useState<TranslationMode>('both');
  const [speechLang, setSpeechLang] = useState<SpeechLang>(() => {
    try {
      return localStorage.getItem(STORAGE_SPEECH_LANG) === 'es' ? 'es' : 'en';
    } catch {
      return 'en';
    }
  });
  const [speechFromPair, setSpeechFromPair] = useState(0);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [translation, setTranslation] = useState('');
  const [translating, setTranslating] = useState(false);
  const [savingVocab, setSavingVocab] = useState(false);

  const totalPages = pages.length;

  const pageIndexForPair = useCallback((pairIndex: number) => {
    if (!ranges.length) return 0;
    for (let i = 0; i < ranges.length; i++) {
      if (pairIndex < ranges[i].end) return i;
    }
    return ranges.length - 1;
  }, [ranges]);

  const getSpeechSegments = useCallback((lang: SpeechLang, fromPair: number): SpeechSegment[] => {
    const segments: SpeechSegment[] = [];
    for (let i = Math.max(0, fromPair); i < allPairs.length; i++) {
      const text = (lang === 'en' ? allPairs[i].en : allPairs[i].es)?.trim();
      if (!text) continue;
      for (const chunk of splitIntoSpeechChunks(text)) {
        segments.push({ pairIndex: i, text: chunk });
      }
    }
    return segments;
  }, [allPairs]);

  const {
    supported: speechSupported,
    status: speechStatus,
    activePairIndex: activeSpeechPair,
    start: startSpeech,
    pause: pauseSpeech,
    resume: resumeSpeech,
    stop: stopSpeech,
  } = useSpeechReader({ getSegments: getSpeechSegments });

  const savePosition = useCallback((pairIndex: number) => {
    try {
      localStorage.setItem(`${STORAGE_POS_PREFIX}${book.id}`, String(pairIndex));
    } catch {
      /* ignore */
    }
  }, [book.id]);

  const persistProgress = useCallback((pairIndex: number, force = false) => {
    if (!onSaveProgress || totalPairs === 0) return;
    const target = Math.min(Math.max(pairIndex, 0), totalPairs - 1);
    savePosition(target);
    const now = Date.now();
    if (force || now - lastDbSaveRef.current > 15000) {
      lastDbSaveRef.current = now;
      onSaveProgress(book.id, target, totalPairs);
    }
  }, [onSaveProgress, totalPairs, book.id, savePosition]);

  const goToPage = useCallback((target: number) => {
    const r = ranges[target];
    if (!r) return;
    if (speechStatus !== 'idle') stopSpeech();
    setPopover(null);
    setPageIndex(target);
    setCurrentPair(Math.min(r.start, totalPairs - 1));
    persistProgress(Math.min(r.start, totalPairs - 1));
  }, [ranges, totalPairs, persistProgress, speechStatus, stopSpeech]);

  const changeMode = useCallback((m: ReaderMode) => {
    if (speechStatus !== 'idle') stopSpeech();
    setMode(m);
    setPopover(null);
    try {
      localStorage.setItem(`${STORAGE_MODE_PREFIX}${book.id}`, m);
    } catch {
      /* ignore */
    }
    if (m === 'scroll') {
      restoreRef.current = true;
    }
  }, [book.id, speechStatus, stopSpeech]);

  const cycleAlign = useCallback(() => {
    setAlign(prev => {
      const idx = ALIGN_OPTIONS.findIndex(o => o.value === prev);
      const next = ALIGN_OPTIONS[(idx + 1) % ALIGN_OPTIONS.length].value;
      try {
        localStorage.setItem(`${STORAGE_ALIGN_PREFIX}${book.id}`, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [book.id]);

  const activeAlign = ALIGN_OPTIONS.find(o => o.value === align) || ALIGN_OPTIONS[0];

  // Al abrir: restaurar posición (BD → localStorage) y modo
  useEffect(() => {
    if (!open) return;
    setPopover(null);
    setTranslation('');
    let savedPos = 0;
    if (typeof book.reading_pair_index === 'number' && book.reading_pair_index >= 0) {
      savedPos = book.reading_pair_index;
    } else {
      try {
        savedPos = parseInt(localStorage.getItem(`${STORAGE_POS_PREFIX}${book.id}`) || '0', 10) || 0;
      } catch {
        /* ignore */
      }
    }
    const clamped = totalPairs ? Math.min(Math.max(savedPos, 0), totalPairs - 1) : 0;
    setCurrentPair(clamped);
    setPageIndex(pageIndexForPair(clamped));
    let savedMode: ReaderMode = 'book';
    try {
      savedMode = localStorage.getItem(`${STORAGE_MODE_PREFIX}${book.id}`) === 'scroll' ? 'scroll' : 'book';
    } catch {
      /* ignore */
    }
    setMode(savedMode);
    restoreRef.current = savedMode === 'scroll';
    let savedAlign: TextAlign = 'justify';
    try {
      const stored = localStorage.getItem(`${STORAGE_ALIGN_PREFIX}${book.id}`) as TextAlign | null;
      if (stored && ALIGN_OPTIONS.some(o => o.value === stored)) savedAlign = stored;
    } catch {
      /* ignore */
    }
    setAlign(savedAlign);
  }, [open, book.id, book.reading_pair_index, totalPairs, pageIndexForPair]);

  // Scroll hasta la posición restaurada (modo scroll)
  useEffect(() => {
    if (!open || mode !== 'scroll' || !restoreRef.current) return;
    restoreRef.current = false;
    const t = setTimeout(() => {
      const target = scrollRef.current?.querySelector<HTMLElement>(`[data-pair-index="${currentPair}"]`);
      if (target) target.scrollIntoView({ block: 'start' });
    }, 80);
    return () => clearTimeout(t);
  }, [open, mode, currentPair]);

  // Mantener índices válidos si cambia el texto
  useEffect(() => {
    if (totalPages && pageIndex >= totalPages) setPageIndex(0);
    if (totalPairs && currentPair >= totalPairs) setCurrentPair(totalPairs - 1);
  }, [totalPages, totalPairs, pageIndex, currentPair]);

  // Navegación con teclado (solo modo libro; Esc lo maneja el Dialog)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (mode !== 'book') return;
      if (e.key === 'ArrowRight') goToPage(pageIndex + 1);
      else if (e.key === 'ArrowLeft') goToPage(pageIndex - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, mode, pageIndex, goToPage]);

  // La lectura en voz alta avanza de página automáticamente y guarda el progreso.
  useEffect(() => {
    if (activeSpeechPair == null) return;
    const target = pageIndexForPair(activeSpeechPair);
    setPageIndex(prev => (prev === target ? prev : target));
  }, [activeSpeechPair, pageIndexForPair]);

  useEffect(() => {
    if (activeSpeechPair == null) return;
    persistProgress(activeSpeechPair);
  }, [activeSpeechPair, persistProgress]);

  // Mantener a la vista el fragmento que se está leyendo.
  useEffect(() => {
    if (activeSpeechPair == null) return;
    const container = mode === 'scroll' ? scrollRef.current : bookScrollRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-pair-index="${activeSpeechPair}"]`);
    if (!el) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    if (eRect.top < cRect.top + 16 || eRect.bottom > cRect.bottom - 16) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeSpeechPair, pageIndex, mode]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !totalPairs) return;
    const containerTop = el.getBoundingClientRect().top;
    let visible = 0;
    const blocks = el.querySelectorAll<HTMLElement>('[data-pair-index]');
    for (const block of Array.from(blocks)) {
      if (block.getBoundingClientRect().top - containerTop <= 60) {
        visible = parseInt(block.dataset.pairIndex || '0', 10);
      } else break;
    }
    setCurrentPair(visible);
    setPageIndex(pageIndexForPair(visible));
    persistProgress(visible);
  }, [totalPairs, pageIndexForPair, persistProgress]);

  const speechStartPair = () =>
    mode === 'book'
      ? Math.min(ranges[pageIndex]?.start ?? 0, Math.max(0, totalPairs - 1))
      : currentPair;

  const handleSpeechLanguage = (next: SpeechLang) => {
    if (next === speechLang) return;
    setSpeechLang(next);
    try {
      localStorage.setItem(STORAGE_SPEECH_LANG, next);
    } catch {
      /* ignore */
    }
    if (next === 'en' && translationMode === 'es') setTranslationMode('both');
    if (next === 'es' && translationMode === 'en') setTranslationMode('both');
    if (speechStatus !== 'idle') {
      const from = activeSpeechPair ?? speechStartPair();
      stopSpeech();
      setSpeechFromPair(from);
      if (!startSpeech(from, next)) {
        toast({ title: 'Sin texto para leer', description: `No hay texto en ${SPEECH_LANG_LABEL[next]} desde este punto.` });
      }
    }
  };

  const handleToggleSpeech = () => {
    if (!speechSupported) {
      toast({
        title: 'Lectura en voz alta no disponible',
        description: 'Este navegador no permite la síntesis de voz.',
      });
      return;
    }
    if (speechStatus === 'playing') {
      pauseSpeech();
      return;
    }
    if (speechStatus === 'paused') {
      resumeSpeech();
      return;
    }
    if (speechLang === 'en' && translationMode === 'es') setTranslationMode('both');
    if (speechLang === 'es' && translationMode === 'en') setTranslationMode('both');
    const from = speechStartPair();
    setSpeechFromPair(from);
    if (!startSpeech(from, speechLang)) {
      toast({
        title: 'Sin texto para leer',
        description: `No hay texto en ${SPEECH_LANG_LABEL[speechLang]} desde este punto.`,
      });
    }
  };

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
    if (selectedText && selectedText.length >= 2 && selectedText.length <= 60 && !selectedText.includes('\n')) {
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
      setTranslation('');
      toast({ title: 'Guardada', description: `"${popover.word}" añadida a tu vocabulario` });
    }
  };

  const closePopover = () => {
    setPopover(null);
    setTranslation('');
  };

  // Tocar el texto o la barra inferior cierra la pestaña de definición
  const handleBackgroundPointerDown = () => {
    if (popover) closePopover();
  };

  const handleClose = () => {
    const speechPos = activeSpeechPair;
    stopSpeech();
    let pos = currentPair;
    if (speechPos != null) pos = Math.min(speechPos, totalPairs ? totalPairs - 1 : 0);
    else if (mode === 'book' && ranges[pageIndex]) pos = Math.min(ranges[pageIndex].start, totalPairs ? totalPairs - 1 : 0);
    savePosition(pos);
    persistProgress(pos, true);
    try {
      if (onSaveProgress && totalPairs > 0) {
        onSaveProgress(book.id, Math.min(Math.max(pos, 0), totalPairs - 1), totalPairs);
      }
    } catch { /* ignore */ }
    onOpenChange(false);
  };

  const progressPercent = mode === 'book'
    ? (totalPages ? Math.round((pageIndex / totalPages) * 100) : 0)
    : (totalPairs ? Math.round((currentPair / totalPairs) * 100) : 0);
  const currentPageNumber = ranges[pageIndex]?.pageNumber;
  const displayPage = currentPageNumber ?? pageIndex + 1;
  const currentPairsEmpty = (pages[pageIndex]?.pairs.length ?? 0) === 0;
  const esFont = Math.round(fontSize * 0.8);
  const speechProgress = activeSpeechPair == null
    ? 0
    : Math.min(100, Math.max(0, ((activeSpeechPair - speechFromPair) / Math.max(1, totalPairs - 1 - speechFromPair)) * 100));

  const renderPair = (pair: LinePair, pairIndex: number) => {
    const isActive = activeSpeechPair === pairIndex;
    return (
      <div
        key={pairIndex}
        data-pair-index={pairIndex}
        aria-current={isActive ? 'true' : undefined}
        className={cn(
          'relative rounded-md -mx-2 px-2 py-0.5 leading-relaxed transition-colors duration-300',
          isActive && 'bg-primary/[0.06]'
        )}
      >
        {isActive && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary',
              speechStatus === 'playing' && 'animate-pulse'
            )}
          />
        )}
        {translationMode !== 'es' && (
          <p
            onClick={(e) => handleEnLineClick(e, pair)}
            className="text-foreground font-medium cursor-text select-text"
            style={{ fontSize, textAlign: align, hyphens: 'auto' }}
          >
            {pair.en}
          </p>
        )}
        {translationMode !== 'en' && pair.es && (
          <p
            className={translationMode === 'es'
              ? 'text-foreground font-medium select-text'
              : 'text-muted-foreground/80 italic mt-0.5 select-none'}
            style={{ fontSize: translationMode === 'es' ? fontSize : esFont, textAlign: align, hyphens: 'auto' }}
          >
            {pair.es}
          </p>
        )}
      </div>
    );
  };

  const renderSpeechControls = () => {
    const label = speechStatus === 'playing'
      ? 'Pausar lectura en voz alta'
      : speechStatus === 'paused'
        ? 'Continuar lectura en voz alta'
        : `Escuchar en ${SPEECH_LANG_LABEL[speechLang]}`;
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center rounded-lg bg-muted p-0.5" role="group" aria-label="Idioma de lectura en voz alta">
          {(['en', 'es'] as SpeechLang[]).map(l => (
            <button
              key={l}
              type="button"
              onClick={() => handleSpeechLanguage(l)}
              aria-pressed={speechLang === l}
              title={`Leer en voz alta en ${SPEECH_LANG_LABEL[l]}`}
              className={cn(
                'h-7 px-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-colors',
                speechLang === l
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant={speechStatus === 'playing' ? 'default' : 'outline'}
          onClick={handleToggleSpeech}
          className="h-7 px-2"
          title={label}
          aria-label={label}
        >
          {speechStatus === 'playing'
            ? <Pause className="w-3.5 h-3.5" />
            : speechStatus === 'paused'
              ? <Play className="w-3.5 h-3.5" />
              : <Volume2 className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline text-xs ml-1">
            {speechStatus === 'playing' ? 'Pausar' : speechStatus === 'paused' ? 'Seguir' : 'Escuchar'}
          </span>
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent
        className="!flex flex-col max-w-none w-full h-[100dvh] max-h-[100dvh] sm:rounded-none p-0 overflow-hidden [&>button:last-child]:hidden"
        onEscapeKeyDown={(e) => { if (popover) { e.preventDefault(); closePopover(); } }}
      >
        {/* Header */}
        <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur px-4 md:px-8 py-3 flex items-center gap-3 z-20">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-base md:text-lg truncate flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-primary shrink-0" />
              {book.title}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {book.author ? `${book.author} · ` : ''}
              Página {displayPage} de {totalPages} · {progressPercent}%
              {speechStatus === 'playing' && (
                <span className="text-primary"> · Leyendo en {SPEECH_LANG_LABEL[speechLang]}</span>
              )}
              {speechStatus === 'paused' && <span className="text-primary"> · En pausa</span>}
            </p>
            <span className="sr-only" role="status" aria-live="polite">
              {speechStatus === 'playing'
                ? `Leyendo en voz alta en ${SPEECH_LANG_LABEL[speechLang]}, página ${displayPage}`
                : speechStatus === 'paused'
                  ? 'Lectura en voz alta en pausa'
                  : ''}
            </span>
            {(effectiveStartDate(book) || effectiveFinishDate(book)) && (
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-2">
                <Calendar className="w-3 h-3 shrink-0" />
                {[
                  effectiveStartDate(book) ? `Inicio ${fmtBookDate(effectiveStartDate(book))}` : null,
                  effectiveFinishDate(book) ? `Fin ${fmtBookDate(effectiveFinishDate(book))}` : null,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden sm:block">{renderSpeechControls()}</div>
            <div className="hidden sm:flex items-center rounded-lg bg-muted p-0.5">
              <Button size="sm" variant={mode === 'book' ? 'default' : 'ghost'} className="h-7 px-2 text-xs" onClick={() => changeMode('book')}>
                <BookMarked className="w-3.5 h-3.5 mr-1" /> Libro
              </Button>
              <Button size="sm" variant={mode === 'scroll' ? 'default' : 'ghost'} className="h-7 px-2 text-xs" onClick={() => changeMode('scroll')}>
                <ScrollText className="w-3.5 h-3.5 mr-1" /> Scroll
              </Button>
            </div>
            <Button
              size="sm"
              variant={translationMode === 'en' ? 'outline' : 'default'}
              onClick={() => setTranslationMode(nextTranslationMode)}
              className="hidden md:inline-flex"
              title={
                translationMode === 'both'
                  ? 'Bilingüe: toca para ver solo inglés'
                  : translationMode === 'en'
                    ? 'Solo inglés: toca para ver solo español'
                    : 'Solo español: toca para ver bilingüe'
              }
            >
              <Languages className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setFontSize(f => Math.max(14, f - 1))} title="Reducir texto">
              <Minus className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setFontSize(f => Math.min(24, f + 1))} title="Agrandar texto">
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cycleAlign}
              title={activeAlign.label}
              aria-label={activeAlign.label}
            >
              <activeAlign.Icon className="w-4 h-4" />
              <span className="hidden lg:inline text-xs">{activeAlign.label}</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClose} title="Salir (Esc)" className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />{" "}
              <span className="hidden sm:inline text-sm">Salir</span>
            </Button>
          </div>
        </header>

        {/* Indicador minimalista del avance de la lectura en voz alta */}
        {speechStatus !== 'idle' && (
          <div className="shrink-0 h-0.5 w-full bg-primary/10" aria-hidden="true">
            <div
              className={cn(
                'h-full bg-primary transition-[width] duration-500 ease-linear',
                speechStatus === 'paused' && 'opacity-40'
              )}
              style={{ width: `${speechProgress}%` }}
            />
          </div>
        )}

        {/* Selector de modo y lectura en voz alta en móvil (no caben en header) */}
        <div className="sm:hidden shrink-0 border-b border-border bg-background px-4 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button size="sm" variant={mode === 'book' ? 'default' : 'outline'} className="h-7 px-3 text-xs" onClick={() => changeMode('book')}>
              <BookMarked className="w-3.5 h-3.5 mr-1" /> Libro
            </Button>
            <Button size="sm" variant={mode === 'scroll' ? 'default' : 'outline'} className="h-7 px-3 text-xs" onClick={() => changeMode('scroll')}>
              <ScrollText className="w-3.5 h-3.5 mr-1" /> Scroll
            </Button>
          </div>
          {renderSpeechControls()}
        </div>

        {/* Reading body */}
        {mode === 'book' ? (
          <div ref={bookScrollRef} className="flex-1 min-h-0 overflow-y-auto" onPointerDown={handleBackgroundPointerDown}>
            <div className="max-w-3xl mx-auto px-5 md:px-8 py-6 pb-10">
              <div className="space-y-5">
                {(pages[pageIndex]?.pairs ?? []).map((pair, i) =>
                  renderPair(pair, (ranges[pageIndex]?.start ?? 0) + i)
                )}
                {currentPairsEmpty && (
                  <p className="text-sm text-muted-foreground text-center py-16">El libro no tiene contenido bilingüe todavía.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div ref={scrollRef} onScroll={handleScroll} onPointerDown={handleBackgroundPointerDown} className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-5 md:px-8 py-6 pb-10">
              <div className="space-y-5">
                {allPairs.map((pair, i) => renderPair(pair, i))}
                {allPairs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-16">El libro no tiene contenido bilingüe todavía.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur z-10" onPointerDown={handleBackgroundPointerDown}>
          {mode === 'book' ? (
            <div className="px-4 py-2.5 flex items-center justify-between gap-3">
              <Button size="sm" variant="outline" onClick={() => goToPage(pageIndex - 1)} disabled={totalPages === 0 || pageIndex <= 0}>
                <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Anterior</span>
              </Button>
              <span className="text-xs text-muted-foreground text-center">
                Página <span className="font-semibold text-foreground">{displayPage}</span> de {totalPages}
              </span>
              <Button size="sm" variant="outline" onClick={() => goToPage(pageIndex + 1)} disabled={totalPages === 0 || pageIndex >= totalPages - 1}>
                <span className="hidden sm:inline">Siguiente</span> <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="px-4 py-2.5 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">
                Página <span className="font-semibold text-foreground">{displayPage}</span> de {totalPages}
              </span>
            </div>
          )}
          <Progress value={progressPercent} className="h-1" />
        </div>

        {/* Vocabulary popover - rendered inside DialogContent (never portaled to body):
            Radix Dialog blocks pointer events outside its content subtree, so a body portal
            would leave "Guardar"/"Cerrar" and click-outside completely dead. */}
        {popover && (
          <div
            role="dialog"
            aria-label={`Definición de ${popover.word}`}
            className="fixed z-30 w-[min(20rem,calc(100vw-1rem))] pointer-events-auto bg-popover text-popover-foreground rounded-xl border border-border shadow-xl p-4"
            style={{
              top: Math.max(8, Math.min(popover.y, window.innerHeight - 250)),
              left: Math.max(8, Math.min(popover.x, window.innerWidth - Math.min(336, window.innerWidth - 16) - 8)),
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-semibold text-base break-words">{popover.word}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 italic">"{popover.es}"</p>
              </div>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={closePopover} title="Cerrar" aria-label="Cerrar">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveVocab(); }}
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
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                {translating && <Loader2 className="w-3 h-3 animate-spin" />}
                Toca fuera o Esc para cerrar
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}