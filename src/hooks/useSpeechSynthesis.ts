import { useCallback, useEffect, useRef, useState } from 'react';

const isSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Limpia el markdown para que no se lea en voz alta.
 * Las tablas, negritas y emoji suenan fatal con un TTS.
 */
export function stripForSpeech(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*\|.*\|\s*$/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/^\s*#{1,6}\s*/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*([-*+]|\d+\.)\s+/gm, '')
    .replace(/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/gm, ' ')
    .replace(/[*_~]/g, '')
    .replace(/[✗✔✓→←]/g, ' ')
    .replace(/[\u{1F000}-\u{1F2FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu, ' ')
    .replace(/\uFE0F/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Parte el texto en frases cortas. Chrome corta la síntesis en utterances
 * largas (bug clásico de los ~15 s) y además tarda más en arrancar: hablar
 * por frases hace que la respuesta empiece a sonar casi al instante.
 */
export function dividirEnFrases(texto: string, maxLen = 220): string[] {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (!limpio) return [];

  const partes = limpio.split(/(?<=[.!?…])\s+/);
  const out: string[] = [];
  let actual = '';

  for (const parte of partes) {
    if (!parte) continue;
    if (!actual) actual = parte;
    else if (`${actual} ${parte}`.length <= maxLen) actual = `${actual} ${parte}`;
    else {
      out.push(actual);
      actual = parte;
    }

    while (actual.length > maxLen + 100) {
      const coma = actual.lastIndexOf(',', maxLen);
      const corte = coma > 60 ? coma + 1 : maxLen;
      out.push(actual.slice(0, corte).trim());
      actual = actual.slice(corte).trim();
    }
  }

  if (actual) out.push(actual);
  return out.filter(s => s.length > 0);
}

/** Índice justo después de la última frase cerrada del texto (0 si no hay). */
function ultimaFrontera(texto: string): number {
  let idx = 0;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c !== '.' && c !== '!' && c !== '?' && c !== '…' && c !== '\n') continue;
    const siguiente = texto[i + 1];
    if (siguiente === undefined || /\s/.test(siguiente)) {
      // Evita cortar abreviaturas tipo "Mr." o decimales
      if (c === '.' && i > 0 && /\d/.test(texto[i - 1]) && /\d/.test(siguiente ?? '')) continue;
      idx = i + 1;
    }
  }
  return idx;
}

export interface SpeechControls {
  supported: boolean;
  /** id del mensaje que se está leyendo ahora mismo */
  speakingId: string | null;
  speaking: boolean;
  isSpeaking: (id: string) => boolean;
  speak: (id: string, text: string) => void;
  /** Añade texto nuevo de una respuesta en streaming y lo va leyendo por frases. */
  speakStream: (id: string, text: string, final?: boolean) => void;
  stop: () => void;
  autoSpeak: boolean;
  setAutoSpeak: (v: boolean) => void;
  /** false si el sistema no tiene ninguna voz del idioma objetivo instalada */
  voiceOk: boolean;
  voices: SpeechSynthesisVoice[];
}

/**
 * Lectura en voz alta con la Web Speech API del navegador (sin claves ni coste).
 * `lang` debe ser un BCP-47 del idioma objetivo, ej. 'en-US' o 'it-IT'.
 */
export function useSpeechSynthesis(lang: string, rate = 1, onEnd?: () => void): SpeechControls {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [supported, setSupported] = useState(true);
  const [voiceOk, setVoiceOk] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const idRef = useRef<string | null>(null);
  const activoRef = useRef<string | null>(null);
  const sonandoRef = useRef(false);
  const colaRef = useRef<string[]>([]);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const streamRef = useRef<{ id: string; consumed: number }>({ id: '', consumed: 0 });
  const canceladoEnRef = useRef(0);
  const latidoRef = useRef(0);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const loadVoices = useCallback(() => setVoices([...window.speechSynthesis.getVoices()]), []);

  useEffect(() => {
    if (!isSupported()) {
      setSupported(false);
      return;
    }
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    // Chrome carga las voces de forma asíncrona
    const t = window.setTimeout(loadVoices, 600);
    return () => {
      window.clearTimeout(t);
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      idRef.current = null;
      activoRef.current = null;
      window.speechSynthesis.cancel();
    };
  }, [loadVoices]);

  useEffect(() => {
    voicesRef.current = voices;
    const norm = (s: string) => s.replace('_', '-').toLowerCase();
    const target = norm(lang);
    const base = target.split('-')[0];
    setVoiceOk(voices.some(v => {
      const l = norm(v.lang);
      return l === target || l === base || l.startsWith(`${base}-`);
    }));
  }, [voices, lang]);

  // Si cambia el idioma objetivo, cancela lo que estuviera sonando
  useEffect(() => {
    if (!isSupported()) return;
    window.speechSynthesis.cancel();
    colaRef.current = [];
    activoRef.current = null;
    idRef.current = null;
    sonandoRef.current = false;
    streamRef.current = { id: '', consumed: 0 };
    setSpeakingId(null);
  }, [lang]);



  const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!isSupported()) return null;
    const lista = voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices();
    if (!lista.length) return null;

    const norm = (s: string) => s.replace('_', '-').toLowerCase();
    const target = norm(lang);
    const base = target.split('-')[0];

    // Nunca una voz de otro idioma: una voz española leyendo inglés suena terrible.
    const candidatas = lista.filter(v => {
      const l = norm(v.lang);
      return l === target || l === base || l.startsWith(`${base}-`);
    });
    if (!candidatas.length) return null;

    const puntuar = (v: SpeechSynthesisVoice) => {
      const n = v.name.toLowerCase();
      let p = 0;
      if (norm(v.lang) === target) p += 40;
      if (n.includes('google')) p += 30;
      if (/(natural|neural|online|premium|enhanced)/.test(n)) p += 25;
      if (/(female|mujer|zira|samantha|aria|elsa|alice|luciana)/.test(n)) p += 5;
      if (v.localService) p += 8;
      if (v.default) p += 3;
      return p;
    };

    return [...candidatas].sort((a, b) => puntuar(b) - puntuar(a))[0];
  }, [lang]);

  const pump = useCallback(() => {
    if (!isSupported()) return;
    if (sonandoRef.current) return;
    // Chrome descarta una utterance si se lanza justo después de cancel()
    if (Date.now() - canceladoEnRef.current < 100) {
      window.setTimeout(() => pump(), 120);
      return;
    }
    const id = activoRef.current;
    if (!id) return;

    const siguiente = colaRef.current.shift();
    if (!siguiente) {
      activoRef.current = null;
      idRef.current = null;
      setSpeakingId(null);
      const cb = onEndRef.current;
      window.setTimeout(() => cb?.(), 0);
      return;
    }

    const u = new SpeechSynthesisUtterance(siguiente);
    u.lang = lang;
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1;
    u.volume = 1;

    const avanzar = () => {
      sonandoRef.current = false;
      latidoRef.current = Date.now();
      pump();
    };
    u.onstart = () => {
      latidoRef.current = Date.now();
    };
    u.onend = avanzar;
    u.onerror = avanzar;

    sonandoRef.current = true;
    latidoRef.current = Date.now();
    try {
      window.speechSynthesis.speak(u);
    } catch {
      avanzar();
    }
  }, [lang, pickVoice, rate]);

  // Bug de Chrome: la síntesis se para sola a los ~15 s. Un resume periódico lo evita.
  // Además se detecta una utterance descartada (cancel + speak inmediato) y se relanza.
  useEffect(() => {
    if (!isSupported()) return;
    const id = window.setInterval(() => {
      if (!sonandoRef.current) return;
      const synth = window.speechSynthesis;
      if (synth.speaking) {
        synth.resume();
        latidoRef.current = Date.now();
        return;
      }
      if (!synth.pending && Date.now() - latidoRef.current > 2500) {
        sonandoRef.current = false;
        pump();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [pump]);

  const enqueue = useCallback(
    (id: string, trozos: string[]) => {
      if (!isSupported() || !trozos.length) return;

      if (activoRef.current !== id) {
        window.speechSynthesis.cancel();
        canceladoEnRef.current = Date.now();
        sonandoRef.current = false;
        colaRef.current = [];
        activoRef.current = id;
        idRef.current = id;
        setSpeakingId(id);
        colaRef.current.push(...trozos);
        // Chrome necesita un respiro entre cancel() y speak()
        window.setTimeout(() => pump(), 140);
        return;
      }

      if (!idRef.current) {
        idRef.current = id;
        setSpeakingId(id);
      }
      colaRef.current.push(...trozos);
      pump();
    },
    [pump]
  );

  const stop = useCallback(() => {
    if (!isSupported()) return;
    window.speechSynthesis.cancel();
    colaRef.current = [];
    activoRef.current = null;
    idRef.current = null;
    sonandoRef.current = false;
    // Se conserva el punto de lectura: si el usuario corta la voz, no debe
    // volver a sonar sola al llegar el siguiente trozo de la misma respuesta.
    streamRef.current = { id: streamRef.current.id, consumed: Number.POSITIVE_INFINITY };
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (id: string, text: string) => {
      if (!isSupported()) return;
      // Si ya se está leyendo este mismo mensaje, no reiniciar (evita repetir frases)
      if (activoRef.current === id) return;
      const limpio = stripForSpeech(text);
      if (!limpio) return;
      streamRef.current = { id, consumed: text.length };
      enqueue(id, dividirEnFrases(limpio));
    },
    [enqueue]
  );

  const speakStream = useCallback(
    (id: string, text: string, final = false) => {
      if (!isSupported() || !text) return;
      if (streamRef.current.id !== id) {
        streamRef.current = { id, consumed: 0 };
      }
      // Si se está leyendo otro mensaje, no mezclar
      if (activoRef.current && activoRef.current !== id) return;

      const pendiente = text.slice(streamRef.current.consumed);
      if (!pendiente.trim()) return;

      const corte = final ? pendiente.length : ultimaFrontera(pendiente);
      if (!corte) return;

      const trozo = pendiente.slice(0, corte);
      streamRef.current.consumed += corte;

      const limpio = stripForSpeech(trozo);
      if (!limpio) return;
      enqueue(id, dividirEnFrases(limpio));
    },
    [enqueue]
  );

  return {
    supported,
    speakingId,
    speaking: speakingId !== null,
    isSpeaking: (id: string) => speakingId === id,
    speak,
    speakStream,
    stop,
    autoSpeak,
    setAutoSpeak,
    voiceOk,
    voices,
  };
}
