import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCubaDate } from '@/lib/cubaTime';
import type { Language } from './useLanguageLearning';
import type { SpeakingMetrics } from '@/lib/speakingMetrics';

// ---------------------------------------------------------------------------
// Registro local de sesiones de speaking (M2)
//
// No toca la BD: los minutos canónicos siguen viviendo en
// `daily_systems_tracking`. Aquí se guarda lo que esa tabla no sabe contar
// (turnos, palabras, ppm, % de frases correctas) para pintarlo en Progreso.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'languages-speaking-sessions-v1';
export const SPEAKING_SESSIONS_EVENT = 'languages-speaking-sessions-changed';
const MAX_RECORDS = 240;

export interface SpeakingSessionRecord {
  id: string;
  date: string;
  createdAt: string;
  language: Language;
  minutes: number;
  turns: number;
  words: number;
  wpm: number;
  correctPct: number | null;
  fillers: number;
  scenarioId: string | null;
  structureId: string | null;
  skillId: string;
  summary?: string;
}

export interface SpeakingStats {
  sessions: number;
  minutes: number;
  avgWpm: number;
  avgCorrect: number | null;
  lastPct: number | null;
  bestPct: number | null;
}

type Store = Record<string, SpeakingSessionRecord[]>;

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Sin almacenamiento: las métricas viven solo en memoria.
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SPEAKING_SESSIONS_EVENT));
  }
}

export function buildSpeakingRecord(input: {
  language: Language;
  minutes: number;
  skillId: string;
  metrics: SpeakingMetrics;
  scenarioId?: string | null;
  structureId?: string | null;
  summary?: string;
}): SpeakingSessionRecord {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: getCubaDate(),
    createdAt: new Date().toISOString(),
    language: input.language,
    minutes: input.minutes,
    turns: input.metrics.turns,
    words: input.metrics.words,
    wpm: input.metrics.wpm,
    correctPct: input.metrics.correctPct,
    fillers: input.metrics.fillers,
    scenarioId: input.scenarioId ?? null,
    structureId: input.structureId ?? null,
    skillId: input.skillId,
    summary: input.summary,
  };
}

function computeStats(records: SpeakingSessionRecord[]): SpeakingStats {
  if (records.length === 0) {
    return { sessions: 0, minutes: 0, avgWpm: 0, avgCorrect: null, lastPct: null, bestPct: null };
  }
  const minutes = records.reduce((sum, item) => sum + item.minutes, 0);
  const withWpm = records.filter(item => item.wpm > 0);
  const avgWpm = withWpm.length
    ? Math.round(withWpm.reduce((sum, item) => sum + item.wpm, 0) / withWpm.length)
    : 0;
  const withPct = records.filter(item => typeof item.correctPct === 'number') as Array<
    SpeakingSessionRecord & { correctPct: number }
  >;
  const avgCorrect = withPct.length
    ? Math.round(withPct.reduce((sum, item) => sum + item.correctPct, 0) / withPct.length)
    : null;
  return {
    sessions: records.length,
    minutes,
    avgWpm,
    avgCorrect,
    lastPct: withPct[0]?.correctPct ?? null,
    bestPct: withPct.length ? Math.max(...withPct.map(item => item.correctPct)) : null,
  };
}

export function useSpeakingSessions(language: Language) {
  const [store, setStore] = useState<Store>(() => readStore());

  useEffect(() => {
    const refresh = () => setStore(readStore());
    window.addEventListener(SPEAKING_SESSIONS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(SPEAKING_SESSIONS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const sessions = useMemo(() => store[language] ?? [], [store, language]);

  const addSession = useCallback(
    (record: SpeakingSessionRecord) => {
      const current = readStore();
      const next: Store = {
        ...current,
        [record.language]: [record, ...(current[record.language] ?? [])].slice(0, MAX_RECORDS),
      };
      writeStore(next);
      setStore(next);
    },
    []
  );

  const last7 = useMemo(() => {
    const cutoff = Date.now() - 7 * 86_400_000;
    return sessions.filter(item => new Date(item.createdAt).getTime() >= cutoff);
  }, [sessions]);

  const stats = useMemo(() => computeStats(sessions), [sessions]);
  const weekStats = useMemo(
    () => ({
      ...computeStats(last7),
      speakingDays: new Set(last7.map(item => item.date)).size,
    }),
    [last7]
  );

  return { sessions, stats, weekStats, addSession };
}
