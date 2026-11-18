import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const isSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

const VOICE_STORAGE_PREFIX = 'tutor-voz';

const normLang = (s: string) => s.replace('_', '-').toLowerCase();

/** Clave de localStorage por idioma base: tutor-voz:en, tutor-voz:it, tutor-voz:es. */
function claveVoz(lang: string): string {
  return `${VOICE_STORAGE_PREFIX}:${normLang(lang).split('-')[0]}`;
}

function leerVozGuardada(lang: string): string | null {
  try {
    return window.localStorage.getItem(claveVoz(lang));
  } catch {
    // Modo privado o almacenamiento bloqueado: se queda solo en memoria.
    return null;
  }
}

/** Edge es el único navegador que expone voces Natural/Neural gratis. */
export function esEdge(): boolean {
  return typeof navigator !== 'undefined' && /Edg\//.test(navigator.userAgent);
}

export function esVozNatural(v: SpeechSynthesisVoice): boolean {
  return /(natural|neural)/i.test(v.name);
}

export function mismoIdioma(v: SpeechSynthesisVoice, lang: string): boolean {
  const objetivo = normLang(lang);
  const base = objetivo.split('-')[0];
  const l = normLang(v.lang);
  return l === objetivo || l === base || l.startsWith(`${base}-`);
}

/** "Microsoft Aria Online (Natural) - English (United States)" -> "Aria" */
export function etiquetaVoz(v: SpeechSynthesisVoice): string {
  const limpio = v.name
    .replace(/^Microsoft\s+/i, '')
    .replace(/\s*\((natural|neural|online|premium|enhanced)\)\s*/gi, ' ')
    .replace(/\s+online\b/gi, '')
    .replace(/\s+-\s+.*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return limpio || v.name;
}

/** Voces del idioma, primero las Natural/Neural y luego por nombre. */
export function vocesDelIdioma(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice[] {
  return voices
    .filter(v => mismoIdioma(v, lang))
    .sort((a, b) => {
      const natural = Number(esVozNatural(b)) - Number(esVozNatural(a));
      if (natural) return natural;
      return etiquetaVoz(a).localeCompare(etiquetaVoz(b));
    });
}

export function vozNaturalDisponible(voices: SpeechSynthesisVoice[], lang: string): boolean {
  return voices.some(v => mismoIdioma(v, lang) && esVozNatural(v));
}

/**
 * Voz elegida a mano si sigue existiendo; si no, la mejor del sistema.
 * Las voces Natural/Neural mandan: son las que suenan humanas.
 */
export function elegirVoz(
  voices: SpeechSynthesisVoice[],
  lang: string,
  preferida: string | null
): SpeechSynthesisVoice | null {
  const candidatas = voices.filter(v => mismoIdioma(v, lang));
  if (!candidatas.length) return null;

  if (preferida) {
    const guardada = candidatas.find(v => v.voiceURI === preferida);
    if (guardada) return guardada;
  }

  const objetivo = normLang(lang);
  const puntuar = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    let p = 0;
    if (normLang(v.lang) === objetivo) p += 40;
    if (esVozNatural(v)) p += 40;
    else if (n.includes('online')) p += 15;
    if (n.includes('google')) p += 25;
    // Voces SAPI antiguas: es lo que suena robótico en Windows.
    if (/(desktop|espeak)/.test(n)) p -= 25;
    if (/microsoft (david|mark|zira|hazel|george|catherine|pablo|helena|laura)/.test(n)) p -= 12;
    if (/(female|mujer|zira|samantha|aria|elsa|alice|luciana|jenny|sofia|emma|ava)/.test(n)) p += 5;
    if (v.localService) p += 4;
    if (v.default) p += 3;
    return p;
  };

  return [...candidatas].sort((a, b) => puntuar(b) - puntuar(a))[0];
}

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
  speak: (id: string, text: string, rateOverride?: number) => void;
  /** Añade texto nuevo de una respuesta en streaming y lo va leyendo por frases. */
  speakStream: (id: string, text: string, final?: boolean) => void;
  stop: () => void;
  autoSpeak: boolean;
  setAutoSpeak: (v: boolean) => void;
  /** Velocidad de lectura actual (0,6–1,2). */
  rate: number;
  setRate: (rate: number) => void;
  /** false si el sistema no tiene ninguna voz del idioma objetivo instalada */
  voiceOk: boolean;
  voices: SpeechSynthesisVoice[];
  /** Voz que se usará ahora mismo (incluye la elegida a mano). */
  voice: SpeechSynthesisVoice | null;
  /** voiceURI elegido por el usuario; null = automático */
  voiceURI: string | null;
  setVoiceURI: (uri: string | null) => void;
  /** true si el idioma tiene voces Natural/Neural instaladas */
  naturalVoices: boolean;
}

/**
 * Lectura en voz alta con la Web Speech API del navegador (sin claves ni coste).
 * `lang` debe ser un BCP-47 del idioma objetivo, ej. 'en-US' o 'it-IT'.
 */
export function useSpeechSynthesis(lang: string, initialRate = 1, onEnd?: () => void): SpeechControls {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [supported, setSupported] = useState(true);
  const [voiceOk, setVoiceOk] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURIState] = useState<string | null>(() => (isSupported() ? leerVozGuardada(lang) : null));
  const [rate, setRateState] = useState(initialRate);

  // El panel puede cambiar la velocidad (M8): se acota y se aplica a la cola.
  const setRate = useCallback((value: number) => {
    const next = Number.isFinite(value) ? Math.min(1.2, Math.max(0.6, value)) : 1;
    setRateState(next);
  }, []);

  useEffect(() => {
    setRateState(initialRate);
  }, [initialRate]);

  const idRef = useRef<string | null>(null);
  const activoRef = useRef<string | null>(null);
  const sonandoRef = useRef(false);
  const colaRef = useRef<{ text: string; rate: number }[]>([]);
  const vozRef = useRef<SpeechSynthesisVoice | null>(null);
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
    setVoiceOk(voices.some(v => mismoIdioma(v, lang)));
  }, [voices, lang]);

  // Cada idioma recuerda su propia voz elegida.
  useEffect(() => {
    setVoiceURIState(leerVozGuardada(lang));
  }, [lang]);

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

  const voice = useMemo(() => elegirVoz(voices, lang, voiceURI), [voices, lang, voiceURI]);
  const naturalVoices = useMemo(() => vozNaturalDisponible(voices, lang), [voices, lang]);
  // pump() sobrevive al cambio de voz: el ref evita que la frase siguiente use la anterior.
  vozRef.current = voice;

  const setVoiceURI = useCallback(
    (uri: string | null) => {
      setVoiceURIState(uri);
      if (!isSupported()) return;
      try {
        if (uri) window.localStorage.setItem(claveVoz(lang), uri);
        else window.localStorage.removeItem(claveVoz(lang));
      } catch {
        // Sin almacenamiento: la elección dura lo que la sesión.
      }
    },
    [lang]
  );

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

    const u = new SpeechSynthesisUtterance(siguiente.text);
    const voz = vozRef.current;
    u.lang = (voz?.lang ?? lang).replace('_', '-');
    if (voz) u.voice = voz;
    u.rate = siguiente.rate;
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
  }, [lang]);

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
    (id: string, trozos: string[], customRate?: number) => {
      if (!isSupported() || !trozos.length) return;
      const items = trozos.map(text => ({ text, rate: customRate ?? rate }));

      if (activoRef.current !== id) {
        window.speechSynthesis.cancel();
        canceladoEnRef.current = Date.now();
        sonandoRef.current = false;
        colaRef.current = [];
        activoRef.current = id;
        idRef.current = id;
        setSpeakingId(id);
        colaRef.current.push(...items);
        // Chrome necesita un respiro entre cancel() y speak()
        window.setTimeout(() => pump(), 140);
        return;
      }

      if (!idRef.current) {
        idRef.current = id;
        setSpeakingId(id);
      }
      colaRef.current.push(...items);
      pump();
    },
    [pump, rate]
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
    (id: string, text: string, rateOverride?: number) => {
      if (!isSupported()) return;
      // Si ya se está leyendo este mismo mensaje, no reiniciar (evita repetir frases)
      if (activoRef.current === id) return;
      const limpio = stripForSpeech(text);
      if (!limpio) return;
      streamRef.current = { id, consumed: text.length };
      enqueue(id, dividirEnFrases(limpio), rateOverride);
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
    rate,
    setRate,
    voiceOk,
    voices,
    voice,
    voiceURI,
    setVoiceURI,
    naturalVoices,
  };
}
