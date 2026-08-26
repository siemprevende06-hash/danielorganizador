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

export function usePersonalLists() {
  const qc = useQueryClient();

  const listsQuery = useQuery({
    queryKey: ['personalLists'],
    queryFn: async (): Promise<PersonalList[]> => {
      const { data, error } = await db
        .from('personal_lists')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PersonalList[];
    },
  });

  const tasksQuery = useQuery({
    queryKey: ['personalListTasks'],
    queryFn: async (): Promise<PersonalListTask[]> => {
      const { data, error } = await db
        .from('personal_list_tasks')
        .select('*')
        .order('position');
      if (error) throw error;
      return (data || []) as PersonalListTask[];
    },
  });

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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['personalLists'] });
    qc.invalidateQueries({ queryKey: ['personalListTasks'] });
  };

  const createList = useMutation({
    mutationFn: async (payload: Partial<PersonalList>) => {
      const { error } = await db.from('personal_lists').insert({ ...payload, user_id: null });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Lista creada'); },
    onError: (e: any) => toast.error(e.message || 'Error al crear la lista'),
  });

  const updateList = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<PersonalList> & { id: string }) => {
      const { error } = await db.from('personal_lists').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || 'Error al actualizar'),
  });

  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('personal_lists').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Lista eliminada'); },
  });

  const createTask = useMutation({
    mutationFn: async (payload: Partial<PersonalListTask>) => {
      const { error } = await db.from('personal_list_tasks').insert(payload);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message || 'Error al crear la tarea'),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<PersonalListTask> & { id: string }) => {
      const { error } = await db.from('personal_list_tasks').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('personal_list_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    lists: listsQuery.data || [],
    tasks: tasksQuery.data || [],
    systems: systemsQuery.data || {},
    isLoading: listsQuery.isLoading,
    createList, updateList, deleteList,
    createTask, updateTask, deleteTask,
  };
}
