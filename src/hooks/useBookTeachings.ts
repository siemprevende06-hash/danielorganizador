import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface TeachingItem {
  id: string;
  text: string;
  done: boolean;
  last_applied_at: string | null;
  created_at: string;
}

export interface BookChecklist {
  teachings: TeachingItem[];
  actions: TeachingItem[];
}

export type BookChecklistKind = 'teachings' | 'actions';

export type BookTeachingsStore = Record<string, BookChecklist>;

/**
 * Las checklists de enseñanzas y acciones por libro se guardan en
 * `text_sections` (una sola fila JSON), igual que "Mi Lista Personal",
 * con respaldo en localStorage.
 */
const SECTION_KEY = 'book_teachings_v1';
const LS_KEY = 'book_teachings_v1';

const db = supabase as any;

const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const emptyChecklist: BookChecklist = { teachings: [], actions: [] };

function readLocal(): BookTeachingsStore {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

function writeLocal(store: BookTeachingsStore) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch {}
}

async function fetchStore(): Promise<BookTeachingsStore> {
  try {
    const { data, error } = await db
      .from('text_sections')
      .select('content')
      .eq('section_key', SECTION_KEY)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    const content = data?.content as BookTeachingsStore | null;
    if (content && typeof content === 'object') {
      writeLocal(content);
      return content;
    }
  } catch {
    // sin conexión → usar copia local
  }
  return readLocal();
}

async function saveStore(store: BookTeachingsStore): Promise<void> {
  writeLocal(store);
  const { data: existingRows } = await db
    .from('text_sections')
    .select('id')
    .eq('section_key', SECTION_KEY);
  const existingIds = (existingRows || []).map((r: any) => r.id) as string[];
  if (existingIds.length > 1) {
    await db.from('text_sections').delete().in('id', existingIds.slice(1));
  }
  if (existingIds.length >= 1) {
    const { error } = await db.from('text_sections').update({ content: store }).eq('id', existingIds[0]);
    if (error) throw error;
  } else {
    const { error } = await db
      .from('text_sections')
      .insert({ section_key: SECTION_KEY, content: store, user_id: null });
    if (error) throw error;
  }
}

export function useBookTeachings() {
  const qc = useQueryClient();

  const storeQuery = useQuery({
    queryKey: ['bookTeachingsStore'],
    queryFn: fetchStore,
    initialData: readLocal,
  });

  const store: BookTeachingsStore = storeQuery.data || {};

  const mutate = async (fn: (s: BookTeachingsStore) => BookTeachingsStore) => {
    const current = qc.getQueryData<BookTeachingsStore>(['bookTeachingsStore']) || readLocal();
    const next = fn(current);
    qc.setQueryData(['bookTeachingsStore'], next);
    try {
      await saveStore(next);
    } catch (e: any) {
      toast.error(e?.message || 'Error al guardar');
    }
  };

  const getBook = (bookId: string): BookChecklist => store[bookId] || emptyChecklist;

  const addBook = async (bookId: string) => {
    await mutate(s => (s[bookId] ? s : { ...s, [bookId]: { ...emptyChecklist } }));
  };

  const removeBook = async (bookId: string) => {
    await mutate(s => {
      if (!s[bookId]) return s;
      const next = { ...s };
      delete next[bookId];
      return next;
    });
  };

  const addItem = async (bookId: string, kind: BookChecklistKind, text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const item: TeachingItem = {
      id: newId(),
      text: clean,
      done: false,
      last_applied_at: null,
      created_at: new Date().toISOString(),
    };
    await mutate(s => {
      const cur = s[bookId] || { ...emptyChecklist };
      return { ...s, [bookId]: { ...cur, [kind]: [...cur[kind], item] } };
    });
  };

  const updateItem = async (
    bookId: string,
    kind: BookChecklistKind,
    itemId: string,
    patch: Partial<TeachingItem>,
  ) => {
    await mutate(s => {
      const cur = s[bookId];
      if (!cur) return s;
      return {
        ...s,
        [bookId]: { ...cur, [kind]: cur[kind].map(i => (i.id === itemId ? { ...i, ...patch } : i)) },
      };
    });
  };

  const deleteItem = async (bookId: string, kind: BookChecklistKind, itemId: string) => {
    await mutate(s => {
      const cur = s[bookId];
      if (!cur) return s;
      return { ...s, [bookId]: { ...cur, [kind]: cur[kind].filter(i => i.id !== itemId) } };
    });
  };

  const toggleItem = async (bookId: string, kind: BookChecklistKind, itemId: string) => {
    const item = getBook(bookId)[kind].find(i => i.id === itemId);
    if (!item) return;
    await updateItem(bookId, kind, itemId, {
      done: !item.done,
      last_applied_at: !item.done ? new Date().toISOString().split('T')[0] : item.last_applied_at,
    });
  };

  const editItem = async (bookId: string, kind: BookChecklistKind, itemId: string, text: string) => {
    const clean = text.trim();
    if (!clean) return;
    await updateItem(bookId, kind, itemId, { text: clean });
  };

  const importFromNotes = async (bookId: string, teachings: string[], actions: string[]) => {
    const mk = (texts: string[]) =>
      texts
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => ({
          id: newId(),
          text: t,
          done: false,
          last_applied_at: null,
          created_at: new Date().toISOString(),
        }));
    await mutate(s => {
      const cur = s[bookId] || { ...emptyChecklist };
      const newT = mk(teachings.filter(t => !cur.teachings.some(i => i.text === t.trim())));
      const newA = mk(actions.filter(a => !cur.actions.some(i => i.text === a.trim())));
      return {
        ...s,
        [bookId]: { teachings: [...cur.teachings, ...newT], actions: [...cur.actions, ...newA] },
      };
    });
  };

  return {
    store,
    getBook,
    addBook,
    removeBook,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    editItem,
    importFromNotes,
  };
}