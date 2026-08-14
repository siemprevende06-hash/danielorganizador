import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
const STATIC_NEEDS = [
    { necesidad_id: 'moto', titulo: 'Moto de Combustión', descripcion: 'Libertad de movimiento con mi propia moto', icono: '🏍️', progreso: 0, area_referencia: 'goals', orden: 1 },
    { necesidad_id: 'dinero', titulo: 'Dinero para Salir', descripcion: 'Tener presupuesto para invitar y disfrutar', icono: '💰', progreso: 0, area_referencia: 'finance', orden: 2 },
    { necesidad_id: 'novia', titulo: 'Novia que me guste', descripcion: 'Relación de pareja con conexión genuina', icono: '❤️', progreso: 0, area_referencia: 'vida-social', orden: 3 },
    { necesidad_id: 'amigos', titulo: 'Amigos y Experiencias', descripcion: 'Salidas, hoteles y momentos inolvidables', icono: '🎉', progreso: 0, area_referencia: 'vida-social', orden: 4 },
    { necesidad_id: 'intimidad', titulo: 'Sexo en todas las posiciones', descripcion: 'Vida íntima plena y variada con mi pareja', icono: '🔞', progreso: 0, area_referencia: 'vida-social', orden: 5 },
    { necesidad_id: 'boxeo', titulo: 'Fuerza y Boxeo', descripcion: 'Estar fuerte, seguro y con skills de boxeo', icono: '🥊', progreso: 0, area_referencia: 'boxeo', orden: 6 },
    { necesidad_id: 'exito', titulo: 'Éxito y Alineación', descripcion: 'Sentirme realizado y alineado con mi propósito', icono: '🧭', progreso: 0, area_referencia: 'vision', orden: 7 },
];
export function useNecesidades() {
    const [necesidades, setNecesidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('necesidades')
                .select('*')
                .order('orden');
            if (error) {
                setNecesidades(STATIC_NEEDS.map((n, i) => ({ ...n, id: `static-${i}` })));
            }
            else if (data && data.length > 0) {
                setNecesidades(data);
            }
            else {
                const { data: inserted } = await supabase
                    .from('necesidades')
                    .insert(STATIC_NEEDS)
                    .select()
                    .order('orden');
                if (inserted)
                    setNecesidades(inserted);
                else
                    setNecesidades(STATIC_NEEDS.map((n, i) => ({ ...n, id: `static-${i}` })));
            }
        }
        catch (err) {
            console.error('Error loading needs:', err);
            setNecesidades(STATIC_NEEDS.map((n, i) => ({ ...n, id: `static-${i}` })));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { loadData(); }, [loadData]);
    const actualizarProgreso = async (necesidadId, progreso) => {
        const clamped = Math.max(0, Math.min(100, progreso));
        setNecesidades(prev => prev.map(n => n.necesidad_id === necesidadId ? { ...n, progreso: clamped } : n));
        await supabase
            .from('necesidades')
            .update({ progreso: clamped })
            .eq('necesidad_id', necesidadId);
    };
    const getProgresoGeneral = () => {
        if (necesidades.length === 0)
            return 0;
        return Math.round(necesidades.reduce((s, n) => s + (n.progreso || 0), 0) / necesidades.length);
    };
    const getNecesidadByArea = (area) => necesidades.find(n => n.area_referencia === area);
    return {
        necesidades,
        loading,
        actualizarProgreso,
        getProgresoGeneral,
        getNecesidadByArea,
        refresh: loadData,
    };
}
