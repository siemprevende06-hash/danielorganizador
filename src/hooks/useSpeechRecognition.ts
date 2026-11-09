import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

const getSpeechRecognition = (): SpeechRecognitionConstructor | undefined => {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

interface Options {
  lang: string;
  /** Transcripción final completa al terminar la escucha (manual o por silencio). */
  onFinal?: (text: string) => void;
  /** Códigos de error relevantes: 'not-allowed', 'network', 'silencio'... */
  onError?: (code: string) => void;
}

/** Silencios seguidos permitidos en modo manos libres antes de rendirse. */
const MAX_SILENCIOS = 4;
/** Algunos navegadores no disparan onend al llamar stop(): forzamos el cierre. */
const STOP_FALLBACK_MS = 1400;

/**
 * Reconocimiento de voz con una transcripción fiable.
 *
 * Chrome a veces repite el mismo resultado final (sobre todo al parar o al
 * reiniciar la escucha en modo continuo). Por eso los resultados finales se
 * guardan por índice absoluto en un Map: cada fragmento se añade una sola vez
 * aunque el navegador lo emita de nuevo. Además, `onFinal` se entrega como
 * máximo una vez por sesión de escucha.
 */
export function useSpeechRecognition({ lang, onFinal, onError }: Options) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalsRef = useRef<Map<number, string>>(new Map());
  const sessionRef = useRef(0);
  const finalizedRef = useRef(false);
  const abortedRef = useRef(false);
  const langRef = useRef(lang);
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  const manualRef = useRef(false);
  const listeningRef = useRef(false);
  const silenciosRef = useRef(0);
  const stopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    langRef.current = lang;
    onFinalRef.current = onFinal;
    onErrorRef.current = onError;
  });

  const supported = !!getSpeechRecognition();

  const clearStopTimer = useCallback(() => {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  /** Junta los fragmentos finales en orden, sin repetir índices. */
  const finalText = useCallback(() => {
    return [...finalsRef.current.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, text]) => text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  /** Suelta el micrófono SIN entregar la transcripción. */
  const soltar = useCallback(() => {
    clearStopTimer();
    sessionRef.current += 1;
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* noop */
      }
    }
    listeningRef.current = false;
    setListening(false);
    setInterim('');
  }, [clearStopTimer]);

  /** Cierra la sesión y entrega la transcripción una única vez. */
  const finalize = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    clearStopTimer();

    const text = finalText();
    finalsRef.current.clear();
    listeningRef.current = false;
    setListening(false);
    setInterim('');

    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* noop */
      }
    }

    if (abortedRef.current) return;

    if (text) {
      silenciosRef.current = 0;
      onFinalRef.current?.(text);
      return;
    }

    // Silencio seguido: no insistir eternamente con el micro abierto.
    if (!manualRef.current) {
      silenciosRef.current += 1;
      if (silenciosRef.current >= MAX_SILENCIOS) {
        silenciosRef.current = 0;
        manualRef.current = true;
        onErrorRef.current?.('silencio');
      }
    }
  }, [clearStopTimer, finalText]);

  /** Para y entrega la transcripción (es lo que hace "soltar para enviar"). */
  const stop = useCallback(() => {
    manualRef.current = true;
    clearStopTimer();
    if (!recRef.current) return;
    try {
      recRef.current.stop();
    } catch {
      /* noop */
    }
    // Red de seguridad: si el navegador no dispara onend, cerramos igual.
    stopTimerRef.current = window.setTimeout(() => finalize(), STOP_FALLBACK_MS);
  }, [clearStopTimer, finalize]);

  /** Corta la escucha SIN entregar la transcripción. */
  const abort = useCallback(() => {
    abortedRef.current = true;
    manualRef.current = true;
    finalizedRef.current = true;
    finalsRef.current.clear();
    soltar();
  }, [soltar]);

  const start = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast.error('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }
    if (recRef.current) {
      // Se evita relanzar mientras el micrófono sigue abierto.
      if (listeningRef.current) return;
      soltar();
    }

    clearStopTimer();
    finalsRef.current.clear();
    finalizedRef.current = false;
    abortedRef.current = false;
    manualRef.current = false;
    setInterim('');

    const session = ++sessionRef.current;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = langRef.current;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    const isCurrent = () => session === sessionRef.current && recRef.current === rec;

    rec.onresult = e => {
      if (!isCurrent() || abortedRef.current) return;
      let live = '';
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        const text = (res?.[0]?.transcript || '').trim();
        if (res.isFinal) {
          if (text) {
            // La clave es el índice absoluto del resultado: si Chrome repite
            // el mismo final, se sobrescribe en vez de duplicarse.
            finalsRef.current.set(i, text);
            silenciosRef.current = 0;
          }
        } else if (text) {
          live = live ? `${live} ${text}` : text;
        }
      }
      const final = finalText();
      setInterim(live ? `${final} ${live}`.trim() : final);
    };

    rec.onerror = e => {
      if (!isCurrent()) return;
      const code = e?.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        manualRef.current = true;
        abortedRef.current = true;
        toast.error('Permiso de micrófono denegado. Actívalo en la configuración de tu navegador.');
        onErrorRef.current?.(code);
      } else if (code === 'network') {
        manualRef.current = true;
        toast.error('Error de red en el reconocimiento de voz. Revisa tu conexión.');
        onErrorRef.current?.(code);
      } else if (code === 'audio-capture') {
        manualRef.current = true;
        toast.error('No encuentro el micrófono. Revisa tu dispositivo.');
        onErrorRef.current?.(code);
      }
      // 'no-speech' es normal: onend hará la cuenta de silencios.
    };

    rec.onend = () => {
      if (!isCurrent()) return;
      finalize();
    };

    try {
      rec.start();
      listeningRef.current = true;
      setListening(true);
    } catch {
      recRef.current = null;
      listeningRef.current = false;
      setListening(false);
    }
  }, [clearStopTimer, finalText, finalize, soltar]);

  useEffect(() => () => soltar(), [soltar]);

  return { supported, listening, interim, start, stop, abort };
}
