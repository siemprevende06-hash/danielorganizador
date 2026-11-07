import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type SpeechLang = 'en' | 'es';
export type SpeechStatus = 'idle' | 'playing' | 'paused';

export interface SpeechSegment {
  /** Índice del par EN/ES al que pertenece el fragmento. */
  pairIndex: number;
  text: string;
}

const LANG_TAG: Record<SpeechLang, string> = { en: 'en-US', es: 'es-ES' };

export const SPEECH_LANG_LABEL: Record<SpeechLang, string> = {
  en: 'inglés',
  es: 'español',
};

const isSpeechSupported = () =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window;

/** Divide el texto en frases cortas: algunos motores cortan audios largos y así el avance es más fino. */
export function splitIntoSpeechChunks(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  const pushLong = (value: string) => {
    let rest = value.trim();
    while (rest.length > 220) {
      let cut = rest.lastIndexOf(' ', 220);
      if (cut < 120) cut = 220;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) chunks.push(rest);
  };

  const sentences = normalized.match(/[^.!?…;]+[.!?…;]+["'»”’)]*\s*|[^.!?…;]+$/g) ?? [normalized];
  for (const rawSentence of sentences) {
    const sentence = rawSentence.trim();
    if (!sentence) continue;
    if (sentence.length <= 220) {
      chunks.push(sentence);
      continue;
    }
    const parts = sentence.match(/[^,，;:]+[,，;:]*\s*/g) ?? [sentence];
    let buffer = '';
    for (const part of parts) {
      if (buffer && (buffer + part).length > 200) {
        pushLong(buffer);
        buffer = part;
      } else {
        buffer += part;
      }
    }
    if (buffer.trim()) pushLong(buffer);
  }
  return chunks;
}

const pickVoice = (lang: SpeechLang): SpeechSynthesisVoice | null => {
  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const primary = LANG_TAG[lang].split('-')[0].toLowerCase();
    const exactTag = LANG_TAG[lang].toLowerCase();
    const matching = voices.filter(v => v.lang.toLowerCase().startsWith(primary));
    if (!matching.length) return null;
    const score = (v: SpeechSynthesisVoice) => {
      let value = 0;
      if (v.lang.toLowerCase() === exactTag) value += 4;
      if (/google/i.test(v.name)) value += 3;
      if (/natural|neural|premium|enhanced/i.test(v.name)) value += 2;
      if (v.default) value += 1;
      if (v.localService) value += 1;
      return value;
    };
    return matching.sort((a, b) => score(b) - score(a))[0] ?? null;
  } catch {
    return null;
  }
};

interface UseSpeechReaderOptions {
  getSegments: (lang: SpeechLang, fromPair: number) => SpeechSegment[];
}

/**
 * Lectura en voz alta con la Web Speech API.
 * El texto se parte en frases y se encola de una en una, de modo que se puede
 * resaltar con precisión por dónde va la lectura y continuar entre páginas.
 */
export function useSpeechReader({ getSegments }: UseSpeechReaderOptions) {
  const supported = useMemo(() => isSpeechSupported(), []);
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [activePairIndex, setActivePairIndex] = useState<number | null>(null);

  const segmentsRef = useRef<SpeechSegment[]>([]);
  const cursorRef = useRef(0);
  const runRef = useRef(0);
  const langRef = useRef<SpeechLang>('en');
  const getSegmentsRef = useRef(getSegments);
  const lastActivityRef = useRef(0);
  const cancelAtRef = useRef(0);
  const kickTimerRef = useRef<number | null>(null);

  useEffect(() => {
    getSegmentsRef.current = getSegments;
  }, [getSegments]);

  const clearKickTimer = useCallback(() => {
    if (kickTimerRef.current == null) return;
    window.clearTimeout(kickTimerRef.current);
    kickTimerRef.current = null;
  }, []);

  const speakAt = useCallback((index: number) => {
    const segment = segmentsRef.current[index];
    if (!segment) {
      setStatus('idle');
      setActivePairIndex(null);
      return;
    }

    cursorRef.current = index;
    lastActivityRef.current = Date.now();
    setActivePairIndex(segment.pairIndex);

    const run = runRef.current;
    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.lang = LANG_TAG[langRef.current];
    const voice = pickVoice(langRef.current);
    if (voice) utterance.voice = voice;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      if (runRef.current !== run) return;
      lastActivityRef.current = Date.now();
    };
    utterance.onend = () => {
      if (runRef.current !== run) return;
      lastActivityRef.current = Date.now();
      speakAt(index + 1);
    };
    utterance.onerror = event => {
      if (runRef.current !== run) return;
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      if (event.error === 'not-allowed') {
        setStatus('idle');
        setActivePairIndex(null);
        return;
      }
      lastActivityRef.current = Date.now();
      speakAt(index + 1);
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      setStatus('idle');
      setActivePairIndex(null);
    }
  }, []);

  const start = useCallback((fromPair: number, lang: SpeechLang) => {
    if (!isSpeechSupported()) return false;
    const segments = getSegmentsRef.current(lang, fromPair);
    if (!segments.length) return false;

    clearKickTimer();
    langRef.current = lang;
    runRef.current += 1;
    const run = runRef.current;
    const synth = window.speechSynthesis;
    // Chrome descarta una utterance si se lanza justo después de cancel();
    // solo hay que esperar cuando de verdad había algo sonando.
    const hadActiveSpeech = synth.speaking || synth.pending;
    const recentlyCancelled = Date.now() - cancelAtRef.current < 150;
    try {
      if (hadActiveSpeech) {
        synth.cancel();
        cancelAtRef.current = Date.now();
      }
      synth.resume();
    } catch {
      /* ignore */
    }
    segmentsRef.current = segments;
    cursorRef.current = 0;
    lastActivityRef.current = Date.now();
    setStatus('playing');
    setActivePairIndex(segments[0].pairIndex);

    const kick = () => {
      if (runRef.current !== run) return;
      speakAt(0);
    };
    if (hadActiveSpeech || recentlyCancelled) {
      kickTimerRef.current = window.setTimeout(() => {
        kickTimerRef.current = null;
        kick();
      }, 150);
    } else {
      kick();
    }
    return true;
  }, [clearKickTimer, speakAt]);

  const pause = useCallback(() => {
    clearKickTimer();
    runRef.current += 1;
    lastActivityRef.current = Date.now();
    cancelAtRef.current = Date.now();
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    setStatus('paused');
  }, [clearKickTimer]);

  const resume = useCallback(() => {
    if (!isSpeechSupported() || !segmentsRef.current.length) return false;
    clearKickTimer();
    setStatus('playing');
    lastActivityRef.current = Date.now();
    try {
      window.speechSynthesis.resume();
    } catch {
      /* ignore */
    }
    speakAt(cursorRef.current);
    return true;
  }, [clearKickTimer, speakAt]);

  const stop = useCallback(() => {
    clearKickTimer();
    runRef.current += 1;
    lastActivityRef.current = Date.now();
    cancelAtRef.current = Date.now();
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    segmentsRef.current = [];
    cursorRef.current = 0;
    setStatus('idle');
    setActivePairIndex(null);
  }, [clearKickTimer]);

  // Bug clásico de Chrome: la síntesis se detiene sola pasados unos segundos.
  // Un resume periódico lo evita; si la utterance se descartó, se relanza.
  useEffect(() => {
    if (!supported || status !== 'playing') return;
    const id = window.setInterval(() => {
      if (!isSpeechSupported()) return;
      const synth = window.speechSynthesis;
      if (synth.speaking) {
        synth.resume();
        lastActivityRef.current = Date.now();
        return;
      }
      if (synth.pending) return;
      if (Date.now() - lastActivityRef.current < 2500) return;
      if (Date.now() - cancelAtRef.current < 1000) return;
      lastActivityRef.current = Date.now();
      speakAt(cursorRef.current);
    }, 1000);
    return () => window.clearInterval(id);
  }, [supported, status, speakAt]);

  useEffect(() => {
    return () => {
      runRef.current += 1;
      if (kickTimerRef.current != null) window.clearTimeout(kickTimerRef.current);
      if (!isSpeechSupported()) return;
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return {
    supported,
    status,
    activePairIndex,
    start,
    pause,
    resume,
    stop,
  };
}
