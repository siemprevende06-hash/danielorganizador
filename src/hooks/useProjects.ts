import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  subTasks?: SubTask[];
  dueDate?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  tasks: ProjectTask[];
}

const SETTINGS_KEY = 'user_projects';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFromSupabase = useCallback(async (): Promise<Project[] | null> => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', SETTINGS_KEY)
        .maybeSingle();
      if (error) throw error;
      if (data?.setting_value && Array.isArray(data.setting_value)) {
        return data.setting_value as Project[];
      }
    } catch (e) {
      console.error('Error loading projects from Supabase:', e);
    }
    return null;
  }, []);

  const saveToSupabase = useCallback(async (projects: Project[]) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: SETTINGS_KEY,
          setting_value: projects,
          user_id: null,
        }, { onConflict: 'user_id,setting_key' });
      if (error) throw error;
    } catch (e) {
      console.error('Error saving projects to Supabase:', e);
    }
  }, []);

  const migrateFromLocalStorage = useCallback((): Project[] => {
    try {
      const stored = localStorage.getItem('userProjects');
      if (stored) {
        const parsed: Project[] = JSON.parse(stored);
        if (parsed.length > 0) {
          saveToSupabase(parsed);
          localStorage.removeItem('userProjects');
          return parsed;
        }
      }
    } catch {}
    return [];
  }, [saveToSupabase]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const fromSupabase = await loadFromSupabase();
      if (fromSupabase && fromSupabase.length > 0) {
        setProjects(fromSupabase);
        localStorage.removeItem('userProjects');
      } else {
        const migrated = migrateFromLocalStorage();
        setProjects(migrated);
      }
      setLoading(false);
    };
    init();
  }, [loadFromSupabase, migrateFromLocalStorage]);

  const persist = useCallback((updated: Project[]) => {
    setProjects(updated);
    saveToSupabase(updated);
  }, [saveToSupabase]);

  const createProject = useCallback((name: string, description: string) => {
    const newProject: Project = {
      id: generateId('project'),
      name,
      description,
      tasks: [],
    };
    persist([...projects, newProject]);
    return newProject;
  }, [projects, persist]);

  const deleteProject = useCallback((id: string) => {
    persist(projects.filter(p => p.id !== id));
  }, [projects, persist]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    persist(projects.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [projects, persist]);

  const addTask = useCallback((projectId: string, title: string, dueDate?: string) => {
    const task: ProjectTask = {
      id: generateId('task'),
      title,
      completed: false,
      dueDate,
    };
    persist(projects.map(p => p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p));
  }, [projects, persist]);

  const updateTask = useCallback((projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
    persist(projects.map(p => p.id === projectId ? {
      ...p,
      tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
    } : p));
  }, [projects, persist]);

  const deleteTask = useCallback((projectId: string, taskId: string) => {
    persist(projects.map(p => p.id === projectId ? {
      ...p,
      tasks: p.tasks.filter(t => t.id !== taskId),
    } : p));
  }, [projects, persist]);

  const toggleTask = useCallback((projectId: string, taskId: string) => {
    persist(projects.map(p => p.id === projectId ? {
      ...p,
      tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t),
    } : p));
  }, [projects, persist]);

  const addSubTask = useCallback((projectId: string, taskId: string, title: string) => {
    const subTask: SubTask = { id: generateId('subtask'), title, completed: false };
    persist(projects.map(p => p.id === projectId ? {
      ...p,
      tasks: p.tasks.map(t => t.id === taskId ? {
        ...t,
        subTasks: [...(t.subTasks || []), subTask],
      } : t),
    } : p));
  }, [projects, persist]);

  const toggleSubTask = useCallback((projectId: string, taskId: string, subTaskId: string) => {
    persist(projects.map(p => p.id === projectId ? {
      ...p,
      tasks: p.tasks.map(t => t.id === taskId ? {
        ...t,
        subTasks: (t.subTasks || []).map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st),
      } : t),
    } : p));
  }, [projects, persist]);

  const getProject = useCallback((id: string): Project | undefined => {
    return projects.find(p => p.id === id);
  }, [projects]);

  return {
    projects, loading,
    setProjects: persist,
    createProject, deleteProject, updateProject,
    addTask, updateTask, deleteTask, toggleTask,
    addSubTask, toggleSubTask,
    getProject,
  };
}