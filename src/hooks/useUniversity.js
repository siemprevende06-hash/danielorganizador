import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
export function useUniversity() {
    const [subjects, setSubjects] = useState([]);
    const [settings, setSettings] = useState({
        current_year: 1,
        current_semester: 1,
        academic_schedule: []
    });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const loadSettings = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('university_settings')
                .select('*')
                .limit(1)
                .maybeSingle();
            if (error && error.code !== 'PGRST116')
                throw error;
            if (data) {
                setSettings({
                    current_year: data.current_year || 1,
                    current_semester: data.current_semester || 1,
                    academic_schedule: data.academic_schedule || []
                });
            }
        }
        catch (error) {
            console.error('Error loading university settings:', error);
        }
    }, []);
    const loadSubjects = useCallback(async () => {
        try {
            setLoading(true);
            const [subjectsRes, topicsRes, partialsRes, partialTopicsRes, tasksRes] = await Promise.all([
                supabase.from('university_subjects').select('*').order('created_at', { ascending: false }),
                supabase.from('subject_topics').select('*').order('order_index', { ascending: true }),
                supabase.from('partial_exams').select('*').order('exam_date', { ascending: true }),
                supabase.from('partial_exam_topics').select('*'),
                supabase.from('tasks').select('*').eq('source', 'university'),
            ]);
            if (subjectsRes.error)
                throw subjectsRes.error;
            const subjectsWithData = (subjectsRes.data || []).map(subject => ({
                id: subject.id,
                name: subject.name,
                code: subject.color || '',
                professor: subject.professor || '',
                schedule: subject.schedule || '',
                approved: subject.approved || false,
                year: subject.year || 1,
                semester: subject.semester || 1,
                color: subject.color || undefined,
                topics: (topicsRes.data || [])
                    .filter(t => t.subject_id === subject.id)
                    .map(t => ({
                    id: t.id,
                    subject_id: t.subject_id,
                    title: t.title,
                    description: t.description,
                    order_index: t.order_index || 0,
                    is_for_final: t.is_for_final ?? true
                })),
                partialExams: (partialsRes.data || [])
                    .filter(p => p.subject_id === subject.id)
                    .map(p => ({
                    id: p.id,
                    subject_id: p.subject_id,
                    title: p.title,
                    exam_date: p.exam_date,
                    weight_percentage: p.weight_percentage || 20,
                    grade: p.grade,
                    status: p.status || 'pending',
                    topics: (partialTopicsRes.data || [])
                        .filter(pt => pt.partial_exam_id === p.id)
                        .map(pt => pt.topic_id)
                })),
                tasks: (tasksRes.data || [])
                    .filter(t => t.source_id === subject.id)
                    .map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description || '',
                    completed: t.completed || false,
                    due_date: t.due_date || undefined,
                    task_type: (t.task_type === 'study' ? 'study' : 'delivery'),
                    estimated_minutes: t.estimated_minutes,
                    topic_id: t.topic_id
                }))
            }));
            setSubjects(subjectsWithData);
        }
        catch (error) {
            console.error('Error loading subjects:', error);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        loadSettings();
        loadSubjects();
    }, [loadSettings, loadSubjects]);
    const updateSettings = async (newSettings) => {
        try {
            const merged = { ...settings, ...newSettings };
            const { error } = await supabase
                .from('university_settings')
                .upsert({
                user_id: null,
                current_year: merged.current_year,
                current_semester: merged.current_semester,
                academic_schedule: merged.academic_schedule,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            if (error)
                throw error;
            setSettings(merged);
            toast({ title: 'Configuración guardada' });
            return true;
        }
        catch (error) {
            console.error('Error updating settings:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return false;
        }
    };
    const createSubject = async (data) => {
        try {
            const { error } = await supabase
                .from('university_subjects')
                .insert({
                name: data.name,
                color: data.code,
                professor: data.professor,
                schedule: data.schedule,
                year: settings.current_year,
                semester: settings.current_semester,
            });
            if (error)
                throw error;
            await loadSubjects();
            toast({ title: 'Asignatura creada', description: `${data.name} ha sido añadida.` });
            return true;
        }
        catch (error) {
            console.error('Error creating subject:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return false;
        }
    };
    const deleteSubject = async (subjectId) => {
        try {
            const { error } = await supabase
                .from('university_subjects')
                .delete()
                .eq('id', subjectId);
            if (error)
                throw error;
            await loadSubjects();
            toast({ title: 'Asignatura eliminada' });
            return true;
        }
        catch (error) {
            console.error('Error deleting subject:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return false;
        }
    };
    const toggleApproved = async (subjectId) => {
        try {
            const subject = subjects.find(s => s.id === subjectId);
            if (!subject)
                return false;
            const { error } = await supabase
                .from('university_subjects')
                .update({ approved: !subject.approved })
                .eq('id', subjectId);
            if (error)
                throw error;
            await loadSubjects();
            toast({ title: subject.approved ? 'Asignatura marcada como en curso' : `¡${subject.name} aprobada! 🎉` });
            return true;
        }
        catch (error) {
            console.error('Error toggling approved:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return false;
        }
    };
    const addTopic = async (subjectId, title, description, isForFinal = true) => {
        try {
            const subject = subjects.find(s => s.id === subjectId);
            const orderIndex = subject?.topics.length || 0;
            const { error } = await supabase
                .from('subject_topics')
                .insert({
                subject_id: subjectId,
                title,
                description,
                is_for_final: isForFinal,
                order_index: orderIndex
            });
            if (error)
                throw error;
            await loadSubjects();
            toast({ title: 'Tema agregado' });
            return true;
        }
        catch (error) {
            console.error('Error adding topic:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return false;
        }
    };
    const deleteTopic = async (topicId) => {
        try {
            const { error } = await supabase
                .from('subject_topics')
                .delete()
                .eq('id', topicId);
            if (error)
                throw error;
            await loadSubjects();
            toast({ title: 'Tema eliminado' });
            return true;
        }
        catch (error) {
            console.error('Error deleting topic:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return false;
        }
    };
    const addPartialExam = async (subjectId, data) => {
        try {
            const { data: examData, error: examError } = await supabase
                .from('partial_exams')
                .insert({
                subject_id: subjectId,
                title: data.title,
                exam_date: data.exam_date,
                weight_percentage: data.weight_percentage || 20
            })
                .select()
                .single();
            if (examError)
                throw examError;
            if (data.topicIds && data.topicIds.length > 0) {
                const topicLinks = data.topicIds.map(topicId => ({
                    partial_exam_id: examData.id,
                    topic_id: topicId
                }));
                const { error: linkError } = await supabase
                    .from('partial_exam_topics')
                    .insert(topicLinks);
                if (linkError)
                    throw linkError;
            }
            await loadSubjects();
            toast({ title: 'Examen parcial creado' });
            return true;
        }
        catch (error) {
            console.error('Error adding partial exam:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return false;
        }
    };
    const updatePartialExamGrade = async (examId, grade, status = 'completed') => {
        try {
            const { error } = await supabase
                .from('partial_exams')
                .update({ grade, status })
                .eq('id', examId);
            if (error)
                throw error;
            await loadSubjects();
            toast({ title: 'Nota actualizada' });
            return true;
        }
        catch (error) {
            console.error('Error updating grade:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return false;
        }
    };
    const deletePartialExam = async (examId) => {
        try {
            const { error } = await supabase
                .from('partial_exams')
                .delete()
                .eq('id', examId);
            if (error)
                throw error;
            await loadSubjects();
            toast({ title: 'Examen eliminado' });
            return true;
        }
        catch (error) {
            console.error('Error deleting exam:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return false;
        }
    };
    const addTask = async (subjectId, data) => {
        try {
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
                area_id: 'universidad'
            });
            if (error)
                throw error;
            await loadSubjects();
            toast({ title: data.task_type === 'delivery' ? 'Tarea a entregar creada' : 'Tiempo de estudio creado' });
            return true;
        }
        catch (error) {
            console.error('Error adding task:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return false;
        }
    };
    const toggleTask = async (taskId) => {
        try {
            const allTasks = subjects.flatMap(s => s.tasks);
            const task = allTasks.find(t => t.id === taskId);
            if (!task)
                return false;
            const { error } = await supabase
                .from('tasks')
                .update({ completed: !task.completed })
                .eq('id', taskId);
            if (error)
                throw error;
            await loadSubjects();
            return true;
        }
        catch (error) {
            console.error('Error toggling task:', error);
            return false;
        }
    };
    const deleteTask = async (taskId) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);
            if (error)
                throw error;
            await loadSubjects();
            toast({ title: 'Tarea eliminada' });
            return true;
        }
        catch (error) {
            console.error('Error deleting task:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            return false;
        }
    };
    const getSubjectsByCurrentSemester = useCallback(() => {
        return subjects.filter(s => s.year === settings.current_year && s.semester === settings.current_semester);
    }, [subjects, settings]);
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
    const getStudyMinutesByDay = async (days = 14) => {
        const start = new Date();
        start.setDate(start.getDate() - (days - 1));
        const { data } = await supabase
            .from('focus_sessions')
            .select('duration_minutes, start_time')
            .eq('task_area', 'universidad')
            .gte('start_time', start.toISOString());
        const byDay = new Map();
        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            byDay.set(d.toISOString().split('T')[0], 0);
        }
        (data || []).forEach(s => {
            const day = String(s.start_time).split('T')[0];
            if (byDay.has(day)) {
                byDay.set(day, byDay.get(day) + (s.duration_minutes || 0));
            }
        });
        return Array.from(byDay.entries()).map(([day, minutes]) => ({
            day: day.slice(5),
            minutes
        }));
    };
    // GPA calculation
    const gpaData = useMemo(() => {
        const currentSubjects = subjects.filter(s => s.year === settings.current_year && s.semester === settings.current_semester);
        return currentSubjects.map(subject => {
            const partialGrades = subject.partialExams.map(p => ({
                title: p.title,
                grade: p.grade ?? null,
                weight: p.weight_percentage
            }));
            const gradedExams = partialGrades.filter(p => p.grade !== null);
            let weightedAverage = null;
            if (gradedExams.length > 0) {
                const totalWeight = gradedExams.reduce((sum, p) => sum + p.weight, 0);
                const weightedSum = gradedExams.reduce((sum, p) => sum + (p.grade * p.weight), 0);
                weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : null;
            }
            return {
                subjectId: subject.id,
                subjectName: subject.name,
                weightedAverage,
                partialGrades
            };
        });
    }, [subjects, settings]);
    const overallGPA = useMemo(() => {
        const gradedSubjects = gpaData.filter(g => g.weightedAverage !== null);
        if (gradedSubjects.length === 0)
            return null;
        const sum = gradedSubjects.reduce((acc, g) => acc + g.weightedAverage, 0);
        return sum / gradedSubjects.length;
    }, [gpaData]);
    return {
        subjects,
        settings,
        loading,
        gpaData,
        overallGPA,
        updateSettings,
        createSubject,
        deleteSubject,
        toggleApproved,
        addTopic,
        deleteTopic,
        addPartialExam,
        updatePartialExamGrade,
        deletePartialExam,
        addTask,
        toggleTask,
        deleteTask,
        getSubjectsByCurrentSemester,
        getTodayStudyTime,
        getStudyMinutesByDay,
        refetch: loadSubjects,
    };
}
