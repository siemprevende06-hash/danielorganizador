import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
export const LEVEL_NAMES = {
    1: 'Principiante',
    2: 'Aprendiz',
    3: 'Intermedio',
    4: 'Experto',
    5: 'Maestro',
};
export const AREAS = [
    { id: 'universidad', label: 'Universidad', icon: '🎓' },
    { id: 'emprendimiento', label: 'Emprendimiento', icon: '💼' },
    { id: 'gym', label: 'Gym', icon: '💪' },
    { id: 'idiomas', label: 'Idiomas', icon: '🌍' },
    { id: 'proyectos', label: 'Proyectos', icon: '🚀' },
    { id: 'musica', label: 'Música', icon: '🎵' },
    { id: 'lectura', label: 'Lectura', icon: '📖' },
];
export const useConfidenceSteps = () => {
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const fetchSteps = async () => {
        try {
            const { data, error } = await supabase
                .from('confidence_steps')
                .select('*')
                .order('order_index', { ascending: true });
            if (error)
                throw error;
            // Organize into parent/child structure
            const parentSteps = data?.filter(s => !s.parent_id) || [];
            const organizedSteps = parentSteps.map(parent => ({
                ...parent,
                subtasks: data?.filter(s => s.parent_id === parent.id) || [],
            }));
            setSteps(organizedSteps);
        }
        catch (error) {
            console.error('Error fetching confidence steps:', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchSteps();
    }, []);
    const addStep = async (step) => {
        try {
            const { data, error } = await supabase
                .from('confidence_steps')
                .insert({
                area: step.area || 'general',
                title: step.title || '',
                description: step.description,
                target_date: step.target_date,
                level: step.level || 1,
                target_level: step.target_level || 2,
                parent_id: step.parent_id,
                view_type: step.view_type || 'weekly',
                progress_percentage: 0,
                completed: false,
            })
                .select()
                .single();
            if (error)
                throw error;
            await fetchSteps();
            toast({
                title: "Escalón agregado",
                description: step.title,
            });
            return data;
        }
        catch (error) {
            console.error('Error adding step:', error);
            toast({
                title: "Error",
                description: "No se pudo agregar el escalón",
                variant: "destructive",
            });
            return null;
        }
    };
    const updateStep = async (id, updates) => {
        try {
            const { error } = await supabase
                .from('confidence_steps')
                .update(updates)
                .eq('id', id);
            if (error)
                throw error;
            await fetchSteps();
        }
        catch (error) {
            console.error('Error updating step:', error);
            toast({
                title: "Error",
                description: "No se pudo actualizar el escalón",
                variant: "destructive",
            });
        }
    };
    const toggleComplete = async (id) => {
        const step = steps.find(s => s.id === id) || steps.flatMap(s => s.subtasks || []).find(s => s.id === id);
        if (!step)
            return;
        await updateStep(id, {
            completed: !step.completed,
            progress_percentage: !step.completed ? 100 : step.progress_percentage,
        });
    };
    const deleteStep = async (id) => {
        try {
            const { error } = await supabase
                .from('confidence_steps')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            await fetchSteps();
            toast({
                title: "Escalón eliminado",
            });
        }
        catch (error) {
            console.error('Error deleting step:', error);
        }
    };
    const getStepsByArea = (area) => {
        return steps.filter(s => s.area === area);
    };
    const getStepsByViewType = (viewType) => {
        return steps.filter(s => s.view_type === viewType);
    };
    const getCurrentLevel = () => {
        const completedSteps = steps.filter(s => s.completed);
        if (completedSteps.length === 0)
            return 1;
        return Math.min(Math.floor(completedSteps.length / 3) + 1, 5);
    };
    const getProgressToNextLevel = () => {
        const completedSteps = steps.filter(s => s.completed).length;
        const currentLevel = getCurrentLevel();
        const stepsForCurrentLevel = (currentLevel - 1) * 3;
        const stepsToNextLevel = 3;
        const progressInLevel = completedSteps - stepsForCurrentLevel;
        return Math.min(Math.round((progressInLevel / stepsToNextLevel) * 100), 100);
    };
    return {
        steps,
        loading,
        addStep,
        updateStep,
        toggleComplete,
        deleteStep,
        getStepsByArea,
        getStepsByViewType,
        getCurrentLevel,
        getProgressToNextLevel,
        refetch: fetchSteps,
        LEVEL_NAMES,
        AREAS,
    };
};
