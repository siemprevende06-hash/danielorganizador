import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
export function useExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const loadExams = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('exams')
                .select('*')
                .order('exam_date', { ascending: true });
            if (error)
                throw error;
            setExams(data || []);
        }
        catch (error) {
            console.error('Error loading exams:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudieron cargar los exámenes'
            });
        }
        finally {
            setLoading(false);
        }
    }, [toast]);
    useEffect(() => {
        loadExams();
    }, [loadExams]);
    const createExam = async (data) => {
        try {
            const { error } = await supabase
                .from('exams')
                .insert({
                ...data,
                preparation_days: data.preparation_days || 14,
                target_study_hours: data.target_study_hours || 20,
                target_exercises: data.target_exercises || 50,
                current_study_hours: 0,
                current_exercises: 0,
                status: 'pending'
            });
            if (error)
                throw error;
            await loadExams();
            toast({ title: 'Examen creado', description: `${data.title} ha sido añadido.` });
            return true;
        }
        catch (error) {
            console.error('Error creating exam:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return false;
        }
    };
    const updateExamProgress = async (examId, data) => {
        try {
            const { error } = await supabase
                .from('exams')
                .update(data)
                .eq('id', examId);
            if (error)
                throw error;
            await loadExams();
            toast({ title: 'Progreso actualizado' });
            return true;
        }
        catch (error) {
            console.error('Error updating exam progress:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
            return false;
        }
    };
    const deleteExam = async (examId) => {
        try {
            const { error } = await supabase
                .from('exams')
                .delete()
                .eq('id', examId);
            if (error)
                throw error;
            await loadExams();
            toast({ title: 'Examen eliminado' });
            return true;
        }
        catch (error) {
            console.error('Error deleting exam:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
            return false;
        }
    };
    const getExamsBySubject = (subjectId) => {
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
