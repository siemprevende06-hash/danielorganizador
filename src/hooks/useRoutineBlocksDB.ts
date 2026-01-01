import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RoutineBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  tasks: string[];
  isFocusBlock?: boolean;
  order: number;
}

const DEFAULT_BLOCKS: RoutineBlock[] = [
  { id: "1", title: "Rutina Activación", startTime: "05:00", endTime: "05:30", tasks: ["Despertar", "Hidratación", "Estiramientos"], order: 0 },
  { id: "2", title: "Idiomas", startTime: "05:30", endTime: "06:00", tasks: ["Duolingo", "Práctica de vocabulario"], order: 1 },
  { id: "3", title: "Gym", startTime: "06:00", endTime: "07:00", tasks: ["Calentamiento", "Entrenamiento", "Estiramientos"], order: 2 },
  { id: "4", title: "Alistamiento y Desayuno", startTime: "07:00", endTime: "07:30", tasks: ["Ducha", "Vestirse", "Desayuno"], order: 3 },
  { id: "5", title: "Focus Emprendimiento", startTime: "07:30", endTime: "08:25", tasks: ["Proyecto principal"], isFocusBlock: true, order: 4 },
  { id: "6", title: "Lectura", startTime: "08:25", endTime: "08:40", tasks: ["Lectura enfocada"], order: 5 },
  { id: "7", title: "Viaje a CUJAE (Podcast)", startTime: "08:40", endTime: "09:00", tasks: ["Escuchar podcast educativo"], order: 6 },
  { id: "8", title: "1er Deep Work", startTime: "09:00", endTime: "10:20", tasks: ["Tarea más importante"], isFocusBlock: true, order: 7 },
  { id: "9", title: "2do Deep Work", startTime: "10:30", endTime: "11:50", tasks: ["Proyecto importante"], isFocusBlock: true, order: 8 },
  { id: "10", title: "3er Deep Work", startTime: "12:00", endTime: "13:20", tasks: ["Trabajo concentrado"], isFocusBlock: true, order: 9 },
  { id: "11", title: "Almuerzo", startTime: "13:20", endTime: "14:00", tasks: ["Almorzar", "Descanso", "Ajedrez"], order: 10 },
  { id: "12", title: "4to Deep Work", startTime: "14:00", endTime: "15:20", tasks: ["Tareas pendientes"], isFocusBlock: true, order: 11 },
  { id: "13", title: "5to Deep Work", startTime: "15:30", endTime: "16:50", tasks: ["Finalizar tareas"], isFocusBlock: true, order: 12 },
  { id: "14", title: "Viaje a Casa (Podcast)", startTime: "16:50", endTime: "17:05", tasks: ["Podcast"], order: 13 },
  { id: "15", title: "Rutina de Llegada", startTime: "17:05", endTime: "17:30", tasks: ["Refrescarse", "Prepararse"], order: 14 },
  { id: "16", title: "Focus Universidad", startTime: "17:30", endTime: "19:00", tasks: ["Estudio universitario"], isFocusBlock: true, order: 15 },
  { id: "17", title: "Comida y Serie", startTime: "19:00", endTime: "19:30", tasks: ["Cena", "Entretenimiento"], order: 16 },
  { id: "18", title: "PS4", startTime: "19:30", endTime: "20:00", tasks: ["Gaming"], order: 17 },
  { id: "19", title: "Guitarra o Piano", startTime: "20:00", endTime: "20:30", tasks: ["Práctica musical"], order: 18 },
  { id: "20", title: "Bloque de Emergencia", startTime: "20:30", endTime: "21:00", tasks: ["Tareas urgentes"], order: 19 },
  { id: "21", title: "Rutina Desactivación", startTime: "21:00", endTime: "22:00", tasks: ["Skincare", "Preparación para dormir", "Lectura"], order: 20 },
  { id: "22", title: "Sueño", startTime: "22:00", endTime: "05:00", tasks: ["Descanso de 7 horas"], order: 21 },
];

export const parseTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatTimeDisplay = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const useRoutineBlocksDB = () => {
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const { data, error } = await supabase
          .from('routine_blocks')
          .select('*')
          .order('order_index', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const formattedBlocks = data.map((row: any) => ({
            id: row.block_id,
            title: row.title,
            startTime: row.start_time,
            endTime: row.end_time,
            tasks: row.tasks || [],
            isFocusBlock: row.tasks?.includes('Focus') || row.title.includes('Deep Work'),
            order: row.order_index,
          }));
          setBlocks(formattedBlocks);
        } else {
          // Check migration
          const stored = localStorage.getItem('customRoutineBlocks');
          if (stored) {
            const localBlocks = JSON.parse(stored) as RoutineBlock[];
            for (const block of localBlocks) {
              await supabase.from('routine_blocks').insert({
                block_id: block.id,
                title: block.title,
                start_time: block.startTime,
                end_time: block.endTime,
                tasks: block.tasks,
                order_index: block.order,
              });
            }
            setBlocks(localBlocks);
            localStorage.removeItem('customRoutineBlocks');
          } else {
            // Insert defaults
            for (const block of DEFAULT_BLOCKS) {
              await supabase.from('routine_blocks').insert({
                block_id: block.id,
                title: block.title,
                start_time: block.startTime,
                end_time: block.endTime,
                tasks: block.tasks,
                order_index: block.order,
              });
            }
            setBlocks(DEFAULT_BLOCKS);
          }
        }
      } catch (error) {
        console.error('Error loading routine blocks:', error);
        const stored = localStorage.getItem('customRoutineBlocks');
        setBlocks(stored ? JSON.parse(stored) : DEFAULT_BLOCKS);
      } finally {
        setIsLoaded(true);
      }
    };

    loadBlocks();
  }, []);

  const saveBlocks = useCallback(async (newBlocks: RoutineBlock[]) => {
    setBlocks(newBlocks);
    try {
      // Delete all and reinsert
      await supabase.from('routine_blocks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      for (const block of newBlocks) {
        await supabase.from('routine_blocks').insert({
          block_id: block.id,
          title: block.title,
          start_time: block.startTime,
          end_time: block.endTime,
          tasks: block.tasks,
          order_index: block.order,
        });
      }
    } catch (error) {
      console.error('Error saving routine blocks:', error);
    }
  }, []);

  const reorderBlocks = useCallback((startIndex: number, endIndex: number) => {
    const result = Array.from(blocks);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    const reordered = result.map((block, index) => ({ ...block, order: index }));
    saveBlocks(reordered);
  }, [blocks, saveBlocks]);

  const updateBlock = useCallback((updatedBlock: RoutineBlock) => {
    const newBlocks = blocks.map(block =>
      block.id === updatedBlock.id ? updatedBlock : block
    );
    saveBlocks(newBlocks);
  }, [blocks, saveBlocks]);

  const getCurrentBlock = useCallback((): RoutineBlock | null => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const block of blocks) {
      const startMinutes = parseTime(block.startTime);
      let endMinutes = parseTime(block.endTime);

      if (endMinutes <= startMinutes) {
        if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
          return block;
        }
      } else if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        return block;
      }
    }
    return null;
  }, [blocks]);

  const getBlockDurationMinutes = useCallback((block: RoutineBlock): number => {
    const startMinutes = parseTime(block.startTime);
    let endMinutes = parseTime(block.endTime);
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    return endMinutes - startMinutes;
  }, []);

  const getBlockProgress = useCallback((block: RoutineBlock): number => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = parseTime(block.startTime);
    let endMinutes = parseTime(block.endTime);

    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    const totalDuration = endMinutes - startMinutes;
    let elapsed = currentMinutes - startMinutes;
    if (elapsed < 0) elapsed += 24 * 60;

    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }, []);

  return {
    blocks,
    isLoaded,
    reorderBlocks,
    updateBlock,
    getCurrentBlock,
    getBlockDurationMinutes,
    getBlockProgress,
    saveBlocks,
  };
};
