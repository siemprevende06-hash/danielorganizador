import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const TECNICAS_POR_DEFECTO = [
    { nombre: 'Jab', descripcion: 'Golpe frontal con mano delantera', categoria: 'basico', nivel_requerido: 1, nivel_dominio: 0 },
    { nombre: 'Cross', descripcion: 'Golpe recto con mano trasera', categoria: 'basico', nivel_requerido: 1, nivel_dominio: 0 },
    { nombre: 'Hook', descripcion: 'Golpe lateral con rotación de cadera', categoria: 'basico', nivel_requerido: 2, nivel_dominio: 0 },
    { nombre: 'Uppercut', descripcion: 'Golpe ascendente de abajo arriba', categoria: 'intermedio', nivel_requerido: 3, nivel_dominio: 0 },
    { nombre: 'Jab-Cross (1-2)', descripcion: 'Combo básico de dos golpes', categoria: 'basico', nivel_requerido: 1, nivel_dominio: 0 },
    { nombre: 'Jab-Cross-Hook (1-2-3)', descripcion: 'Combo de tres golpes', categoria: 'intermedio', nivel_requerido: 3, nivel_dominio: 0 },
    { nombre: 'Jab-Cross-Hook-Cross (1-2-3-2)', descripcion: 'Combo de cuatro golpes', categoria: 'intermedio', nivel_requerido: 4, nivel_dominio: 0 },
    { nombre: 'Slip', descripcion: 'Esquiva lateral de golpes', categoria: 'basico', nivel_requerido: 2, nivel_dominio: 0 },
    { nombre: 'Bob & Weave', descripcion: 'Movimiento de cintura para esquivar', categoria: 'intermedio', nivel_requerido: 3, nivel_dominio: 0 },
    { nombre: 'Roll', descripcion: 'Giro de hombros para absorber golpes', categoria: 'intermedio', nivel_requerido: 4, nivel_dominio: 0 },
    { nombre: 'Step & Slide', descripcion: 'Juego de pies y desplazamiento', categoria: 'basico', nivel_requerido: 1, nivel_dominio: 0 },
    { nombre: 'Counter Punch', descripcion: 'Golpe de contraataque tras esquiva', categoria: 'avanzado', nivel_requerido: 5, nivel_dominio: 0 },
];
export function useBoxeo() {
    const [tecnicas, setTecnicas] = useState([]);
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [tecRes, sesRes] = await Promise.all([
                supabase.from('boxeo_tecnicas').select('*').order('nivel_requerido'),
                supabase.from('boxeo_sesiones').select('*').order('fecha', { ascending: false }),
            ]);
            if (tecRes.data)
                setTecnicas(tecRes.data);
            if (sesRes.data)
                setSesiones(sesRes.data);
        }
        catch (err) {
            console.error('Error loading boxing data:', err);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { loadData(); }, [loadData]);
    const seedTecnicas = async () => {
        const { error } = await supabase.from('boxeo_tecnicas').insert(TECNICAS_POR_DEFECTO.map(t => ({ ...t })));
        if (error) {
            toast.error('Error al cargar técnicas');
            return;
        }
        toast.success('Técnicas de boxeo cargadas');
        loadData();
    };
    const actualizarDominio = async (id, nivel) => {
        const { error } = await supabase.from('boxeo_tecnicas').update({ nivel_dominio: nivel }).eq('id', id);
        if (error) {
            toast.error('Error al actualizar');
            return;
        }
        setTecnicas(prev => prev.map(t => t.id === id ? { ...t, nivel_dominio: nivel } : t));
    };
    const agregarSesion = async (sesion) => {
        const { data, error } = await supabase.from('boxeo_sesiones').insert(sesion).select().single();
        if (error) {
            toast.error('Error al registrar sesión');
            return null;
        }
        toast.success('Sesión registrada 💪');
        setSesiones(prev => [data, ...prev]);
        return data;
    };
    const eliminarSesion = async (id) => {
        const { error } = await supabase.from('boxeo_sesiones').delete().eq('id', id);
        if (error) {
            toast.error('Error al eliminar');
            return;
        }
        setSesiones(prev => prev.filter(s => s.id !== id));
        toast.success('Sesión eliminada');
    };
    const getNivelGeneral = () => {
        if (tecnicas.length === 0)
            return 1;
        const avg = tecnicas.reduce((s, t) => s + t.nivel_dominio, 0) / tecnicas.length;
        if (avg >= 80)
            return 5;
        if (avg >= 60)
            return 4;
        if (avg >= 40)
            return 3;
        if (avg >= 20)
            return 2;
        return 1;
    };
    const getSesionesEstaSemana = () => {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sesiones.filter(s => new Date(s.fecha) >= weekAgo);
    };
    return {
        tecnicas, sesiones, loading,
        seedTecnicas,
        actualizarDominio,
        agregarSesion,
        eliminarSesion,
        getNivelGeneral,
        getSesionesEstaSemana,
        refresh: loadData,
    };
}
