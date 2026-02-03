import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SubjectTopic {
  id: string;
  subject_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_for_final: boolean;
}

export interface PartialExam {
  id: string;
  subject_id: string;
  title: string;
  exam_date?: string;
  weight_percentage: number;
  grade?: number;
  status: string;
  topics: string[]; // topic IDs
}

export interface SubjectTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  task_type: 'delivery' | 'study'; // delivery = entregar, study = tiempo de estudio
  estimated_minutes?: number;
  topic_id?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  professor?: string;
  schedule?: string;
  credits?: number;
  year: number;
  semester: number;
  topics: SubjectTopic[];
  partialExams: PartialExam[];
  tasks: SubjectTask[];
}

export interface UniversitySettings {
  current_year: number;
  current_semester: number;
  academic_schedule: any[];
}

export function useUniversity() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [settings, setSettings] = useState<UniversitySettings>({
    current_year: 1,
    current_semester: 1,
    academic_schedule: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('university_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          current_year: data.current_year || 1,
          current_semester: data.current_semester || 1,
          academic_schedule: (data.academic_schedule as any[]) || []
        });
      }
    } catch (error) {
      console.error('Error loading university settings:', error);
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubjects([]);
        return;
      }

      // Load subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('university_subjects')
        .select('*')
        .order('created_at', { ascending: false });

      if (subjectsError) throw subjectsError;

      // Load topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('subject_topics')
        .select('*')
        .order('order_index', { ascending: true });

      if (topicsError) throw topicsError;

      // Load partial exams
      const { data: partialsData, error: partialsError } = await supabase
        .from('partial_exams')
        .select('*')
        .order('exam_date', { ascending: true });

      if (partialsError) throw partialsError;

      // Load partial exam topics
      const { data: partialTopicsData, error: partialTopicsError } = await supabase
        .from('partial_exam_topics')
        .select('*');

      if (partialTopicsError) throw partialTopicsError;

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('source', 'university');

      if (tasksError) throw tasksError;

      // Combine data
      const subjectsWithData: Subject[] = (subjectsData || []).map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.color || '',
        professor: subject.professor || '',
        schedule: subject.schedule || '',
        credits: subject.credits || 3,
        year: subject.year || 1,
        semester: subject.semester || 1,
        topics: (topicsData || [])
          .filter(t => t.subject_id === subject.id)
          .map(t => ({
            id: t.id,
            subject_id: t.subject_id,
            title: t.title,
            description: t.description,
            order_index: t.order_index || 0,
            is_for_final: t.is_for_final ?? true
          })),
        partialExams: (partialsData || [])
          .filter(p => p.subject_id === subject.id)
          .map(p => ({
            id: p.id,
            subject_id: p.subject_id,
            title: p.title,
            exam_date: p.exam_date,
            weight_percentage: p.weight_percentage || 20,
            grade: p.grade,
            status: p.status || 'pending',
            topics: (partialTopicsData || [])
              .filter(pt => pt.partial_exam_id === p.id)
              .map(pt => pt.topic_id)
          })),
        tasks: (tasksData || [])
          .filter(t => t.source_id === subject.id)
          .map(t => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            completed: t.completed || false,
            due_date: t.due_date || undefined,
            task_type: (t.task_type === 'study' ? 'study' : 'delivery') as 'delivery' | 'study',
            estimated_minutes: t.estimated_minutes,
            topic_id: t.topic_id
          }))
      }));

      setSubjects(subjectsWithData);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadSubjects();
  }, [loadSettings, loadSubjects]);

  const updateSettings = async (newSettings: Partial<UniversitySettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('university_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          ...newSettings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setSettings(prev => ({ ...prev, ...newSettings }));
      toast({ title: 'Configuración guardada' });
      return true;
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }
  };

  const createSubject = async (data: {
    name: string;
    code?: string;
    professor?: string;
    schedule?: string;
    credits?: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('university_subjects')
        .insert({
          name: data.name,
          color: data.code,
          professor: data.professor,
          schedule: data.schedule,
          credits: data.credits || 3,
          year: settings.current_year,
          semester: settings.current_semester,
          user_id: user.id
        });

      if (error) throw error;
      await loadSubjects();
      toast({ title: 'Asignatura creada', description: `${data.name} ha sido añadida.` });
      return true;
    } catch (error: any) {
      console.error('Error creating subject:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }
  };

  const deleteSubject = async (subjectId: string) => {
    try {
      const { error } = await supabase
        .from('university_subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;
      await loadSubjects();
      toast({ title: 'Asignatura eliminada' });
      return true;
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }
  };

  const addTopic = async (subjectId: string, title: string, description?: string, isForFinal: boolean = true) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const subject = subjects.find(s => s.id === subjectId);
      const orderIndex = subject?.topics.length || 0;

      const { error } = await supabase
        .from('subject_topics')
        .insert({
          subject_id: subjectId,
          user_id: user.id,
          title,
          description,
          is_for_final: isForFinal,
          order_index: orderIndex
        });

      if (error) throw error;
      await loadSubjects();
      toast({ title: 'Tema agregado' });
      return true;
    } catch (error: any) {
      console.error('Error adding topic:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }
  };

  const deleteTopic = async (topicId: string) => {
    try {
      const { error } = await supabase
        .from('subject_topics')
        .delete()
        .eq('id', topicId);

      if (error) throw error;
      await loadSubjects();
      toast({ title: 'Tema eliminado' });
      return true;
    } catch (error: any) {
      console.error('Error deleting topic:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }
  };

  const addPartialExam = async (subjectId: string, data: {
    title: string;
    exam_date?: string;
    weight_percentage?: number;
    topicIds?: string[];
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: examData, error: examError } = await supabase
        .from('partial_exams')
        .insert({
          subject_id: subjectId,
          user_id: user.id,
          title: data.title,
          exam_date: data.exam_date,
          weight_percentage: data.weight_percentage || 20
        })
        .select()
        .single();

      if (examError) throw examError;

      // Add topic links
      if (data.topicIds && data.topicIds.length > 0) {
        const topicLinks = data.topicIds.map(topicId => ({
          partial_exam_id: examData.id,
          topic_id: topicId
        }));

        const { error: linkError } = await supabase
          .from('partial_exam_topics')
          .insert(topicLinks);

        if (linkError) throw linkError;
      }

      await loadSubjects();
      toast({ title: 'Examen parcial creado' });
      return true;
    } catch (error: any) {
      console.error('Error adding partial exam:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }
  };

  const updatePartialExamGrade = async (examId: string, grade: number, status: string = 'completed') => {
    try {
      const { error } = await supabase
        .from('partial_exams')
        .update({ grade, status })
        .eq('id', examId);

      if (error) throw error;
      await loadSubjects();
      toast({ title: 'Nota actualizada' });
      return true;
    } catch (error: any) {
      console.error('Error updating grade:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }
  };

  const deletePartialExam = async (examId: string) => {
    try {
      const { error } = await supabase
        .from('partial_exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;
      await loadSubjects();
      toast({ title: 'Examen eliminado' });
      return true;
    } catch (error: any) {
      console.error('Error deleting exam:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }
  };

  const addTask = async (subjectId: string, data: {
    title: string;
    description?: string;
    due_date?: string;
    task_type: 'delivery' | 'study';
    estimated_minutes?: number;
    topic_id?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('tasks')
        .insert({
          title: data.title,
          description: data.description,
          due_date: data.due_date,
          task_type: data.task_type,
          estimated_minutes: data.estimated_minutes,
          topic_id: data.topic_id,
          source: 'university',
          source_id: subjectId,
          status: 'pendiente',
          completed: false,
          user_id: user.id,
          area_id: 'universidad'
        });

      if (error) throw error;
      await loadSubjects();
      toast({ title: data.task_type === 'delivery' ? 'Tarea a entregar creada' : 'Tiempo de estudio creado' });
      return true;
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      const allTasks = subjects.flatMap(s => s.tasks);
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return false;

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId);

      if (error) throw error;
      await loadSubjects();
      return true;
    } catch (error: any) {
      console.error('Error toggling task:', error);
      return false;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      await loadSubjects();
      toast({ title: 'Tarea eliminada' });
      return true;
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }
  };

  const getSubjectsByCurrentSemester = () => {
    return subjects.filter(
      s => s.year === settings.current_year && s.semester === settings.current_semester
    );
  };

  const getTodayStudyTime = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('focus_sessions')
      .select('duration_minutes')
      .eq('task_area', 'universidad')
      .gte('start_time', `${today}T00:00:00`)
      .lte('start_time', `${today}T23:59:59`);

    return (data || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  };

  return {
    subjects,
    settings,
    loading,
    loadSubjects,
    updateSettings,
    createSubject,
    deleteSubject,
    addTopic,
    deleteTopic,
    addPartialExam,
    updatePartialExamGrade,
    deletePartialExam,
    addTask,
    toggleTask,
    deleteTask,
    getSubjectsByCurrentSemester,
    getTodayStudyTime
  };
}
