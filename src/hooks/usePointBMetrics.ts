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
  point_b_area_id: string | null;
}

export function mapAreaToPointBArea(area: string): string {
  const mapping: Record<string, string> = {
    universidad: 'profesional',
    emprendimiento: 'profesional',
    proyectos: 'profesional',
    gym: 'salud',
    idiomas: 'desarrollo',
    musica: 'desarrollo',
    lectura: 'desarrollo',
    finanzas: 'finanzas',
    apariencia: 'apariencia',
    piano: 'desarrollo',
    guitarra: 'desarrollo',
    ajedrez: 'ocio',
  };
  return mapping[area] || area;
}

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
        point_b_area_id: m.point_b_area_id || mapAreaToPointBArea(m.area),
      })));
    } catch (error) {
      console.error('Error loading point B metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addMetric = async (metric: Omit<PointBMetric, 'id'>) => {
    const { error } = await supabase.from('point_b_metrics').insert({
      area: metric.area,
      area_id: metric.area,
      point_b_area_id: metric.point_b_area_id || mapAreaToPointBArea(metric.area),
      metric_name: metric.metric_name,
      current_value: String(metric.current_value),
      target_value: String(metric.target_value),
      unit: metric.unit,
      icon: metric.icon,
      sort_order: metric.sort_order,
    } as any);
    if (error) throw error;
    await load();
  };

  const updateMetric = async (id: string, updates: Partial<PointBMetric>) => {
    const dbUpdates: Record<string, any> = { ...updates };
    if (updates.current_value !== undefined) dbUpdates.current_value = String(updates.current_value);
    if (updates.target_value !== undefined) dbUpdates.target_value = String(updates.target_value);
    if (updates.point_b_area_id) dbUpdates.point_b_area_id = updates.point_b_area_id;
    await supabase.from('point_b_metrics').update(dbUpdates).eq('id', id);
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

  const groupedByPointBArea = () => {
    const groups: Record<string, PointBMetric[]> = {};
    for (const m of metrics) {
      const pbArea = m.point_b_area_id || mapAreaToPointBArea(m.area);
      if (!groups[pbArea]) groups[pbArea] = [];
      groups[pbArea].push(m);
    }
    return groups;
  };

  return {
    metrics,
    groupedByArea: groupedByArea(),
    groupedByPointBArea: groupedByPointBArea(),
    loading,
    addMetric,
    updateMetric,
    deleteMetric,
    refresh: load,
  };
}
