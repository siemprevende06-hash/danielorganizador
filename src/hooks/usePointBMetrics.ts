import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PointBMetric {
  id: string;
  area: string;
  metric_name: string;
  current_value: number;
  target_value: number;
  unit: string;
  icon: string | null;
  sort_order: number;
}

const AREA_ICONS: Record<string, string> = {
  universidad: '🎓',
  emprendimiento: '💼',
  proyectos: '🚀',
  gym: '💪',
  idiomas: '🌍',
  musica: '🎵',
  lectura: '📖',
  finanzas: '💰',
  apariencia: '✨',
};

export function usePointBMetrics() {
  const [metrics, setMetrics] = useState<PointBMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('point_b_metrics')
        .select('*')
        .order('sort_order', { ascending: true });

      setMetrics((data || []).map((m: any) => ({
        id: m.id,
        area: m.area,
        metric_name: m.metric_name,
        current_value: Number(m.current_value),
        target_value: Number(m.target_value),
        unit: m.unit,
        icon: m.icon,
        sort_order: m.sort_order,
      })));
    } catch (error) {
      console.error('Error loading point B metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addMetric = async (metric: Omit<PointBMetric, 'id'>) => {
    const { error } = await supabase.from('point_b_metrics').insert(metric);
    if (error) throw error;
    await load();
  };

  const updateMetric = async (id: string, updates: Partial<PointBMetric>) => {
    await supabase.from('point_b_metrics').update(updates).eq('id', id);
    await load();
  };

  const deleteMetric = async (id: string) => {
    await supabase.from('point_b_metrics').delete().eq('id', id);
    await load();
  };

  const groupedByArea = () => {
    const groups: Record<string, PointBMetric[]> = {};
    for (const m of metrics) {
      if (!groups[m.area]) groups[m.area] = [];
      groups[m.area].push(m);
    }
    return groups;
  };

  return {
    metrics,
    groupedByArea: groupedByArea(),
    loading,
    addMetric,
    updateMetric,
    deleteMetric,
    refresh: load,
  };
}
