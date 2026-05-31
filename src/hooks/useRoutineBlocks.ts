import { useState, useEffect } from 'react';

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

const STORAGE_KEY = 'customRoutineBlocks';

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

export const useRoutineBlocks = () => {
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBlocks(parsed.sort((a: RoutineBlock, b: RoutineBlock) => a.order - b.order));
      } catch {
        setBlocks(DEFAULT_BLOCKS);
      }
    } else {
      setBlocks(DEFAULT_BLOCKS);
    }
    setIsLoaded(true);
  }, []);

  const saveBlocks = (newBlocks: RoutineBlock[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBlocks));
    setBlocks(newBlocks);
  };

  const reorderBlocks = (startIndex: number, endIndex: number) => {
    const result = Array.from(blocks);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    // Update order property
    const reordered = result.map((block, index) => ({ ...block, order: index }));
    saveBlocks(reordered);
  };

  const updateBlock = (updatedBlock: RoutineBlock) => {
    const newBlocks = blocks.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    );
    saveBlocks(newBlocks);
  };

  const getCurrentBlock = (): RoutineBlock | null => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Blocks are sorted by order, so we check each one sequentially
    for (const block of blocks) {
      const startMinutes = parseTime(block.startTime);
      let endMinutes = parseTime(block.endTime);
      
      // Handle overnight blocks (like sleep)
      if (endMinutes <= startMinutes) {
        if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
          return block;
        }
      } else if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        return block;
      }
    }
    return null;
  };

  const getBlockDurationMinutes = (block: RoutineBlock): number => {
    const startMinutes = parseTime(block.startTime);
    let endMinutes = parseTime(block.endTime);
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    return endMinutes - startMinutes;
  };

  const getBlockProgress = (block: RoutineBlock): number => {
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
  };

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
