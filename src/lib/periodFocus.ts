import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';
import {
  Target,
  FolderKanban,
  Trophy,
  GraduationCap,
  Rocket,
  BookOpen,
  Music,
  Pencil,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AREA_LABELS } from '@/lib/hierarchy';

// ───────────────────────────────────────────────────────────────────────────
// Periodos
// ───────────────────────────────────────────────────────────────────────────

export type FocusPeriodType = 'day' | 'week' | 'month' | 'quarter' | 'year';
export const FOCUS_PERIOD_TYPES: FocusPeriodType[] = ['day', 'week', 'month', 'quarter', 'year'];

const PERIOD_LABELS: Record<FocusPeriodType, string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
  quarter: 'Trimestre',
  year: 'Año',
};

export function getFocusPeriodLabel(type: FocusPeriodType): string {
  return PERIOD_LABELS[type];
}

export function getPeriodStart(type: FocusPeriodType, date: Date): Date {
  switch (type) {
    case 'day':
      return startOfDay(date);
    case 'week':
      return startOfWeek(date, { weekStartsOn: 1 });
    case 'month':
      return startOfMonth(date);
    case 'quarter':
      return startOfQuarter(date);
    case 'year':
      return startOfYear(date);
  }
}

export function getPeriodKey(type: FocusPeriodType, date: Date): string {
  return format(getPeriodStart(type, date), 'yyyy-MM-dd');
}

export function getParentType(type: FocusPeriodType): FocusPeriodType | null {
  const chain: Record<FocusPeriodType, FocusPeriodType | null> = {
    day: 'week',
    week: 'month',
    month: 'quarter',
    quarter: 'year',
    year: null,
  };
  return chain[type];
}

export function getPeriodTitle(type: FocusPeriodType, date: Date): string {
  const start = getPeriodStart(type, date);
  switch (type) {
    case 'day':
      return format(start, "EEEE d 'de' MMMM", { locale: es });
    case 'week':
      return `Semana del ${format(start, "d 'de' MMMM", { locale: es })}`;
    case 'month':
      return format(start, 'MMMM yyyy', { locale: es });
    case 'quarter':
      return `${Math.floor(start.getMonth() / 3) + 1}º trimestre ${start.getFullYear()}`;
    case 'year':
      return String(start.getFullYear());
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Entidades enlazables
// ───────────────────────────────────────────────────────────────────────────

export type FocusEntityType =
  | 'task'
  | 'project'
  | 'goal'
  | 'subject'
  | 'entrepreneurship'
  | 'book'
  | 'song'
  | 'free';

export interface FocusEntityOption {
  id: string;
  title: string;
  subtitle?: string;
}

export interface FocusEntityData {
  title: string;
  area_id: string | null;
  done: number;
  total: number;
  completed: boolean;
}

export interface FocusEntityConfig {
  value: FocusEntityType;
  label: string;
  icon: LucideIcon;
  loadOptions: () => Promise<FocusEntityOption[]>;
  resolve: (id: string) => Promise<FocusEntityData | null>;
}

function sourceToArea(source?: string | null): string | null {
  switch (source) {
    case 'project':
      return 'proyectos';
    case 'university':
      return 'universidad';
    case 'entrepreneurship':
      return 'emprendimiento';
    default:
      return null;
  }
}

async function countSourceTasks(source: string, sourceId: string) {
  const { data } = await supabase
    .from('tasks')
    .select('completed')
    .eq('source', source)
    .eq('source_id', sourceId);
  const rows = data ?? [];
  const done = rows.filter((r) => r.completed).length;
  return { done, total: rows.length };
}

export const FOCUS_ENTITY_TYPES: FocusEntityConfig[] = [
  {
    value: 'task',
    label: 'Tarea',
    icon: Target,
    loadOptions: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id,title,completed,area_id,source')
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(300);
      return (data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.completed ? 'Completada' : t.area_id ? AREA_LABELS[t.area_id] ?? t.area_id : undefined,
      }));
    },
    resolve: async (id) => {
      const { data } = await supabase
        .from('tasks')
        .select('title,completed,area_id,source')
        .eq('id', id)
        .maybeSingle();
      if (!data) return null;
      return {
        title: data.title,
        area_id: data.area_id ?? sourceToArea(data.source),
        done: data.completed ? 1 : 0,
        total: 1,
        completed: !!data.completed,
      };
    },
  },
  {
    value: 'project',
    label: 'Proyecto',
    icon: FolderKanban,
    loadOptions: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id,title,status')
        .neq('status', 'archived')
        .order('created_at', { ascending: false });
      return (data ?? []).map((p) => ({ id: p.id, title: p.title, subtitle: p.status }));
    },
    resolve: async (id) => {
      const { data } = await supabase
        .from('projects')
        .select('title,status')
        .eq('id', id)
        .maybeSingle();
      if (!data) return null;
      const { done, total } = await countSourceTasks('project', id);
      const completed = data.status === 'completed' || (total > 0 && done === total);
      return { title: data.title, area_id: 'proyectos', done, total, completed };
    },
  },
  {
    value: 'goal',
    label: 'Meta',
    icon: Trophy,
    loadOptions: async () => {
      const { data } = await supabase
        .from('goals')
        .select('id,title,area_id,progress_percentage,status')
        .neq('status', 'abandoned')
        .order('created_at', { ascending: false });
      return (data ?? []).map((g) => ({
        id: g.id,
        title: g.title,
        subtitle: g.area_id ? AREA_LABELS[g.area_id] ?? g.area_id : undefined,
      }));
    },
    resolve: async (id) => {
      const { data } = await supabase
        .from('goals')
        .select('title,area_id,progress_percentage,status')
        .eq('id', id)
        .maybeSingle();
      if (!data) return null;
      const pct = data.progress_percentage ?? 0;
      return {
        title: data.title,
        area_id: data.area_id ?? null,
        done: pct,
        total: 100,
        completed: data.status === 'completed' || pct >= 100,
      };
    },
  },
  {
    value: 'subject',
    label: 'Asignatura',
    icon: GraduationCap,
    loadOptions: async () => {
      const { data } = await supabase
        .from('university_subjects')
        .select('id,name')
        .order('name', { ascending: true });
      return (data ?? []).map((s) => ({ id: s.id, title: s.name }));
    },
    resolve: async (id) => {
      const { data } = await supabase
        .from('university_subjects')
        .select('name')
        .eq('id', id)
        .maybeSingle();
      if (!data) return null;
      const { done, total } = await countSourceTasks('university', id);
      return {
        title: data.name,
        area_id: 'universidad',
        done,
        total,
        completed: total > 0 && done === total,
      };
    },
  },
  {
    value: 'entrepreneurship',
    label: 'Iniciativa',
    icon: Rocket,
    loadOptions: async () => {
      const { data } = await supabase
        .from('entrepreneurships')
        .select('id,name')
        .order('created_at', { ascending: true });
      return (data ?? []).map((e) => ({ id: e.id, title: e.name }));
    },
    resolve: async (id) => {
      const { data } = await supabase
        .from('entrepreneurships')
        .select('name')
        .eq('id', id)
        .maybeSingle();
      if (!data) return null;
      const { data: tasks } = await supabase
        .from('entrepreneurship_tasks')
        .select('completed')
        .eq('entrepreneurship_id', id);
      const rows = tasks ?? [];
      const done = rows.filter((r) => r.completed).length;
      return {
        title: data.name,
        area_id: 'emprendimiento',
        done,
        total: rows.length,
        completed: rows.length > 0 && done === rows.length,
      };
    },
  },
  {
    value: 'book',
    label: 'Libro',
    icon: BookOpen,
    loadOptions: async () => {
      const { data } = await supabase
        .from('reading_library')
        .select('id,title,author,status')
        .neq('status', 'finished')
        .order('created_at', { ascending: false });
      return (data ?? []).map((b) => ({ id: b.id, title: b.title, subtitle: b.author ?? undefined }));
    },
    resolve: async (id) => {
      const { data } = await supabase
        .from('reading_library')
        .select('title,pages_read,pages_total,status')
        .eq('id', id)
        .maybeSingle();
      if (!data) return null;
      const total = data.pages_total ?? 0;
      const done = data.pages_read ?? 0;
      return {
        title: data.title,
        area_id: 'lectura',
        done,
        total,
        completed: data.status === 'finished' || (total > 0 && done >= total),
      };
    },
  },
  {
    value: 'song',
    label: 'Canción',
    icon: Music,
    loadOptions: async () => {
      const { data } = await supabase
        .from('music_repertoire')
        .select('id,title,artist,status')
        .neq('status', 'mastered')
        .order('created_at', { ascending: false });
      return (data ?? []).map((s) => ({ id: s.id, title: s.title, subtitle: s.artist ?? undefined }));
    },
    resolve: async (id) => {
      const { data } = await supabase
        .from('music_repertoire')
        .select('title,status,learned_at,mastered_at,recorded_at')
        .eq('id', id)
        .maybeSingle();
      if (!data) return null;
      const checks = [data.learned_at, data.mastered_at, data.recorded_at].filter(Boolean).length;
      return {
        title: data.title,
        area_id: 'musica',
        done: checks,
        total: 3,
        completed: checks >= 3 || data.status === 'mastered',
      };
    },
  },
  {
    value: 'free',
    label: 'Libre',
    icon: Pencil,
    loadOptions: async () => [],
    resolve: async () => null,
  },
];

export function getFocusEntityConfig(type: FocusEntityType): FocusEntityConfig {
  return FOCUS_ENTITY_TYPES.find((c) => c.value === type) ?? FOCUS_ENTITY_TYPES[FOCUS_ENTITY_TYPES.length - 1];
}

export function getAreaLabel(areaId?: string | null): string | null {
  if (!areaId) return null;
  return AREA_LABELS[areaId] ?? areaId;
}
