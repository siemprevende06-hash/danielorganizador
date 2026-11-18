import { useEffect, useMemo, useState } from 'react';
import { Headphones, Loader2, Mic, MicOff, RotateCcw, Volume2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Language } from '@/hooks/useLanguageLearning';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import {
  compararPronunciacion,
  levelBand,
  SPEAKING_LEVELS,
  type PronunciationScore,
  type SpeakingLevel,
} from '@/lib/speakingMetrics';
import { MINIMAL_PAIRS, PRONUNCIATION_PHRASES } from '@/lib/speakingContent';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
  level: string;
  /** Frase concreta (p. ej. la corrección de un turno) para repetirla (M6). */
  initialPhrase?: string | null;
}

/**
 * Entrenador de pronunciación (M1/M6/M8).
 *
 * Escuchar → repetir → comparar. La comparación es local (Levenshtein sobre
 * palabras normalizadas), así que no gasta ni una llamada al modelo.
 */
export function PronunciationTrainer({ open, onOpenChange, language, level, initialPhrase = null }: Props) {
  const band = levelBand(level);
  const [selectedLevel, setSelectedLevel] = useState<SpeakingLevel>(band);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [customPhrase, setCustomPhrase] = useState<string | null>(null);
  const [result, setResult] = useState<PronunciationScore | null>(null);
  const [heard, setHeard] = useState('');

  const phrases = PRONUNCIATION_PHRASES[language][selectedLevel];
  const phrase = phrases[phraseIndex] ?? phrases[0];
  const target = customPhrase ?? phrase?.text ?? '';
  const speechLang = language === 'italian' ? 'it-IT' : 'en-US';

  const { supported: ttsSupported, speak, stop: stopSpeak, speaking } = useSpeechSynthesis(speechLang, 1);

  const reset = () => {
    setResult(null);
    setHeard('');
  };

  const { supported: sttSupported, listening, start, stop, abort } = useSpeechRecognition({
    lang: speechLang,
    onFinal: (text, meta) => {
      const score = compararPronunciacion(target, text, meta.confidence);
      setResult(score);
      setHeard(text);
      if (score.total > 0 && score.score >= 80) {
        toast.success(`${score.score}% de palabras acertadas. Muy bien.`);
      }
    },
    onError: () => {
      toast.error('No pude usar el micrófono. Revisa el permiso del navegador.');
    },
    onEmpty: () => {
      toast.info('No te he oído. Inténtalo otra vez más cerca del micrófono.');
    },
  });

  useEffect(() => {
    if (!open) {
      abort();
      return;
    }
    setSelectedLevel(levelBand(level));
    setPhraseIndex(0);
    setCustomPhrase(initialPhrase?.trim() ? initialPhrase.trim() : null);
    setResult(null);
    setHeard('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPhrase, level, language]);

  useEffect(() => {
    if (!open) abort();
    return () => abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const minimalPairs = useMemo(() => (MINIMAL_PAIRS[language] ?? []).slice(0, 6), [language]);

  const playTarget = (rate?: number) => {
    if (!target) return;
    stopSpeak();
    speak(`pron-target-${rate ?? 1}-${Date.now()}`, target, rate);
  };

  const toggleRecording = () => {
    if (listening) {
      stop();
      return;
    }
    stopSpeak();
    reset();
    start();
  };

  const nextPhrase = () => {
    abort();
    reset();
    setPhraseIndex(index => (index + 1) % Math.max(1, phrases.length));
  };

  const close = () => {
    abort();
    stopSpeak();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={value => (value ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[92dvh] w-[min(34rem,94vw)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Headphones className="h-4 w-4 text-primary" />
            Pronunciación · {language === 'italian' ? 'Italiano' : 'Inglés'} {level}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escucha, repite y compara. La puntuación es local: no gasta llamadas al modelo.
          </DialogDescription>
        </DialogHeader>

        {customPhrase ? (
          <div className="flex items-start gap-2 rounded-xl border border-focus/30 bg-focus/[0.04] px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-focus">Repite tu frase corregida</p>
              <p className="mt-0.5 text-sm leading-snug">{customPhrase}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 px-2 text-[11px]"
              onClick={() => {
                setCustomPhrase(null);
                reset();
              }}
            >
              Ver lista
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {SPEAKING_LEVELS.map(value => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={selectedLevel === value ? 'default' : 'outline'}
                className="h-7 px-2.5 text-[11px]"
                onClick={() => {
                  setSelectedLevel(value);
                  setPhraseIndex(0);
                  reset();
                }}
              >
                {value}
                {value === band && <span className="ml-1 text-[9px] opacity-80">tu nivel</span>}
              </Button>
            ))}
            <Badge variant="outline" className="ml-auto text-[10px]">
              {phraseIndex + 1}/{phrases.length}
            </Badge>
          </div>
        )}

        {!customPhrase && phrase && (
          <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <p className="text-base font-medium leading-snug">{phrase.text}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{phrase.translation}</p>
            <Badge variant="outline" className="mt-1.5 text-[10px]">
              {phrase.focus}
            </Badge>
          </div>
        )}

        {customPhrase && !result && <p className="text-[11px] text-muted-foreground">Pulsa el micro y repite la frase tal cual.</p>}

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-[11px]"
            onClick={() => playTarget()}
            disabled={!ttsSupported || !target}
          >
            <Volume2 className={cn('h-3.5 w-3.5', speaking && 'animate-pulse')} />
            Escuchar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-[11px]"
            onClick={() => playTarget(0.75)}
            disabled={!ttsSupported || !target}
            title="Escuchar a 0,75×"
          >
            0,75×
          </Button>
          <Button
            type="button"
            size="sm"
            variant={listening ? 'default' : 'outline'}
            className={cn('h-11 gap-1 px-3 text-xs sm:h-8', listening && 'animate-pulse')}
            onClick={toggleRecording}
            disabled={!sttSupported || !target}
            title={sttSupported ? 'Grabar y comparar' : 'Reconocimiento de voz no disponible: usa Chrome o Edge'}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {listening ? 'Parar' : result ? 'Repetir' : 'Grabar'}
          </Button>
          {!customPhrase && (
            <Button type="button" size="sm" variant="ghost" className="ml-auto h-8 gap-1 text-[11px]" onClick={nextPhrase}>
              Siguiente
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>

        {!sttSupported && (
          <p className="text-[11px] text-muted-foreground">
            Este navegador no tiene reconocimiento de voz. Puedes escuchar las frases, pero para comparar usa Chrome o Edge.
          </p>
        )}

        {listening && !result && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Escuchando… di la frase completa y pulsa Parar.
          </p>
        )}

        {result && (
          <div className="space-y-2 rounded-2xl border border-border/70 px-3 py-3">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold tabular-nums">{result.score}%</p>
              <div className="min-w-0 flex-1">
                <Progress value={result.score} className="h-1.5" />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {result.correct}/{result.total} palabras acertadas
                  {result.confidence > 0 ? ` · confianza ${Math.round(result.confidence * 100)}%` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {result.words.map((word, index) => (
                <span
                  key={`${word.word}-${index}`}
                  title={word.heard ? `Se entendió: ${word.heard}` : 'No se entendió'}
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[11px]',
                    word.ok
                      ? 'border-success/40 bg-success/10 text-success'
                      : 'border-destructive/40 bg-destructive/10 text-destructive'
                  )}
                >
                  {word.word}
                  {!word.ok && word.heard && <span className="ml-1 opacity-70">({word.heard})</span>}
                </span>
              ))}
            </div>

            {heard && <p className="text-[10px] leading-snug text-muted-foreground">El reconocedor entendió: «{heard}»</p>}
            {result.score < 80 && (
              <p className="text-[11px] leading-snug text-muted-foreground">
                Vuelve a escucharla a 0,75×, exagera las palabras marcadas y repítela. No pasa nada si necesitas tres intentos.
              </p>
            )}
            {result.score >= 80 && (
              <p className="text-[11px] leading-snug text-success">
                Suficientemente claro. Pasa a la siguiente frase o llévala a la conversación.
              </p>
            )}
          </div>
        )}

        {!customPhrase && minimalPairs.length > 0 && (
          <section className="space-y-1.5">
            <p className="text-[11px] font-semibold">Pares mínimos (distingue el sonido)</p>
            <div className="grid gap-1">
              {minimalPairs.map(pair => (
                <div key={`${pair.a}-${pair.b}`} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-2 py-1">
                  <button
                    type="button"
                    className="rounded px-1.5 py-0.5 text-[11px] font-medium hover:bg-muted"
                    onClick={() => {
                      stopSpeak();
                      speak(`pair-a-${pair.a}-${Date.now()}`, pair.a, 0.85);
                    }}
                  >
                    {pair.a}
                  </button>
                  <span className="text-[10px] text-muted-foreground">vs</span>
                  <button
                    type="button"
                    className="rounded px-1.5 py-0.5 text-[11px] font-medium hover:bg-muted"
                    onClick={() => {
                      stopSpeak();
                      speak(`pair-b-${pair.b}-${Date.now()}`, pair.b, 0.85);
                    }}
                  >
                    {pair.b}
                  </button>
                  <span className="ml-auto hidden max-w-[55%] truncate text-[10px] text-muted-foreground sm:block" title={pair.hint}>
                    {pair.hint}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-[10px] leading-snug text-muted-foreground">
          Si el navegador no expone confianza (Chrome suele devolver 0), la nota se basa solo en las palabras acertadas. No es una
          nota de examen: es una pista para repetir mejor.
        </p>

        <Button type="button" variant="ghost" size="sm" className="h-8 w-full text-[11px]" onClick={close}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cerrar entrenador
        </Button>
      </DialogContent>
    </Dialog>
  );
}
