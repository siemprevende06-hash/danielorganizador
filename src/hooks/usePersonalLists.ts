import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';

export interface PersonalList {
  id: string;
  title: string;
  description: string | null;
  area_id: string;
  sub_area: string | null;
  cover_image_url: string | null;
  system_key: string | null;
  created_at: string;
}

export interface PersonalListTask {
  id: string;
  list_id: string;
  parent_id: string | null;
  title: string;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  position: number;
}

export const LIFE_AREAS = [
  { id: 'salud_bienestar', label: 'Salud y Bienestar' },
  { id: 'fuerza_mental', label: 'Fuerza Mental' },
  { id: 'apariencia', label: 'Apariencia' },
  { id: 'desarrollo_personal', label: 'Desarrollo Personal' },
  { id: 'profesional_academico', label: 'Profesional / Académico' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'amor_romance', label: 'Amor y Romance' },
  { id: 'familia_amistad', label: 'Familia y Amistad' },
  { id: 'ocio_experiencias', label: 'Ocio, Recreación y Experiencias' },
];

/** Daily systems already tracked in the app (daily_area_stats) */
export const DAILY_SYSTEMS = [
  { id: 'universidad', label: 'Universidad' },
  { id: 'emprendimiento', label: 'Emprendimiento' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'lectura', label: 'Lectura' },
  { id: 'musica', label: 'Música' },
  { id: 'idiomas', label: 'Idiomas' },
  { id: 'ajedrez', label: 'Ajedrez' },
  { id: 'gym', label: 'Gym' },
  { id: 'game', label: 'Game' },
];

const db = supabase as any;

/**
 * Los datos de "Mi Lista Personal" se guardan en `text_sections`
 * (una sola fila JSON) para no depender de tablas dedicadas.
 */
const SECTION_KEY = 'personal_lists_v1';
const LS_KEY = 'personal_lists_v1';

interface Store {
  lists: PersonalList[];
  tasks: PersonalListTask[];
}

const emptyStore: Store = { lists: [], tasks: [] };

function readLocal(): Store {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...emptyStore, ...JSON.parse(raw) };
  } catch {}
  return emptyStore;
}

function writeLocal(store: Store) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch {}
}

async function fetchStore(): Promise<Store> {
  try {
    const { data, error } = await db
      .from('text_sections')
      .select('content')
      .eq('section_key', SECTION_KEY)
      .maybeSingle();
    if (error) throw error;
    const content = (data?.content || null) as Store | null;
    if (content && Array.isArray(content.lists)) {
      writeLocal(content);
      return { lists: content.lists, tasks: content.tasks || [] };
    }
  } catch {
    // sin conexión → usar copia local
  }
  return readLocal();
}

async function saveStore(store: Store): Promise<void> {
  writeLocal(store);
  const { data } = await db
    .from('text_sections')
    .select('id')
    .eq('section_key', SECTION_KEY)
    .maybeSingle();
  if (data?.id) {
    const { error } = await db.from('text_sections').update({ content: store }).eq('id', data.id);
    if (error) throw error;
  } else {
    const { error } = await db
      .from('text_sections')
      .insert({ section_key: SECTION_KEY, content: store, user_id: null });
    if (error) throw error;
  }
}

const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

export function usePersonalLists() {
  const qc = useQueryClient();

  const storeQuery = useQuery({
    queryKey: ['personalListsStore'],
    queryFn: fetchStore,
    initialData: readLocal,
  });

  const store: Store = storeQuery.data || emptyStore;

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const systemsQuery = useQuery({
    queryKey: ['personalListSystems', todayKey],
    queryFn: async (): Promise<Record<string, { completed: boolean; minutes: number; goal: number }>> => {
      const { data, error } = await db
        .from('daily_area_stats')
        .select('area_id, completed, time_spent_minutes, time_goal_minutes')
        .eq('stat_date', todayKey);
      if (error) throw error;
      const map: Record<string, { completed: boolean; minutes: number; goal: number }> = {};
      (data || []).forEach((row: any) => {
        map[row.area_id] = {
          completed: !!row.completed,
          minutes: row.time_spent_minutes || 0,
          goal: row.time_goal_minutes || 0,
        };
      });
      return map;
    },
  });

  const mutateStore = async (fn: (s: Store) => Store) => {
    const current = qc.getQueryData<Store>(['personalListsStore']) || readLocal();
    const next = fn(current);
    qc.setQueryData(['personalListsStore'], next);
    await saveStore(next);
    return next;
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ['personalListsStore'] });

  const createList = useMutation({
    mutationFn: async (payload: Partial<PersonalList>) => {
      await mutateStore(s => ({
        ...s,
        lists: [
          {
            id: newId(),
            title: payload.title || 'Sin título',
            description: payload.description ?? null,
            area_id: payload.area_id || LIFE_AREAS[0].id,
            sub_area: payload.sub_area ?? null,
            cover_image_url: payload.cover_image_url ?? null,
            system_key: payload.system_key ?? null,
            created_at: new Date().toISOString(),
          },
          ...s.lists,
        ],
      }));
    },
    onSuccess: () => { invalidate(); toast.success('Lista creada'); },
    onError: (e: any) => toast.error(e.message || 'Error al crear la lista'),
  });

  const updateList = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<PersonalList> & { id: string }) => {
      await mutateStore(s => ({
        ...s,
        lists: s.lists.map(l => (l.id === id ? { ...l, ...patch } : l)),
      }));
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || 'Error al actualizar'),
  });

  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      await mutateStore(s => ({
        lists: s.lists.filter(l => l.id !== id),
        tasks: s.tasks.filter(t => t.list_id !== id),
      }));
    },
    onSuccess: () => { invalidate(); toast.success('Lista eliminada'); },
    onError: (e: any) => toast.error(e.message || 'Error al eliminar'),
  });

  const createTask = useMutation({
    mutationFn: async (payload: Partial<PersonalListTask>) => {
      await mutateStore(s => ({
        ...s,
        tasks: [
          ...s.tasks,
          {
            id: newId(),
            list_id: payload.list_id!,
            parent_id: payload.parent_id ?? null,
            title: payload.title || 'Nueva tarea',
            due_date: payload.due_date ?? null,
            priority: payload.priority || 'medium',
            completed: payload.completed ?? false,
            position: payload.position ?? s.tasks.filter(t => t.list_id === payload.list_id).length,
          },
        ],
      }));
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || 'Error al crear la tarea'),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<PersonalListTask> & { id: string }) => {
      await mutateStore(s => ({
        ...s,
        tasks: s.tasks.map(t => (t.id === id ? { ...t, ...patch } : t)),
      }));
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || 'Error al actualizar la tarea'),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await mutateStore(s => ({
        ...s,
        tasks: s.tasks.filter(t => t.id !== id && t.parent_id !== id),
      }));
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || 'Error al eliminar la tarea'),
  });

  return {
    lists: store.lists,
    tasks: [...store.tasks].sort((a, b) => a.position - b.position),
    systems: systemsQuery.data || {},
    isLoading: storeQuery.isLoading,
    createList, updateList, deleteList,
    createTask, updateTask, deleteTask,
  };
}
