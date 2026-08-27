import { useState, useEffect, useCallback } from 'react';

export type RoutineType = 'disciplina' | 'normal' | 'super' | 'descanso' | 'equilibrio';

export interface RoutineBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  tasks?: string[];
  genericTasks?: string[];
  currentStreak: number;
  maxStreak: number;
  weeklyCompletion: boolean[];
  isFocusBlock?: boolean;
  blockType?: string;
  isHalfTime?: boolean;
  order: number;
  currentFocus?: string;
  defaultFocus?: string;
}

export interface RoutineInfo {
  type: RoutineType;
  label: string;
  shortLabel: string;
  wakeTime: string;
  sleepTime: string;
  icon: string;
  color: string;
  description: string;
  totalBlocks: number;
}

export const ROUTINES: RoutineInfo[] = [
  { type: 'disciplina', label: 'Disciplina', shortLabel: 'Disciplina', wakeTime: '5:00', sleepTime: '9:00', icon: '🔥', color: 'orange', description: 'Máximo enfoque y estructura', totalBlocks: 15 },
  { type: 'normal', label: 'Normal', shortLabel: 'Normal', wakeTime: '6:30', sleepTime: '10:30', icon: '⚖️', color: 'blue', description: 'Balance productivo diario', totalBlocks: 16 },
  { type: 'super', label: 'Súper Productividad', shortLabel: 'Súper', wakeTime: '5:00', sleepTime: '10:30', icon: '⚡', color: 'purple', description: 'Días de carga intensa', totalBlocks: 16 },
  { type: 'descanso', label: 'Descanso', shortLabel: 'Descanso', wakeTime: '8:00', sleepTime: '10:30', icon: '🌿', color: 'green', description: 'Recuperación y ocio', totalBlocks: 14 },
  { type: 'equilibrio', label: 'Equilibrio', shortLabel: 'Equilibrio', wakeTime: '6:00', sleepTime: '10:30', icon: '🌅', color: 'cyan', description: 'Productividad sostenible con pausas', totalBlocks: 16 },
];

const makeBlock = (
  id: string,
  title: string,
  startTime: string,
  endTime: string,
  order: number,
  isFocusBlock = false,
  tasks?: string[],
  defaultFocus?: string
): RoutineBlock => ({
  id,
  title,
  startTime,
  endTime,
  tasks: tasks || [],
  currentStreak: 0,
  maxStreak: 0,
  weeklyCompletion: [false, false, false, false, false, false, false],
  isFocusBlock,
  order,
  defaultFocus: defaultFocus || (isFocusBlock ? 'none' : undefined),
  currentFocus: undefined,
});

const DISCIPLINA_BLOCKS: RoutineBlock[] = [
  makeBlock('d-activacion', 'Rutina de Activación', '05:00', '05:30', 0, false, ['Despertar', 'Hidratación', 'Estiramientos']),
  makeBlock('d-focus-manana', 'Focus', '05:30', '07:00', 1, true, ['Tarea más importante del día']),
  makeBlock('d-gym', 'Gym', '07:00', '08:00', 2, false, ['Calentamiento', 'Entrenamiento', 'Estiramientos']),
  makeBlock('d-alistamiento', 'Alistamiento y Desayuno', '08:00', '08:30', 3, false, ['Ducha', 'Vestirse', 'Desayuno']),
  makeBlock('d-lectura', 'Lectura o Podcast', '08:30', '09:00', 4, false, ['Lectura', 'Podcast educativo']),
  makeBlock('d-deep1', '1er Deep Work', '09:00', '10:20', 5, true, ['Tarea más importante']),
  makeBlock('d-deep2', '2do Deep Work', '10:30', '11:50', 6, true, ['Proyecto importante']),
  makeBlock('d-deep3', '3er Deep Work', '12:00', '13:20', 7, true, ['Trabajo concentrado']),
  makeBlock('d-almuerzo', 'Almuerzo + Video + Ajedrez', '13:20', '14:00', 8, false, ['Almorzar', 'Ver video', 'Jugar ajedrez']),
  makeBlock('d-deep4', '4to Deep Work', '14:00', '15:20', 9, true, ['Tareas pendientes']),
  makeBlock('d-deep5', '5to Deep Work', '15:30', '16:50', 10, true, ['Finalizar tareas']),
  makeBlock('d-idiomas', 'Idiomas', '17:00', '18:30', 11, false, ['Inglés', 'Italiano', 'Práctica']),
  makeBlock('d-ocio-comida', 'Ocio y Comida', '18:30', '20:00', 12, false, ['Cena', 'Entretenimiento', 'Descanso']),
  makeBlock('d-musica', 'Música (Piano o Guitarra)', '20:00', '20:30', 13, false, ['Práctica musical']),
  makeBlock('d-desactivacion', 'Rutina de Desactivación', '20:30', '21:00', 14, false, ['Skincare', 'Preparación para dormir']),
];

const NORMAL_BLOCKS: RoutineBlock[] = [
  makeBlock('n-activacion', 'Rutina de Activación', '06:30', '07:00', 0, false, ['Despertar', 'Hidratación', 'Estiramientos']),
  makeBlock('n-gym', 'Gym', '07:00', '08:00', 1, false, ['Calentamiento', 'Entrenamiento', 'Estiramientos']),
  makeBlock('n-alistamiento', 'Alistamiento y Desayuno', '08:00', '08:30', 2, false, ['Ducha', 'Vestirse', 'Desayuno']),
  makeBlock('n-lectura', 'Lectura o Podcast', '08:30', '09:00', 3, false, ['Lectura', 'Podcast educativo']),
  makeBlock('n-deep1', '1er Deep Work', '09:00', '10:20', 4, true, ['Tarea más importante']),
  makeBlock('n-deep2', '2do Deep Work', '10:30', '11:50', 5, true, ['Proyecto importante']),
  makeBlock('n-deep3', '3er Deep Work', '12:00', '13:20', 6, true, ['Trabajo concentrado']),
  makeBlock('n-almuerzo', 'Almuerzo + Video + Ajedrez', '13:20', '14:00', 7, false, ['Almorzar', 'Ver video', 'Jugar ajedrez']),
  makeBlock('n-deep4', '4to Deep Work', '14:00', '15:20', 8, true, ['Tareas pendientes']),
  makeBlock('n-deep5', '5to Deep Work', '15:30', '16:50', 9, true, ['Finalizar tareas']),
  makeBlock('n-trabajo', 'Bloque de Trabajo', '17:00', '18:30', 10, true, ['Trabajo', 'Tareas pendientes']),
  makeBlock('n-bloque-extra', 'Bloque Extra', '18:30', '20:00', 11, false, ['Tareas pendientes', 'Estudio extra']),
  makeBlock('n-idiomas', 'Idiomas', '20:00', '20:30', 12, false, ['Inglés', 'Italiano', 'Práctica']),
  makeBlock('n-ocio', 'Ocio', '20:30', '21:30', 13, false, ['Entretenimiento', 'Descanso']),
  makeBlock('n-musica', 'Música (Piano o Guitarra)', '21:30', '22:00', 14, false, ['Práctica musical']),
  makeBlock('n-desactivacion', 'Rutina de Desactivación', '22:00', '22:30', 15, false, ['Skincare', 'Preparación para dormir']),
];

const SUPER_BLOCKS: RoutineBlock[] = [
  makeBlock('s-activacion', 'Rutina de Activación', '05:00', '05:30', 0, false, ['Despertar', 'Hidratación', 'Estiramientos']),
  makeBlock('s-focus-manana', 'Focus', '05:30', '07:00', 1, true, ['Tarea más importante del día']),
  makeBlock('s-gym', 'Gym', '07:00', '08:00', 2, false, ['Calentamiento', 'Entrenamiento', 'Estiramientos']),
  makeBlock('s-alistamiento', 'Alistamiento y Desayuno', '08:00', '08:30', 3, false, ['Ducha', 'Vestirse', 'Desayuno']),
  makeBlock('s-piano-lectura', 'Piano + Lectura/Podcast', '08:30', '09:00', 4, false, ['Piano (15min)', 'Lectura o Podcast (15min)']),
  makeBlock('s-deep1', '1er Deep Work', '09:00', '10:20', 5, true, ['Tarea más importante']),
  makeBlock('s-deep2', '2do Deep Work', '10:30', '11:50', 6, true, ['Proyecto importante']),
  makeBlock('s-deep3', '3er Deep Work', '12:00', '13:20', 7, true, ['Trabajo concentrado']),
  makeBlock('s-almuerzo', 'Almuerzo + Video + Ajedrez', '13:20', '14:00', 8, false, ['Almorzar', 'Ver video', 'Jugar ajedrez']),
  makeBlock('s-deep4', '4to Deep Work', '14:00', '15:20', 9, true, ['Tareas pendientes']),
  makeBlock('s-deep5', '5to Deep Work', '15:30', '16:50', 10, true, ['Finalizar tareas']),
  makeBlock('s-idiomas', 'Idiomas', '17:00', '18:30', 11, false, ['Inglés', 'Italiano', 'Práctica']),
  makeBlock('s-focus-tarde', 'Focus', '18:30', '20:00', 12, true, ['Trabajo adicional']),
  makeBlock('s-comida-ocio', 'Comida + Ocio', '20:00', '20:30', 13, false, ['Cena', 'Descanso breve']),
  makeBlock('s-focus-nocturno', 'Focus Nocturno', '20:30', '22:00', 14, true, ['Tareas atrasadas', 'Trabajo intensivo']),
  makeBlock('s-desactivacion', 'Rutina de Desactivación', '22:00', '22:30', 15, false, ['Skincare', 'Preparación para dormir']),
];

const DESCANSO_BLOCKS: RoutineBlock[] = [
  makeBlock('r-activacion', 'Rutina de Activación', '08:00', '08:30', 0, false, ['Despertar', 'Hidratación', 'Estiramientos']),
  makeBlock('r-gym', 'Gym', '08:30', '09:30', 1, false, ['Calentamiento', 'Entrenamiento', 'Estiramientos']),
  makeBlock('r-alistamiento', 'Alistamiento y Desayuno', '09:30', '10:00', 2, false, ['Ducha', 'Vestirse', 'Desayuno']),
  makeBlock('r-lectura', 'Lectura', '10:00', '10:30', 3, false, ['Lectura recreativa']),
  makeBlock('r-deep1', '1er Bloque (Deep Work)', '10:30', '11:50', 4, true, ['Tarea más importante']),
  makeBlock('r-deep2', '2do Bloque (Deep Work)', '12:00', '13:20', 5, true, ['Proyecto importante']),
  makeBlock('r-almuerzo', 'Almuerzo + Video + Ajedrez', '13:20', '14:00', 6, false, ['Almorzar', 'Ver video', 'Jugar ajedrez']),
  makeBlock('r-deep3', '3er Bloque (Deep Work)', '14:00', '15:20', 7, true, ['Tareas pendientes']),
  makeBlock('r-deep4', '4to Bloque (Deep Work)', '15:30', '16:50', 8, true, ['Finalizar tareas']),
  makeBlock('r-idiomas', 'Idiomas', '17:00', '18:30', 9, false, ['Inglés', 'Italiano', 'Práctica']),
  makeBlock('r-ocio-comida', 'Ocio y Comida', '18:30', '20:00', 10, false, ['Cena', 'Entretenimiento', 'Descanso']),
  makeBlock('r-ocio-extra', 'Ocio', '20:00', '21:30', 11, false, ['Entretenimiento', 'Descanso', 'Hobby']),
  makeBlock('r-musica', 'Música (Piano o Guitarra)', '21:30', '22:00', 12, false, ['Práctica musical']),
  makeBlock('r-desactivacion', 'Rutina de Desactivación', '22:00', '22:30', 13, false, ['Skincare', 'Preparación para dormir']),
];

const ROUTINE_MAP: Record<RoutineType, RoutineBlock[]> = {
  disciplina: DISCIPLINA_BLOCKS,
  normal: NORMAL_BLOCKS,
  super: SUPER_BLOCKS,
  descanso: DESCANSO_BLOCKS,
};

const ROUTINE_TYPE_KEY = 'selectedRoutineType';
const ROUTINE_BLOCKS_PREFIX = 'routineBlocks_';

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
  const [routineType, setRoutineTypeState] = useState<RoutineType>('disciplina');
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedType = localStorage.getItem(ROUTINE_TYPE_KEY) as RoutineType | null;
    const type = savedType && ROUTINE_MAP[savedType] ? savedType : 'disciplina';
    setRoutineTypeState(type);
    const loaded = loadBlocksForType(type);
    setBlocks(loaded);
    setIsLoaded(true);
  }, []);

  const loadBlocksForType = (type: RoutineType): RoutineBlock[] => {
    const storageKey = `${ROUTINE_BLOCKS_PREFIX}${type}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.sort((a: RoutineBlock, b: RoutineBlock) => a.order - b.order);
      } catch {}
    }
    return ROUTINE_MAP[type];
  };

  const setRoutineType = useCallback((type: RoutineType) => {
    setRoutineTypeState(type);
    localStorage.setItem(ROUTINE_TYPE_KEY, type);
    const loaded = loadBlocksForType(type);
    setBlocks(loaded);
  }, []);

  const saveBlocks = useCallback((newBlocks: RoutineBlock[]) => {
    const storageKey = `${ROUTINE_BLOCKS_PREFIX}${routineType}`;
    localStorage.setItem(storageKey, JSON.stringify(newBlocks));
    setBlocks(newBlocks);
  }, [routineType]);

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

  const updateBlockFocus = useCallback((blockId: string, focus: string) => {
    const newBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, currentFocus: focus } : block
    );
    saveBlocks(newBlocks);
  }, [blocks, saveBlocks]);

  return {
    blocks,
    isLoaded,
    routineType,
    setRoutineType,
    reorderBlocks,
    updateBlock,
    getCurrentBlock,
    getBlockDurationMinutes,
    getBlockProgress,
    saveBlocks,
    updateBlockFocus,
    routineInfo: ROUTINES.find(r => r.type === routineType) || ROUTINES[0],
  };
};
