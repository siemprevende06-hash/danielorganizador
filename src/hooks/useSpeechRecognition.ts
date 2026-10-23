// @ts-nocheck
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

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface Options {
  lang: string;
  /** Transcripción final completa al terminar la escucha (manual o por silencio). */
  onFinal?: (text: string) => void;
}

export function useSpeechRecognition({ lang, onFinal }: Options) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef('');
  const langRef = useRef(lang);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    langRef.current = lang;
    onFinalRef.current = onFinal;
  });

  const supported =
    typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
    setInterim('');
  }, []);

  /** Corta la escucha SIN entregar la transcripción (para descartar lo grabado). */
  const abort = useCallback(() => {
    const rec = recRef.current;
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
    recRef.current = null;
    finalRef.current = '';
    setListening(false);
    setInterim('');
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }
    const prev = recRef.current;
    if (prev) {
      prev.onresult = null;
      prev.onerror = null;
      prev.onend = null;
      try {
        prev.abort();
      } catch {
        /* noop */
      }
    }
    finalRef.current = '';
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
        if (res.isFinal) finalRef.current = `${finalRef.current} ${text}`.trim();
        else live += text;
      }
      setInterim(live);
    };

    rec.onerror = e => {
      const code = e?.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        toast.error('Permiso de micrófono denegado. Actívalo en la configuración de tu navegador.');
      } else if (code === 'no-speech') {
        toast('No te escuché. Pulsa el micro e inténtalo otra vez.');
      } else if (code === 'network') {
        toast.error('Error de red en el reconocimiento de voz.');
      }
    };

    rec.onend = () => {
      const text = finalRef.current.trim();
      finalRef.current = '';
      setListening(false);
      setInterim('');
      if (text) onFinalRef.current?.(text);
    };

    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  useEffect(
    () => () => {
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
    },
    []
  );

  return { supported, listening, interim, start, stop, abort };
}
