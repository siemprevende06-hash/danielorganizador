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

export interface SpeechControls {
  supported: boolean;
  /** id del mensaje que se está leyendo ahora mismo */
  speakingId: string | null;
  isSpeaking: (id: string) => boolean;
  speak: (id: string, text: string) => void;
  stop: () => void;
  autoSpeak: boolean;
  setAutoSpeak: (v: boolean) => void;
}

/**
 * Lectura en voz alta con la Web Speech API del navegador (sin claves ni coste).
 * `lang` debe ser un BCP-47 del idioma objetivo, ej. 'en-US' o 'it-IT'.
 */
export function useSpeechSynthesis(lang: string, rate = 0.95): SpeechControls {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [supported, setSupported] = useState(true);
  const idRef = useRef<string | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  const loadVoices = useCallback(() => {
    if (!isSupported()) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) voicesRef.current = voices;
  }, []);

  useEffect(() => {
    if (!isSupported()) {
      setSupported(false);
      return;
    }
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      idRef.current = null;
      window.speechSynthesis.cancel();
    };
  }, [loadVoices]);

  // Si cambia el idioma objetivo, cancela lo que estuviera sonando
  useEffect(() => {
    if (!isSupported()) return;
    window.speechSynthesis.cancel();
    idRef.current = null;
    setSpeakingId(null);
  }, [lang]);

  const pickVoice = useCallback(() => {
    if (!isSupported()) return null;
    const voices = voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const norm = (s: string) => s.replace('_', '-').toLowerCase();
    const target = norm(lang);
    const base = target.split('-')[0];
    return (
      voices.find(v => norm(v.lang) === target) ||
      voices.find(v => norm(v.lang).startsWith(base)) ||
      voices.find(v => v.default) ||
      null
    );
  }, [lang]);

  const stop = useCallback(() => {
    if (!isSupported()) return;
    window.speechSynthesis.cancel();
    idRef.current = null;
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (id: string, text: string) => {
      if (!isSupported()) return;
      const limpio = stripForSpeech(text);
      if (!limpio) return;

      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(limpio);
      u.lang = lang;
      const voice = pickVoice();
      if (voice) u.voice = voice;
      u.rate = rate;
      u.pitch = 1;

      const finish = () => {
        if (idRef.current === id) {
          idRef.current = null;
          setSpeakingId(null);
        }
      };
      u.onend = finish;
      u.onerror = finish;

      idRef.current = id;
      setSpeakingId(id);
      window.speechSynthesis.speak(u);
    },
    [lang, pickVoice, rate]
  );

  return {
    supported,
    speakingId,
    isSpeaking: (id: string) => speakingId === id,
    speak,
    stop,
    autoSpeak,
    setAutoSpeak,
  };
}
