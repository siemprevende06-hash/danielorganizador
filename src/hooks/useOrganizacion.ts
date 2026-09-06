import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type OrganizacionMoment = 'manana' | 'noche';

export const HOUSE_AREAS = [
  { id: 'cocina', label: 'Cocina' },
  { id: 'cuarto-daniel', label: 'Cuarto Daniel' },
  { id: 'cuarto-alfredo', label: 'Cuarto Alfredo' },
  { id: 'sala', label: 'Sala' },
  { id: 'bano', label: 'Baño' },
  { id: 'cuarto-desahogo', label: 'Cuarto de Desahogo' },
];

export const ORGANIZACION_MOMENTS: { id: OrganizacionMoment; label: string }[] = [
  { id: 'manana', label: 'Mañana' },
  { id: 'noche', label: 'Noche' },
];

export interface OrganizacionGroup {
  id: string;
  moment: OrganizacionMoment;
  area: string;
  title: string;
  created_at: string;
}

export interface OrganizacionTask {
  id: string;
  group_id: string;
  title: string;
  completed: boolean;
  position: number;
}

export function areaLabel(id: string) {
  return HOUSE_AREAS.find(a => a.id === id)?.label || id;
}

const db = supabase as any;

const SECTION_KEY = 'organizacion_v1';
const LS_KEY = 'organizacion_v1';

interface Store {
  groups: OrganizacionGroup[];
  tasks: OrganizacionTask[];
}

const emptyStore: Store = { groups: [], tasks: [] };

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
    if (content && Array.isArray(content.groups)) {
      writeLocal(content);
      return { groups: content.groups, tasks: content.tasks || [] };
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

export function useOrganizacion() {
  const qc = useQueryClient();

  const storeQuery = useQuery({
    queryKey: ['organizacionStore'],
    queryFn: fetchStore,
    initialData: readLocal,
  });

  const store: Store = storeQuery.data || emptyStore;

  const mutateStore = async (fn: (s: Store) => Store) => {
    const current = qc.getQueryData<Store>(['organizacionStore']) || readLocal();
    const next = fn(current);
    qc.setQueryData(['organizacionStore'], next);
    await saveStore(next);
    return next;
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ['organizacionStore'] });

  const createGroup = useMutation({
    mutationFn: async (payload: Partial<OrganizacionGroup>) => {
      await mutateStore(s => ({
        ...s,
        groups: [
          {
            id: newId(),
            moment: (payload.moment || 'manana') as OrganizacionMoment,
            area: payload.area || HOUSE_AREAS[0].id,
            title: payload.title || 'Nuevo grupo',
            created_at: new Date().toISOString(),
          },
          ...s.groups,
        ],
      }));
    },
    onSuccess: () => { invalidate(); toast.success('Grupo creado'); },
    onError: (e: any) => toast.error(e.message || 'Error al crear el grupo'),
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      await mutateStore(s => ({
        groups: s.groups.filter(g => g.id !== id),
        tasks: s.tasks.filter(t => t.group_id !== id),
      }));
    },
    onSuccess: () => { invalidate(); toast.success('Grupo eliminado'); },
    onError: (e: any) => toast.error(e.message || 'Error al eliminar'),
  });

  const createTask = useMutation({
    mutationFn: async (payload: Partial<OrganizacionTask>) => {
      await mutateStore(s => ({
        ...s,
        tasks: [
          ...s.tasks,
          {
            id: newId(),
            group_id: payload.group_id!,
            title: payload.title || 'Nueva tarea',
            completed: payload.completed ?? false,
            position: payload.position ?? s.tasks.filter(t => t.group_id === payload.group_id).length,
          },
        ],
      }));
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || 'Error al crear la tarea'),
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await mutateStore(s => ({
        ...s,
        tasks: s.tasks.map(t => (t.id === id ? { ...t, completed } : t)),
      }));
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || 'Error al actualizar la tarea'),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await mutateStore(s => ({
        ...s,
        tasks: s.tasks.filter(t => t.id !== id),
      }));
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || 'Error al eliminar la tarea'),
  });

  return {
    groups: store.groups,
    tasks: [...store.tasks].sort((a, b) => a.position - b.position),
    isLoading: storeQuery.isLoading,
    createGroup, deleteGroup, createTask, toggleTask, deleteTask,
  };
}