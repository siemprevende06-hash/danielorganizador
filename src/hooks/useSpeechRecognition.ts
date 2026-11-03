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

export function useSpeechRecognition({ lang, onFinal, onError }: Options) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef('');
  const langRef = useRef(lang);
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  const manualRef = useRef(false);
  const listeningRef = useRef(false);
  const silenciosRef = useRef(0);

  useEffect(() => {
    langRef.current = lang;
    onFinalRef.current = onFinal;
    onErrorRef.current = onError;
  });

  const supported = !!getSpeechRecognition();

  const soltar = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    try {
      rec.abort();
    } catch {
      /* noop */
    }
    recRef.current = null;
  }, []);

  /** Para y entrega la transcripción (es lo que hace "soltar para enviar"). */
  const stop = useCallback(() => {
    manualRef.current = true;
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
  }, []);

  /** Corta la escucha SIN entregar la transcripción. */
  const abort = useCallback(() => {
    manualRef.current = true;
    soltar();
    finalRef.current = '';
    listeningRef.current = false;
    setListening(false);
    setInterim('');
  }, [soltar]);

  const start = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast.error('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }
    if (recRef.current) {
      // Se evita relanzar mientras el micrófono sigue abierto
      if (listeningRef.current) return;
      soltar();
    }

    finalRef.current = '';
    manualRef.current = false;
    setInterim('');

    const rec = new SR();
    recRef.current = rec;
    rec.lang = langRef.current;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = e => {
      let live = '';
      for (let i = e.resultIndex ?? 0; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res?.[0]?.transcript || '';
        if (res.isFinal) {
          if (text.trim()) silenciosRef.current = 0;
          finalRef.current = `${finalRef.current} ${text}`.trim();
        } else {
          live += text;
        }
      }
      const final = finalRef.current;
      setInterim((final ? `${final} ` : '') + live);
    };

    rec.onerror = e => {
      const code = e?.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        manualRef.current = true;
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
    };

    rec.onend = () => {
      const text = finalRef.current.trim();
      finalRef.current = '';
      listeningRef.current = false;
      setListening(false);
      setInterim('');

      if (text) {
        silenciosRef.current = 0;
        onFinalRef.current?.(text);
        return;
      }

      // Silencio seguido: no insistir eternamente con el micro abierto
      if (!manualRef.current) {
        silenciosRef.current += 1;
        if (silenciosRef.current >= MAX_SILENCIOS) {
          silenciosRef.current = 0;
          manualRef.current = true;
          onErrorRef.current?.('silencio');
        }
      }
    };

    try {
      rec.start();
      listeningRef.current = true;
      setListening(true);
    } catch {
      listeningRef.current = false;
      setListening(false);
    }
  }, [soltar]);

  useEffect(() => () => soltar(), [soltar]);

  return { supported, listening, interim, start, stop, abort };
}
