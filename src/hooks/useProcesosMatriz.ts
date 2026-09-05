import { useCallback, useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface ProcesoConfig {
  areaId: string;
  label: string;
  grupo: 'centrales' | 'desarrollo';
  proceso: string;          // descripción del sistema (proceso activo)
  minDiario: number;        // minutos mínimos
  maxDiario: number;        // minutos máximos
  bloques?: string;         // texto de bloques (ej. "3 bloques de 1:20")
  resultadoSemana: string;  // etiqueta del resultado semanal
  resultadoMes: string;
  resultadoTrimestre: string;
}

export const PROCESOS: ProcesoConfig[] = [
  {
    areaId: 'universidad', label: 'Universidad', grupo: 'centrales',
    proceso: 'Estudio profundo por temas', minDiario: 80, maxDiario: 240,
    bloques: 'máx 3 bloques de 1:20 · mín 1 bloque',
    resultadoSemana: 'Temas estudiados', resultadoMes: 'Tareas y exámenes', resultadoTrimestre: 'Asignaturas aprobadas',
  },
  {
    areaId: 'emprendimiento', label: 'Emprendimiento', grupo: 'centrales',
    proceso: 'Construir y vender', minDiario: 80, maxDiario: 160,
    bloques: 'máx 2 bloques de 1:20 · mín 1 bloque',
    resultadoSemana: 'Tareas cerradas', resultadoMes: 'Tareas del mes', resultadoTrimestre: 'Tareas del trimestre',
  },
  {
    areaId: 'proyectos', label: 'Proyectos', grupo: 'centrales',
    proceso: 'Avances de proyecto', minDiario: 30, maxDiario: 90,
    bloques: 'máx 1 bloque de 1:30 · mín 30 min',
    resultadoSemana: 'Avances', resultadoMes: 'Avances del mes', resultadoTrimestre: 'Avances del trimestre',
  },
  {
    areaId: 'tareas', label: 'Tareas', grupo: 'centrales',
    proceso: 'Cerrar pendientes', minDiario: 15, maxDiario: 60,
    resultadoSemana: 'Tareas cerradas', resultadoMes: 'Tareas del mes', resultadoTrimestre: 'Tareas del trimestre',
  },
  {
    areaId: 'lectura', label: 'Lectura', grupo: 'desarrollo',
    proceso: 'Leer cada día', minDiario: 15, maxDiario: 30,
    resultadoSemana: 'Páginas acumuladas', resultadoMes: 'Libros leídos', resultadoTrimestre: 'Libros leídos',
  },
  {
    areaId: 'musica', label: 'Música', grupo: 'desarrollo',
    proceso: 'Práctica de piano / guitarra', minDiario: 15, maxDiario: 30,
    resultadoSemana: 'Minutos acumulados', resultadoMes: 'Canciones aprendidas', resultadoTrimestre: 'Canciones aprendidas',
  },
  {
    areaId: 'idiomas', label: 'Idiomas', grupo: 'desarrollo',
    proceso: 'Inglés / Italiano', minDiario: 15, maxDiario: 60,
    resultadoSemana: 'Minutos acumulados', resultadoMes: 'Días activos', resultadoTrimestre: 'Días activos',
  },
  {
    areaId: 'gym', label: 'Gym', grupo: 'desarrollo',
    proceso: 'Entrenamiento de fuerza', minDiario: 45, maxDiario: 60,
    resultadoSemana: 'Días entrenados', resultadoMes: 'Días entrenados', resultadoTrimestre: 'Días entrenados',
  },
  {
    areaId: 'ajedrez', label: 'Ajedrez', grupo: 'desarrollo',
    proceso: 'Partidas y táctica', minDiario: 10, maxDiario: 20,
    resultadoSemana: 'Días activos', resultadoMes: 'Días activos', resultadoTrimestre: 'Días activos',
  },
  {
    areaId: 'game', label: 'Game', grupo: 'desarrollo',
    proceso: 'Ocio consciente', minDiario: 10, maxDiario: 30,
    resultadoSemana: 'Minutos acumulados', resultadoMes: 'Minutos acumulados', resultadoTrimestre: 'Minutos acumulados',
  },
];

export interface PeriodoAgg {
  minutos: number;
  dias: number;
  paginas: number;
}

export interface ProcesoFila {
  config: ProcesoConfig;
  hoyMinutos: number;
  semana: PeriodoAgg;
  mes: PeriodoAgg;
  trimestre: PeriodoAgg;
  resultadoSemanaValor: string;
  resultadoMesValor: string;
  resultadoTrimestreValor: string;
}

const empty = (): PeriodoAgg => ({ minutos: 0, dias: 0, paginas: 0 });

async function safe<T = any>(q: any): Promise<T[]> {
  try {
    const { data, error } = await q;
    if (error) return [];
    return (data as T[]) || [];
  } catch {
    return [];
  }
}

export function useProcesosMatriz(hoyMinutosPorArea: Record<string, number>) {
  const [rows, setRows] = useState<ProcesoFila[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const now = new Date();
    const qs = format(startOfQuarter(now), 'yyyy-MM-dd');
    const qe = format(endOfQuarter(now), 'yyyy-MM-dd');
    const ws = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const we = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const mstart = format(startOfMonth(now), 'yyyy-MM-dd');
    const mend = format(endOfMonth(now), 'yyyy-MM-dd');

    const [stats, tasks, exams, books, songs] = await Promise.all([
      safe(supabase.from('daily_area_stats').select('area_id, stat_date, time_spent_minutes, completed, pages_done').gte('stat_date', qs).lte('stat_date', qe)),
      safe(supabase.from('tasks').select('id, area_id, source, completed, due_date').gte('due_date', `${qs}T00:00:00`).lte('due_date', `${qe}T23:59:59`)),
      safe(supabase.from('exams').select('id, exam_date').gte('exam_date', qs).lte('exam_date', qe)),
      safe(supabase.from('reading_library').select('id, status, updated_at')),
      safe(supabase.from('music_repertoire').select('id, status, updated_at')),
    ]);

    const inRange = (d: string | null | undefined, a: string, b: string) => !!d && d.slice(0, 10) >= a && d.slice(0, 10) <= b;

    const aggFor = (areaId: string, a: string, b: string): PeriodoAgg => {
      const acc = empty();
      stats.forEach((r: any) => {
        if (r.area_id !== areaId) return;
        if (!inRange(r.stat_date, a, b)) return;
        acc.minutos += Number(r.time_spent_minutes) || 0;
        acc.paginas += Number(r.pages_done) || 0;
        if ((Number(r.time_spent_minutes) || 0) > 0 || r.completed) acc.dias += 1;
      });
      return acc;
    };

    const tasksDone = (areaId: string, a: string, b: string) =>
      tasks.filter((t: any) => (t.area_id === areaId || t.source === areaId) && t.completed && inRange(t.due_date, a, b)).length;

    const tasksTotal = (areaId: string, a: string, b: string) =>
      tasks.filter((t: any) => (t.area_id === areaId || t.source === areaId) && inRange(t.due_date, a, b)).length;

    const examsIn = (a: string, b: string) => exams.filter((e: any) => inRange(e.exam_date, a, b)).length;

    const booksIn = (a: string, b: string) =>
      books.filter((x: any) => (x.status === 'read' || x.status === 'leido' || x.status === 'completed') && inRange(x.updated_at, a, b)).length;

    const songsIn = (a: string, b: string) =>
      songs.filter((x: any) => x.status === 'mastered' && inRange(x.updated_at, a, b)).length;

    const out: ProcesoFila[] = PROCESOS.map(cfg => {
      const semana = aggFor(cfg.areaId, ws, we);
      const mes = aggFor(cfg.areaId, mstart, mend);
      const trimestre = aggFor(cfg.areaId, qs, qe);

      let rs = '', rm = '', rt = '';
      switch (cfg.areaId) {
        case 'universidad':
          rs = `${tasksDone('universidad', ws, we)} temas`;
          rm = `${tasksDone('universidad', mstart, mend)}/${tasksTotal('universidad', mstart, mend)} tareas · ${examsIn(mstart, mend)} exámenes`;
          rt = `${tasksDone('universidad', qs, qe)}/${tasksTotal('universidad', qs, qe)} tareas · ${examsIn(qs, qe)} exámenes`;
          break;
        case 'lectura':
          rs = `${semana.paginas} páginas`;
          rm = `${booksIn(mstart, mend)} libros · ${mes.paginas} páginas`;
          rt = `${booksIn(qs, qe)} libros · ${trimestre.paginas} páginas`;
          break;
        case 'musica':
          rs = `${semana.minutos} min`;
          rm = `${songsIn(mstart, mend)} canciones`;
          rt = `${songsIn(qs, qe)} canciones`;
          break;
        case 'gym':
          rs = `${semana.dias} días`;
          rm = `${mes.dias} días`;
          rt = `${trimestre.dias} días`;
          break;
        case 'idiomas':
        case 'ajedrez':
          rs = `${semana.minutos} min · ${semana.dias} días`;
          rm = `${mes.dias} días activos`;
          rt = `${trimestre.dias} días activos`;
          break;
        default:
          rs = `${tasksDone(cfg.areaId, ws, we)} tareas`;
          rm = `${tasksDone(cfg.areaId, mstart, mend)}/${tasksTotal(cfg.areaId, mstart, mend)} tareas`;
          rt = `${tasksDone(cfg.areaId, qs, qe)}/${tasksTotal(cfg.areaId, qs, qe)} tareas`;
      }

      return {
        config: cfg,
        hoyMinutos: hoyMinutosPorArea[cfg.areaId] || 0,
        semana, mes, trimestre,
        resultadoSemanaValor: rs,
        resultadoMesValor: rm,
        resultadoTrimestreValor: rt,
      };
    });

    setRows(out);
    setLoading(false);
  }, [hoyMinutosPorArea]);

  useEffect(() => { load(); }, [load]);

  return { rows, loading };
}
