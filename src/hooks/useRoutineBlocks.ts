import { useState, useEffect, useCallback, useMemo } from 'react';

export type RoutineType = 'disciplina' | 'normal' | 'super' | 'descanso' | 'equilibrio';

export type ExtraMode = 'idiomas' | 'ocio' | 'focus' | 'sueno';

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
  extraMode?: ExtraMode;
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
  { type: 'disciplina', label: 'Disciplina', shortLabel: 'Disciplina', wakeTime: '5:00', sleepTime: '22:00', icon: '🔥', color: 'orange', description: 'Máximo enfoque y estructura', totalBlocks: 17 },
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
  makeBlock('d-deep6', '6to Deep Work', '17:00', '18:30', 11, true, ['Tarea más importante']),
  makeBlock('d-idiomas', 'Idiomas', '18:30', '19:00', 12, false, ['Inglés', 'Italiano', 'Práctica']),
  makeBlock('d-bloque-extra', 'Bloque Extra', '19:00', '20:00', 13, false, ['Tareas pendientes', 'Estudio extra']),
  makeBlock('d-ocio', 'Ocio', '20:00', '21:00', 14, false, ['Entretenimiento', 'Descanso']),
  makeBlock('d-musica', 'Música (Piano o Guitarra)', '21:00', '21:30', 15, false, ['Práctica musical']),
  makeBlock('d-desactivacion', 'Rutina de Desactivación', '21:30', '22:00', 16, false, ['Skincare', 'Preparación para dormir']),
];
DISCIPLINA_BLOCKS.find(b => b.id === 'd-bloque-extra')!.extraMode = 'focus';

const shiftTime = (timeStr: string, deltaMinutes: number): string => {
  let [h, m] = timeStr.split(':').map(Number);
  let total = h * 60 + m - deltaMinutes;
  if (total < 0) total += 24 * 60;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
};

/** Aplica el modo del Bloque Extra para la rutina de disciplina. */
export const resolveDisciplinaBlocks = (raw: RoutineBlock[]): RoutineBlock[] => {
  const extra = raw.find(b => b.id === 'd-bloque-extra');
  if (!extra) return raw;
  const mode = extra.extraMode || 'focus';

  if (mode === 'focus') {
    return raw.map(b =>
      b.id === 'd-bloque-extra'
        ? { ...b, isFocusBlock: true, defaultFocus: b.currentFocus || 'none', title: 'Bloque Extra', blockType: 'focus' }
        : b
    );
  }

  if (mode === 'idiomas') {
    // Fusiona el Bloque Extra con el bloque de Idiomas contiguo
    return raw
      .filter(b => b.id !== 'd-bloque-extra')
      .map(b =>
        b.id === 'd-idiomas'
          ? {
              ...b,
              endTime: extra.endTime,
              title: 'Idiomas (ampliado)',
              tasks: Array.from(new Set([...(b.tasks || []), ...(extra.tasks || [])])),
            }
          : b
      )
      .map((b, index) => ({ ...b, order: index }));
  }

  if (mode === 'ocio') {
    return raw
      .filter(b => b.id !== 'd-bloque-extra')
      .map(b => (b.id === 'd-ocio' ? { ...b, startTime: extra.startTime, endTime: extra.endTime } : b))
      .map((b, index) => ({ ...b, order: index }));
  }

  // mode === 'sueno': el Bloque Extra se usa para adelantar el sueño.
  // Ocio/Música/Desactivación se corren 1h antes y se añade el bloque Sueño al final.
  const shifted = raw
    .filter(b => b.id !== 'd-bloque-extra')
    .map(b =>
      ['d-ocio', 'd-musica', 'd-desactivacion'].includes(b.id)
        ? { ...b, startTime: shiftTime(b.startTime, 60), endTime: shiftTime(b.endTime, 60) }
        : b
    );

  const desactivacion = shifted.find(b => b.id === 'd-desactivacion');
  const sleepStart = desactivacion ? desactivacion.endTime : extra.endTime;
  const sleepBlock: RoutineBlock = {
    ...makeBlock('d-sueno', 'Sueño (adelantado) 😴', sleepStart, shiftTime(sleepStart, -60), 0, false, [
      'Dormir 1h antes',
      'Pantallas apagadas',
      'Habitación oscura y fresca',
    ]),
    extraMode: undefined,
  };

  return [...shifted, sleepBlock].map((b, index) => ({ ...b, order: index }));
};


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

const EQUILIBRIO_BLOCKS: RoutineBlock[] = [
  makeBlock('e-inicio', 'Rutina de Inicio', '06:00', '06:30', 0, false, ['Higiene', 'Estiramientos', 'Preparación mental', 'Batido/Merienda']),
  makeBlock('e-focus1', 'Focus 1 🧠', '06:30', '08:00', 1, true, ['Bloque de alto rendimiento (1h20 trabajo + 10 descanso)', 'Tareas creativas o difíciles (pico cognitivo)']),
  makeBlock('e-alistamiento', 'Alistamiento + Desayuno', '08:00', '08:30', 2, false, ['Ducha', 'Vestirse', 'Desayuno tranquilo']),
  makeBlock('e-lectura', 'Lectura o Podcast', '08:30', '09:00', 3, false, ['Aprendizaje pasivo', 'Inspiración', 'Desarrollo personal']),
  makeBlock('e-bloque2', 'Bloque 2 📊 Emprendimiento', '09:00', '10:30', 4, true, ['Emprendimiento / Estrategia (1h20 trabajo + 10 descanso)', 'Decisiones, planificación, creación'], 'emprendimiento'),
  makeBlock('e-bloque3', 'Bloque 3 📚 Universidad', '10:30', '12:00', 5, true, ['Universidad / Estudio profundo (1h20 trabajo + 10 descanso)', 'Teoría densa, repasos intensos'], 'universidad'),
  makeBlock('e-bloque4', 'Bloque 4 📝 Tareas Mecánicas', '12:00', '13:20', 6, true, ['Tareas mecánicas (1h10 trabajo + 10 descanso)', 'Correos, organización, revisión ligera']),
  makeBlock('e-almuerzo', 'Almuerzo', '13:20', '14:00', 7, false, ['Comida', 'Desconexión sin pantallas']),
  makeBlock('e-bloque5', 'Bloque 5 📋 Administrativo', '14:00', '15:30', 8, true, ['Administrativo / Pendientes (1h20 trabajo + 10 descanso)', 'Baja intensidad post-almuerzo']),
  makeBlock('e-bloque6', 'Bloque 6 🔄 Revisión / Cierre', '15:30', '17:00', 9, true, ['Revisión / Cierre (1h20 trabajo + 10 descanso)', 'Planificar mañana', 'Cerrar tareas del día']),
  makeBlock('e-gym', 'Gimnasio 🏋️', '17:00', '18:30', 10, false, ['Preparación', '50 min entreno intenso', 'Ducha y cambio', 'Sin cardio largo']),
  makeBlock('e-idiomas', 'Idiomas 🌍', '18:30', '19:00', 11, false, ['Vocabulario', 'Listening', 'Repetición']),
  makeBlock('e-flexible', 'Bloque Flexible 🎯', '19:00', '20:30', 12, false, ['Comodín: ocio extra, adelantar trabajo, focus extra, más idiomas o dormir temprano']),
  makeBlock('e-ocio', 'Ocio', '20:30', '21:30', 13, false, ['Desconexión total', 'Series, redes, amigos, lectura por placer']),
  makeBlock('e-piano', 'Piano 🎹', '21:30', '22:00', 14, false, ['Habilidad motora + mindfulness', 'Canciones conocidas en días de estrés']),
  makeBlock('e-fin', 'Rutina de Fin de Día', '22:00', '22:30', 15, false, ['Higiene', 'Preparar ropa para mañana', 'Planificar el día siguiente', 'Apagar pantallas', 'Acostarse 22:10 (7.5h de sueño)']),
];

const ROUTINE_MAP: Record<RoutineType, RoutineBlock[]> = {
  disciplina: DISCIPLINA_BLOCKS,
  normal: NORMAL_BLOCKS,
  super: SUPER_BLOCKS,
  descanso: DESCANSO_BLOCKS,
  equilibrio: EQUILIBRIO_BLOCKS,
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
  const [rawBlocks, setRawBlocks] = useState<RoutineBlock[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedType = localStorage.getItem(ROUTINE_TYPE_KEY) as RoutineType | null;
    const type = savedType && ROUTINE_MAP[savedType] ? savedType : 'disciplina';
    setRoutineTypeState(type);
    const loaded = loadBlocksForType(type);
    setRawBlocks(loaded);
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

  const blocks = useMemo(
    () => (routineType === 'disciplina' ? resolveDisciplinaBlocks(rawBlocks) : rawBlocks),
    [rawBlocks, routineType]
  );

  const setRoutineType = useCallback((type: RoutineType) => {
    setRoutineTypeState(type);
    localStorage.setItem(ROUTINE_TYPE_KEY, type);
    const loaded = loadBlocksForType(type);
    setRawBlocks(loaded);
  }, []);

  const saveBlocks = useCallback((newBlocks: RoutineBlock[]) => {
    const storageKey = `${ROUTINE_BLOCKS_PREFIX}${routineType}`;
    localStorage.setItem(storageKey, JSON.stringify(newBlocks));
    setRawBlocks(newBlocks);
  }, [routineType]);

  const reorderBlocks = useCallback((startIndex: number, endIndex: number) => {
    const result = Array.from(rawBlocks);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    const reordered = result.map((block, index) => ({ ...block, order: index }));
    saveBlocks(reordered);
  }, [rawBlocks, saveBlocks]);

  const updateBlock = useCallback((updatedBlock: RoutineBlock) => {
    const newBlocks = rawBlocks.map(block =>
      block.id === updatedBlock.id ? updatedBlock : block
    );
    saveBlocks(newBlocks);
  }, [rawBlocks, saveBlocks]);

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
    const newBlocks = rawBlocks.map(block =>
      block.id === blockId ? { ...block, currentFocus: focus } : block
    );
    saveBlocks(newBlocks);
  }, [rawBlocks, saveBlocks]);

  const extraMode: ExtraMode =
    (rawBlocks.find(b => b.id === 'd-bloque-extra')?.extraMode as ExtraMode) || 'focus';

  const setExtraMode = useCallback((mode: ExtraMode) => {
    const newBlocks = rawBlocks.map(block =>
      block.id === 'd-bloque-extra' ? { ...block, extraMode: mode } : block
    );
    saveBlocks(newBlocks);
  }, [rawBlocks, saveBlocks]);

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
    extraMode,
    setExtraMode,
    routineInfo: ROUTINES.find(r => r.type === routineType) || ROUTINES[0],
  };
};
