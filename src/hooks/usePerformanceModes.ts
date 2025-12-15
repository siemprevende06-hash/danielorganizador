import { useState, useEffect, useCallback } from 'react';
import { RoutineBlock } from '@/hooks/useRoutineBlocks';

export interface PerformanceMode {
  id: string;
  name: string;
  description: string;
  wakeTime: string;
  icon: string;
  color: string;
  blocks: RoutineBlock[];
}

// Default modes
const DEFAULT_MODES: PerformanceMode[] = [
  {
    id: "alto-rendimiento",
    name: "Alto Rendimiento",
    description: "Máxima productividad. Empieza a las 4:00 AM con 7 bloques de deep work.",
    wakeTime: "04:00",
    icon: "rocket",
    color: "from-orange-500 to-red-600",
    blocks: [
      { id: "hp-1", title: "Rutina Activación", startTime: "04:00", endTime: "04:30", tasks: ["Despertar", "Hidratación", "Meditación"], order: 0 },
      { id: "hp-2", title: "Idiomas", startTime: "04:30", endTime: "05:00", tasks: ["Duolingo", "Práctica intensiva"], order: 1 },
      { id: "hp-3", title: "Gym", startTime: "05:00", endTime: "06:00", tasks: ["Entrenamiento completo"], order: 2 },
      { id: "hp-4", title: "Alistamiento y Desayuno", startTime: "06:00", endTime: "06:30", tasks: ["Ducha fría", "Desayuno nutritivo"], order: 3 },
      { id: "hp-5", title: "1er Deep Work", startTime: "06:30", endTime: "08:00", tasks: ["Proyecto principal"], isFocusBlock: true, order: 4 },
      { id: "hp-6", title: "Lectura", startTime: "08:00", endTime: "08:20", tasks: ["Lectura enfocada"], order: 5 },
      { id: "hp-7", title: "Viaje a CUJAE", startTime: "08:20", endTime: "09:00", tasks: ["Podcast educativo"], order: 6 },
      { id: "hp-8", title: "2do Deep Work", startTime: "09:00", endTime: "10:30", tasks: ["Trabajo concentrado"], isFocusBlock: true, order: 7 },
      { id: "hp-9", title: "3er Deep Work", startTime: "10:40", endTime: "12:10", tasks: ["Tareas importantes"], isFocusBlock: true, order: 8 },
      { id: "hp-10", title: "Almuerzo", startTime: "12:10", endTime: "12:50", tasks: ["Almuerzo rápido"], order: 9 },
      { id: "hp-11", title: "4to Deep Work", startTime: "12:50", endTime: "14:20", tasks: ["Proyecto secundario"], isFocusBlock: true, order: 10 },
      { id: "hp-12", title: "5to Deep Work", startTime: "14:30", endTime: "16:00", tasks: ["Tareas pendientes"], isFocusBlock: true, order: 11 },
      { id: "hp-13", title: "6to Deep Work", startTime: "16:10", endTime: "17:00", tasks: ["Finalizar tareas"], isFocusBlock: true, order: 12 },
      { id: "hp-14", title: "Viaje a Casa", startTime: "17:00", endTime: "17:20", tasks: ["Podcast"], order: 13 },
      { id: "hp-15", title: "Focus Universidad", startTime: "17:30", endTime: "19:00", tasks: ["Estudio intensivo"], isFocusBlock: true, order: 14 },
      { id: "hp-16", title: "Comida", startTime: "19:00", endTime: "19:30", tasks: ["Cena saludable"], order: 15 },
      { id: "hp-17", title: "7mo Deep Work", startTime: "19:30", endTime: "20:30", tasks: ["Emprendimiento"], isFocusBlock: true, order: 16 },
      { id: "hp-18", title: "Rutina Desactivación", startTime: "20:30", endTime: "21:00", tasks: ["Skincare", "Preparación"], order: 17 },
      { id: "hp-19", title: "Sueño", startTime: "21:00", endTime: "04:00", tasks: ["Descanso de 7 horas"], order: 18 },
    ],
  },
  {
    id: "normal",
    name: "Rendimiento Normal",
    description: "Día equilibrado y productivo. Empieza a las 6:00 AM con 5 bloques de deep work.",
    wakeTime: "06:00",
    icon: "activity",
    color: "from-blue-500 to-cyan-600",
    blocks: [
      { id: "np-1", title: "Rutina Activación", startTime: "06:00", endTime: "06:30", tasks: ["Despertar", "Hidratación", "Estiramientos"], order: 0 },
      { id: "np-2", title: "Idiomas", startTime: "06:30", endTime: "07:00", tasks: ["Duolingo", "Vocabulario"], order: 1 },
      { id: "np-3", title: "Gym", startTime: "07:00", endTime: "08:00", tasks: ["Entrenamiento"], order: 2 },
      { id: "np-4", title: "Alistamiento y Desayuno", startTime: "08:00", endTime: "08:30", tasks: ["Ducha", "Desayuno"], order: 3 },
      { id: "np-5", title: "Viaje a CUJAE", startTime: "08:30", endTime: "09:00", tasks: ["Podcast"], order: 4 },
      { id: "np-6", title: "1er Deep Work", startTime: "09:00", endTime: "10:20", tasks: ["Tarea principal"], isFocusBlock: true, order: 5 },
      { id: "np-7", title: "2do Deep Work", startTime: "10:30", endTime: "11:50", tasks: ["Proyecto"], isFocusBlock: true, order: 6 },
      { id: "np-8", title: "3er Deep Work", startTime: "12:00", endTime: "13:20", tasks: ["Trabajo concentrado"], isFocusBlock: true, order: 7 },
      { id: "np-9", title: "Almuerzo", startTime: "13:20", endTime: "14:00", tasks: ["Almorzar", "Descanso"], order: 8 },
      { id: "np-10", title: "4to Deep Work", startTime: "14:00", endTime: "15:20", tasks: ["Tareas pendientes"], isFocusBlock: true, order: 9 },
      { id: "np-11", title: "5to Deep Work", startTime: "15:30", endTime: "16:50", tasks: ["Finalizar"], isFocusBlock: true, order: 10 },
      { id: "np-12", title: "Viaje a Casa", startTime: "16:50", endTime: "17:15", tasks: ["Podcast"], order: 11 },
      { id: "np-13", title: "Descanso", startTime: "17:15", endTime: "17:45", tasks: ["Refrescarse"], order: 12 },
      { id: "np-14", title: "Focus Universidad", startTime: "17:45", endTime: "19:00", tasks: ["Estudio"], isFocusBlock: true, order: 13 },
      { id: "np-15", title: "Comida y Serie", startTime: "19:00", endTime: "19:30", tasks: ["Cena", "Entretenimiento"], order: 14 },
      { id: "np-16", title: "Hobby", startTime: "19:30", endTime: "20:30", tasks: ["Guitarra o Gaming"], order: 15 },
      { id: "np-17", title: "Lectura", startTime: "20:30", endTime: "21:00", tasks: ["Lectura relajante"], order: 16 },
      { id: "np-18", title: "Rutina Desactivación", startTime: "21:00", endTime: "22:00", tasks: ["Skincare", "Preparación"], order: 17 },
      { id: "np-19", title: "Sueño", startTime: "22:00", endTime: "06:00", tasks: ["Descanso de 8 horas"], order: 18 },
    ],
  },
  {
    id: "bajo-rendimiento",
    name: "Bajo Rendimiento",
    description: "Día ligero con más descansos. Empieza a las 6:30 AM con 4 bloques de trabajo.",
    wakeTime: "06:30",
    icon: "battery-low",
    color: "from-green-500 to-emerald-600",
    blocks: [
      { id: "lp-1", title: "Rutina Activación Suave", startTime: "06:30", endTime: "07:00", tasks: ["Despertar lento", "Hidratación"], order: 0 },
      { id: "lp-2", title: "Alistamiento y Desayuno", startTime: "07:00", endTime: "07:45", tasks: ["Ducha", "Desayuno tranquilo"], order: 1 },
      { id: "lp-3", title: "Idiomas (opcional)", startTime: "07:45", endTime: "08:15", tasks: ["Práctica ligera"], order: 2 },
      { id: "lp-4", title: "Viaje a CUJAE", startTime: "08:15", endTime: "09:00", tasks: ["Música o podcast"], order: 3 },
      { id: "lp-5", title: "1er Bloque Trabajo", startTime: "09:00", endTime: "10:30", tasks: ["Tareas esenciales"], isFocusBlock: true, order: 4 },
      { id: "lp-6", title: "Descanso", startTime: "10:30", endTime: "11:00", tasks: ["Café", "Caminar"], order: 5 },
      { id: "lp-7", title: "2do Bloque Trabajo", startTime: "11:00", endTime: "12:30", tasks: ["Trabajo moderado"], isFocusBlock: true, order: 6 },
      { id: "lp-8", title: "Almuerzo extendido", startTime: "12:30", endTime: "14:00", tasks: ["Almorzar", "Siesta corta"], order: 7 },
      { id: "lp-9", title: "3er Bloque Trabajo", startTime: "14:00", endTime: "15:30", tasks: ["Tareas ligeras"], isFocusBlock: true, order: 8 },
      { id: "lp-10", title: "Descanso", startTime: "15:30", endTime: "16:00", tasks: ["Snack", "Descanso"], order: 9 },
      { id: "lp-11", title: "4to Bloque Trabajo", startTime: "16:00", endTime: "17:00", tasks: ["Finalizar pendientes"], isFocusBlock: true, order: 10 },
      { id: "lp-12", title: "Viaje a Casa", startTime: "17:00", endTime: "17:30", tasks: ["Relajación"], order: 11 },
      { id: "lp-13", title: "Tiempo Libre", startTime: "17:30", endTime: "19:00", tasks: ["Actividad de elección"], order: 12 },
      { id: "lp-14", title: "Comida", startTime: "19:00", endTime: "19:45", tasks: ["Cena relajada"], order: 13 },
      { id: "lp-15", title: "Entretenimiento", startTime: "19:45", endTime: "21:00", tasks: ["Series", "Gaming", "Hobby"], order: 14 },
      { id: "lp-16", title: "Rutina Desactivación", startTime: "21:00", endTime: "22:00", tasks: ["Preparación suave"], order: 15 },
      { id: "lp-17", title: "Sueño", startTime: "22:00", endTime: "06:30", tasks: ["Descanso de 8.5 horas"], order: 16 },
    ],
  },
  {
    id: "recuperacion",
    name: "Recuperación & Descanso",
    description: "Día de recompensa y recarga. Despertar natural, autocuidado y actividades placenteras.",
    wakeTime: "08:00",
    icon: "heart",
    color: "from-purple-500 to-pink-600",
    blocks: [
      { id: "rm-1", title: "Despertar Natural", startTime: "08:00", endTime: "09:00", tasks: ["Despertar sin alarma", "Hidratación", "Estiramientos suaves"], order: 0 },
      { id: "rm-2", title: "Desayuno Relajado", startTime: "09:00", endTime: "10:00", tasks: ["Desayuno nutritivo", "Café/Té"], order: 1 },
      { id: "rm-3", title: "Actividad Suave", startTime: "10:00", endTime: "11:00", tasks: ["Caminata", "Yoga", "Meditación"], order: 2 },
      { id: "rm-4", title: "Tiempo Personal", startTime: "11:00", endTime: "12:30", tasks: ["Lectura", "Hobby", "Creatividad"], order: 3 },
      { id: "rm-5", title: "Almuerzo", startTime: "12:30", endTime: "13:30", tasks: ["Comida nutritiva", "Socializar"], order: 4 },
      { id: "rm-6", title: "Siesta/Descanso", startTime: "13:30", endTime: "15:00", tasks: ["Siesta", "Relajación profunda"], order: 5 },
      { id: "rm-7", title: "Autocuidado", startTime: "15:00", endTime: "16:30", tasks: ["Skincare", "Baño relajante", "Mascarilla"], order: 6 },
      { id: "rm-8", title: "Naturaleza/Aire Libre", startTime: "16:30", endTime: "18:00", tasks: ["Paseo", "Sol", "Conexión con naturaleza"], order: 7 },
      { id: "rm-9", title: "Preparar Comida", startTime: "18:00", endTime: "19:00", tasks: ["Cocinar algo especial"], order: 8 },
      { id: "rm-10", title: "Cena", startTime: "19:00", endTime: "20:00", tasks: ["Cena tranquila"], order: 9 },
      { id: "rm-11", title: "Entretenimiento", startTime: "20:00", endTime: "21:30", tasks: ["Película", "Serie", "Juegos"], order: 10 },
      { id: "rm-12", title: "Rutina Nocturna", startTime: "21:30", endTime: "22:30", tasks: ["Preparación para dormir"], order: 11 },
      { id: "rm-13", title: "Sueño Reparador", startTime: "22:30", endTime: "08:00", tasks: ["Descanso completo de 9.5 horas"], order: 12 },
    ],
  },
];

const MODES_STORAGE_KEY = 'performanceModes';
const SELECTED_MODE_KEY = 'selectedPerformanceMode';
const ACTIVE_ROUTINE_KEY = 'dailyRoutineBlocks';

export const usePerformanceModes = () => {
  const [modes, setModes] = useState<PerformanceMode[]>([]);
  const [selectedModeId, setSelectedModeId] = useState<string>('normal');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load modes and selected mode from localStorage
  useEffect(() => {
    const storedModes = localStorage.getItem(MODES_STORAGE_KEY);
    const storedSelectedMode = localStorage.getItem(SELECTED_MODE_KEY);

    if (storedModes) {
      try {
        setModes(JSON.parse(storedModes));
      } catch {
        setModes(DEFAULT_MODES);
        localStorage.setItem(MODES_STORAGE_KEY, JSON.stringify(DEFAULT_MODES));
      }
    } else {
      setModes(DEFAULT_MODES);
      localStorage.setItem(MODES_STORAGE_KEY, JSON.stringify(DEFAULT_MODES));
    }

    if (storedSelectedMode) {
      setSelectedModeId(storedSelectedMode);
    }

    setIsLoaded(true);
  }, []);

  // Save modes to localStorage when they change
  const saveModes = useCallback((newModes: PerformanceMode[]) => {
    localStorage.setItem(MODES_STORAGE_KEY, JSON.stringify(newModes));
    setModes(newModes);
  }, []);

  // Update a specific mode
  const updateMode = useCallback((modeId: string, updates: Partial<PerformanceMode>) => {
    const newModes = modes.map(mode =>
      mode.id === modeId ? { ...mode, ...updates } : mode
    );
    saveModes(newModes);
  }, [modes, saveModes]);

  // Update a block within a mode
  const updateBlockInMode = useCallback((modeId: string, blockId: string, updates: Partial<RoutineBlock>) => {
    const newModes = modes.map(mode => {
      if (mode.id === modeId) {
        return {
          ...mode,
          blocks: mode.blocks.map(block =>
            block.id === blockId ? { ...block, ...updates } : block
          ),
        };
      }
      return mode;
    });
    saveModes(newModes);
  }, [modes, saveModes]);

  // Add a new block to a mode
  const addBlockToMode = useCallback((modeId: string, block: RoutineBlock) => {
    const newModes = modes.map(mode => {
      if (mode.id === modeId) {
        return {
          ...mode,
          blocks: [...mode.blocks, { ...block, order: mode.blocks.length }],
        };
      }
      return mode;
    });
    saveModes(newModes);
  }, [modes, saveModes]);

  // Remove a block from a mode
  const removeBlockFromMode = useCallback((modeId: string, blockId: string) => {
    const newModes = modes.map(mode => {
      if (mode.id === modeId) {
        return {
          ...mode,
          blocks: mode.blocks.filter(block => block.id !== blockId),
        };
      }
      return mode;
    });
    saveModes(newModes);
  }, [modes, saveModes]);

  // Select a mode and apply its blocks to the active routine
  const selectMode = useCallback((modeId: string) => {
    const mode = modes.find(m => m.id === modeId);
    if (mode) {
      setSelectedModeId(modeId);
      localStorage.setItem(SELECTED_MODE_KEY, modeId);
      
      // Apply mode blocks to active routine
      const routineBlocks = mode.blocks.map(block => ({
        ...block,
        currentStreak: 0,
        maxStreak: 0,
        weeklyCompletion: [false, false, false, false, false, false, false],
        notDone: [false, false, false, false, false, false, false],
      }));
      localStorage.setItem(ACTIVE_ROUTINE_KEY, JSON.stringify(routineBlocks));
    }
  }, [modes]);

  // Get the currently selected mode
  const getSelectedMode = useCallback(() => {
    return modes.find(m => m.id === selectedModeId);
  }, [modes, selectedModeId]);

  // Get blocks for the active routine (from the selected mode)
  const getActiveRoutineBlocks = useCallback(() => {
    const stored = localStorage.getItem(ACTIVE_ROUTINE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    const mode = getSelectedMode();
    return mode?.blocks || [];
  }, [getSelectedMode]);

  // Reset a mode to its default
  const resetModeToDefault = useCallback((modeId: string) => {
    const defaultMode = DEFAULT_MODES.find(m => m.id === modeId);
    if (defaultMode) {
      updateMode(modeId, { blocks: defaultMode.blocks, wakeTime: defaultMode.wakeTime });
    }
  }, [updateMode]);

  return {
    modes,
    selectedModeId,
    isLoaded,
    updateMode,
    updateBlockInMode,
    addBlockToMode,
    removeBlockFromMode,
    selectMode,
    getSelectedMode,
    getActiveRoutineBlocks,
    resetModeToDefault,
  };
};
