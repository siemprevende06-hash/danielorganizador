import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cachedMutation } from '@/lib/supabaseCache';
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

function mapRowToProject(row: any): Project {
  return {
    id: row.id,
    name: row.title,
    description: row.description || '',
    coverImage: row.cover_image || undefined,
    tasks: (row.tasks as ProjectTask[]) || [],
  };
}

function mapProjectToRow(project: Project): any {
  return {
    id: project.id,
    title: project.name,
    description: project.description || null,
    cover_image: project.coverImage || null,
    tasks: project.tasks as any,
    status: 'active',
  };
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFromDb = useCallback(async (): Promise<Project[] | null> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        return data.map(mapRowToProject);
      }
    } catch (e) {
      console.error('Error loading projects:', e);
    }
    return null;
  }, []);

  const migrateFromLegacy = useCallback(async (): Promise<Project[]> => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'user_projects')
        .maybeSingle();

      let legacy: Project[] = [];
      if (data?.setting_value && Array.isArray(data.setting_value)) {
        legacy = data.setting_value as unknown as Project[];
      } else {
        const stored = localStorage.getItem('userProjects');
        if (stored) legacy = JSON.parse(stored);
      }

      if (legacy.length === 0) return [];

      const migrated = legacy.map(p => ({
        ...mapProjectToRow(p),
        id: crypto.randomUUID(),
      }));

      const { error } = await supabase.from('projects').insert(migrated as any);
      if (error) throw error;

      localStorage.removeItem('userProjects');
      await supabase.from('app_settings').delete().eq('setting_key', 'user_projects');

      return migrated.map(mapRowToProject);
    } catch (e) {
      console.error('Error migrating projects:', e);
      return [];
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const fromDb = await loadFromDb();
      if (fromDb && fromDb.length > 0) {
        setProjects(fromDb);
      } else {
        const migrated = await migrateFromLegacy();
        setProjects(migrated);
      }
      setLoading(false);
    };
    init();
  }, [loadFromDb, migrateFromLegacy]);

  const persistOne = useCallback(async (project: Project) => {
    const row = mapProjectToRow(project);
    await cachedMutation('projects', 'upsert', row, undefined, 'id');
  }, []);

  const deleteOne = useCallback(async (id: string) => {
    await cachedMutation('projects', 'delete', undefined, { id });
  }, []);

  const createProject = useCallback((name: string, description: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      tasks: [],
    };
    setProjects(prev => [...prev, newProject]);
    persistOne(newProject);
    return newProject;
  }, [persistOne]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    deleteOne(id);
  }, [deleteOne]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      const changed = updated.find(p => p.id === id);
      if (changed) persistOne(changed);
      return updated;
    });
  }, [persistOne]);

  const addTask = useCallback((projectId: string, title: string, dueDate?: string) => {
    const task: ProjectTask = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      dueDate,
    };
    setProjects(prev => {
      const updated = prev.map(p =>
        p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p
      );
      const changed = updated.find(p => p.id === projectId);
      if (changed) persistOne(changed);
      return updated;
    });
  }, [persistOne]);

  const updateTask = useCallback((projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
    setProjects(prev => {
      const updated = prev.map(p =>
        p.id === projectId ? {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
        } : p
      );
      const changed = updated.find(p => p.id === projectId);
      if (changed) persistOne(changed);
      return updated;
    });
  }, [persistOne]);

  const deleteTask = useCallback((projectId: string, taskId: string) => {
    setProjects(prev => {
      const updated = prev.map(p =>
        p.id === projectId ? {
          ...p,
          tasks: p.tasks.filter(t => t.id !== taskId),
        } : p
      );
      const changed = updated.find(p => p.id === projectId);
      if (changed) persistOne(changed);
      return updated;
    });
  }, [persistOne]);

  const toggleTask = useCallback((projectId: string, taskId: string) => {
    setProjects(prev => {
      const updated = prev.map(p =>
        p.id === projectId ? {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t),
        } : p
      );
      const changed = updated.find(p => p.id === projectId);
      if (changed) persistOne(changed);
      return updated;
    });
  }, [persistOne]);

  const addSubTask = useCallback((projectId: string, taskId: string, title: string) => {
    const subTask: SubTask = { id: crypto.randomUUID(), title, completed: false };
    setProjects(prev => {
      const updated = prev.map(p =>
        p.id === projectId ? {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? {
            ...t,
            subTasks: [...(t.subTasks || []), subTask],
          } : t),
        } : p
      );
      const changed = updated.find(p => p.id === projectId);
      if (changed) persistOne(changed);
      return updated;
    });
  }, [persistOne]);

  const toggleSubTask = useCallback((projectId: string, taskId: string, subTaskId: string) => {
    setProjects(prev => {
      const updated = prev.map(p =>
        p.id === projectId ? {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? {
            ...t,
            subTasks: (t.subTasks || []).map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st),
          } : t),
        } : p
      );
      const changed = updated.find(p => p.id === projectId);
      if (changed) persistOne(changed);
      return updated;
    });
  }, [persistOne]);

  const getProject = useCallback((id: string): Project | undefined => {
    return projects.find(p => p.id === id);
  }, [projects]);

  return {
    projects, loading,
    setProjects: (updated: Project[]) => {
      setProjects(updated);
      for (const p of updated) persistOne(p);
    },
    createProject, deleteProject, updateProject,
    addTask, updateTask, deleteTask, toggleTask,
    addSubTask, toggleSubTask,
    getProject,
  };
}
