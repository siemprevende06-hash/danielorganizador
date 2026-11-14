import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, startOfWeek } from 'date-fns';
import { getCubaDate } from '@/lib/cubaTime';
import { LANGUAGE_SKILL_IDS, type LanguageSkillId } from '@/lib/languagePlan';

// ---------------------------------------------------------------------------
// Habilidad foco: diaria o semanal
//
// El usuario elige una de las 6 habilidades y decide si el foco es para hoy o
// para toda la semana. El foco diario manda; si no hay, cae al semanal.
// Todo vive en localStorage (preferencia de interfaz, no dato de progreso).
// ---------------------------------------------------------------------------

export type FocusMode = 'day' | 'week';

interface FocusState {
  mode: FocusMode;
  day: Record<string, LanguageSkillId>;
  week: Record<string, LanguageSkillId>;
}

const STORAGE_KEY = 'languages-focus-v1';
const VALID = new Set<string>(LANGUAGE_SKILL_IDS);

const EMPTY: FocusState = { mode: 'day', day: {}, week: {} };

const SKILL_LABEL: Record<LanguageSkillId, string> = {
  gramatica: 'Gramática',
  vocabulario: 'Vocabulario',
  'lectura-l': 'Lectura',
  listening: 'Listening',
  speaking: 'Speaking',
  escritura: 'Escritura',
};

function weekKeyOf(date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

function cleanRecord(raw: unknown): Record<string, LanguageSkillId> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, LanguageSkillId> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key === 'string' && typeof value === 'string' && VALID.has(value)) {
      out[key] = value as LanguageSkillId;
    }
  }
  return out;
}

function read(): FocusState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<FocusState>;
    return {
      mode: parsed.mode === 'week' ? 'week' : 'day',
      day: cleanRecord(parsed.day),
      week: cleanRecord(parsed.week),
    };
  } catch {
    return EMPTY;
  }
}

export function useLanguageFocus() {
  const [state, setState] = useState<FocusState>(read);

  // Mantiene el foco sincronizado entre pestañas del navegador.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setState(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((next: FocusState) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Sin almacenamiento: el foco vive en memoria durante la sesión.
    }
  }, []);

  const today = getCubaDate();
  const week = weekKeyOf();

  const daySkill = state.day[today] ?? null;
  const weekSkill = state.week[week] ?? null;
  const skill = state.mode === 'day' ? daySkill ?? weekSkill : weekSkill ?? daySkill;
  const source: FocusMode | null =
    state.mode === 'day'
      ? daySkill
        ? 'day'
        : weekSkill
          ? 'week'
          : null
      : weekSkill
        ? 'week'
        : daySkill
          ? 'day'
          : null;

  const setMode = useCallback(
    (mode: FocusMode) => {
      persist({ ...state, mode });
    },
    [persist, state]
  );

  const setSkill = useCallback(
    (next: LanguageSkillId) => {
      if (state.mode === 'day') {
        persist({ ...state, day: { ...state.day, [today]: next } });
      } else {
        persist({ ...state, week: { ...state.week, [week]: next } });
      }
    },
    [persist, state, today, week]
  );

  const clear = useCallback(() => {
    const day = { ...state.day };
    const weekMap = { ...state.week };
    // Quita el foco que se está mostrando, no los dos a la vez.
    if (state.mode === 'day') {
      if (day[today]) delete day[today];
      else delete weekMap[week];
    } else {
      if (weekMap[week]) delete weekMap[week];
      else delete day[today];
    }
    persist({ ...state, day, week: weekMap });
  }, [persist, state, today, week]);

  /** Alterna el foco con la habilidad indicada (pin de las tarjetas). */
  const toggleSkill = useCallback(
    (next: LanguageSkillId) => {
      if (skill === next) clear();
      else setSkill(next);
    },
    [skill, clear, setSkill]
  );

  const label = useMemo(() => {
    if (!skill) return 'Sin foco: se sugiere la habilidad menos practicada.';
    return source === 'day'
      ? `Foco de hoy: ${SKILL_LABEL[skill]}`
      : `Foco de la semana: ${SKILL_LABEL[skill]}`;
  }, [skill, source]);

  return {
    mode: state.mode,
    setMode,
    skill,
    source,
    label,
    setSkill,
    toggleSkill,
    clear,
    todayKey: today,
    weekKey: week,
  };
}
