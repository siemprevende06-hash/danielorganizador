import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
export function useRoutinePresets() {
    const [presets, setPresets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        loadPresets();
    }, []);
    const loadPresets = async () => {
        try {
            const { data, error } = await supabase
                .from('routine_presets')
                .select('*')
                .order('is_default', { ascending: false });
            if (error)
                throw error;
            const formattedPresets = (data || []).map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                wake_time: p.wake_time,
                sleep_time: p.sleep_time,
                sleep_hours: p.sleep_hours,
                excluded_block_ids: p.excluded_block_ids || [],
                modified_blocks: p.modified_blocks || {},
                is_default: p.is_default,
                icon: p.icon,
                color: p.color,
            }));
            setPresets(formattedPresets);
        }
        catch (error) {
            console.error('Error loading presets:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const applyPresetToDate = useCallback(async (presetId, date, mode, notes) => {
        const preset = presets.find(p => p.id === presetId);
        if (!preset)
            return null;
        const dateStr = date.toISOString().split('T')[0];
        try {
            const { data, error } = await supabase
                .from('daily_plans')
                .upsert({
                plan_date: dateStr,
                mode,
                notes: notes || null,
                preset_id: presetId,
                wake_time: preset.wake_time,
                sleep_time: preset.sleep_time,
                excluded_blocks: preset.excluded_block_ids,
            }, {
                onConflict: 'plan_date'
            })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error applying preset:', error);
            return null;
        }
    }, [presets]);
    const getPresetForDate = useCallback(async (date) => {
        const dateStr = date.toISOString().split('T')[0];
        try {
            const { data, error } = await supabase
                .from('daily_plans')
                .select('*')
                .eq('plan_date', dateStr)
                .maybeSingle();
            if (error)
                throw error;
            if (data) {
                return {
                    id: data.id,
                    plan_date: data.plan_date,
                    mode: data.mode,
                    notes: data.notes,
                    preset_id: data.preset_id,
                    wake_time: data.wake_time,
                    sleep_time: data.sleep_time,
                    excluded_blocks: data.excluded_blocks || [],
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error getting preset for date:', error);
            return null;
        }
    }, []);
    const getBlocksExcludedByPreset = useCallback((presetId) => {
        const preset = presets.find(p => p.id === presetId);
        return preset?.excluded_block_ids || [];
    }, [presets]);
    const getDefaultPreset = useCallback(() => {
        return presets.find(p => p.is_default);
    }, [presets]);
    return {
        presets,
        isLoading,
        applyPresetToDate,
        getPresetForDate,
        getBlocksExcludedByPreset,
        getDefaultPreset,
        refreshPresets: loadPresets,
    };
}
