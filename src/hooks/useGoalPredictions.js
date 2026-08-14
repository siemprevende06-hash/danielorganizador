import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';
export function useGoalPredictions() {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function analyze() {
            const { data: goals } = await supabase.from('twelve_week_goals')
                .select('*').eq('status', 'active');
            if (!goals?.length) {
                setLoading(false);
                return;
            }
            const preds = goals.map(g => {
                const progress = g.progress_percentage || 0;
                const createdAt = new Date(g.created_at);
                const daysElapsed = Math.max(1, differenceInDays(new Date(), createdAt));
                const dailyRate = progress / daysElapsed;
                const remaining = 100 - progress;
                const daysToComplete = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : null;
                const predictedDate = daysToComplete
                    ? new Date(Date.now() + daysToComplete * 86400000).toISOString().split('T')[0]
                    : null;
                const targetDate = g.target_value ? undefined : undefined; // use quarter end
                const quarterEnd = new Date(g.year, g.quarter * 3, 0);
                const daysRemaining = differenceInDays(quarterEnd, new Date());
                const onTrack = daysToComplete !== null ? daysToComplete <= daysRemaining : false;
                return {
                    id: g.id,
                    title: g.title,
                    currentProgress: progress,
                    dailyRate: Math.round(dailyRate * 100) / 100,
                    predictedDaysToComplete: daysToComplete,
                    predictedDate,
                    onTrack,
                    targetDate: quarterEnd.toISOString().split('T')[0],
                };
            });
            setPredictions(preds);
            setLoading(false);
        }
        analyze();
    }, []);
    return { predictions, loading };
}
