import { pushSyncKey } from '@/lib/planSync';

// ---------------------------------------------------------------------------
// Store compartido de "Algún Día" (sueños sin fecha).
//
// Lo usan la página Algún Día y la página Metas Sistemas. Las metas creadas
// desde una tarjeta de sistema guardan `systemId` para poder mostrarse en la
// tarjeta correcta, pero siguen siendo el mismo registro que ve Algún Día.
// ---------------------------------------------------------------------------

export const SOMEDAY_GOALS_KEY = 'algundia_dreams';
export const SOMEDAY_GOALS_EVENT = 'someday-goals-updated';

export type DreamPriority = 'low' | 'medium' | 'high';

export interface DreamItem {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  priority: DreamPriority;
  dateAdded: string;
  /** Sistema al que pertenece la meta (solo si se creó desde Metas Sistemas). */
  systemId?: string | null;
  updatedAt?: string;
}

const PRIORITIES: DreamPriority[] = ['low', 'medium', 'high'];

export function generateDreamId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Categoría de Algún Día que mejor representa a cada sistema. */
export function categoryForSystem(systemId: string): string {
  switch (systemId) {
    case 'musica':
      return 'musica';
    case 'gym':
      return 'deportes';
    case 'lectura':
    case 'idiomas':
    case 'universidad':
    case 'ajedrez':
    case 'game':
      return 'aprender';
    case 'emprendimiento':
    case 'proyectos':
      return 'crear';
    case 'finanzas':
      return 'comprar';
    default:
      return 'otros';
  }
}

function normalizeDream(value: unknown): DreamItem | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;

  const priority = PRIORITIES.includes(raw.priority as DreamPriority)
    ? (raw.priority as DreamPriority)
    : 'medium';

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : generateDreamId(),
    title,
    description: typeof raw.description === 'string' ? raw.description : '',
    category: typeof raw.category === 'string' && raw.category ? raw.category : 'otros',
    completed: raw.completed === true,
    priority,
    dateAdded: typeof raw.dateAdded === 'string' && raw.dateAdded
      ? raw.dateAdded
      : new Date().toISOString(),
    systemId: typeof raw.systemId === 'string' && raw.systemId ? raw.systemId : null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

export function loadSomedayGoals(): DreamItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SOMEDAY_GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeDream)
      .filter((item): item is DreamItem => item != null);
  } catch {
    return [];
  }
}

export function saveSomedayGoals(items: DreamItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOMEDAY_GOALS_KEY, JSON.stringify(items));
    pushSyncKey(SOMEDAY_GOALS_KEY);
  } catch {
    // Sin persistencia: los sueños siguen funcionando en memoria.
  }
  window.dispatchEvent(new CustomEvent(SOMEDAY_GOALS_EVENT));
}

export function subscribeSomedayGoals(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === SOMEDAY_GOALS_KEY) listener();
  };

  window.addEventListener(SOMEDAY_GOALS_EVENT, listener);
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener(SOMEDAY_GOALS_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
