import { pushSyncKey } from '@/lib/planSync';

// ---------------------------------------------------------------------------
// Metas con fecha de los sistemas.
//
// Cada meta pertenece a un sistema (o a una de las áreas estructurales) y
// tiene una fecha exacta yyyy-MM-dd. Las metas sin fecha NO viven aquí: se
// guardan en el store compartido de "Algún Día" (algundia_dreams).
//
// El store se sincroniza igual que los planes: localStorage + sync_state.
// ---------------------------------------------------------------------------

export const SYSTEM_GOALS_KEY = 'system_goals_v1';
export const SYSTEM_GOALS_EVENT = 'system-goals-updated';

export interface SystemGoal {
  id: string;
  /** Id del sistema o área: lectura, gym, salud, fuerza-mental… */
  systemId: string;
  title: string;
  /** Objetivo corto opcional (ej. "2 libros", "1800 ELO"). */
  objective?: string;
  /** Fecha exacta de la meta (yyyy-MM-dd). */
  date: string;
  completed?: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function generateGoalId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
}

function normalizeGoal(value: unknown): SystemGoal | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const systemId = typeof raw.systemId === 'string' ? raw.systemId.trim() : '';
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const date = typeof raw.date === 'string' ? raw.date.slice(0, 10) : '';
  if (!systemId || !title || !DATE_RE.test(date)) return null;

  const createdAt = typeof raw.createdAt === 'string' && raw.createdAt
    ? raw.createdAt
    : `${date}T12:00:00.000Z`;

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : generateGoalId(),
    systemId,
    title,
    objective: typeof raw.objective === 'string' && raw.objective.trim()
      ? raw.objective.trim()
      : undefined,
    date,
    completed: raw.completed === true,
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
    createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

export function loadSystemGoals(): SystemGoal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SYSTEM_GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeGoal)
      .filter((goal): goal is SystemGoal => goal != null);
  } catch {
    return [];
  }
}

export function saveSystemGoals(goals: SystemGoal[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SYSTEM_GOALS_KEY, JSON.stringify(goals));
    pushSyncKey(SYSTEM_GOALS_KEY);
  } catch {
    // Sin persistencia: las metas siguen funcionando en memoria.
  }
  window.dispatchEvent(new CustomEvent(SYSTEM_GOALS_EVENT));
}

export function subscribeSystemGoals(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === SYSTEM_GOALS_KEY) listener();
  };

  window.addEventListener(SYSTEM_GOALS_EVENT, listener);
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener(SYSTEM_GOALS_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Metas cuya fecha cae dentro del rango [startKey, endKey]. */
export function goalsInDateRange(
  goals: SystemGoal[],
  startKey: string,
  endKey: string,
): SystemGoal[] {
  return goals.filter(goal => goal.date >= startKey && goal.date <= endKey);
}
