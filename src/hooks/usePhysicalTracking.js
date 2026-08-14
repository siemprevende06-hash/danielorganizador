import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
export const usePhysicalTracking = () => {
    const [goal, setGoal] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const loadGoal = useCallback(async () => {
        const { data, error } = await supabase
            .from('physical_goals')
            .select('*')
            .eq('is_active', true)
            .maybeSingle();
        if (error) {
            console.error('Error loading physical goal:', error);
            return null;
        }
        return data;
    }, []);
    const loadMeasurements = useCallback(async () => {
        const { data, error } = await supabase
            .from('physical_tracking')
            .select('*')
            .order('measurement_date', { ascending: false })
            .limit(100);
        if (error) {
            console.error('Error loading measurements:', error);
            return [];
        }
        return data || [];
    }, []);
    const loadGymDaysThisMonth = useCallback(async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startStr = startOfMonth.toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('habit_history')
            .select('completed_dates')
            .or('habit_id.ilike.%gym%,habit_id.ilike.%ejercicio%,habit_id.ilike.%entrenamiento%');
        if (error || !data)
            return 0;
        let count = 0;
        data.forEach((habit) => {
            const dates = habit.completed_dates;
            if (Array.isArray(dates)) {
                dates.forEach(entry => {
                    if (entry.date >= startStr && entry.status === 'completed') {
                        count++;
                    }
                });
            }
        });
        return count;
    }, []);
    const calculateStreak = useCallback(async () => {
        const { data, error } = await supabase
            .from('habit_history')
            .select('completed_dates')
            .or('habit_id.ilike.%gym%,habit_id.ilike.%ejercicio%,habit_id.ilike.%entrenamiento%')
            .limit(1)
            .maybeSingle();
        if (error || !data)
            return 0;
        const dates = data.completed_dates;
        if (!Array.isArray(dates) || dates.length === 0)
            return 0;
        const completedDates = dates
            .filter(d => d.status === 'completed')
            .map(d => d.date)
            .sort()
            .reverse();
        if (completedDates.length === 0)
            return 0;
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let currentDate = new Date(today);
        for (const dateStr of completedDates) {
            const checkDate = currentDate.toISOString().split('T')[0];
            if (dateStr === checkDate) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            }
            else if (dateStr < checkDate) {
                break;
            }
        }
        return streak;
    }, []);
    const loadAll = useCallback(async () => {
        setIsLoading(true);
        const [goalData, measurementsData] = await Promise.all([
            loadGoal(),
            loadMeasurements()
        ]);
        if (goalData)
            setGoal(goalData);
        setMeasurements(measurementsData);
        setIsLoading(false);
    }, [loadGoal, loadMeasurements]);
    useEffect(() => {
        loadAll();
    }, [loadAll]);
    const addMeasurement = async (measurement) => {
        const { data, error } = await supabase
            .from('physical_tracking')
            .insert({
            weight: measurement.weight,
            body_fat_percentage: measurement.body_fat_percentage,
            chest_cm: measurement.chest_cm,
            waist_cm: measurement.waist_cm,
            arm_cm: measurement.arm_cm,
            front_photo_url: measurement.front_photo_url,
            side_photo_url: measurement.side_photo_url,
            notes: measurement.notes,
            measurement_date: new Date().toISOString().split('T')[0]
        })
            .select()
            .single();
        if (error) {
            toast({
                title: 'Error',
                description: 'No se pudo guardar la medición',
                variant: 'destructive'
            });
            return null;
        }
        toast({
            title: '¡Medición guardada!',
            description: `Peso registrado: ${measurement.weight} kg`
        });
        await loadAll();
        return data;
    };
    const createOrUpdateGoal = async (goalData) => {
        // Deactivate existing goals
        await supabase
            .from('physical_goals')
            .update({ is_active: false })
            .eq('is_active', true);
        const { data, error } = await supabase
            .from('physical_goals')
            .insert({
            start_weight: goalData.start_weight,
            target_weight: goalData.target_weight,
            start_photo_url: goalData.start_photo_url,
            target_photo_url: goalData.target_photo_url,
            gym_days_target: goalData.gym_days_target || 20,
            target_date: goalData.target_date,
            is_active: true
        })
            .select()
            .single();
        if (error) {
            toast({
                title: 'Error',
                description: 'No se pudo guardar la meta',
                variant: 'destructive'
            });
            return null;
        }
        toast({
            title: '¡Meta guardada!',
            description: `Meta: ${goalData.target_weight} kg`
        });
        await loadAll();
        return data;
    };
    const getStats = useCallback(async () => {
        const [gymDays, streak] = await Promise.all([
            loadGymDaysThisMonth(),
            calculateStreak()
        ]);
        const startWeight = goal?.start_weight || 50;
        const targetWeight = goal?.target_weight || 70;
        const currentWeight = measurements[0]?.weight || startWeight;
        const muscleGainTarget = targetWeight - startWeight;
        const currentMuscleGain = currentWeight - startWeight;
        // Calculate trend based on last measurements
        let trend = 'stable';
        if (measurements.length >= 2) {
            const recent = measurements[0].weight;
            const previous = measurements[1].weight;
            if (recent > previous)
                trend = 'up';
            else if (recent < previous)
                trend = 'down';
        }
        return {
            startWeight,
            currentWeight,
            targetWeight,
            muscleGainTarget,
            currentMuscleGain,
            gymDaysThisMonth: gymDays,
            gymDaysTarget: goal?.gym_days_target || 20,
            currentStreak: streak,
            trend,
            startPhotoUrl: goal?.start_photo_url || null,
            targetPhotoUrl: goal?.target_photo_url || null
        };
    }, [goal, measurements, loadGymDaysThisMonth, calculateStreak]);
    return {
        goal,
        measurements,
        isLoading,
        addMeasurement,
        createOrUpdateGoal,
        getStats,
        reload: loadAll
    };
};
