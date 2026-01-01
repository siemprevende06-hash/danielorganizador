import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Exam {
  id: string;
  subject_id: string;
  user_id: string;
  title: string;
  exam_date: string;
  preparation_days: number;
  target_study_hours: number;
  target_exercises: number;
  current_study_hours: number;
  current_exercises: number;
  status: string;
  grade: number | null;
  topics: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExamData {
  subject_id: string;
  title: string;
  exam_date: string;
  preparation_days?: number;
  target_study_hours?: number;
  target_exercises?: number;
  topics?: string;
  notes?: string;
}

export interface UpdateExamProgressData {
  current_study_hours?: number;
  current_exercises?: number;
  status?: string;
  grade?: number;
}

export function useExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadExams = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setExams([]);
        return;
      }

      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id)
        .order('exam_date', { ascending: true });

      if (error) throw error;
      setExams((data as Exam[]) || []);
    } catch (error: any) {
      console.error('Error loading exams:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los exámenes'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const createExam = async (data: CreateExamData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('exams')
        .insert({
          ...data,
          user_id: user.id,
          preparation_days: data.preparation_days || 14,
          target_study_hours: data.target_study_hours || 20,
          target_exercises: data.target_exercises || 50,
          current_study_hours: 0,
          current_exercises: 0,
          status: 'pending'
        });

      if (error) throw error;
      
      await loadExams();
      toast({ title: 'Examen creado', description: `${data.title} ha sido añadido.` });
      return true;
    } catch (error: any) {
      console.error('Error creating exam:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
      return false;
    }
  };

  const updateExamProgress = async (examId: string, data: UpdateExamProgressData) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update(data)
        .eq('id', examId);

      if (error) throw error;
      
      await loadExams();
      toast({ title: 'Progreso actualizado' });
      return true;
    } catch (error: any) {
      console.error('Error updating exam progress:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
      return false;
    }
  };

  const deleteExam = async (examId: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;
      
      await loadExams();
      toast({ title: 'Examen eliminado' });
      return true;
    } catch (error: any) {
      console.error('Error deleting exam:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
      return false;
    }
  };

  const getExamsBySubject = (subjectId: string) => {
    return exams.filter(exam => exam.subject_id === subjectId);
  };

  return {
    exams,
    loading,
    loadExams,
    createExam,
    updateExamProgress,
    deleteExam,
    getExamsBySubject
  };
}
