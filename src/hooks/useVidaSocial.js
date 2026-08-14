import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
export function useVidaSocial() {
    const [eventos, setEventos] = useState([]);
    const [citas, setCitas] = useState([]);
    const [intimidad, setIntimidad] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [evRes, citRes, intRes] = await Promise.all([
                supabase.from('eventos_sociales').select('*').order('fecha', { ascending: false }),
                supabase.from('citas').select('*').order('fecha', { ascending: false }),
                supabase.from('intimidad_tracking').select('*').order('fecha', { ascending: false }),
            ]);
            if (evRes.data)
                setEventos(evRes.data);
            if (citRes.data)
                setCitas(citRes.data);
            if (intRes.data)
                setIntimidad(intRes.data);
        }
        catch (err) {
            console.error('Error loading social data:', err);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { loadData(); }, [loadData]);
    const agregarEvento = async (evento) => {
        const { data, error } = await supabase.from('eventos_sociales').insert(evento).select().single();
        if (error) {
            toast.error('Error al registrar evento');
            return null;
        }
        toast.success('Experiencia registrada 🎉');
        setEventos(prev => [data, ...prev]);
        return data;
    };
    const eliminarEvento = async (id) => {
        await supabase.from('eventos_sociales').delete().eq('id', id);
        setEventos(prev => prev.filter(e => e.id !== id));
        toast.success('Evento eliminado');
    };
    const agregarCita = async (cita) => {
        const { data, error } = await supabase.from('citas').insert(cita).select().single();
        if (error) {
            toast.error('Error al registrar cita');
            return null;
        }
        toast.success('Cita registrada ❤️');
        setCitas(prev => [data, ...prev]);
        return data;
    };
    const eliminarCita = async (id) => {
        await supabase.from('citas').delete().eq('id', id);
        setCitas(prev => prev.filter(c => c.id !== id));
        toast.success('Cita eliminada');
    };
    const agregarIntimidad = async (entry) => {
        const { data, error } = await supabase.from('intimidad_tracking').insert(entry).select().single();
        if (error) {
            toast.error('Error al registrar');
            return null;
        }
        toast.success('Registrado 🔥');
        setIntimidad(prev => [data, ...prev]);
        return data;
    };
    const eliminarIntimidad = async (id) => {
        await supabase.from('intimidad_tracking').delete().eq('id', id);
        setIntimidad(prev => prev.filter(i => i.id !== id));
        toast.success('Registro eliminado');
    };
    const getStatsMes = () => {
        const now = new Date();
        const mesStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const citasMes = citas.filter(c => new Date(c.fecha) >= mesStart);
        const eventosMes = eventos.filter(e => new Date(e.fecha) >= mesStart);
        const intimidadMes = intimidad.filter(i => new Date(i.fecha) >= mesStart);
        const posicionesUnicas = [...new Set(intimidadMes.flatMap(i => i.posiciones))];
        return {
            totalCitas: citasMes.length,
            totalEventos: eventosMes.length,
            totalIntimidad: intimidadMes.length,
            posicionesUnicas,
            gastoTotalEventos: eventosMes.reduce((s, e) => s + (e.gasto || 0), 0),
            promedioCalidad: intimidadMes.length > 0
                ? Math.round(intimidadMes.reduce((s, i) => s + i.calidad, 0) / intimidadMes.length)
                : 0,
        };
    };
    return {
        eventos, citas, intimidad, loading,
        agregarEvento, eliminarEvento,
        agregarCita, eliminarCita,
        agregarIntimidad, eliminarIntimidad,
        getStatsMes,
        refresh: loadData,
    };
}
