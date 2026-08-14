import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
export function useSprints() {
    const [sprints, setSprints] = useState([]);
    const [activeSprint, setActiveSprint] = useState(null);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        try {
            const { data: sprintsData } = await supabase
                .from('sprints')
                .select('*')
                .order('start_date', { ascending: false });
            if (!sprintsData) {
                setLoading(false);
                return;
            }
            const sprintsWithObjectives = [];
            for (const s of sprintsData) {
                const { data: objectives } = await supabase
                    .from('sprint_objectives')
                    .select('*')
                    .eq('sprint_id', s.id);
                const sprint = {
                    id: s.id,
                    name: s.name,
                    start_date: s.start_date,
                    end_date: s.end_date,
                    status: s.status,
                    objectives: (objectives || []).map((o) => ({
                        id: o.id,
                        sprint_id: o.sprint_id,
                        area: o.area,
                        type: o.type,
                        title: o.title,
                        description: o.description,
                        target_value: Number(o.target_value),
                        current_value: Number(o.current_value),
                        unit: o.unit,
                        min_daily: o.min_daily ? Number(o.min_daily) : null,
                        max_daily: o.max_daily ? Number(o.max_daily) : null,
                        status: o.status,
                    })),
                };
                sprintsWithObjectives.push(sprint);
                if (s.status === 'active')
                    setActiveSprint(sprint);
            }
            setSprints(sprintsWithObjectives);
        }
        catch (error) {
            console.error('Error loading sprints:', error);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const createSprint = async (name, startDate, endDate) => {
        const { data, error } = await supabase
            .from('sprints')
            .insert({ name, start_date: startDate, end_date: endDate, status: 'active' })
            .select()
            .single();
        if (error)
            throw error;
        await load();
        return data;
    };
    const addObjective = async (sprintId, objective) => {
        const { error } = await supabase
            .from('sprint_objectives')
            .insert({ sprint_id: sprintId, objective_type: objective.type, ...objective });
        if (error)
            throw error;
        await load();
    };
    const updateObjective = async (id, updates) => {
        await supabase.from('sprint_objectives').update(updates).eq('id', id);
        await load();
    };
    const completeSprint = async (id) => {
        await supabase.from('sprints').update({ status: 'completed' }).eq('id', id);
        await load();
    };
    const deleteSprint = async (id) => {
        await supabase.from('sprint_objectives').delete().eq('sprint_id', id);
        await supabase.from('sprints').delete().eq('id', id);
        await load();
    };
    return {
        sprints,
        activeSprint,
        loading,
        createSprint,
        addObjective,
        updateObjective,
        completeSprint,
        deleteSprint,
        refresh: load,
    };
}
